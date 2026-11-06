import json

from django.core.management.base import BaseCommand, CommandError

from accounts.guest_retention import cleanup_guest_data


class Command(BaseCommand):
    help = "清理超过保留期的游客数据；默认仅预演，--apply 才实际删除，--days 覆盖保留期（默认 90 天）。"

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="实际删除；缺省仅预演并给出计划计数")
        parser.add_argument("--days", type=int, default=90, help="保留天数（默认 90）")

    def handle(self, *args, **options):
        if options["days"] <= 0:
            raise CommandError("--days 必须为正整数")
        report = cleanup_guest_data(apply=options["apply"], days=options["days"])
        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2))