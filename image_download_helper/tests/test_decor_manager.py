import copy
import json
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import decor_manager as manager
import update_decors as updater
from wiki_updates import six_months_before, dates_in, parse_special, parse_standard_history, scan_sources, standard_targets


def special_html(events='', name='Test Flower', designs=(('Red', 1),)):
    links = ''.join(f'<td><a class="image" href="/File:Decor_{color}_Test_Flower_{number}.png"><img src="https://pikmin.wiki.gallery/images/thumb/a/ab/Decor_{color}_Test_Flower_{number}.png/80px-Decor_{color}_Test_Flower_{number}.png"></a></td>' for color, number in designs)
    return f'<div id="mw-content-text"><div class="mw-parser-output"><h2><span class="mw-headline" id="Test_Flower">{name}</span></h2><ul>{events}</ul><table class="wikitable scrollable noresize"><tr>{links}</tr></table></div></div>'


def snapshot():
    return {'today': '2026-10-07', 'cutoff': '2026-04-07', 'events': [], 'undated': [], 'errors': [], 'catalog': {
        'special:Test Flower': {'type': 'special', 'name': 'Test Flower', 'source': 'https://www.pikminwiki.com/Special_Decor_Pikmin#Test_Flower', 'images': {
            'red': {'url': 'https://example.test/red.png', 'file_name': 'red.png'},
            'ice': {'url': 'https://example.test/ice.png', 'file_name': 'ice.png'}}},
        'special:Later Flower': {'type': 'special', 'name': 'Later Flower', 'source': 'https://www.pikminwiki.com/Special_Decor_Pikmin#Later_Flower', 'images': {
            'yellow': {'url': 'https://example.test/yellow.png', 'file_name': 'yellow.png'}}}}}


class WikiUpdateTests(unittest.TestCase):
    def test_six_calendar_months_and_month_end_clamping(self):
        self.assertEqual(six_months_before(date(2026, 10, 7)), date(2026, 4, 7))
        self.assertEqual(six_months_before(date(2024, 8, 31)), date(2024, 2, 29))

    def test_shared_year_ordinals_and_cross_year_ranges(self):
        self.assertEqual(dates_in('October 1 st to October 31 st , 2026'), [date(2026, 10, 1), date(2026, 10, 31)])
        self.assertEqual(dates_in('December 15th to January 12th, 2026'), [date(2025, 12, 15), date(2026, 1, 12)])
        self.assertEqual(dates_in('November 26th, 2025 to November 27th, 2026'), [date(2025, 11, 26), date(2026, 11, 27)])
        self.assertEqual(dates_in('April 2026'), [date(2026, 4, 1)])

    def test_special_recent_new_rerun_and_future_exclusion(self):
        events = '<li>From March 1st to March 31st, 2026, these Decor Pikmin were available for the first time.</li><li>From October 1st to October 31st, 2026, all types were available.</li><li>From November 1st to November 30th, 2026, all types were available.</li>'
        catalog, changes, _ = parse_special(special_html(events), date(2026, 10, 7))
        self.assertIn('special:Test Flower', catalog)
        self.assertEqual(len(changes), 1)
        self.assertEqual(changes[0]['kind'], '復刻／再次開放')
        self.assertEqual(changes[0]['start'], '2026-10-01')
        self.assertTrue(changes[0]['source'].endswith('#Test_Flower'))

    def test_new_color_is_not_mislabeled_as_entirely_new_category(self):
        _, events, _ = parse_special(special_html('<li>From August 1st to August 31st, 2026, all types were available, with Ice Pikmin available for the first time.</li>'), date(2026, 10, 7))
        self.assertEqual(events[0]['kind'], '追加新款／復刻')

    def test_overlapping_window_keeps_active_and_excludes_ended_event(self):
        _, events, _ = parse_special(special_html('<li>From April 1st to April 30th, 2026, these Decor Pikmin were available.</li><li>From March 1st to April 6th, 2026, these Decor Pikmin were available.</li>'), date(2026, 10, 7))
        self.assertEqual(len(events), 1)

    def test_permanent_old_availability_is_not_a_new_rerun(self):
        _, events, _ = parse_special(special_html('<li>Since May 1st, 2024, these Decor Pikmin are permanently available.</li>'), date(2026, 10, 7))
        self.assertEqual(events, [])

    def test_multi_design_special_maps_numeric_ids_stably(self):
        catalog, _, _ = parse_special(special_html(designs=(('Red', 2), ('Red', 1), ('Ice', 1))), date(2026, 10, 7))
        images = catalog['special:Test Flower']['images']
        self.assertEqual(set(images), {'red', 'red1', 'ice'})
        self.assertTrue(images['red1']['file_name'].endswith('_2.png'))
        self.assertNotIn('/thumb/', images['red']['url'])

    def test_standard_history_date_filter_and_unresolved_versions(self):
        html = '<table class="wikitable"><tr><th>Update or date</th><th>Changes</th></tr><tr><td>April 6th, 2026</td><td>Added old decor.</td></tr><tr><td>September 9<sup>th</sup>, 2026</td><td><ul><li>Added the Pastry costume for Bakery.</li><li>Added Rare Decor for Acorn.</li></ul></td></tr><tr><td>150.0</td><td>Changed decor.</td></tr></table>'
        records = {'Bakery/Pastry': {'location': 'Bakery', 'costume': 'Pastry'}}
        events, unresolved = parse_standard_history(html, records, date(2026, 10, 7))
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0]['targets'], ['standard:Bakery/Pastry'])
        self.assertEqual(len(unresolved), 1)
        self.assertNotIn('start', unresolved[0])

    def test_history_suggestions_select_only_named_new_or_rare_costume(self):
        records = {
            'Bakery/Baguette': {'location': 'Bakery', 'costume': 'Baguette'},
            'Bakery/Pastry': {'location': 'Bakery', 'costume': 'Pastry'},
            'Forest/Acorn': {'location': 'Forest', 'costume': 'Acorn'},
            'Forest/Acorn (Rare)': {'location': 'Forest', 'costume': 'Acorn (Rare)'}}
        self.assertEqual(standard_targets('Added the Pastry costume for Bakery.', records), ['standard:Bakery/Pastry'])
        self.assertEqual(standard_targets('Added Rare Decor variants for Acorn.', records), ['standard:Forest/Acorn (Rare)'])
        self.assertEqual(standard_targets('Renamed the Bakery category.', records), [])

    def test_partial_source_failure_preserves_other_source(self):
        def fetch(page):
            if page == 'Decor_Pikmin':
                raise TimeoutError('temporary failure')
            return special_html()
        with patch('wiki_updates.fetch_page', side_effect=fetch):
            result = scan_sources(date(2026, 10, 7))
        self.assertEqual(result['errors'][0]['type'], 'standard')
        self.assertIn('special:Test Flower', result['catalog'])


class ManagerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.data_file = self.root / 'decors.json'
        self.output = self.root / 'images'
        self.data = {'categories': [{'id': 'event_later_flower', 'name': 'Later Flower', 'name_ch': '後面的花', 'image_path': 'LaterFlower', 'icon': 'special.png', 'variants': [{'id': 'event_later_flower', 'name': 'Later Flower', 'name_ch': '後面的花', 'image_name': 'LaterFlower', 'colors': ['yellow']}]}]}
        self.data_file.write_text(json.dumps(self.data))
        self.manager = manager.Manager(self.data_file, self.output, date(2026, 10, 7))
        self.manager.snapshot = snapshot()

    def tearDown(self):
        self.temp.cleanup()

    def preview(self, **extra):
        return self.manager.preview([dict(id='special:Test Flower', chinese_name='測試花朵', **extra)])

    def test_new_special_inserts_before_next_wiki_category(self):
        before = self.data_file.read_bytes()
        plan = self.preview()
        self.assertEqual(plan['summaries'][0]['position'], 1)
        self.assertEqual(plan['summaries'][0]['next_name'], 'Later Flower')
        self.assertEqual(plan['counts'], {'download': 2, 'keep': 0, 'replace': 0})
        self.assertEqual(self.data_file.read_bytes(), before)

    def test_default_keeps_existing_images_and_overwrite_requires_selection(self):
        destination = self.output / 'TestFlower/TestFlower_Red.png'
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'old image')
        self.assertEqual(self.preview()['counts']['keep'], 1)
        self.assertEqual(self.preview(overwrite=True)['counts']['replace'], 1)

    def test_catalog_counts_files_even_when_json_category_is_missing(self):
        destination = self.output / 'TestFlower/TestFlower_Red.png'
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'existing image')
        item = next(item for item in self.manager.catalog()['items'] if item['id'] == 'special:Test Flower')
        self.assertEqual(item['status'], '新增分類')
        self.assertEqual(item['missing_images'], 1)
        self.assertEqual(item['image_count'], 2)

    def test_apply_uses_preview_and_creates_backup(self):
        plan = self.preview()
        def download(url, path):
            path.write_bytes(updater.PNG_SIGNATURE + b'fixture')
        with patch.object(updater, 'download_file', side_effect=download):
            result = self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(result['changed_images'], 2)
        self.assertEqual(json.loads(Path(result['backup']).read_text()), self.data)
        self.assertEqual(json.loads(self.data_file.read_text())['categories'][0]['name_ch'], '測試花朵')
        self.assertTrue((self.output / 'TestFlower/TestFlower_Ice.png').exists())
        with self.assertRaisesRegex(updater.UpdateError, '預覽已失效'):
            self.manager.apply(plan['preview_id'], lambda message: None)

    def test_preview_token_invalidated_on_repreview(self):
        old = self.preview()['preview_id']
        self.preview()
        with self.assertRaises(updater.UpdateError):
            self.manager.apply(old, lambda message: None)

    def test_missing_translation_is_rejected_without_prompt(self):
        with patch.object(sys.stdin, 'isatty', return_value=True), patch('builtins.input', side_effect=AssertionError('must not prompt')):
            with self.assertRaisesRegex(updater.UpdateError, '需要中文名稱'):
                self.manager.preview([{'id': 'special:Test Flower'}])

    def test_external_json_edit_rejects_apply(self):
        plan = self.preview()
        self.data_file.write_bytes(b'changed externally')
        with self.assertRaisesRegex(updater.UpdateError, 'JSON 已'):
            self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(self.data_file.read_bytes(), b'changed externally')
        self.assertFalse(self.output.exists())

    def test_external_image_edit_rejects_apply(self):
        plan = self.preview()
        destination = self.output / 'TestFlower/TestFlower_Red.png'
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'external edit')
        with self.assertRaisesRegex(updater.UpdateError, '圖片已'):
            self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(destination.read_bytes(), b'external edit')

    def test_download_failure_leaves_all_official_files_unchanged(self):
        plan = self.preview()
        original = self.data_file.read_bytes()
        def bad_download(url, path):
            path.write_bytes(b'not a png')
        with patch.object(updater, 'download_file', side_effect=bad_download):
            with self.assertRaises(updater.UpdateError):
                self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(self.data_file.read_bytes(), original)
        self.assertFalse(self.output.exists())

    def test_json_write_failure_rolls_back_replaced_and_new_images(self):
        destination = self.output / 'TestFlower/TestFlower_Red.png'
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'old image')
        original = self.data_file.read_bytes()
        plan = self.preview(overwrite=True)
        real_replace = updater.os.replace
        def replace(source, target):
            if Path(target) == self.data_file:
                raise OSError('simulated JSON write failure')
            return real_replace(source, target)
        def download(url, path):
            path.write_bytes(updater.PNG_SIGNATURE + b'new image')
        with patch.object(updater, 'download_file', side_effect=download), patch.object(updater.os, 'replace', side_effect=replace):
            with self.assertRaisesRegex(OSError, 'simulated'):
                self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(destination.read_bytes(), b'old image')
        self.assertFalse((self.output / 'TestFlower/TestFlower_Ice.png').exists())
        self.assertEqual(self.data_file.read_bytes(), original)

    def test_kept_images_are_not_fetched(self):
        destination = self.output / 'TestFlower/TestFlower_Red.png'
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b'original')
        plan = self.preview()
        def download(url, path):
            path.write_bytes(updater.PNG_SIGNATURE + b'fixture')
        with patch.object(updater, 'download_file', side_effect=download) as fetch:
            self.manager.apply(plan['preview_id'], lambda message: None)
        self.assertEqual(fetch.call_count, 1)
        self.assertEqual(destination.read_bytes(), b'original')

    def test_batch_positions_use_final_json_and_translation_required(self):
        plan = self.manager.preview([{'id': 'special:Later Flower'}, {'id': 'special:Test Flower', 'chinese_name': '測試花朵'}])
        self.assertEqual([summary['position'] for summary in plan['summaries']], [2, 1])

    def test_unknown_or_duplicate_selection_is_rejected(self):
        for selections in ([{'id': 'unknown'}], [{'id': 'special:Test Flower', 'chinese_name': '花'}] * 2):
            with self.assertRaises(updater.UpdateError):
                self.manager.preview(selections)

    def test_numbered_special_colors_preserve_existing_missing_colors(self):
        category = self.data['categories'][0]
        category['variants'][0]['colors'] += ['red1']
        self.data_file.write_text(json.dumps(self.data))
        plan = self.manager.preview([{'id': 'special:Later Flower'}])
        self.assertIn('red1', plan['summaries'][0]['after']['variants'][0]['colors'])

    def test_new_regular_variant_is_inserted_at_wiki_position(self):
        regular = {'id': 'forest', 'name': 'Forest', 'name_ch': '森林', 'image_path': 'Forest', 'variants': [
            {'id': 'acorn', 'name': 'Acorn', 'name_ch': '橡實', 'image_name': 'Acorn', 'colors': ['red']}]}
        records = {'Forest/Acorn (Rare)': {'location': 'Forest', 'costume': 'Acorn (Rare)', 'images': {'red': {'url': 'https://example.test/red.png', 'file_name': 'red.png'}}}, 'Forest/Acorn': {'location': 'Forest', 'costume': 'Acorn', 'images': {'red': {'url': 'https://example.test/red.png', 'file_name': 'red.png'}}}}
        arguments = manager.standard_args(dict(name='Forest/Acorn (Rare)'), {'translations': {'Acorn (Rare)': '稀有橡實'}})
        updated, _, _ = updater.create_standard_plan({'categories': [regular]}, records, arguments)
        self.assertEqual([variant['id'] for variant in updated['categories'][0]['variants']], ['forest_acorn_rare', 'acorn'])


if __name__ == '__main__':
    unittest.main()
