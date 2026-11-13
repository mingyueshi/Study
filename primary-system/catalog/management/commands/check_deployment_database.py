from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


class Command(BaseCommand):
    requires_system_checks = []
    help = '检查当前部署数据库的迁移兼容性，拒绝缺少迁移和未知的新版本迁移。'

    def add_arguments(self, parser):
        parser.add_argument('--allow-pending', action='store_true', help='迁移前检查：允许待执行迁移，仍拒绝未知迁移。')

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            raise CommandError('部署数据库必须是 PostgreSQL。')
        executor = MigrationExecutor(connection)
        unknown = set(executor.loader.applied_migrations) - set(executor.loader.disk_migrations)
        if unknown:
            raise CommandError('数据库包含当前代码未知的迁移，请使用匹配的代码版本。')
        if not options['allow_pending'] and executor.migration_plan(executor.loader.graph.leaf_nodes()):
            raise CommandError('数据库有待执行迁移；快速更新已拒绝，请使用 make update，或构建后执行 make db-migrate。')
        self.stdout.write('PostgreSQL 迁移状态校验通过。')
