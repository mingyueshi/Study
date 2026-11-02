import json
from pathlib import Path
import sqlite3
from zipfile import BadZipFile
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from config.base_data import BaselineError, restore_package, verify_package


class Command(BaseCommand):
    requires_system_checks = []
    help = "离线恢复固定UUID基础包；非空库默认不改动，显式--refresh-data先备份并保护个人记录。"

    def add_arguments(self, parser):
        parser.add_argument(
            "--input", type=Path, default=settings.BASE_DIR / "data/baseline"
        )
        parser.add_argument("--refresh-data", action="store_true")
        parser.add_argument("--verify-only", action="store_true")
        parser.add_argument(
            "--backup-dir", type=Path, default=settings.BASE_DIR / ".backups/base-data"
        )
        parser.add_argument(
            "--backup-already", type=Path, help="bootstrap在迁移前创建的本次恢复点"
        )
        parser.add_argument(
            "--input-root", type=Path, default=settings.BASE_DIR.parent / "references"
        )

    def handle(self, *args, **options):
        if settings.DATABASES["default"]["ENGINE"] != "django.db.backends.sqlite3":
            raise CommandError(
                "本机基础包恢复只支持SQLite，请用bootstrap --database指定SQLite路径。"
            )
        try:
            verify_package(options["input"])
            # Verified project-local assets first; never ORM-import a domain or generate UUIDs.
            from reference_library.importing import prepare, check_registry

            packages = prepare(
                options["input_root"],
                settings.REFERENCE_STORAGE_ROOT / "packages",
                persist=True,
            )
            result = restore_package(
                settings.DATABASES["default"]["NAME"],
                options["input"],
                refresh=options["refresh_data"],
                verify_only=options["verify_only"],
                backup_dir=options["backup_dir"],
                backup_already=(
                    str(options["backup_already"])
                    if options["backup_already"]
                    else None
                ),
            )
            check_registry(packages)
            result["asset_files"] = sum(len(p["files"]) for p in packages)
        except (
            BaselineError,
            OSError,
            ValueError,
            KeyError,
            TypeError,
            EOFError,
            ValidationError,
            BadZipFile,
            sqlite3.DatabaseError,
        ) as exc:
            raise CommandError(
                str(exc)
                + "\n未完整准备时不会启动服务。修复入口：python3.12 bootstrap.py --refresh-data；独立运行：python3.12 bootstrap.py --database "
                + str(settings.BASE_DIR / "db.baseline.sqlite3")
            ) from exc
        self.stdout.write(json.dumps(result, ensure_ascii=False, indent=2))
