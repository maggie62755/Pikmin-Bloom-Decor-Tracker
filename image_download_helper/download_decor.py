# pip install requests beautifulsoup4
import os
import re
import requests
import unicodedata
from bs4 import BeautifulSoup
from urllib.parse import urljoin

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

def fetch_decor_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    print("正在讀取網頁數據，請稍候... / Fetching data from wiki, please wait...")
    try:
        response = requests.get(URL, headers=headers)
        if response.status_code != 200:
            print(f"無法讀取網頁 / Failed to load page. Code: {response.status_code}")
            return None
    except Exception as e:
        print(f"連線發生異常 / Connection error: {e}")
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    tables = soup.find_all('table', class_='wikitable scrollable noresize')
    
    decor_dict = {} 
    
    for table in tables:
        headers_row = table.find('tr')
        if not headers_row:
            continue
            
        th_tags = headers_row.find_all('th')
        cols = [t.get_text(strip=True) for t in th_tags]
        
        if len(cols) < 3 or not any(col in cols[0].lower() or col in cols[1].lower() for col in ['location', 'decor', 'costume', 'type']):
            continue
            
        row_colors = cols[2:]
        rows = table.find_all('tr')[1:] 
        
        current_location = ""
        for row in rows:
            tds = row.find_all(['td', 'th'])
            if not tds:
                continue
                
            if len(tds) == len(cols):
                current_location = clean_text(tds[0].get_text())
                costume_td = tds[1]
                color_tds = tds[2:]
            elif len(tds) == len(cols) - 1:
                costume_td = tds[0]
                color_tds = tds[1:]
            else:
                continue
                
            current_costume = clean_text(costume_td.get_text())
            if not current_location or not current_costume:
                continue
            
            if current_costume == "AvailablePikmintypes":
                continue
                
            category_key = f"{current_location}/{current_costume}"
            
            if category_key not in decor_dict:
                decor_dict[category_key] = {}
                
            for idx, td in enumerate(color_tds):
                if idx >= len(row_colors):
                    break
                color_name = clean_text(row_colors[idx])
                
                td_text = td.get_text(strip=True)
                if td_text == "N/A" or "N/A" in td_text:
                    continue
                    
                img_tag = td.find('img')
                if img_tag:
                    img_url = img_tag.get('src')
                    if img_url:
                        img_url = urljoin(URL, img_url)
                        
                        final_color_name = color_name
                        counter = 1
                        while final_color_name in decor_dict[category_key]:
                            counter += 1
                            final_color_name = f"{color_name}{counter}"
                            
                        decor_dict[category_key][final_color_name] = img_url

    return decor_dict

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