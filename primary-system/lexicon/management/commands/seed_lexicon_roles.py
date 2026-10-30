from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = '建立词库编辑与来源发布的独立权限组，不修改用户。'

    def handle(self, *args, **options):
        editor, _ = Group.objects.get_or_create(name='词库编辑')
        publisher, _ = Group.objects.get_or_create(name='词库来源与发布')
        view = Permission.objects.filter(content_type__app_label='lexicon', codename__startswith='view_')
        editor.permissions.add(*view)
        editor.permissions.add(*Permission.objects.filter(content_type__app_label='lexicon', codename__in=[
            'change_lexicalentry', 'change_sense', 'change_pronunciation', 'add_contententrylink',
            'change_contententrylink', 'change_entrymatch',
        ]))
        editor.permissions.add(*Permission.objects.filter(content_type__app_label='catalog', codename='view_contentitem'))
        publisher.permissions.add(*view)
        publisher.permissions.add(*Permission.objects.filter(content_type__app_label='lexicon', codename__in=[
            'manage_sources', 'publish_lexicon', 'change_lexiconsource', 'add_lexiconsource',
        ]))
        self.stdout.write('词库编辑、词库来源与发布权限组已就绪。')
