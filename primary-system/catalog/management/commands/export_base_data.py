import json
import sqlite3
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from config.base_data import BaselineError, export_package


class Command(BaseCommand):
    requires_system_checks = []
    help = "从只读SQLite backup导出Git基础内容包；排除个人记录，审计actor置空。"

    def add_arguments(self, parser):
        parser.add_argument(
            "--output", type=Path, default=settings.BASE_DIR / "data/baseline"
        )
        parser.add_argument("--replace", action="store_true")

    def handle(self, *args, **options):
        if settings.DATABASES["default"]["ENGINE"] != "django.db.backends.sqlite3":
            raise CommandError(
                "此本地基础包工具只支持SQLite；不会连接或改写其他数据库。"
            )
        try:
            result = export_package(
                settings.DATABASES["default"]["NAME"],
                options["output"],
                replace=options["replace"],
            )
        except (
            BaselineError,
            OSError,
            ValueError,
            KeyError,
            TypeError,
            sqlite3.DatabaseError,
        ) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(result, ensure_ascii=False, indent=2))
