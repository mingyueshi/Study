"""数学公式专题测试：数据契约、?stage/?chapter 分视图、只读纪律（GET 零会话）。

零模型只读应用，会话即泄漏渠道——页面必须保持 GET 零写入零会话（照 grammar
先例）；数据改坏时 load_data 直接拒绝上线（照 plurals 同纪律）。
"""
import json
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from . import content

DATA = json.loads((Path(__file__).parent / 'data' / 'formulas.json').read_text(encoding='utf-8'))


def _iter_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _iter_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _iter_strings(item)


class FormulaDataTests(SimpleTestCase):
    """数据契约：结构、学段归属、文本契约与规模下限。"""

    def test_schema_and_stages(self):
        self.assertEqual(DATA['schema_version'], 1)
        self.assertEqual([s['code'] for s in DATA['stages']], ['primary', 'junior', 'senior'])
        self.assertEqual([s['name'] for s in DATA['stages']], ['小学', '初中', '高中'])

    def test_chapters_unique_and_valid_stage(self):
        codes = [c['code'] for c in DATA['chapters']]
        self.assertEqual(len(codes), len(set(codes)))
        stages = {s['code'] for s in DATA['stages']}
        for chapter in DATA['chapters']:
            self.assertIn(chapter['stage'], stages)
            self.assertTrue(chapter['title'])
            self.assertTrue(chapter['intro'])

    def test_groups_reference_known_chapters(self):
        codes = {c['code'] for c in DATA['chapters']}
        for group in DATA['groups']:
            self.assertIn(group['chapter'], codes)
            self.assertTrue(group['items'])
            for name, formula in group['items']:
                self.assertTrue(name.strip())
                self.assertTrue(formula.strip())

    def test_primary_scale(self):
        """小学是重点：10 章、40+ 组、150+ 条公式。"""
        chapter_stage = {c['code']: c['stage'] for c in DATA['chapters']}
        primary_groups = [g for g in DATA['groups'] if chapter_stage[g['chapter']] == 'primary']
        self.assertEqual(len([c for c in DATA['chapters'] if c['stage'] == 'primary']), 10)
        self.assertGreaterEqual(len(primary_groups), 40)
        self.assertGreaterEqual(sum(len(g['items']) for g in primary_groups), 150)

    def test_text_contract(self):
        """值内禁英文双引号、裸换行与 HTML 标签；中文标点口径。"""
        for text in _iter_strings(DATA):
            self.assertNotIn('"', text)
            self.assertNotIn('\n', text)
            self.assertNotRegex(text, r'<[a-zA-Z/!?]')

    def test_validate_passes_and_rejects_drift(self):
        self.assertTrue(content.validate(DATA))
        with self.assertRaises(ImproperlyConfigured):
            content.validate({**DATA, 'schema_version': 2})
        with self.assertRaises(ImproperlyConfigured):
            content.validate({**DATA, 'groups': DATA['groups'] + [{'chapter': 'nope', 'title': '坏组', 'items': [['甲', '乙']]}]})
        with self.assertRaises(ImproperlyConfigured):
            content.validate({**DATA, 'groups': DATA['groups'] + [{'chapter': 'plane', 'title': '坏条目', 'items': [['只有一项']]}]})

    def test_load_data_is_cached_and_validated(self):
        self.assertIs(content.load_data(), content.load_data())

    def test_stage_counts(self):
        stages = {s['code']: s for s in content.stages_with_counts()}
        self.assertEqual(stages['primary']['chapters'], 10)
        self.assertGreaterEqual(stages['primary']['groups'], 40)
        self.assertGreaterEqual(stages['junior']['groups'], 4)
        self.assertGreaterEqual(stages['senior']['groups'], 4)


class FormulaPageTests(TestCase):
    """?stage 与 ?chapter 分视图：切换生效、非法参数一律回退。"""

    def test_page_renders_primary_default(self):
        response = self.client.get(reverse('math-formulas'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '数学公式')
        self.assertContains(response, '数的认识与整除')
        self.assertContains(response, 'data-mform-row')
        self.assertEqual(response.context['stage']['code'], 'primary')
        self.assertEqual(response.context['chapter']['code'], 'count')

    def test_stage_switch(self):
        response = self.client.get(reverse('math-formulas'), {'stage': 'junior'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '数与式')
        self.assertContains(response, '整理中')
        self.assertEqual(response.context['chapter']['code'], 'jc-shu')

    def test_invalid_stage_falls_back_to_primary(self):
        response = self.client.get(reverse('math-formulas'), {'stage': 'college'})
        self.assertEqual(response.context['stage']['code'], 'primary')

    def test_chapter_switch(self):
        response = self.client.get(reverse('math-formulas'), {'stage': 'primary', 'chapter': 'plane'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '圆环面积')
        self.assertContains(response, 'C = πd = 2πr')
        self.assertEqual(response.context['chapter']['group_count'], 3)

    def test_cross_stage_chapter_falls_back_to_first(self):
        response = self.client.get(reverse('math-formulas'), {'stage': 'junior', 'chapter': 'plane'})
        self.assertEqual(response.context['chapter']['code'], 'jc-shu')

    def test_read_only_no_session(self):
        response = self.client.get(reverse('math-formulas'))
        self.assertNotIn(settings.SESSION_COOKIE_NAME, response.cookies)

    def test_pager_links(self):
        response = self.client.get(reverse('math-formulas'), {'stage': 'primary', 'chapter': 'calc'})
        self.assertIn('prev_chapter', response.context)
        self.assertEqual(response.context['next_chapter']['code'], 'equation')


class HomePageEntryTests(TestCase):
    """首页专题卡：数学卡可点达公式页（注册即渲染，模板零硬编码）。"""

    def test_special_entry_on_home(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '数学公式')
        self.assertContains(response, reverse('math-formulas'))
