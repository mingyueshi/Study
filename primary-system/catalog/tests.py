import copy
import io
import json
import tempfile
from pathlib import Path
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from .entry_registry import SPECIAL_ENTRIES
from .importing import import_snapshot
from .models import ContentItem, Grade, Module, Placement, Stage, Subject, Textbook, TextbookBook, TextbookEdition, Unit, \
    published_textbook_books


def minimal_snapshot():
    return {'schema_version': 1, 'modules': [{
        'code': 'math', 'source_file': 'primary/math-data.js', 'sha256': 'a' * 64,
        'data': {'units': [{'id': 'test-unit', 'name': '数字', 'points': [
            {'id': 'point-1', 'title': '认识数字', 'overview': '测试内容', 'items': ['十进制'], 'fig': 'figure-reference'},
        ]}], 'formulas': [{'title': '测试公式', 'items': ['1 + 1 = 2']}]},
    }]}


class PlatformFixture(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_platform', stdout=io.StringIO())
        import_snapshot(minimal_snapshot(), publish=True)
        cls.item = ContentItem.objects.get(title='认识数字')
        cls.collection = TextbookBook.objects.get(code='primary-math-all')
        cls.unit = cls.collection.units.get(code='test-unit')


def english_snapshot():
    return {'schema_version': 1, 'modules': [{
        'code': 'english', 'source_file': 'primary/english-data.js', 'sha256': 'b' * 64,
        'data': {
            'ENGLISH_UNITS': [{'id': '4a-u1', 'book': '四年级上册', 'name': 'Unit 1  I love sports', 'zh': '我爱运动',
                               'words': [{'en': 'sport', 'ipa': '/spɔːt/', 'zh': 'n. 运动', 'emoji': '⚽'}]}],
            'ENGLISH_DIALOGUES': [{'id': '4a-u1-d1', 'unitId': '4a-u1', 'title': 'Start up  Read and answer',
                                   'zh': '你能做到吗', 'emoji': '💬',
                                   'lines': [{'who': 'Amy', 'emoji': '👧', 'en': 'Can you jump high, Daming?', 'zh': '你能跳得很高吗？'},
                                             {'who': 'Daming', 'emoji': '👦', 'en': 'Yes, I can.', 'zh': '是的，我能。'}]}],
            'ENGLISH_BOOKS': ['四年级上册'], 'ENGLISH_WORDS': [],
        }}]}


def knowledge_snapshot():
    """primary/knowledge-data.js 新版单一数据源的形状：课文素材 + 单元板块 + 顶层古诗文。"""
    return {'schema_version': 1, 'modules': [{
        'code': 'knowledge', 'source_file': 'primary/knowledge-data.js', 'sha256': 'c' * 64,
        'data': {
            'textbook': '人教版（统编版·新课标）语文四年级上册', 'edition': '测试修订版 · 一个单元一课',
            'units': [{'id': 'u1', 'no': '第一单元', 'name': '自然之美', 'emoji': '🌊', 'color': '#2f9bd6',
                       'banner': 'bn-u1', 'intro': '壮丽山河，四时之美。',
                       'goals': ['边读边想象画面'],
                       'book': {'title': '快乐读书吧', 'points': ['读《中国神话传说》']},
                       'lessons': [{'id': '1', 'title': '观潮', 'tag': '精读', 'author': '赵宗成 朱明元',
                                    'fig': 'tide', 'img': 'images/lessons/qiantang.jpg',
                                    'overview': '课文描绘了钱塘江大潮由远而近的全过程。',
                                    'main': ['潮来时：白浪翻滚，形成两丈多高的水墙。'],
                                    'excerpts': ['浪潮犹如千万匹白色战马齐头并进。'],
                                    'authorLife': '课文改写自观潮报道。',
                                    'authorBio': '两位作者亲睹大潮后写下此篇。',
                                    'videos': [{'bvid': 'BV1aP4y1Z7QR', 'title': '钱塘江大潮现场', 'up': '央视频',
                                                'dur': 532, 'note': '现场实拍'}]}]}],
            'poems': [{'title': '鹿柴', 'dynasty': '唐', 'author': '王维', 'kind': '诗',
                       'fig': 'luzhai', 'img': 'images/poems/luzhai.jpg', 'lines': ['空山不见人，但闻人语响。'],
                       'note': '泛指空幽的意境。', 'notes': [['但', '只']],
                       'life': '王维，唐代诗人。', 'bio': '本诗作于辋川别业。', 'bg': '隐居辋川时所作。', 'videos': []}],
            'sayings': [], 'polyphonic': [], 'similar': [],
        }}]}


class EnglishTextbookTests(PlatformFixture):
    def test_dialogue_import_and_texts_tab(self):
        report = import_snapshot(english_snapshot(), publish=True)
        self.assertGreaterEqual(report['created'], 1)
        item = ContentItem.objects.get(kind='dialogue', title__contains='Start up')
        self.assertEqual(item.source_payload['lines'][0]['who'], 'Amy')
        response = self.client.get('/books/primary-english-first/?unit=4a-u1&tab=texts')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'dialogue-card')
        self.assertContains(response, 'Can you jump high, Daming?')
        self.assertContains(response, '整段连读')
        # 单词 tab 不受影响
        words = self.client.get('/books/primary-english-first/?unit=4a-u1')
        self.assertContains(words, 'class="wcard"')

    def test_seed_renames_english_module_once(self):
        Module.objects.filter(code='english').update(name='教材同步单词')
        call_command('seed_platform', stdout=io.StringIO())
        self.assertEqual(Module.objects.get(code='english').name, '教材同步')


class CatalogTests(PlatformFixture):
    def test_seed_is_idempotent_and_preserves_changes(self):
        Module.objects.filter(code='math').update(name='我的数学')
        call_command('seed_platform', stdout=io.StringIO())
        self.assertEqual(Module.objects.count(), 8)
        self.assertEqual(Grade.objects.count(), 6)
        self.assertEqual(Module.objects.get(code='math').name, '我的数学')
        self.assertFalse(Group.objects.get(name='内容编辑').permissions.exclude(content_type__app_label='catalog').exists())

    def test_home_and_filtered_catalog(self):
        self.assertContains(self.client.get('/'), '我的学习书架')
        self.assertEqual(self.client.get('/api/v1/catalog/?grade=primary-1').json()['total'], 0)
        self.assertEqual(self.client.get('/api/v1/catalog/?grade=primary-4&subject=math').json()['total'], 1)
        self.assertEqual(self.client.get('/api/v1/catalog/?edition=pep-chinese').json()['total'], 0)
        self.assertEqual(self.client.get('/api/v1/catalog/?grade=unknown').status_code, 400)
        self.assertEqual(self.client.get('/api/v1/items/?q=数字').json()['total'], 1)

    def test_module_count_groups_multiple_books(self):
        # 同一模块可并存多本教材册（如 english 上/下册场景）：换一套教材再建一本。
        edition = TextbookEdition.objects.create(code='bnu-math-4b', name='北师大版数学四下', subject=self.item.module.subject,
                                                 publisher='北京师范大学出版社', version='v1')
        textbook = Textbook.objects.create(code='bnu-math-4b-2026', name='北师大版数学 · 四年级下册',
                                           edition=edition, grade=self.collection.textbook.grade, term='second')
        TextbookBook.objects.create(code='math-second', name='第二本数学', module=self.item.module,
                                    textbook=textbook, is_published=True)
        response = self.client.get('/')
        card = next(c for c in response.context['entry_cards'] if c['name'] == '数学思维')
        self.assertEqual(card['badge'], '2 本学习册')

    def test_home_renders_every_registered_special_card(self):
        """首页专题卡全部由 entry_registry.SPECIAL_ENTRIES 驱动，模板无逐卡硬编码。"""
        response = self.client.get('/')
        for spec in SPECIAL_ENTRIES:
            self.assertContains(response, spec['name'])
            for link in spec.get('links', []):
                self.assertContains(response, reverse(link['route']))
            if 'route' in spec:
                self.assertContains(response, reverse(spec['route']))
        # 专题卡按注册顺序殿后（最后一个仍是无组的单链接卡）。
        self.assertEqual(response.context['entry_cards'][-1]['name'], '多音字')
        self.assertEqual(len(response.context['entry_cards']),
                         Module.objects.filter(is_active=True).count() + len(SPECIAL_ENTRIES))

    def test_home_questionbank_card_carries_both_tracks(self):
        """题库一张卡承载普通/奥数两个入口：卡内双按钮，学科维度仍是数学一张卡。"""
        response = self.client.get('/')
        card = next(c for c in response.context['entry_cards'] if c['name'] == '挑战题库')
        self.assertEqual([link['name'] for link in card['links']], ['普通题库', '奥数挑战'])
        self.assertEqual([link['url'] for link in card['links']],
                         [reverse('questionbank'), reverse('questionbank-olympiad')])
        self.assertEqual(card['area'], 'math')
        # 学科筛选照常生效：古诗词下题库卡不出现，数学下正常出现。
        poetry = self.client.get('/?area=poetry')
        self.assertNotIn('挑战题库', [c['name'] for c in poetry.context['entry_cards']])
        math_page = self.client.get('/?area=math')
        self.assertIn('挑战题库', [c['name'] for c in math_page.context['entry_cards']])

    def test_area_filter_single_select(self):
        """专题单选筛选：按 ?area= 过滤卡片，无效值回退全部，chips 保留书架筛选。"""
        response = self.client.get('/?area=poetry')
        self.assertContains(response, '飞花令')
        self.assertContains(response, '诗词地图')
        self.assertNotContains(response, '数学思维')
        self.assertNotContains(response, '场景成语')
        # 无效值回退全部卡片。
        self.assertContains(self.client.get('/?area=bogus'), '数学思维')
        self.assertContains(self.client.get('/'), '数学思维')
        # chips 链接保留书架的其他筛选参数。
        self.assertContains(self.client.get('/?grade=primary-4'), '?grade=primary-4&amp;area=poetry')

    def test_visibility_is_consistent_across_every_read_path(self):
        item_path = f'/items/{self.item.pk}/'
        for target, field, value in [
            (self.item, 'status', 'draft'), (self.collection, 'is_published', False),
            (self.item.module, 'is_active', False),
        ]:
            old = getattr(target, field)
            setattr(target, field, value)
            target.save()
            self.assertEqual(self.client.get(item_path).status_code, 404)
            self.assertEqual(self.client.get(f'/api/v1/items/{self.item.pk}/').status_code, 404)
            self.assertNotContains(self.client.get('/'), '认识数字')
            self.assertNotIn(str(self.item.pk), str(self.client.get('/api/v1/items/').json()))
            setattr(target, field, old)
            target.save()
        self.item.placements.all().delete()
        self.assertEqual(self.client.get(item_path).status_code, 404)

    def test_hidden_items_do_not_make_collection_match_search(self):
        self.item.status = 'draft'
        self.item.save()
        self.assertEqual(self.client.get('/api/v1/catalog/?q=认识数字').json()['total'], 0)

    def test_search_matches_sections_body_only(self):
        # 教材正文已迁入类型化 sections；标题与概要排除后仍应能按正文命中。
        self.item.title = '无关标题'
        self.item.summary = ''
        self.item.body = ''
        self.item.sections = [{'type': 'text', 'title': '要点', 'text': '勾股定理是直角三角形的秘密'}]
        self.item.save()
        self.assertEqual(self.client.get('/api/v1/items/?q=直角三角形').json()['total'], 1)
        self.assertEqual(self.client.get('/api/v1/items/?q=无关标题').json()['total'], 1)

    def test_textbook_subject_consistency_and_reusable_placements(self):
        self.collection.textbook = Textbook.objects.get(code='pep-chinese-4a-2026')
        with self.assertRaises(ValidationError):
            self.collection.full_clean()
        # 同模块的另一本教材册（如 english 上/下册场景）：内容可复用编入。
        edition = TextbookEdition.objects.create(code='bnu-math-4b', name='北师大版数学四下', subject=self.item.module.subject,
                                                 publisher='北京师范大学出版社', version='v1')
        textbook = Textbook.objects.create(code='bnu-math-4b-2026', name='北师大版数学 · 四年级下册',
                                           edition=edition, grade=self.collection.textbook.grade, term='second')
        other = TextbookBook.objects.create(code='math-second', name='第二本数学',
            module=self.item.module, textbook=textbook, is_published=True)
        unit = Unit.objects.create(textbook_book=other, code='u1', title='复习')
        Placement(unit=unit, item=self.item).full_clean()
        invalid = ContentItem.objects.create(module=Module.objects.get(code='knowledge'), title='语文')
        with self.assertRaises(ValidationError):
            Placement(unit=unit, item=invalid).full_clean()

    def test_parent_moves_cannot_break_existing_curriculum(self):
        self.item.module = Module.objects.get(code='knowledge')
        with self.assertRaises(ValidationError):
            self.item.full_clean()
        self.collection.module = Module.objects.get(code='knowledge')
        with self.assertRaises(ValidationError):
            self.collection.full_clean()
        textbook = Textbook.objects.get(code='bnu-math-4a-2026')
        textbook.edition = TextbookEdition.objects.get(code='pep-chinese')
        with self.assertRaises(ValidationError):
            textbook.full_clean()

    def test_content_structure_validation_and_html_escaping(self):
        self.item.sections = {'bad': 'shape'}
        with self.assertRaises(ValidationError):
            self.item.full_clean()
        self.item.sections = [{'title': '安全文本', 'text': '<script>alert(1)</script>'}]
        self.item.save()
        response = self.client.get(f'/items/{self.item.pk}/')
        self.assertContains(response, '&lt;script&gt;')
        self.assertNotContains(response, '<script>alert(1)</script>')

    def test_can_extend_to_new_grade_subject_and_textbook_without_code_changes(self):
        stage = Stage.objects.create(code='junior', name='初中')
        grade = Grade.objects.create(code='junior-1', name='七年级', stage=stage)
        subject = Subject.objects.create(code='physics', name='物理')
        edition = TextbookEdition.objects.create(code='physics-example', name='测试版本', subject=subject, publisher='测试', version='v1')
        textbook = Textbook.objects.create(code='physics-7', name='物理七年级', edition=edition, grade=grade, term='full')
        module = Module.objects.create(code='physics', name='物理模块', subject=subject)
        book = TextbookBook(code='physics-7', name='七年级物理', module=module, textbook=textbook, is_published=True)
        book.full_clean()
        book.save()
        self.assertEqual(self.client.get('/api/v1/catalog/?grade=junior-1&subject=physics').json()['total'], 1)


class ShelfPartitionTests(PlatformFixture):
    """教材同步书架：目录只承载教材管线，专题由独立玩法应用承载。"""

    def test_book_semantics_are_explicit(self):
        self.assertIsInstance(self.collection, TextbookBook)
        self.assertEqual(self.collection.kind, 'textbook')
        self.assertIn(self.collection, published_textbook_books())

    def test_home_shelf_renders_textbook_section_only(self):
        response = self.client.get('/')
        self.assertContains(response, '教材同步')
        self.assertNotContains(response, '主题探索')
        self.assertContains(response, '北师大版数学 · 四年级上册')

    def test_api_reports_textbook_kind(self):
        data = self.client.get('/api/v1/catalog/').json()
        self.assertEqual({c['kind'] for c in data['collections']}, {'textbook'})
        self.assertEqual(data['collections'][0]['code'], 'primary-math-all')


class ContentBlockTests(PlatformFixture):
    def test_imported_fig_becomes_leading_figure_block(self):
        self.assertEqual(self.item.schema_version, 2)
        self.assertEqual(self.item.sections[0], {'type': 'figure', 'fig': 'figure-reference'})
        self.assertTrue(all(s.get('type') == 'text' for s in self.item.sections[1:]))

    def test_v1_sections_stay_valid_at_version_1(self):
        self.item.sections = [{'title': '旧分节', 'text': '正文'}]
        self.item.save()
        self.item.refresh_from_db()
        self.assertEqual(self.item.schema_version, 1)

    def test_v2_blocks_and_validation_rules(self):
        self.item.sections = [
            {'type': 'figure', 'fig': 'demo-angle', 'caption': '角的测量'},
            {'type': 'text', 'title': '要点', 'text': '正文'},
        ]
        self.item.full_clean()
        self.item.save()
        self.item.refresh_from_db()
        self.assertEqual(self.item.schema_version, 2)
        for bad in [
            [{'type': 'quote', 'fig': 'x'}],
            [{'type': 'figure', 'fig': '  '}],
            [{'type': 'figure', 'fig': 'x' * 121}],
            [{'type': 'figure', 'fig': 'x', 'extra': 1}],
            [{'type': 'figure', 'fig': 'x', 'caption': '长' * 201}],
            [{'type': 'text', 'title': 't'}],
            [{'type': 'text', 'title': 't', 'text': 'x', 'extra': 1}],
        ]:
            self.item.sections = bad
            with self.assertRaises(ValidationError):
                self.item.full_clean()

    def test_figure_block_renders_placeholder_with_escaped_caption(self):
        self.item.sections = [{'type': 'figure', 'fig': 'pv-table', 'caption': '数<b>位</b>'},
                              {'type': 'text', 'title': '要点', 'text': '正文'}]
        self.item.save()
        response = self.client.get(f'/items/{self.item.pk}/')
        self.assertContains(response, 'data-fig-placeholder')
        self.assertContains(response, 'data-fig-lib="Figures"')
        self.assertContains(response, 'data-fig-fig="pv-table"')
        self.assertContains(response, '数&lt;b&gt;位&lt;/b&gt;')
        self.assertContains(response, 'figures/loader.js')

    def test_v1_item_does_not_load_figure_assets(self):
        self.item.sections = [{'title': '纯文本', 'text': '正文'}]
        self.item.save()
        response = self.client.get(f'/items/{self.item.pk}/')
        self.assertNotContains(response, 'data-fig-placeholder')
        self.assertNotContains(response, 'figures/figures.js')

    def test_item_api_reports_schema_version(self):
        data = self.client.get(f'/api/v1/items/{self.item.pk}/').json()
        self.assertEqual(data['schema_version'], 2)
        self.assertEqual(data['sections'][0]['type'], 'figure')


class ConvertFiguresTests(PlatformFixture):
    @staticmethod
    def make_legacy_item(fixture):
        return ContentItem.objects.create(
            module=fixture.item.module, kind='knowledge', title='旧版图示内容',
            sections=[{'title': '要点', 'text': '正文'}], source_payload={'fig': 'demo-angle', 'id': 'x'},
            status='published', source_file='primary/math-data.js', source_hash='a' * 64)

    def test_convert_adds_block_and_is_idempotent(self):
        legacy = self.make_legacy_item(self)
        out = io.StringIO()
        call_command('convert_figures', stdout=out)
        legacy.refresh_from_db()
        self.assertEqual(legacy.sections[0], {'type': 'figure', 'fig': 'demo-angle'})
        self.assertEqual(legacy.sections[1], {'type': 'text', 'title': '要点', 'text': '正文'})
        self.assertEqual(legacy.schema_version, 2)
        stats = json.loads(out.getvalue())
        self.assertEqual(stats['converted'], 1)
        self.assertEqual(stats['already_v2'], 1)
        second = io.StringIO()
        call_command('convert_figures', stdout=second)
        stats2 = json.loads(second.getvalue())
        self.assertEqual(stats2['converted'], 0)
        self.assertEqual(stats2['already_v2'], 2)

    def test_dry_run_writes_nothing(self):
        legacy = self.make_legacy_item(self)
        call_command('convert_figures', '--dry-run', stdout=io.StringIO())
        legacy.refresh_from_db()
        self.assertEqual(legacy.schema_version, 1)
        self.assertNotIn('type', legacy.sections[0])

    def test_locked_item_is_skipped(self):
        legacy = self.make_legacy_item(self)
        legacy.import_locked = True
        legacy.save()
        out = io.StringIO()
        call_command('convert_figures', stdout=out)
        stats = json.loads(out.getvalue())
        self.assertEqual(stats['import_locked'], 1)
        self.assertEqual(stats['converted'], 0)
        legacy.refresh_from_db()
        self.assertEqual(legacy.schema_version, 1)


class ImportTests(PlatformFixture):
    def test_english_relation_ui_metadata_is_skipped_and_teaching_extras_are_preserved(self):
        snapshot = {'schema_version': 1, 'modules': [{
            'code': 'english', 'source_file': 'primary/english-data.js', 'sha256': 'a' * 64,
            'data': {
                'ENGLISH_UNITS': [{'id': '4a-u1', 'name': 'Unit 1', 'book': '四年级上册',
                                   'words': [{'en': 'apple', 'zh': '苹果'}]}],
                'RELATION_META': {'synonym': {'label': '近义词', 'color': '#345678'}},
                'RELATION_ORDER': ['synonym'],
                'WORD_ZH': {'pear': '梨'},
            },
        }]}
        import_snapshot(snapshot, publish=True)
        items = ContentItem.objects.filter(module__code='english')
        self.assertEqual(set(items.values_list('title', flat=True)), {'apple', '关联词释义'})
        reference = items.get(source_key='primary:english:reference:WORD_ZH')
        self.assertEqual(reference.source_payload, {'WORD_ZH': {'pear': '梨'}})
        self.assertIn('梨', reference.sections[0]['text'])

    def test_command_skips_non_textbook_sources_even_when_module_exists(self):
        # seed_platform 已创建 words；旧库还可能保留其他专题模块。
        self.assertTrue(Module.objects.filter(code='words').exists())
        Module.objects.create(code='geo', name='地理专题', subject=self.item.module.subject)
        snapshot = minimal_snapshot()
        snapshot['modules'][0]['data']['units'][0]['points'][0]['title'] = '教材正常更新'
        for code, units_key in [('words', 'WORD_UNITS'), ('geo', 'units'), ('future-topic', 'units')]:
            snapshot['modules'].append({
                'code': code, 'source_file': f'primary/{code}-data.js', 'sha256': 'b' * 64,
                'data': {units_key: []},
            })
        before = set(ContentItem.objects.values_list('pk', flat=True))
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'snapshot.json'
            file.write_text(json.dumps(snapshot))
            output = io.StringIO()
            call_command('import_primary', str(file), publish=True, stdout=output)
        self.assertEqual(json.loads(output.getvalue())['skipped_modules'], ['words', 'geo', 'future-topic'])
        self.assertEqual(set(ContentItem.objects.values_list('pk', flat=True)), before)
        self.assertEqual(TextbookBook.objects.count(), 1)
        self.item.refresh_from_db()
        self.assertEqual(self.item.title, '教材正常更新')

    def test_repeat_import_keeps_ids_and_preserves_archival_state(self):
        before = set(ContentItem.objects.values_list('id', flat=True))
        self.item.status = 'archived'
        self.item.save()
        self.collection.is_published = False
        self.collection.save()
        report = import_snapshot(minimal_snapshot(), publish=True)
        self.assertEqual(report['created'], 0)
        self.assertEqual(before, set(ContentItem.objects.values_list('id', flat=True)))
        self.item.refresh_from_db()
        self.collection.refresh_from_db()
        self.assertEqual(self.item.status, 'archived')
        self.assertFalse(self.collection.is_published)

    def test_import_lock_preserves_manual_fields_and_raw_source(self):
        self.item.title = '人工标题'
        self.item.import_locked = True
        self.item.save()
        snapshot = minimal_snapshot()
        snapshot['modules'][0]['data']['units'][0]['points'][0]['title'] = '外部修改'
        self.assertEqual(import_snapshot(snapshot, publish=True)['locked'], 1)
        self.item.refresh_from_db()
        self.assertEqual(self.item.title, '人工标题')
        self.assertEqual(self.item.source_payload['fig'], 'figure-reference')
        self.assertEqual(self.item.source_payload['title'], '认识数字')

    def test_command_dry_run_and_atomic_failure(self):
        snapshot = minimal_snapshot()
        snapshot['modules'][0]['data']['units'][0]['points'][0]['title'] = '新标题'
        snapshot['modules'].append({
            'code': 'words', 'source_file': 'primary/words-data.js', 'sha256': 'b' * 64,
            'data': {'WORD_UNITS': []},
        })
        with tempfile.TemporaryDirectory() as temp:
            file = Path(temp) / 'snapshot.json'
            file.write_text(json.dumps(snapshot))
            call_command('import_primary', str(file), dry_run=True, stdout=io.StringIO())
            self.item.refresh_from_db()
            self.assertEqual(self.item.title, '认识数字')
            snapshot['modules'].append(copy.deepcopy(snapshot['modules'][0]))
            file.write_text(json.dumps(snapshot))
            from django.core.management.base import CommandError
            with self.assertRaises(CommandError):
                call_command('import_primary', str(file), stdout=io.StringIO())
            self.item.refresh_from_db()
            self.assertEqual(self.item.title, '认识数字')


def math_snapshot():
    """primary/math-data.js 新版单一数据源：单元横幅 + 知识点生活情境照片 + 视频清单。"""
    return {'schema_version': 1, 'modules': [{
        'code': 'math', 'source_file': 'primary/math-data.js', 'sha256': 'd' * 64,
        'data': {
            'textbook': '北师大版（新课标）数学四年级上册', 'edition': '测试修订版 · 一个单元一个知识点',
            'meta': {'subject': '数学', 'textbook': '北师大版（新课标）', 'grade': '四年级', 'volume': '上册'},
            'banners': {'mu1': 'images/math/banner-mu1.jpg', 'formulas': 'images/math/banner-mformulas.jpg'},
            'videos': {'groups': [{'id': 'blocks', 'name': '数字积木动画', 'desc': '边玩边学'}],
                       'list': [{'id': 'nb-s1', 'group': 'blocks', 'bvid': 'BV15KTx6SEGr', 'title': '数字积木 第一季',
                                 'up': 'B站少儿 · Numberblocks', 'dur': 600, 'cover': 'images/math/videos/v-nb-s1.jpg',
                                 'note': '一集一个数字，认识数与运算'}]},
            'formulas': [{'title': '亿以内数位顺序表', 'items': ['个级、万级、亿级']}],
            'units': [{'id': 'mu1', 'no': '第一单元', 'name': '认识更大的数', 'emoji': '🔢', 'color': '#2f9bd6',
                       'banner': 'mban-mu1', 'intro': '认识万级与亿级的计数单位。',
                       'goals': ['感受大数'], 'points': [
                           {'id': 'p1', 'title': '数一数', 'fig': 'count', 'life': '十万张纸摞起来大约厚 10 米。',
                            'overview': '认识万级计数单位。', 'items': ['十万'], 'recall': '口诀'}]}],
        }}]}


class KnowledgeImportTests(PlatformFixture):
    """knowledge 新版单一数据源导入：素材字段中文化、实景图片块、单元板块不丢。"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        import_snapshot(knowledge_snapshot(), publish=True)
        cls.lesson = ContentItem.objects.get(title='观潮')
        cls.poem_card = ContentItem.objects.get(source_key='primary:knowledge:reference:poems')
        cls.guide = ContentItem.objects.get(source_key='primary:knowledge:u1:__overview')

    def test_lesson_sections_use_chinese_labels_and_image_block(self):
        by_title = {s.get('title'): s for s in self.lesson.sections if s.get('title')}
        self.assertEqual(self.lesson.sections[0]['type'], 'image')
        self.assertEqual(self.lesson.sections[0]['src'], 'images/lessons/qiantang.jpg')
        for expected in ('原文金句', '作者小传', '作者简介', '拓展视频', '内容梳理'):
            self.assertIn(expected, by_title)
        # 英文键名不再泄漏进任何块。
        for section in self.lesson.sections:
            self.assertNotIn('img：', section.get('text', ''))
            title = str(section.get('title', ''))
            self.assertTrue(not title or not title.isascii(), title)
        self.assertIn('B站编号', by_title['拓展视频']['text'])
        self.assertIn('UP 主', by_title['拓展视频']['text'])

    def test_unit_guide_keeps_book_and_goals(self):
        titles = [s.get('title') for s in self.guide.sections]
        self.assertIn('快乐读书吧', titles)
        self.assertIn('学习目标', titles)

    def test_poem_reference_card_keeps_life_and_background(self):
        # 顶层古诗文暂按一张汇总资料卡导入（逐首拆卡是下一步升级）；小传/背景保留，img 不泄漏。
        text = ''.join(s.get('text', '') for s in self.poem_card.sections)
        self.assertEqual(self.poem_card.title, '古诗文')
        self.assertIn('鹿柴', text)
        self.assertIn('人物小传', text)
        self.assertIn('创作背景', text)
        self.assertNotIn('img：', text)


class MathImportTests(PlatformFixture):
    """math 新版单一数据源导入：情境照片按 id 派生、横幅进单元指南、meta/banners 不立卡。"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        import_snapshot(math_snapshot(), publish=True)
        cls.point = ContentItem.objects.get(title='数一数')
        cls.guide = ContentItem.objects.get(source_key='primary:math:mu1:__overview')

    def test_point_photo_and_life_label(self):
        self.assertEqual(self.point.sections[0]['type'], 'image')
        self.assertEqual(self.point.sections[0]['src'], 'images/math/p-p1.jpg')
        by_title = {s.get('title'): s for s in self.point.sections if s.get('title')}
        self.assertIn('生活中的数学', by_title)
        self.assertIn('十万张纸', by_title['生活中的数学']['text'])

    def test_unit_guide_has_banner_image(self):
        self.assertEqual(self.guide.sections[0]['type'], 'image')
        self.assertEqual(self.guide.sections[0]['src'], 'images/math/banner-mu1.jpg')
        titles = [s.get('title') for s in self.guide.sections]
        self.assertIn('学习目标', titles)

    def test_meta_and_banners_do_not_become_cards(self):
        from catalog.models import Unit
        reference = Unit.objects.get(textbook_book__code='primary-math-all', code='reference')
        titles = [p.item.title for p in reference.placements.select_related('item')]
        self.assertIn('拓展视频', titles)
        self.assertNotIn('meta', titles)
        self.assertNotIn('banners', titles)
        videos_card = next(p.item for p in reference.placements.select_related('item') if p.item.title == '拓展视频')
        text = ''.join(s.get('text', '') for s in videos_card.sections)
        self.assertIn('数字积木 第一季', text)
        self.assertNotIn('cover：', text)

    def test_reference_cards_get_their_banners(self):
        # 公式速查卡取 banners['formulas'] 作横幅；单元指南按 mban- 前缀归一化解析。
        formulas = ContentItem.objects.get(source_key='primary:math:reference:formulas')
        self.assertEqual(formulas.sections[0], {'type': 'image', 'src': 'images/math/banner-mformulas.jpg',
                                                'alt': '公式速查'})
        guide = ContentItem.objects.get(source_key='primary:math:mu1:__overview')
        self.assertEqual(guide.sections[0]['src'], 'images/math/banner-mu1.jpg')
