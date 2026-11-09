"""数学教材册的数据加载与契约校验（按册编排）。

数据是生成物：``scripts/build_mathbook.cjs`` 从 content_sources/ 确定性同步。册次注册
在构建脚本的 ``BOOKS`` 映射里（册次码对齐 catalog 教材码后缀，如 bnu-math-4a
→ ``4a``），每册产出两个文件：

- ``static/mathbook/books/<册>.js``——规范化为 ``const MKB = <JSON>;``，浏览器
  直接加载，本模块读同一份文件剥壳解析；
- ``mathbook/data/books/<册>.json``——结构摘要（册次码、来源 sha256、计数与
  图示/视频 id 清单），是加载期校验的对照基准。

坏数据在加载期直接拒绝上线（与 grammar 的 catalog.py 同范式）。
"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

BOOKS_DIR = Path(__file__).resolve().parent / 'data' / 'books'
STATIC_BOOKS_DIR = settings.BASE_DIR / 'static' / 'mathbook' / 'books'
IMAGES_DIR = settings.BASE_DIR / 'static' / 'images' / 'math'
DATA_MARKER = 'const MKB = '
SCHEMA_VERSION = 1
BOOK_SLUG_RE = re.compile(r'^[a-z0-9]{1,12}$')
COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
TAG_RE = re.compile(r'<[a-zA-Z/]')


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured('数学教材册数据异常：' + message)


def _walk_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from _walk_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from _walk_strings(item)


def _image_exists(relative):
    return (IMAGES_DIR / relative.removeprefix('images/math/')).is_file()


def validate(manifest, mkb):
    """按 manifest 的结构摘要核对数据本体；计数以 manifest 为权威（源头契约
    由各册声明的静态版测试把守，这里管生成物一致性）。"""
    book = manifest.get('book', '')
    _require(manifest.get('schema_version') == SCHEMA_VERSION,
             f'不支持的 schema_version：{manifest.get("schema_version")}。')
    _require(bool(BOOK_SLUG_RE.match(book)), '册次码不合法：' + book)
    _require(manifest.get('units') >= 1 and manifest.get('points') >= 1,
             'manifest 计数异常。')

    fig_ids = set(manifest.get('fig_ids', []))
    banner_ids = set(manifest.get('banner_ids', []))
    video_ids = set(manifest.get('video_ids', []))
    units = mkb.get('units')
    _require(isinstance(units, list) and len(units) == manifest['units'],
             f'数据单元数应为 {manifest["units"]}。')
    _require(isinstance(mkb.get('textbook'), str) and mkb['textbook'], '缺少 textbook。')
    _require(isinstance(mkb.get('meta'), dict), '缺少 meta 对象。')

    point_total = 0
    seen_points = set()
    for unit in units:
        unit_id = unit.get('id', '')
        tag = f'[{book} {unit_id}]'
        _require(isinstance(unit_id, str) and unit_id, tag + ' 缺少 id。')
        _require(isinstance(unit.get('no'), str) and unit.get('name'), tag + ' 缺少编号或名称。')
        _require(COLOR_RE.match(unit.get('color', '')), tag + ' 颜色格式异常。')
        _require(unit.get('intro') and isinstance(unit.get('goals'), list) and unit['goals'],
                 tag + ' 缺少导语或学习重点。')
        points = unit.get('points')
        _require(isinstance(points, list) and points, tag + ' 至少 1 个知识点。')
        banner = (mkb.get('banners') or {}).get(unit_id)
        if banner:
            _require(banner.startswith('images/math/'), tag + ' 横幅照片路径异常：' + banner)
        for point in points:
            point_id = point.get('id', '')
            where = f'{tag} {point_id}'
            point_total += 1
            _require(point_id not in seen_points, where + ' 知识点 id 重复。')
            seen_points.add(point_id)
            _require(point_id.startswith(unit_id + '-'), where + ' id 未以单元 id 为前缀。')
            _require(point.get('title') and point.get('overview') and point.get('life'),
                     where + ' 缺少标题/概述/生活情境。')
            _require(point.get('fig') in fig_ids, where + ' 图示不在清单：' + str(point.get('fig')))
            _require(isinstance(point.get('items'), list) and len(point['items']) >= 2,
                     where + ' 知识要点不足 2 条。')
            example = point.get('example') or {}
            _require(example.get('q') and example.get('a') and example.get('steps'),
                     where + ' 例题不完整（q/a/steps）。')
            if point.get('video'):
                _require(point['video'] in video_ids, where + ' 关联视频不在清单。')

    _require(point_total == manifest['points'],
             f'数据知识点数应为 {manifest["points"]}，实际 {point_total}。')
    formulas = mkb.get('formulas')
    _require(isinstance(formulas, list) and len(formulas) >= 4, '公式速查至少 4 组。')
    mistakes = mkb.get('mistakes')
    _require(isinstance(mistakes, list) and len(mistakes) >= 10, '易错诊所至少 10 条。')
    videos = mkb.get('videos') or {}
    _require({v.get('id') for v in videos.get('list', [])} == video_ids, '视频清单与 manifest 不一致。')

    for banner_id in banner_ids:
        banner = (mkb.get('banners') or {}).get(banner_id, '')
        _require(banner and _image_exists(banner), f'横幅照片文件缺失：{banner_id} → {banner}')
    for video in videos.get('list', []):
        _require(_image_exists(video.get('cover', '')), f'视频封面文件缺失：{video.get("id")}')

    for text in _walk_strings(mkb):
        _require('"' not in text and '\n' not in text and '\r' not in text,
                 '出现英文双引号或裸换行：' + text[:24])
        _require(not TAG_RE.search(text), '含有疑似 HTML 标签：' + text[:24])


@lru_cache(maxsize=16)
def load_book(book):
    """读取并校验一册生成物；任何契约不符直接抛 ImproperlyConfigured。"""
    _require(bool(BOOK_SLUG_RE.match(book or '')), '册次码不合法：' + str(book))
    manifest_path = BOOKS_DIR / f'{book}.json'
    _require(manifest_path.is_file(), f'未知册次：{book}（manifest 缺失，先重跑 scripts/build_mathbook.cjs）。')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    _require(manifest.get('book') == book, f'manifest 册次码与请求不一致：{manifest.get("book")} ≠ {book}。')
    data_path = STATIC_BOOKS_DIR / f'{book}.js'
    _require(data_path.is_file(), f'数据文件缺失：books/{book}.js。')
    text = data_path.read_text(encoding='utf-8')
    _, marker, payload = text.partition(DATA_MARKER)
    _require(bool(marker), '数据文件缺少 const MKB 标记，请重跑 scripts/build_mathbook.cjs。')
    mkb = json.loads(payload.rsplit(';', 1)[0])
    validate(manifest, mkb)
    return {'manifest': manifest, 'mkb': mkb}


def book_exists(book):
    """册次是否已注册（manifest 在位）；未注册册次由视图回 404，
    已注册但契约损坏的仍在 load_book 抛 ImproperlyConfigured 拒绝上线。"""
    return bool(BOOK_SLUG_RE.match(book or '')) and (BOOKS_DIR / f'{book}.json').is_file()


def available_books():
    """全部已同步册次的轻量摘要（册次码、教材名、meta、知识点数），按册次码排序。"""
    books = []
    for manifest_path in sorted(BOOKS_DIR.glob('*.json')):
        book = manifest_path.stem
        data = load_book(book)
        manifest, mkb = data['manifest'], data['mkb']
        books.append({
            'book': book,
            'textbook_code': manifest.get('textbook_code', ''),
            'textbook': mkb.get('textbook', ''),
            'meta': mkb.get('meta', {}),
            'units': manifest['units'],
            'points': manifest['points'],
        })
    return books
