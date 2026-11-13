"""Build exactly the published schema in a disposable PostgreSQL database."""
import json
import os
import re

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


def require_stage():
    name = settings.DATABASES['default']['NAME']
    if (os.environ.get('PRIMARY_DOCKER') != '1' or connection.vendor != 'postgresql'
            or not re.fullmatch(r'primary_stage_[0-9a-f]{32}', name)):
        raise CommandError('只能用于 Docker 创建的临时 PostgreSQL 数据库。')


class Command(BaseCommand):
    requires_system_checks = []
    help = '只在空的临时 PostgreSQL 数据库中创建基础包对应结构。'

    def handle(self, *args, **options):
        require_stage()
        if connection.introspection.table_names():
            raise CommandError('暂存数据库非空，拒绝回退或覆盖。')
        manifest = json.loads((settings.BASE_DIR / 'data/baseline/manifest.json').read_text())
        required = {tuple(item) for item in manifest['required_migrations']}
        executor = MigrationExecutor(connection)
        if required - set(executor.loader.disk_migrations):
            raise CommandError('代码缺少基础包要求的迁移，不能初始化。')
        targets = sorted(node for node in required if not any(
            child.key in required for child in executor.loader.graph.node_map[node].children))
        executor.migrate(targets)
        if set(executor.recorder.applied_migrations()) != required:
            raise CommandError('迁移依赖不再与基础包结构匹配，拒绝恢复内容。')
        self.stdout.write('基础包对应的 PostgreSQL 空库结构已创建。')
