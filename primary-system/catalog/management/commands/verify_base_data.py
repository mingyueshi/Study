import json
import sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from config.base_data import (
    BaselineError,
    verify_package,
    compare_database,
    open_readonly,
)


class Command(BaseCommand):
    requires_system_checks = []
    help = "校验基础包摘要和结构；--database同时只读核对当前SQLite内容。"

    def add_arguments(self, parser):
        parser.add_argument(
            "--input", type=Path, default=settings.BASE_DIR / "data/baseline"
        )
        parser.add_argument("--database", action="store_true")

    def handle(self, *args, **options):
        try:
            manifest = verify_package(options["input"])
            differences = []
            if options["database"]:
                if (
                    settings.DATABASES["default"]["ENGINE"]
                    != "django.db.backends.sqlite3"
                ):
                    raise BaselineError("基础包的数据库核对仅支持SQLite。")
                with open_readonly(settings.DATABASES["default"]["NAME"]) as database:
                    differences = compare_database(database, manifest)
                if differences:
                    raise BaselineError(
                        "当前库与基线有差异："
                        + json.dumps(differences, ensure_ascii=False)
                    )
        except (
            BaselineError,
            OSError,
            ValueError,
            KeyError,
            TypeError,
            EOFError,
            sqlite3.DatabaseError,
        ) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(
            json.dumps(
                {
                    "digest": manifest["digest"],
                    "tables": len(manifest["tables"]),
                    "rows": sum(t["rows"] for t in manifest["tables"]),
                    "database_checked": options["database"],
                },
                ensure_ascii=False,
            )
        )
