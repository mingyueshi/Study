import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
from unittest.mock import patch

from django.test import SimpleTestCase
from django.urls import reverse

from . import upgrade_history as history
from .upgrade_history import load_history, validate_history


class UpgradeHistoryDataTests(SimpleTestCase):
    def test_saved_history_is_valid(self):
        records = load_history()
        self.assertGreater(len(records), 1)
        self.assertEqual(records, sorted(records, key=lambda row: row['date'], reverse=True))

    def test_unchanged_snapshot_is_parsed_once_and_changed_snapshot_is_reloaded(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'history.json'
            data = {'schema_version': 1, 'records': [
                {'revision': 'a' * 40, 'date': '2026-11-17', 'title': '完善阅读设置'},
            ]}
            path.write_text(json.dumps(data), encoding='utf-8')
            url = reverse('upgrade-history')
            with patch.object(history, 'HISTORY_PATH', path), patch.object(history, 'validate_history', wraps=validate_history) as validate:
                self.assertContains(self.client.get(url), '完善阅读设置')
                self.assertContains(self.client.get(url, {'page': '2'}), '完善阅读设置')
                validate.assert_called_once()
                path.write_text('{broken', encoding='utf-8')
                with self.assertLogs('catalog.file_content', level='ERROR'):
                    response = self.client.get(url)
                self.assertContains(response, '内容暂时无法加载', status_code=503)
                data['records'][0]['title'] = '已恢复的升级记录'
                replacement = path.with_suffix('.new')
                replacement.write_text(json.dumps(data), encoding='utf-8')
                replacement.replace(path)
                self.assertContains(self.client.get(url), '已恢复的升级记录')
                self.assertEqual(validate.call_count, 2)

    def test_rejects_invalid_and_ambiguous_records(self):
        valid = {'schema_version': 1, 'records': [
            {'revision': 'a' * 40, 'date': '2026-11-17', 'title': '完善阅读设置'},
            {'revision': 'b' * 40, 'date': '2026-11-16', 'title': '增加地图玩法'},
        ]}
        invalid = []
        for field, value in [('revision', 'oops'), ('date', '2026-02-30'),
                             ('date', '2026-11-18'), ('title', ''), ('title', '两行\n文字')]:
            data = copy.deepcopy(valid)
            data['records'][1][field] = value
            invalid.append(data)
        duplicate = copy.deepcopy(valid)
        duplicate['records'][1]['revision'] = 'a' * 40
        invalid.extend([duplicate, {'schema_version': True, 'records': valid['records']},
                        {'schema_version': 1, 'records': []}])
        for data in invalid:
            with self.subTest(data=data), self.assertRaises(ValueError):
                validate_history(data)

    def test_export_only_includes_this_system_and_works_when_copied(self):
        script = Path(__file__).resolve().parents[1] / 'scripts' / 'build_upgrade_history.py'
        spec = importlib.util.spec_from_file_location('build_upgrade_history', script)
        exporter = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(exporter)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.run(['git', '-C', str(root), '-c', 'user.name=测试',
                                       '-c', 'user.email=test@example.invalid', *args],
                                      check=True, capture_output=True, text=True).stdout
            git('init', '--quiet')
            project = root / 'primary-system'
            project.mkdir()
            (project / 'README.md').write_text('学习系统', encoding='utf-8')
            git('add', '.')
            git('commit', '--quiet', '-m', '新增学习系统')
            (root / 'personal-learning').mkdir()
            (root / 'personal-learning' / 'README.md').write_text('其他系统', encoding='utf-8')
            git('add', '.')
            git('commit', '--quiet', '-m', '其他系统的独立改进')
            (root / 'docs').mkdir()
            (root / 'docs/content-guide.md').write_text('内容编排指南', encoding='utf-8')
            git('add', '.')
            git('commit', '--quiet', '-m', '新增内容编排指南')
            snapshot = project / 'catalog/data/upgrade_history.json'
            snapshot.parent.mkdir(parents=True)
            snapshot.write_text('{}', encoding='utf-8')
            git('add', '.')
            git('commit', '--quiet', '-m', '同步升级记录快照')
            with patch.object(exporter, 'PROJECT', project):
                records = exporter.build_history()['records']
            self.assertEqual([row['title'] for row in records], ['新增内容编排指南', '新增学习系统'])
            # 单独拷走的系统可使用自己的 Git 根目录。
            snapshot.unlink()
            git('init', '--quiet', str(project))
            git('-C', str(project), 'add', '.')
            git('-C', str(project), 'commit', '--quiet', '-m', '独立维护')
            with patch.object(exporter, 'PROJECT', project):
                self.assertEqual([row['title'] for row in exporter.build_history()['records']], ['独立维护'])


class UpgradeHistoryPageTests(SimpleTestCase):
    def setUp(self):
        self.records = [
            {'revision': f'{index:040x}', 'date': f'2026-11-{18 - index:02}',
             'title': '阅读与地图' if index == 2 else f'完善学习体验（第 {index} 次）'}
            for index in range(1, 8)
        ] + [{'revision': 'f' * 40, 'date': '2026-10-30', 'title': '新增学习系统'}]
        patcher = patch('catalog.upgrade_views.load_history', return_value=self.records)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.url = reverse('upgrade-history')

    def test_guest_can_read_timeline_and_follow_footer(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '成长时间线')
        self.assertContains(response, '阅读与地图')
        self.assertContains(response, '共 8 条')
        self.assertContains(response, f'href="{self.url}" aria-current="page"')
        self.assertEqual(len(response.context['page'].object_list), 5)
        self.assertNotContains(response, '新增学习系统')

    def test_search_terms_month_and_revision_can_find_records(self):
        for query in ['阅读 地图', self.records[1]['revision']]:
            response = self.client.get(self.url, {'q': query, 'month': '2026-11'})
            self.assertContains(response, '共 1 条')
            self.assertContains(response, '阅读与地图')
        october = self.client.get(self.url, {'month': '2026-10'})
        self.assertContains(october, '新增学习系统')
        self.assertNotContains(october, '阅读与地图')

    def test_pagination_preserves_filters_and_handles_invalid_parameters(self):
        response = self.client.get(self.url, {'month': '2026-11', 'q': '学习', 'page': 'nonsense'})
        self.assertEqual(response.context['page'].number, 1)
        self.assertIn('month=2026-11', response.context['next_url'])
        self.assertIn('q=', response.context['next_url'])
        last = self.client.get(self.url, {'page': 999, 'month': 'invalid'})
        self.assertContains(last, '新增学习系统')
        self.assertEqual(last.context['selected_month'], '')

    def test_load_older_link_returns_only_the_next_matching_dates(self):
        response = self.client.get(self.url, {'month': '2026-11', 'q': '学习'})
        self.assertContains(response, 'data-upgrade-next')
        first_dates = {group['date'] for group in response.context['page']}
        older = self.client.get(self.url + response.context['next_url'])
        self.assertEqual(older.status_code, 200)
        older_dates = {group['date'] for group in older.context['page']}
        self.assertEqual(len(older_dates), 1)
        self.assertLess(max(older_dates), min(first_dates))
        self.assertContains(older, '完善学习体验（第 7 次）')
        self.assertNotContains(older, '新增学习系统')
        self.assertNotContains(older, 'data-upgrade-next')

    def test_empty_search_is_escaped_and_can_be_cleared(self):
        response = self.client.get(self.url, {'q': '<script>alert(1)</script>'})
        self.assertContains(response, '暂时没有找到这条足迹')
        self.assertContains(response, '查看全部升级记录')
        self.assertNotContains(response, '<script>alert(1)</script>')
        self.assertEqual(self.client.post(self.url).status_code, 405)
