import json
from contextlib import closing
import sqlite3
from django.core.management.base import BaseCommand, CommandError
from poetry.feihualing import ExerciseError
from poetry.feihualing_index import ensure_index, readonly


class Command(BaseCommand):
    help = "只读扫描已就绪诗词，原子重建可丢弃的飞花令索引，不修改内容库。"
    requires_system_checks = []

    def handle(self, *args, **options):
        try:
            context, path = ensure_index(force=True)
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
