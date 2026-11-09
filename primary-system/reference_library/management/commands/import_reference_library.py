import json
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from reference_library.importing import run_import


class Command(BaseCommand):
    help = "核验当前资料包并按保留领域全量导入；--dry-run不写DB或项目资产。"

    def add_arguments(self, p):
        p.add_argument(
            "--input-root", default=str(settings.REFERENCE_ARCHIVE_ROOT)
        )
        p.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        try:
            result = run_import(options["input_root"], dry_run=options["dry_run"])
        except (ValidationError, ValueError, zipfile.BadZipFile) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(result, ensure_ascii=False, default=str, indent=2))


import zipfile
