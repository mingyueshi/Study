from django.conf import settings
from django.core.management.base import BaseCommand
from catalog.management.commands.prepare_deployment_schema import require_stage
from config.postgres_baseline import restore_postgres_package
from reference_library.importing import prepare, check_registry


class Command(BaseCommand):
    requires_system_checks = []
    help = '将发布的固定 UUID 内容包转换并导入临时 PostgreSQL 库，不接管已有业务库。'

    def handle(self, *args, **options):
        require_stage()
        packages = prepare(settings.REFERENCE_ARCHIVE_ROOT,
                           settings.REFERENCE_STORAGE_ROOT / 'packages', persist=True)
        manifest = restore_postgres_package(settings.BASE_DIR / 'data/baseline', self.stdout.write)
        check_registry(packages)
        self.stdout.write(f"PostgreSQL 基础内容就绪：{sum(t['rows'] for t in manifest['tables'])} 行。")
