import json
from pathlib import Path
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from catalog.importing import import_snapshot

class Command(BaseCommand):
    help = '原子导入 export_primary.cjs 的 JSON；支持预演，保护人工修改，不删除历史。'

    def add_arguments(self, parser):
        parser.add_argument('snapshot', type=Path)
        parser.add_argument('--publish', action='store_true', help='仅将首次创建的学习册与内容设为发布')
        parser.add_argument('--dry-run', action='store_true', help='运行全部校验后回滚，不保存')

    def handle(self, *args, **options):
        try:
            snapshot = json.loads(options['snapshot'].read_text(encoding='utf-8'))
            with transaction.atomic():
                report = import_snapshot(snapshot, publish=options['publish'])
                if options['dry_run']:
                    transaction.set_rollback(True)
        except (OSError, ValueError, KeyError, TypeError, ValidationError) as exc:
            raise CommandError(f'导入未保存：{exc}') from exc
        self.stdout.write(json.dumps({'dry_run': options['dry_run'], **report}, ensure_ascii=False))
