import json
from contextlib import closing
import sqlite3
from django.core.management.base import BaseCommand, CommandError
from poetry.feihualing import ExerciseError
from poetry.feihualing_index import ensure_index, readonly
from reference_library.models import Dataset


class Command(BaseCommand):
    help = "只读扫描已就绪诗词，原子重建可丢弃的飞花令索引，不修改内容库。"
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("--if-needed", action="store_true", help="只在资料就绪且索引缺失或过期时构建。")

    def handle(self, *args, **options):
        if options["if_needed"] and not Dataset.objects.filter(code="poetry", state="ready").exists():
            return
        try:
            _, path = ensure_index(force=not options["if_needed"])
            with closing(readonly(path)) as db:
                meta = {
                    key: json.loads(value)
                    for key, value in db.execute("SELECT key,value FROM meta")
                }
            self.stdout.write(
                json.dumps(
                    {**meta, "path": str(path), "bytes": path.stat().st_size},
                    ensure_ascii=False,
                    indent=2,
                )
            )
        except (ExerciseError, OSError, sqlite3.DatabaseError) as error:
            raise CommandError(str(error)) from error
