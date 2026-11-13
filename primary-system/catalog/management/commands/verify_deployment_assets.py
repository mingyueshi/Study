from django.conf import settings
from django.core.management.base import BaseCommand
from reference_library.importing import prepare, check_registry


class Command(BaseCommand):
    requires_system_checks = []
    help = '只读验证部署资料文件的完整性、摘要及数据库登记。'

    def handle(self, *args, **options):
        packages = prepare(settings.REFERENCE_ARCHIVE_ROOT,
                           settings.REFERENCE_STORAGE_ROOT / 'packages',
                           persist=True, verify_only=True)
        check_registry(packages)
        self.stdout.write('私有资料文件及数据库登记校验通过。')
