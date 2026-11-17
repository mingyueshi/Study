#!/usr/bin/env python3
"""把当前 Git 历史中的本系统提交保存为可独立发布的升级记录。"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))
from catalog.upgrade_history import HISTORY_PATH, validate_history


def build_history():
    project = PROJECT.resolve()
    root = Path(subprocess.check_output(
        ['git', '-C', str(project), 'rev-parse', '--show-toplevel'], text=True).strip()).resolve()
    relative = project.relative_to(root).as_posix()
    log = subprocess.check_output([
        'git', '-C', str(root), '-c', 'log.showSignature=false', 'log',
        '--format=%H%x00%cs%x00%s', '--', relative,
    ], text=True, encoding='utf-8')
    records = []
    for line in log.splitlines():
        revision, day, title = line.split('\0', 2)
        records.append({'revision': revision, 'date': day, 'title': title})
    # 同日保持 Git 原顺序；不同日期严格倒序，避免回填提交时间打乱时间线。
    records.sort(key=lambda row: row['date'], reverse=True)
    return validate_history({'schema_version': 1, 'records': records})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='核对保存的记录是否与当前 Git 历史一致')
    args = parser.parse_args()
    try:
        data = build_history()
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f'无法读取升级记录，请在完整 Git 仓库内运行：{exc}\n')
    output = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if args.check:
        if not HISTORY_PATH.exists() or HISTORY_PATH.read_text(encoding='utf-8') != output:
            parser.exit(1, '升级记录尚未同步，请运行 scripts/build_upgrade_history.py。\n')
        print(f'升级记录已同步，共 {len(data["records"])} 条。')
    else:
        HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        HISTORY_PATH.write_text(output, encoding='utf-8')
        print(f'已保存 {len(data["records"])} 条升级记录。')


if __name__ == '__main__':
    main()
