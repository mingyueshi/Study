"""导入题库批次：manage.py import_questions --input <批次 JSON> [--dry-run]。"""
import json
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from questionbank import importing


class Command(BaseCommand):
    help = '导入题库批次 JSON：全有或全无、只新增、回执防重。'

    def add_arguments(self, parser):
        parser.add_argument('--input', required=True, help='批次 JSON 路径（相对仓库根或绝对路径）。')
        mode = parser.add_mutually_exclusive_group()
        mode.add_argument('--dry-run', action='store_true', help='预演：完整校验后回滚，不落库。')
        mode.add_argument('--verify-only', action='store_true', help='只读核对已导入批次的回执。')

    def handle(self, *args, **options):
        path = Path(options['input'])
        if not path.is_absolute():
            path = Path.cwd() / path
        if not path.is_file():
            raise CommandError(f'找不到批次文件：{path}')
        try:
            payload = json.loads(path.read_text(encoding='utf-8'))
        except (ValueError, UnicodeError) as error:
            raise CommandError(f'批次文件不是合法 JSON：{error}') from error
        try:
            report = importing.import_batch(
                payload, source=str(path), dry_run=options['dry_run'], verify_only=options['verify_only'],
            )
        except ValidationError as error:
            raise CommandError(f'导入中止：{error.message}') from error
        self.stdout.write(self.style.SUCCESS(
            f"批次 {report['batch_id']} · {report['status']} · "
            f"共 {report['total']} 题，新导入 {report['imported']}，已存在跳过 {report['duplicated']}"))
