import json
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from reference_library.retirement import cleanup_retired_assets


class Command(BaseCommand):
    help = "精确预演退役教材／算术资产清理；--apply在退役迁移后实际删除，可重跑。"

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        if options["apply"] and options["dry_run"]:
            raise CommandError("--apply与--dry-run不能同时使用")
        try:
            report = cleanup_retired_assets(apply=options["apply"])
        except (ValidationError, OSError) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2))
