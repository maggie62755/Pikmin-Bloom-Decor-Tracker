# pip install requests beautifulsoup4
import os
import re
import requests
import unicodedata
from bs4 import BeautifulSoup
from urllib.parse import urljoin, unquote, urlsplit, urlunsplit

# 目標 URL
URL = "https://www.pikminwiki.com/Decor_Pikmin"

def clean_text(text):
    """移除空格與換行符號"""
    if not text:
        return ""
    return re.sub(r'\s+', '', text.strip())

def get_display_width(text):
    """精準計算中英文混合字串在終端機顯示的實際寬度"""
    width = 0
    for char in text:
        # W: 全形, F: 寬字元, A: 曖昧字元(通常算寬) -> 這些佔 2 格，其餘（英數半形）佔 1 格
        if unicodedata.east_asian_width(char) in ('W', 'F', 'A'):
            width += 2
        else:
            width += 1
    return width

def pad_to_width(text, target_width):
    """根據終端機實際顯示寬度進行靠左對齊補白"""
    current_width = get_display_width(text)
    padding_needed = target_width - current_width
    if padding_needed > 0:
        return text + (" " * padding_needed)
    return text

def original_image_url(src):
    """Use the original PNG rather than the table's resized thumbnail."""
    parts = urlsplit(urljoin(URL, src))
    path = parts.path
    if '/images/thumb/' in path:
        path = path.replace('/images/thumb/', '/images/', 1).rsplit('/', 1)[0]
    return urlunsplit((parts.scheme, parts.netloc, path, '', ''))


def parse_decor_html(html):
    """Return location/costume records, expanding both location and costume rowspans."""
    soup = BeautifulSoup(html, 'html.parser')
    records = {}
    colors = {'red', 'yellow', 'blue', 'purple', 'white', 'winged', 'rock', 'ice'}
    for table in soup.select('table.wikitable'):
        rows = table.find_all('tr', recursive=False)
        if not rows:
            rows = table.select(':scope > tbody > tr')
        if not rows:
            continue
        headers = [cell.get_text(' ', strip=True) for cell in rows[0].find_all(['th', 'td'], recursive=False)]
        if len(headers) < 3 or headers[:2] != ['Location', 'Costume']:
            continue
        if any(color.casefold() not in colors for color in headers[2:]):
            raise ValueError('Wiki 飾品表格包含未知顏色欄位。')
        spans = {}
        for row in rows[1:]:
            cells = iter(row.find_all(['th', 'td'], recursive=False))
            expanded = []
            for col in range(len(headers)):
                if col in spans:
                    cell, remaining = spans[col]
                    if remaining == 1:
                        del spans[col]
                    else:
                        spans[col] = (cell, remaining - 1)
                else:
                    cell = next(cells, None)
                    if cell is None or int(cell.get('colspan', 1)) != 1:
                        raise ValueError('Wiki 飾品表格欄位格式已變更，無法安全解析。')
                    rowspan = int(cell.get('rowspan', 1))
                    if rowspan > 1:
                        spans[col] = (cell, rowspan - 1)
                expanded.append(cell)
            location = expanded[0].get_text(' ', strip=True)
            costume = expanded[1].get_text(' ', strip=True)
            # Roadside's three Sticker rows are separate variants in this project.
            if location == 'Roadside' and costume == 'Sticker':
                image = row.find('a', href=re.compile(r'Decor_.*_Sticker_[123]\.png'))
                if not image:
                    raise ValueError('無法辨識 Roadside Sticker 款式。')
                number = int(re.search(r'_([123])\.png', image['href']).group(1))
                costume = ('Green Sticker', 'Blue Sticker', 'Orange Sticker')[number - 1]
            key = f'{location}/{costume}'
            record = records.setdefault(key, {'location': location, 'costume': costume, 'images': {}})
            for color, cell in zip(headers[2:], expanded[2:]):
                if cell.get_text(' ', strip=True) == 'N/A':
                    continue
                links = cell.select('a.image[href]')
                if not links:
                    raise ValueError(f'{key}/{color} 缺少圖片，無法安全更新。')
                for link in links:
                    img = link.find('img')
                    if not img or not img.get('src'):
                        raise ValueError(f'{key}/{color} 缺少圖片網址。')
                    url = original_image_url(img['src'])
                    file_name = unquote(link['href'].split('File:', 1)[-1])
                    if not file_name.lower().endswith('.png'):
                        raise ValueError(f'{key}/{color} 不是 PNG 圖片。')
                    images = record['images']
                    if any(item['file_name'] == file_name for item in images.values()):
                        continue
                    color_id = color.casefold()
                    numbered = re.search(r'_(\d+)\.png$', file_name)
                    if int(expanded[1].get('rowspan', 1)) > 1 and numbered and expanded[1].get_text(' ', strip=True) != 'Sticker':
                        # Preserve collection IDs even if Wiki reorders numbered designs.
                        number = int(numbered.group(1))
                        if number < 1:
                            raise ValueError(f'{key}/{color} 的款式編號無效。')
                        color_id += str(number - 1) if number > 1 else ''
                        if color_id in images:
                            raise ValueError(f'{key}/{color} 的款式編號重複。')
                    else:
                        suffix = 0
                        while color_id in images:
                            suffix += 1
                            color_id = f'{color.casefold()}{suffix}'
                    images[color_id] = {'url': url, 'file_name': file_name}
    if not records:
        raise ValueError('Wiki 找不到一般飾品圖片表格。')
    return records


def fetch_standard_records():
    response = requests.get(URL, headers={'User-Agent': 'PikminDecorImageDownloader/1.0'}, timeout=30)
    response.raise_for_status()
    return parse_decor_html(response.text)


def fetch_decor_data():
    print('正在讀取網頁數據，請稍候... / Fetching data from wiki, please wait...')
    try:
        records = fetch_standard_records()
        return {
            f"{clean_text(record['location'])}/{clean_text(record['costume'])}": {
                color.capitalize(): image['url'] for color, image in record['images'].items()
            }
            for record in records.values()
        }
    except (requests.RequestException, ValueError) as exc:
        print(f'讀取失敗 / Failed to read wiki: {exc}')
        return None


def download_image(url, folder, filename):
    """下載圖片並存檔"""
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    path = os.path.join(folder, filename)
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, stream=True)
        if r.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
            print(f"  [O] Success: {path}")
        else:
            print(f"  [X] Failed: {filename} (Status: {r.status_code})")
    except Exception as e:
        print(f"  [!] Error downloading {filename}: {e}")

def main():
    decor_data = fetch_decor_data()
    
    if not decor_data:
        print("未抓取到任何資料。 / No data found.")
        return
        
    print("\n" + "="*85)
    print(" 已解析的類別與可下載顏色清單 / Parsed Categories & Available Colors:")
    print("="*85)
    
    active_categories = [cat for cat, colors in decor_data.items() if colors]
    if not active_categories:
        print("沒有可下載的類別。 / No downloadable categories found.")
        return
        
    # 使用我們自訂的 get_display_width 找出最大「顯示寬度」
    max_width = max(get_display_width(cat) for cat in active_categories) + 2
    
    for category in active_categories:
        colors = decor_data[category]
        color_list = ", ".join(colors.keys())
        
        # 呼叫客製化補白函式，達成不論中英文都完美對齊
        aligned_category = pad_to_width(category, max_width)
        print(f" {aligned_category} : {color_list}")
            
    print("="*85 + "\n")
    
    # 互動介面 (中英雙語提示)
    while True:
        print("-" * 85)
        print("請輸入想要下載的 Costume 名稱 (例: LeafHat) 或 Location 名稱 (例: Café)")
        user_input = input("Enter Costume (e.g., LeafHat) or Location (e.g., Café) to download\n(q: exit/離開): ").strip()
        
        if user_input.lower() == 'q':
            print("程式結束。 / Process finished.")
            break
            
        if not user_input:
            continue
            
        matched_categories = []
        
        # 為了友善處理輸入，我們把比對目標轉成「不分大小寫」
        # 甚至可以把法文的 é 取代成 e 來提高容錯率（例如輸入 Cafe 也能配對 Café）
        def normalize_str(s):
            return s.lower().replace('é', 'e')

        search_input = normalize_str(user_input)
        
        for category in decor_data.keys():
            if '/' in category:
                loc, cos = category.split('/', 1)
                # 使用不分大小寫且容錯的標準進行配對
                if search_input == normalize_str(cos) or search_input == normalize_str(loc):
                    matched_categories.append(category)
                
        if not matched_categories:
            print(f"\n[!] 找不到符合 '{user_input}' 的類別。 / No matches found for '{user_input}'.\n")
            continue
            
        print(f"\n開始下載... / Downloading images for '{user_input}'...")
        for category in matched_categories:
            loc, cos = category.split('/', 1)
            colors_dict = decor_data[category]
            
            for color_name, img_url in colors_dict.items():
                filename = f"{cos}_{color_name}.png"
                download_image(img_url, loc, filename)
                
        print("下載完畢！ / Download complete!\n")

if __name__ == "__main__":
    main()