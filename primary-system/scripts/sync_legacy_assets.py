"""把 legacy primary 的前端资产同步进本项目的 static 目录。

图示库（六个自包含 IIFE）与点读引擎 speech.js 以「只复制不改写」的方式复用：
legacy 目录将来退役时，本脚本的产物已在本项目内独立存在。每次同步校验
SHA256 与来源一致，防止手工改动造成静默漂移。

用法：.venv/bin/python scripts/sync_legacy_assets.py [--check]
--check 只校验不复制，用于回归。
"""
import argparse
import hashlib
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
LEGACY = BASE.parent / 'primary'

ASSETS = {
    'figures.js': 'figures/figures.js',
    'sci-figures.js': 'figures/sci-figures.js',
    'lit-figures.js': 'figures/lit-figures.js',
    'geo-figures.js': 'figures/geo-figures.js',
    'astro-figures.js': 'figures/astro-figures.js',
    'history-figures.js': 'figures/history-figures.js',
    'figures.css': 'figures/figures.css',
    'speech.js': 'speech.js',
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def main():
    parser = argparse.ArgumentParser(description='同步 legacy 图示与点读资产到 static/')
    parser.add_argument('--check', action='store_true', help='只校验已有副本一致，不复制')
    args = parser.parse_args()
    failures = []
    for source_name, target_rel in ASSETS.items():
        source, target = LEGACY / source_name, BASE / 'static' / target_rel
        if not source.exists():
            failures.append(f'缺少来源文件：{source}')
            continue
        source_hash = digest(source)
        if args.check:
            if digest(target) != source_hash:
                failures.append(f'副本不一致或缺失：{target}')
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
        status = '一致' if digest(target) == source_hash else '校验失败'
        print(f'{source_name} -> static/{target_rel} [{status}]')
        if status != '一致':
            failures.append(target_rel)
    if failures:
        raise SystemExit('同步校验失败：' + '; '.join(failures))
    print('全部资产与 legacy 来源逐字节一致。' if not args.check else '校验通过：全部副本与来源一致。')


if __name__ == '__main__':
    main()
