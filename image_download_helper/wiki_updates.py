"""Read Pikipedia's dated changes and downloadable galleries (no project writes)."""
from __future__ import annotations

import calendar
import re
from datetime import date
from urllib.parse import unquote, quote

import requests
from bs4 import BeautifulSoup

from download_decor import parse_decor_html, original_image_url
from update_decors import COLOR_ORDER, standard_match_key, comparable_name

BASE = 'https://www.pikminwiki.com/'
MONTHS = {name.casefold(): index for index, name in enumerate(calendar.month_name) if name}
MONTH_PATTERN = '|'.join(calendar.month_name[1:])
DATE_RE = re.compile(rf'\b({MONTH_PATTERN})\s+(?:(\d{{1,2}})(?:\s*(?:st|nd|rd|th))?\s*,?\s*)?(\d{{4}})?\b', re.I)
FILE_RE = re.compile(r'^Decor_(Red|Yellow|Blue|Purple|White|Winged|Rock|Ice)_(.+)\.png$', re.I)


def six_months_before(today: date) -> date:
    month = today.year * 12 + today.month - 1 - 6
    year, month = divmod(month, 12)
    month += 1
    return date(year, month, min(today.day, calendar.monthrange(year, month)[1]))


def clean_text(node) -> str:
    copy = BeautifulSoup(str(node), 'html.parser')
    for element in copy.select('.reference, .mw-editsection'):
        element.decompose()
    text = re.sub(r'\s+', ' ', copy.get_text(' ', strip=True)).strip()
    text = re.sub(r'(\d)\s+(st|nd|rd|th)\b', r'\1\2', text)
    return re.sub(r'\s+([,.])', r'\1', text)


def dates_in(text: str) -> list[date]:
    """Handle ordinal days and a year shared by both ends of a range."""
    matches = list(DATE_RE.finditer(text))
    result = []
    for index, match in enumerate(matches):
        year = match[3]
        if not year:
            later = next((item for item in matches[index + 1:] if item[3]), None)
            if later:
                year = later[3]
                # December ... January, 2026 spans the year boundary.
                year = str(int(year) - (MONTHS[match[1].casefold()] > MONTHS[later[1].casefold()]))
            else:
                earlier = next((item for item in reversed(matches[:index]) if item[3]), None)
                if earlier:
                    year = str(int(earlier[3]) + (MONTHS[match[1].casefold()] < MONTHS[earlier[1].casefold()]))
        if not year:
            continue
        try:
            result.append(date(int(year), MONTHS[match[1].casefold()], int(match[2] or 1)))
        except ValueError:
            continue
    return result


def event_dates(text: str):
    # Prefer the availability clause; later sentences may mention an unrelated release.
    lead = text.split('. ', 1)[0]
    parsed = dates_in(lead)
    if not parsed:
        return None
    start = parsed[0]
    end = parsed[1] if len(parsed) > 1 and re.search(r'\b(?:to|until|through)\b', lead, re.I) else start
    if end < start:
        return None
    return start, end


def in_window(start: date, end: date, today: date) -> bool:
    return start <= today and end >= six_months_before(today)


def phrase_present(phrase: str, text: str) -> bool:
    normalized_text = re.sub(r'[^a-z0-9]+', ' ', text.casefold())
    normalized_phrase = re.sub(r'[^a-z0-9]+', ' ', phrase.casefold()).strip()
    return bool(normalized_phrase and re.search(r'\b' + re.escape(normalized_phrase) + r'\b', normalized_text))


def standard_targets(text: str, records: dict) -> list[str]:
    # Renames are information, rather than an instruction to redownload images.
    if text.casefold().startswith('renamed'):
        return []
    bases = {re.sub(r'\s*\(Rare\)', '', record['costume'], flags=re.I) for record in records.values()}
    remaining = text
    named = set()
    for base in sorted(bases, key=len, reverse=True):
        if phrase_present(base, remaining):
            named.add(base)
            pattern = r'\b' + re.escape(base).replace(r'\ ', r'\s+') + r'\b'
            remaining = re.sub(pattern, ' ', remaining, flags=re.I)
    rare_only = bool(re.search(r'^Added (?:a )?Rare Decor', text, re.I))
    includes_rare = bool(re.search(r'Rare', text, re.I))
    targets = []
    for key, record in records.items():
        costume = record['costume']
        base = re.sub(r'\s*\(Rare\)', '', costume, flags=re.I)
        is_rare = bool(re.search(r'\(Rare\)', costume, re.I))
        if named:
            match = base in named and (is_rare if rare_only else not is_rare or includes_rare)
        else:
            match = phrase_present(record['location'], text)
        if match:
            targets.append('standard:' + key)
    aliases = {'Shrines and Temples': 'Shrine & Temple', 'Hardware Store': 'DIY Store',
               'Pizzeria': 'Italian Restaurant', 'Fortune': 'Shrine & Temple', 'Kimchi': 'Korean Restaurant'}
    if not named:
        for phrase, location in aliases.items():
            if phrase_present(phrase, text):
                targets.extend('standard:' + key for key, record in records.items() if record['location'] == location)
    return list(dict.fromkeys(targets))


def parse_standard_history(html: str, records: dict, today: date) -> tuple[list[dict], list[dict]]:
    soup = BeautifulSoup(html, 'html.parser')
    table = next((table for table in soup.select('table.wikitable')
                  if table.find('tr') and 'Update or date' in clean_text(table.find('tr'))), None)
    if table is None:
        raise ValueError('Wiki 一般飾品 History 表格不存在或格式已變更。')
    events, undated = [], []
    for row in table.find_all('tr')[1:]:
        cells = row.find_all(['th', 'td'], recursive=False)
        if len(cells) != 2:
            continue
        stamp = clean_text(cells[0])
        items = cells[1].find_all('li', recursive=True)
        texts = [clean_text(item) for item in items] if items else [clean_text(cells[1])]
        parsed = dates_in(stamp)
        for text in texts:
            event = {'type': 'standard', 'category': '一般飾品 History', 'description': text,
                     'date_label': stamp, 'source': BASE + 'Decor_Pikmin#History',
                     'targets': standard_targets(text, records), 'kind': '更新'}
            if not parsed:
                # No guessed release dates: keep version-only changes explicitly separate.
                undated.append(event)
            elif in_window(parsed[0], parsed[0], today):
                event.update(start=parsed[0].isoformat(), end=parsed[0].isoformat())
                events.append(event)
    return events, undated


def parse_special(html: str, today: date) -> tuple[dict, list[dict], list[dict]]:
    soup = BeautifulSoup(html, 'html.parser')
    sections = {}
    root, current, anchor = '', '', ''
    # The content element is the parent of the article's headline headings, not the TOC.
    first = soup.select_one('#mw-content-text h2 .mw-headline')
    if first is None:
        raise ValueError('Wiki Special Decor 章節不存在。')
    body = first.parent.parent
    for node in body.children:
        if not getattr(node, 'name', None):
            continue
        if node.name in ('h2', 'h3', 'h4'):
            headline = node.select_one('.mw-headline')
            if not headline:
                continue
            title = clean_text(headline)
            if node.name == 'h2':
                root = title
            current = title
            anchor = headline.get('id', title.replace(' ', '_'))
            sections.setdefault(current, {'root': root, 'anchor': anchor, 'images': [], 'statements': []})
        elif current and node.name in ('ul', 'ol', 'p'):
            items = node.find_all('li', recursive=False) if node.name in ('ul', 'ol') else [node]
            sections[current]['statements'].extend(clean_text(item) for item in items)
        elif current and node.name == 'table' and 'noresize' in node.get('class', []):
            # Only galleries, excluding tables describing card suits or language variants.
            for link in node.select('a.image[href]'):
                filename = unquote(link['href'].split('File:', 1)[-1])
                match = FILE_RE.fullmatch(filename)
                image = link.find('img')
                if match and image and image.get('src'):
                    sections[current]['images'].append((match[1].casefold(), filename, original_image_url(image['src'])))

    catalog, events, undated = {}, [], []
    for name, section in sections.items():
        if not section['images']:
            continue
        # These headings describe availability, not distinct decor categories.
        display = section['root'] if name.endswith('Decor Pikmin availability') else name
        images = {}
        by_color = {}
        for color, filename, url in section['images']:
            by_color.setdefault(color, {})[filename] = url
        for color, files in by_color.items():
            numbered = [re.search(r'_(\d+)\.png$', filename) for filename in files]
            if len(files) > 1 and not all(numbered):
                raise ValueError(f'{display} 的 {color} 有多張無編號圖片，無法對應款式。')
            for filename, url in files.items():
                suffix = re.search(r'_(\d+)\.png$', filename)
                number = int(suffix[1]) if suffix and len(files) > 1 else 1
                if number < 1:
                    raise ValueError(f'{display} 的圖片編號無效。')
                color_id = color + (str(number - 1) if number > 1 else '')
                if color_id in images:
                    raise ValueError(f'{display} 的款式编号重複。')
                images[color_id] = {'url': url, 'file_name': filename}
        source = BASE + 'Special_Decor_Pikmin#' + quote(section['anchor'])
        key = 'special:' + display
        if key in catalog:
            raise ValueError(f'重複的 Special Decor 分類：{display}')
        catalog[key] = {'type': 'special', 'name': display, 'images': images, 'source': source}
        statements = list(section['statements'])
        if name != section['root']:
            statements += sections.get(section['root'], {}).get('statements', [])
        seen = set()
        for text in statements:
            # Availability bullets and release statements; exclude rename-only prose.
            if text in seen or not re.search(r'\b(?:available|introduced|added|released|obtain|first time)\b', text, re.I):
                continue
            seen.add(text)
            period = event_dates(text)
            if not period:
                if re.search(r'\b(?:From|Since|During)\b', text):
                    undated.append({'type': 'special', 'category': display, 'description': text,
                                    'source': source, 'targets': [key], 'kind': '日期待確認'})
                continue
            start, end = period
            if in_window(start, end, today):
                kind = ('追加新款／復刻' if re.search(r'with .+?first time', text, re.I) else
                        '跨期開放' if start < six_months_before(today) else
                        '首次推出') if re.search(r'first time|introduced|released', text, re.I) else (
                    '永久開放／更新' if re.search(r'permanently|Since', text, re.I) else '復刻／再次開放')
                events.append({'type': 'special', 'category': display, 'description': text,
                               'source': source, 'targets': [key], 'kind': kind,
                               'start': start.isoformat(), 'end': end.isoformat(),
                               'date_label': f'{start.isoformat()} ～ {end.isoformat()}'})
    if not catalog:
        raise ValueError('Wiki Special Decor 找不到可下載圖片。')
    return catalog, events, undated


def fetch_page(page: str) -> str:
    response = requests.get(BASE + page, timeout=40, headers={'User-Agent': 'PikminDecorTrackerUpdater/2.0'})
    response.raise_for_status()
    return response.text


def scan_sources(today: date, progress=lambda message: None) -> dict:
    catalog, events, undated, errors = {}, [], [], []
    for kind, page in (('standard', 'Decor_Pikmin'), ('special', 'Special_Decor_Pikmin')):
        try:
            progress('正在讀取 ' + page + '…')
            html = fetch_page(page)
            if kind == 'standard':
                records = parse_decor_html(html)
                for name, record in records.items():
                    catalog['standard:' + name] = dict(record, type='standard', name=name,
                                                       source=BASE + page + '#Gallery')
                changes, missing = parse_standard_history(html, records, today)
            else:
                items, changes, missing = parse_special(html, today)
                catalog.update(items)
            events.extend(changes)
            undated.extend(missing)
        except Exception as exc:
            errors.append({'type': kind, 'message': str(exc)})
    events.sort(key=lambda event: event['start'], reverse=True)
    return {'today': today.isoformat(), 'cutoff': six_months_before(today).isoformat(),
            'catalog': catalog, 'events': events, 'undated': undated, 'errors': errors}
