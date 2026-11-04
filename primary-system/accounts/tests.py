from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils.crypto import get_random_string
from catalog.tests import PlatformFixture


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
