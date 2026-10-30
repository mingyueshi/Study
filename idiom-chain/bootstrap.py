"""Local-only launcher: python3.12 bootstrap.py [--setup-only]."""
import argparse
import os
from pathlib import Path
import subprocess
import sys
import venv


def main():
    if sys.version_info[:2] != (3, 12):
        raise SystemExit('请使用 Python 3.12 运行：python3.12 bootstrap.py')
    parser = argparse.ArgumentParser(description='初始化家庭成语词典并在本机启动')
    parser.add_argument('--setup-only', action='store_true', help='只安装、迁移和导入，不启动服务器')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    os.chdir(root)
    env = dict(os.environ, DJANGO_DEBUG='1', DJANGO_ALLOWED_HOSTS='localhost,127.0.0.1')
    # This convenience launcher is local only, never a production entry point.
    env.pop('DJANGO_PRODUCTION', None)
    env.pop('SQLITE_PATH', None)
    python = root / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not python.exists():
        venv.EnvBuilder(with_pip=True).create(root / '.venv')
    def run(*command):
        subprocess.run([str(python), *command], check=True, env=env)
    run('-m', 'pip', 'install', '-r', 'requirements.txt')
    fresh = not (root / 'db.sqlite3').exists()
    run('manage.py', 'migrate', '--noinput')
    if fresh:
        run('manage.py', 'seed_idioms')
    run('manage.py', 'import_xinhua', 'data/chinese-xinhua/idiom.json')
    run('manage.py', 'check')
    if args.setup_only:
        print('初始化完成；运行 python3.12 bootstrap.py 启动。')
    else:
        print('本机地址：http://127.0.0.1:8000 （按 Ctrl+C 停止）', flush=True)
        run('manage.py', 'runserver', '127.0.0.1:8000', '--noreload')


if __name__ == '__main__':
    main()
