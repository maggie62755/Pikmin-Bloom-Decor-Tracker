#!/usr/bin/env python3
"""Local browser manager for Wiki update discovery, previews and atomic downloads."""
from __future__ import annotations

import argparse
import copy
import json
import re
import secrets
import threading
import uuid
import webbrowser
from datetime import datetime, date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

import update_decors as updater
from wiki_updates import scan_sources

STATIC = Path(__file__).parent / 'manager_ui'
SPECIAL_ALIASES = {
    'colorpowder': 'coloredpowder', 'presentstickergold': 'presentsticker',
    'hanafudacardvolume1': 'flowercardvolume1', 'hanafudacardvolume2': 'flowercardvolume2',
}


def special_existing(data: dict, name: str):
    key = updater.comparable_name(name)
    candidates = [item for item in data['categories'] if str(item.get('id', '')).startswith('event_')
                  and any(updater.comparable_name(str(item.get(field, ''))) in {key, SPECIAL_ALIASES.get(key, key)}
                          for field in ('name', 'image_path'))]
    if len(candidates) > 1:
        raise updater.UpdateError(f'多個分類對應 {name}，請先整理 JSON。')
    return candidates[0] if candidates else None


def standard_args(item, selection):
    translations = selection.get('translations', {})
    if not isinstance(translations, dict) or any(not isinstance(key, str) or not isinstance(value, str) for key, value in translations.items()):
        raise updater.UpdateError('造型翻譯格式無效。')
    return SimpleNamespace(category=item['name'], chinese_name=(selection.get('chinese_name') or '').strip() or None,
                           variant_chinese_name=[f'{name}={value.strip()}' for name, value in translations.items() if value.strip()],
                           custom_id=None, custom_image_token=None, icon=None, non_interactive=True)


def standard_records(snapshot):
    return {item['name']: item for item in snapshot['catalog'].values() if item['type'] == 'standard'}


def special_order(snapshot, data):
    order = []
    for item in snapshot['catalog'].values():
        if item['type'] != 'special':
            continue
        order.append(item['name'])
        existing = special_existing(data, item['name'])
        if existing:
            order.append(existing['name'])
    return tuple(order)


def plan_item(data, snapshot, item, selection):
    if item['type'] == 'standard':
        return updater.create_standard_plan(data, standard_records(snapshot), standard_args(item, selection))
    existing = special_existing(data, item['name'])
    # Use an existing canonical name only for matching; retain Wiki name in the catalog.
    name = existing['name'] if existing else item['name']
    specs = tuple(updater.DownloadSpec(color, color.capitalize(), image['file_name'], image['url'])
                  for color, image in sorted(item['images'].items(), key=lambda pair: updater.standard_color_sort_key(pair[0])))
    resolved = updater.ResolvedDecor(name, specs, special_order(snapshot, data))
    plan = updater.create_plan(data, name, (selection.get('chinese_name') or '').strip() or None, None, None, resolved)
    updated = updater.apply_plan_to_data(data, plan)
    category = updated['categories'][plan.insert_index]
    if existing:
        # Do not drop collection IDs when a Wiki gallery temporarily omits a color.
        category['variants'][0]['colors'] = sorted(
            set(existing['variants'][0]['colors']) | set(category['variants'][0]['colors']),
            key=updater.standard_color_sort_key)
    downloads = [(spec.url, spec.source_file_name,
                  str(updater.destination_for_spec(Path('.'), data, plan, spec))) for spec in specs]
    return updated, downloads, plan.insert_index


class Manager:
    def __init__(self, data_file=updater.DEFAULT_DATA_FILE, output_root=updater.DEFAULT_OUTPUT_ROOT,
                 today=None):
        self.data_file = Path(data_file)
        self.output_root = Path(output_root)
        self.today = today or datetime.now(ZoneInfo('Asia/Taipei')).date()
        self.snapshot = None
        self.previews = {}
        self.jobs = {}
        self.lock = threading.RLock()
        self.write_lock = threading.Lock()

    def submit(self, kind, operation):
        with self.lock:
            if any(job['state'] == 'running' for job in self.jobs.values()):
                raise updater.UpdateError('另一個工作正在執行，請稍後再試。')
            if len(self.jobs) >= 20:
                for old_id in list(self.jobs)[:-10]:
                    if self.jobs[old_id]['state'] != 'running':
                        del self.jobs[old_id]
            job_id = uuid.uuid4().hex
            self.jobs[job_id] = {'id': job_id, 'kind': kind, 'state': 'running', 'message': '準備中…', 'logs': []}
        def progress(message):
            with self.lock:
                self.jobs[job_id]['message'] = message
                self.jobs[job_id]['logs'] = (self.jobs[job_id]['logs'] + [message])[-100:]
        def run():
            try:
                result = operation(progress)
                with self.lock:
                    self.jobs[job_id].update(state='done', result=result, message='完成')
            except Exception as exc:
                with self.lock:
                    self.jobs[job_id].update(state='error', message=str(exc))
        threading.Thread(target=run, daemon=True).start()
        return {'job_id': job_id}

    def refresh(self, progress):
        snapshot = scan_sources(self.today, progress)
        if not snapshot['catalog']:
            raise updater.UpdateError('兩個 Wiki 來源皆讀取失敗：' + '; '.join(error['message'] for error in snapshot['errors']))
        with self.lock:
            self.snapshot = snapshot
            self.previews.clear()
        return self.catalog()

    def catalog(self):
        with self.lock:
            snapshot = self.snapshot
            if not snapshot:
                return {'ready': False}
            snapshot = copy.deepcopy(snapshot)
        data, _, _ = updater.load_decor_data(self.data_file)
        items = []
        for key, item in snapshot['catalog'].items():
            requirements = []
            local_category = None
            local_variant = None
            if item['type'] == 'special':
                local_category = special_existing(data, item['name'])
                local_variant = local_category['variants'][0] if local_category and len(local_category['variants']) == 1 else None
                if not local_category:
                    requirements.append({'key': 'category', 'label': item['name'], 'value': ''})
            else:
                location_key = updater.standard_match_key(item['location'])
                matches = [category for category in data['categories'] if not category['id'].startswith('event_')
                           and any(updater.standard_match_key(category.get(field, '')) == location_key for field in ('name', 'image_path', 'id'))]
                if len(matches) > 1:
                    raise updater.UpdateError(f'多個分類對應 {item["location"]}')
                local_category = matches[0] if matches else None
                if not local_category:
                    requirements.append({'key': 'category', 'label': item['location'], 'value': ''})
                if local_category:
                    variants = [variant for variant in local_category['variants']
                                if any(updater.standard_match_key(variant.get(field, '')) == updater.standard_match_key(item['costume'])
                                       for field in ('name', 'image_name', 'id'))]
                    if len(variants) > 1:
                        raise updater.UpdateError(f'多個造型對應 {item["name"]}')
                    local_variant = variants[0] if variants else None
                if not local_variant:
                    requirements.append({'key': item['costume'], 'label': item['costume'], 'value': ''})
            existing_colors = local_variant.get('colors', []) if local_variant else []
            added = [color for color in item['images'] if color not in existing_colors]
            image_path = updater.safe_image_component(
                local_category['image_path'] if local_category else
                updater.normalize_image_token(item.get('location', item['name'])))
            image_name = updater.safe_image_component(
                local_variant['image_name'] if local_variant else
                updater.normalize_image_token(item['name']) if item['type'] == 'special' else
                re.sub(r'[^A-Za-z0-9()_-]', '', updater.ascii_text(item['costume'])))
            missing = sum(not (self.output_root / image_path / f'{image_name}_{color.capitalize()}.png').exists()
                          for color in item['images'])
            related = [event for event in snapshot['events'] if key in event['targets']]
            items.append({'id': key, 'type': item['type'], 'name': item['name'],
                          'source': item['source'], 'preview_image': next(iter(item['images'].values()))['url'],
                          'colors': list(item['images']), 'image_count': len(item['images']),
                          'missing_images': missing, 'new_colors': added,
                          'local_name': local_variant.get('name_ch', '') if local_variant else '',
                          'category_chinese': local_category.get('name_ch', '') if local_category else '',
                          'requirements': requirements, 'events': related,
                          'status': '新增分類' if not local_category else '新增造型' if not local_variant else
                                    '補新顏色' if added else '補圖片' if missing else '已收錄'})
        return dict(ready=True, today=snapshot['today'], cutoff=snapshot['cutoff'], items=items,
                    events=snapshot['events'], undated=snapshot['undated'], errors=snapshot['errors'])

    def preview(self, selections):
        if not isinstance(selections, list) or not selections:
            raise updater.UpdateError('請至少選擇一個飾品。')
        if len(selections) > 200:
            raise updater.UpdateError('一次最多選擇 200 個飾品。')
        with self.lock:
            if any(job['state'] == 'running' for job in self.jobs.values()):
                raise updater.UpdateError('工作正在執行，請完成後再預覽。')
            if not self.snapshot:
                raise updater.UpdateError('請先讀取 Wiki 更新。')
            snapshot = copy.deepcopy(self.snapshot)
        data, original, newline = updater.load_decor_data(self.data_file)
        updated = data
        downloads, summaries, seen = {}, [], set()
        category_translations = {}
        for selection in selections:
            if not isinstance(selection, dict) or not isinstance(selection.get('id'), str):
                raise updater.UpdateError('選取資料格式無效。')
            key = selection['id']
            if key in seen or key not in snapshot['catalog']:
                raise updater.UpdateError('重複或未知的飾品：' + key)
            seen.add(key)
            item = snapshot['catalog'][key]
            translation_group = item.get('location', item['name'])
            category_translation = selection.get('chinese_name', '')
            if category_translation:
                if not isinstance(category_translation, str):
                    raise updater.UpdateError('中文名稱必須為文字。')
                if translation_group in category_translations and category_translations[translation_group] != category_translation:
                    raise updater.UpdateError(f'{translation_group} 的分類中文名稱不一致。')
                category_translations[translation_group] = category_translation
            updated, files, index = plan_item(updated, snapshot, item, selection)
            category = updated['categories'][index]
            summaries.append({'name': item['name'], 'category_id': category['id'], 'type': item['type'],
                              'before': next((c for c in data['categories'] if c['id'] == category['id']), None)})
            for url, source, relative in files:
                destination = self.output_root / relative
                # Only paths generated by the existing planners are accepted.
                if not destination.resolve().is_relative_to(self.output_root.resolve()):
                    raise updater.UpdateError('圖片路徑超出允許目錄。')
                fingerprint = updater.sha256(destination) if destination.exists() else None
                action = 'replace' if fingerprint and selection.get('overwrite') is True else 'keep' if fingerprint else 'download'
                entry = {'url': url, 'source': source, 'relative': relative,
                         'action': action, 'fingerprint': fingerprint}
                if relative in downloads and downloads[relative] != entry:
                    raise updater.UpdateError('本次選取含衝突的圖片路徑：' + relative)
                downloads[relative] = entry
        # Earlier insertions may move positions; compute all positions from the final batch.
        for summary in summaries:
            index = next(i for i, category in enumerate(updated['categories']) if category['id'] == summary['category_id'])
            summary.update(position=index + 1, after=updated['categories'][index],
                           previous_name=updated['categories'][index - 1]['name'] if index else None,
                           next_name=updated['categories'][index + 1]['name'] if index + 1 < len(updated['categories']) else None)
        token = uuid.uuid4().hex
        preview = {'id': token, 'original': original, 'updated_json': updater.serialize_json(updated, newline),
                   'files': list(downloads.values()), 'summaries': summaries}
        with self.lock:
            self.previews.clear()
            self.previews[token] = preview
        return {'preview_id': token, 'summaries': summaries,
                'files': [{key: value for key, value in item.items() if key not in ('url', 'fingerprint')}
                          for item in preview['files']],
                'counts': {action: sum(item['action'] == action for item in preview['files'])
                           for action in ('download', 'keep', 'replace')},
                'json_changed': preview['updated_json'] != original}

    def apply(self, token, progress):
        with self.write_lock:
            with self.lock:
                preview = self.previews.pop(token, None)
            if not preview:
                raise updater.UpdateError('預覽已失效，請重新預覽。')
            def check_unchanged():
                if self.data_file.read_bytes() != preview['original']:
                    raise updater.UpdateError('JSON 已在預覽後改變，請重新預覽。')
                for item in preview['files']:
                    destination = self.output_root / item['relative']
                    current = updater.sha256(destination) if destination.exists() else None
                    if current != item['fingerprint']:
                        raise updater.UpdateError('圖片已在預覽後改變：' + item['relative'] + '，請重新預覽。')
            check_unchanged()
            with updater.temporary_directory(self.data_file.parent, '.decor-manager-stage-') as stage:
                staged = []
                pending = [item for item in preview['files'] if item['action'] != 'keep']
                for number, item in enumerate(pending):
                    progress(f'下載 {number + 1}/{len(pending)}：{item["source"]}')
                    path = stage / f'{number}.png'
                    updater.download_file(item['url'], path)
                    updater.validate_png(path)
                    staged.append((path, self.output_root / item['relative']))
                check_unchanged()
                # Recoverable JSON backup before any official files are changed.
                backup_root = self.data_file.parent / '.decor-backups'
                backup_root.mkdir(exist_ok=True)
                backup = backup_root / f'decors-{datetime.now().strftime("%Y%m%d-%H%M%S")}-{token[:8]}.json'
                backup.write_bytes(preview['original'])
                progress('圖片驗證完成，正在寫入圖片與 JSON…')
                changed, identical = updater.commit_update(staged, self.data_file, preview['updated_json'], True)
            return {'changed_images': changed, 'identical_images': identical,
                    'kept_images': sum(item['action'] == 'keep' for item in preview['files']),
                    'backup': str(backup), 'message': '圖片與 decors.json 更新完成'}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send(self, status, value, content_type='application/json; charset=utf-8'):
        body = json.dumps(value, ensure_ascii=False).encode() if content_type.startswith('application/json') else value
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.end_headers()
        self.wfile.write(body)

    def valid_host(self):
        return self.headers.get('Host') in {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}

    def do_GET(self):
        if not self.valid_host():
            return self.send(403, {'error': '只允許本機存取。'})
        path = urlsplit(self.path).path
        try:
            if path == '/':
                html = (STATIC / 'index.html').read_text().replace('__CSRF_TOKEN__', self.server.csrf)
                return self.send(200, html.encode(), 'text/html; charset=utf-8')
            if path in ('/app.js', '/style.css'):
                return self.send(200, (STATIC / path[1:]).read_bytes(),
                                 'text/javascript; charset=utf-8' if path.endswith('.js') else 'text/css; charset=utf-8')
            if path == '/api/catalog':
                return self.send(200, self.server.manager.catalog())
            if path.startswith('/api/jobs/'):
                with self.server.manager.lock:
                    job = copy.deepcopy(self.server.manager.jobs.get(path.rsplit('/', 1)[-1]))
                return self.send(200 if job else 404, job or {'error': '找不到工作。'})
            return self.send(404, {'error': '找不到頁面。'})
        except Exception as exc:
            self.send(400, {'error': str(exc)})

    def do_POST(self):
        if not self.valid_host() or self.headers.get('X-Decor-Token') != self.server.csrf:
            return self.send(403, {'error': '請從本機管理頁面操作。'})
        origin = self.headers.get('Origin')
        if origin and origin not in {f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'}:
            return self.send(403, {'error': '來源不符。'})
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length < 1 or length > 200_000:
                raise updater.UpdateError('請求大小無效。')
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise updater.UpdateError('請求必須為 JSON 物件。')
            path = urlsplit(self.path).path
            manager = self.server.manager
            if path == '/api/refresh':
                return self.send(202, manager.submit('refresh', manager.refresh))
            if path == '/api/preview':
                return self.send(200, manager.preview(body.get('selections')))
            if path == '/api/apply':
                token = body.get('preview_id')
                if not isinstance(token, str):
                    raise updater.UpdateError('請先完成預覽。')
                return self.send(202, manager.submit('apply', lambda progress: manager.apply(token, progress)))
            self.send(404, {'error': '找不到操作。'})
        except Exception as exc:
            self.send(400, {'error': str(exc)})


def create_server(manager, port=8765):
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.manager = manager
    server.csrf = secrets.token_urlsafe(32)
    return server


def main(argv=None):
    parser = argparse.ArgumentParser(description='開啟本機飾品更新管理介面。')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-open', action='store_true', help='不要自動開啟瀏覽器。')
    parser.add_argument('--as-of', type=date.fromisoformat, help='以指定日期查看近六個月，例如 2026-10-07。')
    args = parser.parse_args(argv)
    try:
        server = create_server(Manager(today=args.as_of), args.port)
    except OSError as exc:
        parser.error(f'無法啟動：{exc}。可用 --port 8766 改用另一個連接埠。')
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'飾品管理介面：{url}\n按 Ctrl+C 結束。', flush=True)
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
