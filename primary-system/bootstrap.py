"""Offline content setup; existing databases require explicit repair consent."""

import argparse
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import venv


def main():
    if sys.version_info < (3, 12):
        raise SystemExit("需要Python 3.12或更高版本。")
    parser = argparse.ArgumentParser(
        description="离线恢复乐学堂当前基础内容，不创建默认账号"
    )
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", type=int, default=8012)
    parser.add_argument("--database", type=Path)
    parser.add_argument("--skip-install", action="store_true")
    parser.add_argument(
        "--skip-content",
        action="store_true",
        help="仅建空结构，不加载基础内容（开发测试用途）",
    )
    parser.add_argument(
        "--refresh-data",
        action="store_true",
        help="旧开发库修复：迁移前备份，保护个人数据和人工修订",
    )
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("端口应在1024–65535之间。")
    if os.environ.get("PRIMARY_PRODUCTION") == "1":
        parser.error("只支持本地开发，不用于生产部署。")
    if args.skip_content and args.refresh_data:
        parser.error("--skip-content不能与--refresh-data一起使用。")
    root = Path(__file__).resolve().parent
    database = (
        args.database.expanduser().resolve() if args.database else root / "db.sqlite3"
    )
    database.parent.mkdir(parents=True, exist_ok=True)
    env = dict(
        os.environ,
        PRIMARY_DEBUG="1",
        PRIMARY_DB_ENGINE="sqlite",
        PRIMARY_SQLITE_PATH=str(database),
        PRIMARY_ALLOWED_HOSTS="localhost,127.0.0.1",
    )
    python = (
        root / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    )
    if not python.exists():
        venv.EnvBuilder(with_pip=True).create(root / ".venv")

    def run(*command):
        subprocess.run([str(python), *command], cwd=root, env=env, check=True)

    if not args.skip_install:
        run("-m", "pip", "install", "-r", "requirements.txt")
    existing = False
    if database.exists() and database.stat().st_size:
        with sqlite3.connect(database.as_uri() + "?mode=ro", uri=True) as connection:
            existing = connection.execute(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%')"
            ).fetchone()[0]
    backup = None
    if not args.skip_content:
        run("manage.py", "verify_base_data")
    if existing and not args.refresh_data:
        if args.skip_content:
            raise SystemExit(
                "现有库未改动；结构升级请显式维护。完整内容修复请用 --refresh-data。"
            )
        run("manage.py", "restore_base_data", "--verify-only")
    else:
        if existing:
            from config.base_data import PERSONAL, backup_database, open_readonly, quote

            with open_readonly(database) as connection:
                available = {
                    r[0]
                    for r in connection.execute(
                        "SELECT name FROM sqlite_master WHERE type='table'"
                    )
                }
                personal = [
                    name
                    for name in PERSONAL
                    if name in available
                    and connection.execute(
                        "SELECT EXISTS(SELECT 1 FROM " + quote(name) + ")"
                    ).fetchone()[0]
                ]
            if personal:
                # Django's --check exits before migration execution. Older migrations
                # can retire content/progress, so inspect before even making a backup.
                pending = subprocess.run(
                    [str(python), "manage.py", "migrate", "--check"],
                    cwd=root,
                    env=env,
                    capture_output=True,
                    text=True,
                )
                if pending.returncode:
                    raise SystemExit(
                        "原库未改动：存在个人记录且迁移待应用或状态无法确认（"
                        + ", ".join(personal)
                        + "）。请在独立库完整运行：python3.12 bootstrap.py --database "
                        + str(database.with_name("db.baseline.sqlite3"))
                    )
            backup = backup_database(database, root / ".backups/base-data")
            print("迁移前恢复点：" + backup, flush=True)
        run("manage.py", "migrate", "--noinput")
        if args.skip_content:
            run("manage.py", "seed_platform")
        else:
            command = ["manage.py", "restore_base_data"]
            if args.refresh_data:
                command += ["--refresh-data"]
            if backup:
                command += ["--backup-already", backup]
            run(*command)
        if not existing:
            run("manage.py", "seed_platform")
            run("manage.py", "seed_lexicon_roles")
    run("manage.py", "check")
    print("本地数据库：" + str(database), flush=True)
    print(
        (
            "仅空结构已准备（--skip-content）；尚未加载学习内容。"
            if args.skip_content
            else "当前基础内容、字词典及资料文件已完整准备；未创建默认账号。"
        ),
        flush=True,
    )
    if args.database:
        print("后续命令必须使用同一PRIMARY_SQLITE_PATH=" + str(database), flush=True)
    if args.serve:
        print(f"前台 http://127.0.0.1:{args.port}/", flush=True)
        run("manage.py", "runserver", f"127.0.0.1:{args.port}", "--noreload")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        raise SystemExit(exc.returncode)
