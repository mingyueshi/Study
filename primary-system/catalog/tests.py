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
from .models import Collection, ContentItem, Grade, Module, Placement, Stage, Subject, Textbook, TextbookEdition, Unit


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
        cls.collection = Collection.objects.get(code='primary-math-all')
        cls.unit = cls.collection.units.get(code='test-unit')


class CatalogTests(PlatformFixture):
    def test_seed_is_idempotent_and_preserves_changes(self):
        Module.objects.filter(code='math').update(name='我的数学')
        call_command('seed_platform', stdout=io.StringIO())
        self.assertEqual(Module.objects.count(), 12)
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

    def test_module_count_groups_multiple_collections(self):
        Collection.objects.create(code='math-second', name='第二本数学', module=self.item.module, is_published=True)
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
        other = Collection.objects.create(code='another', name='另一本', module=self.item.module, is_published=True)
        unit = Unit.objects.create(collection=other, code='u1', title='复习')
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
        collection = Collection(code='physics-7', name='七年级物理', module=module, textbook=textbook, is_published=True)
        collection.full_clean()
        collection.save()
        self.assertEqual(self.client.get('/api/v1/catalog/?grade=junior-1&subject=physics').json()['total'], 1)


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
