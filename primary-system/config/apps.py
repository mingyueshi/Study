from django.contrib.admin.apps import AdminConfig


class StudyAdminConfig(AdminConfig):
    default_site = 'config.admin_site.StudyAdminSite'
