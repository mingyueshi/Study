from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


class Command(BaseCommand):
    requires_system_checks = []
    help = '检查当前部署数据库的迁移兼容性，拒绝缺少迁移和未知的新版本迁移。'

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            raise CommandError('部署数据库必须是 PostgreSQL。')
        executor = MigrationExecutor(connection)
        unknown = set(executor.loader.applied_migrations) - set(executor.loader.disk_migrations)
        if unknown or executor.migration_plan(executor.loader.graph.leaf_nodes()):
            raise CommandError('数据库与当前代码的迁移不匹配，请使用备份对应的代码版本。')
        self.stdout.write('PostgreSQL 迁移状态校验通过。')
