import io
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import PermissionDenied
from django.core.management import call_command
from django.test import Client, TestCase
from lexicon.importing import stage_manifest
from lexicon.models import (ContentEntryLink, EntryMatch, LexicalEntry, LexiconAudit, LexiconSource,
                            Pronunciation, Sense, SourceBinding, SourceRecord, SourceRelease)
from lexicon.services import activate_release, build_matches, revise
from .helpers import manifest, row


class AdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.release, _ = stage_manifest(manifest())
        cls.record = cls.release.records.get()
        cls.sense = cls.record.binding.sense
        call_command('seed_lexicon_roles', stdout=io.StringIO())
        cls.admin = get_user_model().objects.create_superuser('lex-admin', password='local-test-only-2026!')
        cls.editor = get_user_model().objects.create_user('lex-editor', is_staff=True)
        cls.publisher = get_user_model().objects.create_user('lex-publisher', is_staff=True)
        cls.editor.groups.add(Group.objects.get(name='词库编辑'))
        cls.publisher.groups.add(Group.objects.get(name='词库来源与发布'))

    def test_every_admin_list_and_detail_renders(self):
        self.client.force_login(self.admin)
        for model in [LexiconSource, SourceRelease, LexicalEntry, Sense, Pronunciation, SourceBinding, SourceRecord, ContentEntryLink, EntryMatch, LexiconAudit]:
            path = f'/admin/lexicon/{model._meta.model_name}/'
            self.assertEqual(self.client.get(path).status_code, 200, path)
            obj = model.objects.first()
            if obj:
                self.assertEqual(self.client.get(f'{path}{obj.pk}/change/').status_code, 200, path)

    def test_editor_can_revise_but_not_approve_source_publish_or_mutate_raw(self):
        self.client.force_login(self.editor)
        source = self.release.source
        self.assertEqual(self.client.post(f'/admin/lexicon/lexiconsource/{source.pk}/change/', {'public_allowed': True}).status_code, 403)
        self.assertEqual(self.client.post(f'/admin/lexicon/sourcerecord/{self.record.pk}/change/', {'definition': '篡改原文'}).status_code, 403)
        response = self.client.post(f'/admin/lexicon/sense/{self.sense.pk}/change/', {
            'editorial_definition': '编辑的新讲解', 'editorial_note': '核对后修订', 'expected_revision': 0, 'status': 'published', '_save': '保存',
        })
        self.assertEqual(response.status_code, 302)
        self.sense.refresh_from_db()
        self.assertEqual((self.sense.status, self.sense.revision), ('draft', 1))
        self.assertEqual(self.sense.editorial_definition, '编辑的新讲解')
        self.assertTrue(LexiconAudit.objects.filter(action='revise_sense', actor=self.editor).exists())
        response = self.client.post('/admin/lexicon/sense/', {'action': 'publish', '_selected_action': str(self.sense.pk)})
        self.sense.refresh_from_db()
        self.assertEqual(self.sense.status, 'draft')
        with self.assertRaises(PermissionDenied):
            activate_release(self.release.pk, expected_current='', reason='越权', actor=self.editor)

    def test_stale_admin_form_returns_validation_error_not_overwrite(self):
        revise(self.sense, value='别处的新修改', note='新修订', expected_revision=0, actor=self.editor)
        self.client.force_login(self.editor)
        response = self.client.post(f'/admin/lexicon/sense/{self.sense.pk}/change/', {
            'editorial_definition': '旧页面覆盖', 'editorial_note': '过时修改', 'expected_revision': 0, '_save': '保存',
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '记录已更新')
        self.sense.refresh_from_db()
        self.assertEqual(self.sense.editorial_definition, '别处的新修改')

    def test_activation_confirmation_and_stale_review(self):
        self.client.force_login(self.publisher)
        data = {'action': 'activate', '_selected_action': str(self.release.pk)}
        response = self.client.post('/admin/lexicon/sourcerelease/', data)
        self.assertContains(response, '核对来源版本差异')
        self.release.source.refresh_from_db()
        self.assertIsNone(self.release.source.active_release_id)
        response = self.client.post('/admin/lexicon/sourcerelease/', {**data, 'confirm': 'yes', 'expected_current': '', 'reason': '内部评估启用'})
        self.assertEqual(response.status_code, 302)
        self.release.source.refresh_from_db()
        self.assertEqual(self.release.source.active_release_id, self.release.pk)
        self.assertFalse(self.release.source.public_allowed)

    def test_publisher_can_review_but_cannot_edit_content_or_accounts(self):
        self.client.force_login(self.publisher)
        self.client.post('/admin/lexicon/sense/', {'action': 'publish', '_selected_action': str(self.sense.pk)})
        self.sense.refresh_from_db()
        self.assertEqual(self.sense.status, 'published')
        self.assertEqual(self.client.post(f'/admin/lexicon/sense/{self.sense.pk}/change/', {'editorial_definition': '越权修改'}).status_code, 403)
        self.assertEqual(self.client.get('/admin/accounts/user/').status_code, 403)
        self.assertEqual(self.client.get('/admin/learning/progress/').status_code, 403)

    def test_source_policy_form_does_not_overwrite_active_pointer_and_is_audited(self):
        stale = LexiconSource.objects.get(pk=self.release.source_id)
        activate_release(self.release.pk, expected_current='', reason='切换版本')
        stale.name = '稍后保存的来源配置'
        stale.save()
        stale.refresh_from_db()
        self.assertEqual(stale.active_release_id, self.release.pk)
        self.client.force_login(self.publisher)
        response = self.client.post(f'/admin/lexicon/lexiconsource/{stale.pk}/change/', {
            'name': '来源审批后名称', 'url': '', 'attribution': '测试署名', 'code_license': '',
            'data_license': 'Synthetic', 'rights_evidence': '测试公开使用依据', 'public_allowed': 'on', 'enabled': 'on', 'priority': 100,
            '_save': '保存',
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue(LexiconAudit.objects.filter(action='source_policy').exists())

    def test_admin_mutations_require_csrf_and_nonstaff_cannot_enter(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.publisher)
        self.assertEqual(client.post('/admin/lexicon/sourcerelease/', {'action': 'activate'}).status_code, 403)
        ordinary = get_user_model().objects.create_user('ordinary')
        self.client.force_login(ordinary)
        self.assertEqual(self.client.get('/admin/lexicon/lexicalentry/').status_code, 302)

    def test_merge_confirmation_keeps_senses_separate(self):
        stage_manifest(manifest([row('bank-river', meaning='河岸')], source='river-source'))
        build_matches()
        candidate = EntryMatch.objects.get()
        self.client.force_login(self.editor)
        data = {'action': 'merge', '_selected_action': candidate.pk}
        preview = self.client.post('/admin/lexicon/entrymatch/', data)
        self.assertContains(preview, '核对同形词')
        self.assertContains(preview, '来源释义：银行')
        self.assertContains(preview, '来源释义：河岸')
        response = self.client.post('/admin/lexicon/entrymatch/', {**data, 'confirm': 'yes', 'reason': '确认一个词头保留不同意义'})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Sense.objects.count(), 2)
        self.assertEqual(Sense.objects.values('entry_id').distinct().count(), 1)
