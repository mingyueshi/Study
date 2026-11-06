import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from django.utils.crypto import get_random_string
from accounts.guest_retention import cleanup_guest_data
from catalog.tests import PlatformFixture
from chain.models import GameRound
from words.models import LearningTarget, WordProgress
from writing.models import WritingDraft


class RegistrationTests(PlatformFixture):
    """快捷注册：用户名 + 密码即建号并登录，不收联系方式；特权字段永不生效。"""

    def register(self, **overrides):
        payload = {'username': 'newkid', 'display_name': '小明',
                   'password1': 'happy-learning-42', 'password2': 'happy-learning-42'}
        payload.update(overrides)
        return self.client.post('/accounts/register/', payload)

    def test_register_page_renders_and_login_links_to_it(self):
        self.assertContains(self.client.get('/accounts/register/'), '快速注册')
        self.assertContains(self.client.get('/accounts/login/'), '/accounts/register/')

    def test_register_creates_learner_and_logs_in(self):
        response = self.register(next='/books/primary-english-first/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/books/primary-english-first/')
        user = get_user_model().objects.get(username='newkid')
        self.assertEqual(user.display_name, '小明')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('happy-learning-42'))
        self.assertIn('_auth_user_id', self.client.session)

    def test_register_without_next_goes_home_and_blocks_logged_in_access(self):
        self.assertEqual(self.register(display_name='').url, '/')
        self.assertEqual(self.client.get('/accounts/register/').status_code, 302)

    def test_register_rejects_mismatch_weak_and_duplicate(self):
        self.assertContains(self.register(password2='happy-learning-43'), '两次输入的密码不一致')
        self.assertContains(self.register(username='weakkid', password1='12345678', password2='12345678'), '密码')
        self.register()
        other = self.client_class()  # 换一个未登录会话再注册同名账号
        self.assertContains(other.post('/accounts/register/', {
            'username': 'newkid', 'password1': 'happy-learning-42', 'password2': 'happy-learning-42',
        }), '已存在')
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_privilege_fields_cannot_be_injected(self):
        self.register(is_staff='on', is_superuser='on')
        user = get_user_model().objects.get(username='newkid')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_unsafe_next_is_ignored(self):
        response = self.register(next='https://evil.example/')
        self.assertEqual(response.url, '/')


class AccountTests(PlatformFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.password = get_random_string(24)
        cls.admin_password = get_random_string(24)
        cls.user = get_user_model().objects.create_user('student', password=cls.password)

    def test_login_logout_and_profile_whitelist(self):
        self.assertEqual(self.client.post('/accounts/login/', {'username': 'student', 'password': self.password}).status_code, 302)
        self.assertEqual(self.client.post('/accounts/profile/', {'display_name': '小同学', 'grade': self.collection.textbook.grade_id, 'is_superuser': True, 'is_staff': True}).status_code, 302)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, '小同学')
        self.assertFalse(self.user.is_superuser)
        self.assertFalse(self.user.is_staff)
        self.assertEqual(self.client.get('/accounts/logout/').status_code, 405)
        self.assertEqual(self.client.post('/accounts/logout/').status_code, 302)
        self.assertEqual(self.client.get('/me/').status_code, 302)

    def test_content_editor_cannot_manage_accounts_or_private_progress(self):
        self.user.is_staff = True
        self.user.save()
        self.user.groups.add(Group.objects.get(name='内容编辑'))
        self.client.force_login(self.user)
        self.assertEqual(self.client.get('/admin/catalog/contentitem/').status_code, 200)
        self.assertEqual(self.client.get('/admin/accounts/user/').status_code, 403)
        self.assertEqual(self.client.get('/admin/learning/progress/').status_code, 403)

    def test_normal_user_has_no_admin_access_and_login_redirect_is_safe(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get('/admin/').status_code, 302)
        self.client.logout()
        response = self.client.post('/accounts/login/', {'username': 'student', 'password': self.password, 'next': 'https://evil.example/'})
        self.assertEqual(response.url, '/')

    def test_all_admin_lists_and_add_forms_render(self):
        admin = get_user_model().objects.create_superuser('local-admin', password=self.admin_password)
        self.client.force_login(admin)
        for model in ['stage', 'grade', 'subject', 'textbookedition', 'textbook', 'module', 'textbookbook', 'unit', 'contentitem', 'placement']:
            self.assertEqual(self.client.get(f'/admin/catalog/{model}/').status_code, 200, model)
            self.assertEqual(self.client.get(f'/admin/catalog/{model}/add/').status_code, 200, model)
        self.assertEqual(self.client.get('/admin/accounts/user/add/').status_code, 200)

    def test_frontend_login_cannot_bypass_admin_slider(self):
        self.user.is_staff = True
        self.user.save()
        response = self.client.post('/accounts/login/', {'username': 'student', 'password': self.password})
        self.assertContains(response, '管理账号请从管理后台入口登录')
        self.assertNotIn('_auth_user_id', self.client.session)


class GuestRetentionTests(PlatformFixture):
    """游客数据保留期：超期游客行删除，新鲜游客行与账号数据保留。"""

    def test_cleanup_guest_data_drops_expired_keeps_fresh_and_account(self):
        player = get_user_model().objects.create_user('player')

        fresh_round = GameRound.objects.create(guest_key='fresh-round')
        old_round = GameRound.objects.create(guest_key='old-round')
        player_round = GameRound.objects.create(user=player)
        past = timezone.now() - datetime.timedelta(days=91)
        GameRound.objects.filter(pk=old_round.pk).update(updated_at=past)
        GameRound.objects.filter(pk=player_round.pk).update(updated_at=past)

        target = LearningTarget.objects.create(label='book', legacy={'word_id': 1})
        fresh_word = WordProgress.objects.create(guest_key='fresh-word', target=target, learned=False)
        old_word = WordProgress.objects.create(guest_key='old-word', target=target, learned=True)
        WordProgress.objects.filter(pk=old_word.pk).update(updated_at=past)

        fresh_draft = WritingDraft.objects.create(guest_key='fresh-draft', title='新草稿')
        old_draft = WritingDraft.objects.create(guest_key='old-draft', title='旧草稿')
        WritingDraft.objects.filter(pk=old_draft.pk).update(updated_at=past)

        report = cleanup_guest_data(apply=False, days=90)
        self.assertTrue(report['dry_run'])
        self.assertEqual(report['planned']['GameRound'], 1)
        self.assertEqual(report['planned']['WordProgress'], 1)
        self.assertEqual(report['planned']['WritingDraft'], 1)
        self.assertEqual(report['planned_total'], 3)
        self.assertEqual(GameRound.objects.count(), 3)

        report = cleanup_guest_data(apply=True, days=90)
        self.assertFalse(report['dry_run'])
        self.assertEqual(report['deleted']['GameRound'], 1)
        self.assertEqual(report['deleted']['WordProgress'], 1)
        self.assertEqual(report['deleted']['WritingDraft'], 1)
        self.assertEqual(report['deleted_total'], 3)

        self.assertTrue(GameRound.objects.filter(pk=fresh_round.pk).exists())
        self.assertFalse(GameRound.objects.filter(pk=old_round.pk).exists())
        self.assertTrue(GameRound.objects.filter(pk=player_round.pk).exists())
        self.assertTrue(WordProgress.objects.filter(pk=fresh_word.pk).exists())
        self.assertFalse(WordProgress.objects.filter(pk=old_word.pk).exists())
        self.assertTrue(WritingDraft.objects.filter(pk=fresh_draft.pk).exists())
        self.assertFalse(WritingDraft.objects.filter(pk=old_draft.pk).exists())
