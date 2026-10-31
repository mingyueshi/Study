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


class CatalogTests(PlatformFixture):
    def test_seed_is_idempotent_and_preserves_changes(self):
        Module.objects.filter(code='math').update(name='我的数学')
        call_command('seed_platform', stdout=io.StringIO())
        self.assertEqual(Module.objects.count(), 5)
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
        module = next(m for m in response.context['modules'] if m.code == 'math')
        self.assertEqual(module.available_count, 2)

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
