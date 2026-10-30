from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from catalog.tests import PlatformFixture


class AccountTests(PlatformFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user = get_user_model().objects.create_user('student', password='Strong-local-test-2026!')

    def test_login_logout_and_profile_whitelist(self):
        self.assertEqual(self.client.post('/accounts/login/', {'username': 'student', 'password': 'Strong-local-test-2026!'}).status_code, 302)
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
        response = self.client.post('/accounts/login/', {'username': 'student', 'password': 'Strong-local-test-2026!', 'next': 'https://evil.example/'})
        self.assertEqual(response.url, '/')

    def test_all_admin_lists_and_add_forms_render(self):
        admin = get_user_model().objects.create_superuser('local-admin', password='Strong-local-test-2026!')
        self.client.force_login(admin)
        for model in ['stage', 'grade', 'subject', 'textbookedition', 'textbook', 'module', 'collection', 'unit', 'contentitem', 'placement']:
            self.assertEqual(self.client.get(f'/admin/catalog/{model}/').status_code, 200, model)
            self.assertEqual(self.client.get(f'/admin/catalog/{model}/add/').status_code, 200, model)
        self.assertEqual(self.client.get('/admin/accounts/user/add/').status_code, 200)

    def test_frontend_login_cannot_bypass_admin_slider(self):
        self.user.is_staff = True
        self.user.save()
        response = self.client.post('/accounts/login/', {'username': 'student', 'password': 'Strong-local-test-2026!'})
        self.assertContains(response, '管理账号请从管理后台入口登录')
        self.assertNotIn('_auth_user_id', self.client.session)
