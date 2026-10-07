"""Run with .venv/bin/python -m unittest discover -s image_download_helper/tests."""
import copy
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import update_decors as updater
from download_decor import parse_decor_html


def args(category='Rainy Day', **overrides):
    defaults = dict(category=category, variant_chinese_name=[], custom_id=None,
                    custom_image_token=None, icon=None, chinese_name=None,
                    list_categories=False, dry_run=False, yes=True, force=False)
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def record(location, costume, colors):
    return {'location': location, 'costume': costume, 'images': {
        color: {'url': f'https://example.test/{costume}_{color}.png',
                'file_name': f'{costume}_{color}.png'} for color in colors}}


def table_html(rows):
    return '<table class="wikitable"><tr><th>Location</th><th>Costume</th><th>Blue</th></tr>' + rows + '</table>'


def image(number):
    return f'<td><a class="image" href="/File:Decor_Blue_Leaf_Hat_{number}.png"><img src="https://pikmin.wiki.gallery/images/thumb/a/ab/Decor_Blue_Leaf_Hat_{number}.png/100px-Decor_Blue_Leaf_Hat_{number}.png"></a></td>'


class StandardUpdateTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(updater.DEFAULT_DATA_FILE.read_text())
        self.records = {'Rainy Day/Leaf Hat': record('Rainy Day', 'Leaf Hat', ['blue', 'blue1', 'blue2'])}

    def test_rowspans_include_all_color_variants_and_original_pngs(self):
        html = table_html('<tr><th rowspan="3">Rainy Day</th><th rowspan="3">Leaf Hat</th>' + image(1) + '</tr><tr>' + image(2) + '</tr><tr>' + image(3) + '</tr>')
        parsed = parse_decor_html(html)['Rainy Day/Leaf Hat']['images']
        self.assertEqual(list(parsed), ['blue', 'blue1', 'blue2'])
        self.assertNotIn('/thumb/', parsed['blue']['url'])
        self.assertTrue(parsed['blue2']['url'].endswith('Decor_Blue_Leaf_Hat_3.png'))

    def test_numbered_designs_preserve_ids_after_wiki_reorders_rows(self):
        html = table_html('<tr><th rowspan="3">Rainy Day</th><th rowspan="3">Leaf Hat</th>' + image(3) + '</tr><tr>' + image(1) + '</tr><tr>' + image(2) + '</tr>')
        parsed = parse_decor_html(html)['Rainy Day/Leaf Hat']['images']
        self.assertTrue(parsed['blue']['file_name'].endswith('_1.png'))
        self.assertTrue(parsed['blue2']['file_name'].endswith('_3.png'))

    def test_roadside_sticker_rows_remain_separate_variants(self):
        def sticker(number):
            return image(number).replace('Leaf_Hat', 'Sticker')
        html = table_html('<tr><th rowspan="3">Roadside</th><th rowspan="3">Sticker</th>' + sticker(1) + '</tr><tr>' + sticker(2) + '</tr><tr>' + sticker(3) + '</tr>')
        parsed = parse_decor_html(html)
        self.assertEqual(list(parsed), ['Roadside/Green Sticker', 'Roadside/Blue Sticker', 'Roadside/Orange Sticker'])
        self.assertEqual(list(parsed['Roadside/Blue Sticker']['images']), ['blue'])

    def test_unknown_table_layout_does_not_silently_update_json(self):
        with self.assertRaises(ValueError):
            parse_decor_html(table_html('<tr><th>Rainy Day</th><th>Leaf Hat</th></tr>'))

    def test_preserve_ids_names_paths_and_unrelated_data(self):
        original = copy.deepcopy(self.data)
        updated, downloads, index = updater.create_standard_plan(self.data, self.records, args())
        self.assertEqual(updated, self.data)
        self.assertEqual(self.data, original)
        self.assertEqual(updated['categories'][index]['variants'][0]['id'], 'leaf_hat')
        self.assertEqual([item[2] for item in downloads], ['RainyDay/LeafHat_Blue.png', 'RainyDay/LeafHat_Blue1.png', 'RainyDay/LeafHat_Blue2.png'])

    def test_missing_wiki_colors_are_preserved(self):
        self.records['Rainy Day/Leaf Hat']['images'].pop('blue2')
        updated, _, index = updater.create_standard_plan(self.data, self.records, args())
        self.assertIn('blue2', updated['categories'][index]['variants'][0]['colors'])

    def test_rare_alias_preserves_collection_id(self):
        records = {'Restaurant/Chef Hat (Rare)': record('Restaurant', 'Chef Hat (Rare)', ['red', 'ice'])}
        updated, downloads, index = updater.create_standard_plan(self.data, records, args('Restaurant'))
        self.assertEqual(updated['categories'][index]['variants'][1]['id'], 'shiny_chef_hat')
        self.assertEqual(downloads[0][2], 'Restaurant/ChefHat(Rare)_Red.png')

    def test_costume_selection_preserves_other_variants(self):
        records = {'Forest/Acorn': record('Forest', 'Acorn', ['red'])}
        updated, _, index = updater.create_standard_plan(self.data, records, args('Acorn'))
        self.assertEqual(updated['categories'][index], self.data['categories'][index])

    def test_new_variant_needs_translation(self):
        bakery = next(category for category in self.data['categories'] if category['id'] == 'bakery')
        bakery['variants'] = [variant for variant in bakery['variants'] if variant['image_name'] != 'Pastry']
        records = {'Bakery/Pastry': record('Bakery', 'Pastry', ['red', 'ice'])}
        with self.assertRaisesRegex(updater.UpdateError, '需要中文名稱'):
            updater.create_standard_plan(self.data, records, args('Bakery'))
        updated, downloads, index = updater.create_standard_plan(self.data, records, args('Bakery', variant_chinese_name=['Pastry=酥皮點心']))
        variant = updated['categories'][index]['variants'][-1]
        self.assertEqual(variant['id'], 'bakery_pastry')
        self.assertEqual(variant['name_ch'], '酥皮點心')
        self.assertEqual(downloads[1][2], 'Bakery/Pastry_Ice.png')

    def test_new_category_is_inserted_before_events(self):
        records = {'New Location/New Costume': record('New Location', 'New Costume', ['red'])}
        updated, downloads, index = updater.create_standard_plan(self.data, records, args('New Location', chinese_name='新地點', variant_chinese_name=['New Costume=新造型']))
        self.assertEqual(updated['categories'][index]['id'], 'new_location')
        self.assertTrue(updated['categories'][index + 1]['id'].startswith('event_'))
        self.assertEqual(downloads[0][2], 'NewLocation/NewCostume_Red.png')

    def test_ambiguous_costume_is_rejected(self):
        records = {'A/Hat': record('A', 'Hat', ['red']), 'B/Hat': record('B', 'Hat', ['red'])}
        with self.assertRaisesRegex(updater.UpdateError, '多個地點'):
            updater.select_standard_records(records, 'Hat')
        self.assertEqual(updater.select_standard_records(records, 'A/Hat')[0]['location'], 'A')

    def test_path_traversal_and_id_changes_are_rejected(self):
        for overrides in ({'custom_image_token': '../escape'}, {'custom_id': 'changed_id'}):
            with self.assertRaises(updater.UpdateError):
                updater.create_standard_plan(self.data, self.records, args(**overrides))

    def test_dry_run_does_not_download_or_write(self):
        with tempfile.TemporaryDirectory() as root:
            data_file = Path(root) / 'decors.json'
            data_file.write_text(json.dumps(self.data))
            before = data_file.read_bytes()
            with patch.object(updater, 'load_standard_records', return_value=self.records), patch.object(updater, 'download_file') as download, redirect_stdout(io.StringIO()):
                self.assertEqual(updater.update_standard(args(dry_run=True), data_file, Path(root) / 'images'), 0)
                download.assert_not_called()
            self.assertEqual(data_file.read_bytes(), before)
            self.assertFalse((Path(root) / 'images').exists())

    def test_successful_download_writes_json_and_all_images(self):
        records = {'Rainy Day/Leaf Hat': record('Rainy Day', 'Leaf Hat', ['blue', 'blue1', 'blue2', 'blue3'])}
        def download(_url, destination):
            destination.write_bytes(updater.PNG_SIGNATURE + b'fixture')
        with tempfile.TemporaryDirectory() as root:
            data_file = Path(root) / 'decors.json'
            data_file.write_text(json.dumps(self.data))
            output = Path(root) / 'images'
            with patch.object(updater, 'load_standard_records', return_value=records), patch.object(updater, 'download_file', side_effect=download), redirect_stdout(io.StringIO()):
                updater.update_standard(args(), data_file, output)
            updated = json.loads(data_file.read_text())
            rainy = next(c for c in updated['categories'] if c['id'] == 'rainy_day')
            self.assertIn('blue3', rainy['variants'][0]['colors'])
            self.assertEqual(len(list(output.rglob('*.png'))), 4)

    def test_failed_png_download_leaves_collection_and_images_untouched(self):
        def bad_download(_url, destination):
            destination.write_bytes(b'<html>error</html>')
        with tempfile.TemporaryDirectory() as root:
            data_file = Path(root) / 'decors.json'
            data_file.write_text(json.dumps(self.data))
            before = data_file.read_bytes()
            output = Path(root) / 'images'
            with patch.object(updater, 'load_standard_records', return_value=self.records), patch.object(updater, 'download_file', side_effect=bad_download), redirect_stdout(io.StringIO()):
                with self.assertRaises(updater.UpdateError):
                    updater.update_standard(args(), data_file, output)
            self.assertEqual(data_file.read_bytes(), before)
            self.assertFalse(output.exists())

    def test_concurrent_json_edit_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            data_file = Path(root) / 'decors.json'
            data_file.write_text(json.dumps(self.data))
            output = Path(root) / 'images'
            def download(_url, destination):
                destination.write_bytes(updater.PNG_SIGNATURE + b'fixture')
                data_file.write_bytes(b'external edit')
            with patch.object(updater, 'load_standard_records', return_value=self.records), patch.object(updater, 'download_file', side_effect=download), redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(updater.UpdateError, '其他程序修改'):
                    updater.update_standard(args(), data_file, output)
            self.assertEqual(data_file.read_bytes(), b'external edit')
            self.assertFalse(output.exists())

    def test_commit_conflict_rolls_back_prior_files(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            data_file = root / 'decors.json'
            data_file.write_bytes(b'original json')
            staged1, staged2, dest1, dest2 = [root / name for name in ('stage1', 'stage2', 'dest1', 'dest2')]
            staged1.write_bytes(b'new1')
            staged2.write_bytes(b'new2')
            dest2.write_bytes(b'existing')
            with self.assertRaises(updater.UpdateError):
                updater.commit_update([(staged1, dest1), (staged2, dest2)], data_file, b'updated json', False)
            self.assertFalse(dest1.exists())
            self.assertEqual(dest2.read_bytes(), b'existing')
            self.assertEqual(data_file.read_bytes(), b'original json')

    def test_special_workflow_still_works(self):
        resolved = updater.ResolvedDecor('Test Event', (updater.DownloadSpec('red', 'Red', 'Decor_Red_Test_Event.png', 'https://example.test/red.png'),), ('Test Event',))
        plan = updater.create_plan(self.data, 'Test Event', '測試活動', None, None, resolved)
        updated = updater.apply_plan_to_data(self.data, plan)
        self.assertEqual(updated['categories'][plan.insert_index]['id'], 'event_test_event')
        self.assertEqual(updated['categories'][plan.insert_index]['icon'], 'special.png')

    def test_cli_standard_dispatch_and_dry_run(self):
        with patch.object(sys, 'argv', ['update_decors.py', 'Rainy Day', '--type', 'standard', '--dry-run']), patch.object(updater, 'load_standard_records', return_value=self.records), patch.object(updater, 'download_file') as download, redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(updater.main(), 0)
            download.assert_not_called()


if __name__ == '__main__':
    unittest.main()
