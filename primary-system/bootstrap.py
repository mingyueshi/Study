"""Local setup. Start a loopback preview only when --serve is supplied."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv


def main():
    if sys.version_info < (3, 12):
        raise SystemExit('需要 Python 3.12 或更高版本。')
    parser = argparse.ArgumentParser(description='初始化乐学堂统一系统（本机独立 SQLite）')
    parser.add_argument('--serve', action='store_true', help='初始化后启动本机预览')
    parser.add_argument('--port', type=int, default=8012)
    parser.add_argument('--skip-install', action='store_true', help='已安装依赖时跳过安装')
    parser.add_argument('--skip-content', action='store_true', help='仅初始化目录，不导入 primary 内容')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('端口应在 1024–65535 之间。')
    if os.environ.get('PRIMARY_PRODUCTION') == '1':
        parser.error('此脚本只用于本地；生产环境请按 README 手动迁移。')
    root = Path(__file__).resolve().parent
    env = dict(os.environ, PRIMARY_DEBUG='1', PRIMARY_DB_ENGINE='sqlite',
               PRIMARY_SQLITE_PATH=str(root / 'db.sqlite3'), PRIMARY_ALLOWED_HOSTS='localhost,127.0.0.1')
    python = root / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not python.exists():
        venv.EnvBuilder(with_pip=True).create(root / '.venv')

    def run(*command):
        subprocess.run([str(python), *command], cwd=root, env=env, check=True)

    if not args.skip_install:
        run('-m', 'pip', 'install', '-r', 'requirements.txt')
    run('manage.py', 'migrate', '--noinput')
    run('manage.py', 'seed_platform')
    run('manage.py', 'seed_lexicon_roles')
    if not args.skip_content:
        node = shutil.which('node')
        if not node:
            raise SystemExit('内容导入需要 Node.js（仅导入时使用）。可安装后重试，或加 --skip-content 先使用空基座。')
        subprocess.run([node, str(root / 'scripts/export_primary.cjs')], cwd=root, check=True)
        run('manage.py', 'import_primary', 'data/primary.json', '--publish')
        run('manage.py', 'import_lexicon', '--adapter', 'primary')
    run('manage.py', 'check')
    print('初始化完成。管理员请自行运行 .venv/bin/python manage.py createsuperuser；未创建默认账号。', flush=True)
    if args.serve:
        print(f'前台 http://127.0.0.1:{args.port}/  后台 http://127.0.0.1:{args.port}/admin/', flush=True)
        run('manage.py', 'runserver', f'127.0.0.1:{args.port}', '--noreload')


if __name__ == '__main__':
    main()
