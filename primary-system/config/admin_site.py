"""在原有 AdminSite 上扩展首页，模型注册、认证与权限仍由 Django 负责。"""
from django.conf import settings
from django.contrib.admin import AdminSite
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.urls import path, reverse
from django.views.decorators.http import require_GET
from nova_admin.preferences import selected_mode

from .admin_dashboard import build_dashboard


class StudyAdminSite(AdminSite):
    index_template = 'admin/study_index.html'

    def get_urls(self):
        return [path('_dashboard/data/', self.admin_view(require_GET(self.dashboard_data)),
                     name='study_dashboard_data')] + super().get_urls()

    def index(self, request, extra_context=None):
        active = settings.NOVA_ADMIN_ENABLED and selected_mode(request) != 'native'
        context = dict(extra_context or {}, study_dashboard_active=active)
        if active:
            context.update(
                dashboard=build_dashboard(request, self),
                dashboard_url=reverse(f'{self.name}:study_dashboard_data'),
            )
        return super().index(request, extra_context=context)

    def dashboard_data(self, request):
        dashboard = build_dashboard(request, self)
        return JsonResponse({
            'html': render_to_string('admin/study_dashboard.html', {'dashboard': dashboard}, request),
            'period': dashboard['period'],
            'updated_at': dashboard['updated_at'],
        })
