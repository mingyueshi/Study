"""语文教材册的数据加载与契约校验（按册编排）。

数据是生成物：``scripts/build_chinesebook.cjs`` 从 content_sources/ 确定性同步。册次注册
在构建脚本的 ``BOOKS`` 映射里（册次码对齐 catalog 教材码后缀，如 pep-chinese-4a
→ ``4a``），每册产出两个文件：

- ``static/chinesebook/books/<册>.js``——规范化为 ``const KB = <JSON>;``，浏览器
  直接加载，本模块读同一份文件剥壳解析；
- ``chinesebook/data/books/<册>.json``——结构摘要（册次码、来源 sha256、单元/
  课文/古诗文/字词计数、图示与图片清单），是加载期校验的对照基准。

坏数据在加载期直接拒绝上线（与 grammar 的 catalog.py 同范式）。
"""
import json
import re
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

BOOKS_DIR = Path(__file__).resolve().parent / 'data' / 'books'
STATIC_BOOKS_DIR = settings.BASE_DIR / 'static' / 'chinesebook' / 'books'
IMAGES_DIR = settings.BASE_DIR / 'static'
DATA_MARKER = 'const KB = '
SCHEMA_VERSION = 1
BOOK_SLUG_RE = re.compile(r'^[a-z0-9]{1,12}$')
UNIT_ID_RE = re.compile(r'^u\d+$')
COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
PINYIN_RE = re.compile(r'^[a-zāáǎàēéěèīíǐìōóǒòūúǔù]+$', re.IGNORECASE)
VOLUME_RE = re.compile(r'^(.+?)([一二三四五六\d]+年级[上下]册)$')


def _require(condition, message):
    if not condition:
        raise ImproperlyConfigured('语文教材册数据异常：' + message)


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
    return (IMAGES_DIR / relative).is_file()


def _check_videos(vids, where):
    _require(isinstance(vids, list) and vids, where + ' 视频清单为空。')
    for video in vids:
        _require(all(video.get(k) for k in ('bvid', 'title', 'up', 'note'))
                 and isinstance(video.get('dur'), (int, float)),
                 where + ' 视频格式应为 {bvid,title,up,dur,note}。')


def _check_unit(u, fig_ids):
    unit_id = u.get('id', '')
    tag = f'[{unit_id}]'
    _require(bool(UNIT_ID_RE.match(unit_id)), tag + ' 单元 id 应为 u1-u8 形态。')
    _require(isinstance(u.get('no'), str) and '单元' in u['no'] and u.get('name'),
             tag + ' 缺少单元编号或名称。')
    _require(isinstance(u.get('emoji'), str) and u['emoji'], tag + ' 缺少 emoji。')
    _require(bool(COLOR_RE.match(u.get('color', ''))), tag + ' 颜色格式异常。')
    _require(u.get('intro') and isinstance(u.get('goals'), list) and len(u['goals']) >= 2,
             tag + ' 缺少导语或学习重点不足 2 条。')
    writing = u.get('writing')
    _require(writing and writing.get('title') and isinstance(writing.get('points'), list)
             and len(writing['points']) >= 2, tag + ' 习作板块不完整。')
    if u.get('banner'):
        _require(u['banner'] in fig_ids, tag + ' 横幅图示不在清单：' + u['banner'])
    lessons = u.get('lessons')
    _require(isinstance(lessons, list) and lessons, tag + ' 至少 1 篇课文。')


def _check_lesson(u, l, fig_ids):
    where = f'[{u.get("id")}] 第{l.get("id")}课'
    _require(isinstance(l.get('id'), (str, int)) and str(l['id']), where + ' 缺少课号。')
    _require(l.get('title') and l.get('overview') and l.get('theme') and l.get('craft'),
             where + ' 缺少题目/概览/主题/写法。')
    _require(l.get('tag') in ('精读', '略读'), where + ' 课型应为 精读/略读。')
    _require(isinstance(l.get('author'), str), where + ' author 应为字符串。')
    _require(isinstance(l.get('main'), list) and len(l['main']) >= 2, where + ' 内容梳理不足 2 条。')
    _require(isinstance(l.get('tips'), list) and len(l['tips']) >= 2, where + ' 考点提示不足 2 条。')
    if l.get('fig'):
        _require(l['fig'] in fig_ids, where + ' 图示不在清单：' + l['fig'])
    for row in l.get('poly') or []:
        _require(len(row) == 5 and PINYIN_RE.match(row[1]) and PINYIN_RE.match(row[3]),
                 where + ' 多音字格式应为 [字, 拼音1, 词1, 拼音2, 词2]。')
    for row in l.get('synant') or []:
        _require(len(row) == 3 and all(row), where + ' 近反义词格式应为 [词, 近义, 反义]。')
    for pair in l.get('words') or []:
        _require(len(pair) == 2 and all(pair), where + ' 重点词语格式应为 [词, 释义]。')
    if l.get('authorBio'):
        _require(l.get('authorLife') and l.get('authorBio'), where + ' 作者小传不完整。')
    if l.get('videos'):
        _check_videos(l['videos'], where)


def _check_poem(p, fig_ids):
    where = f'《{p.get("title")}》'
    _require(p.get('title') and p.get('dynasty') and p.get('note'), where + ' 缺少标题/朝代/诗意。')
    _require(p.get('kind') in ('古诗', '文言文'), where + ' kind 应为 古诗/文言文。')
    _require(isinstance(p.get('lines'), list) and len(p['lines']) >= 2, where + ' 诗句不完整。')
    if p['kind'] == '古诗':
        _require(p.get('author'), where + ' 古诗缺少作者。')
    if p.get('fig'):
        _require(p['fig'] in fig_ids, where + ' 图示不在清单：' + p['fig'])
    if p.get('img'):
        _require(p['img'].startswith('images/'), where + ' 意境图应为本地 images/ 路径。')
    if p.get('videos'):
        _check_videos(p['videos'], where)


def validate(manifest, kb):
    """按 manifest 的结构摘要核对数据本体；计数以 manifest 为权威（源头契约
    由各册声明的静态版测试把守，这里管生成物一致性）。"""
    book = manifest.get('book', '')
    _require(manifest.get('schema_version') == SCHEMA_VERSION,
             f'不支持的 schema_version：{manifest.get("schema_version")}。')
    _require(bool(BOOK_SLUG_RE.match(book)), '册次码不合法：' + book)
    _require(all(manifest.get(k, 0) >= 1 for k in ('units', 'lessons', 'poems')),
             'manifest 计数异常。')

    fig_ids = set(manifest.get('fig_ids', []))
    units = kb.get('units')
    _require(isinstance(units, list) and len(units) == manifest['units'],
             f'数据单元数应为 {manifest["units"]}。')
    _require(isinstance(kb.get('textbook'), str) and kb['textbook'], '缺少 textbook。')
    _require(isinstance(kb.get('edition'), str) and kb['edition'], '缺少 edition。')

    lesson_total = 0
    seen_lessons = set()
    for unit in units:
        _check_unit(unit, fig_ids)
        for lesson in unit['lessons']:
            lesson_id = str(lesson.get('id'))
            _require(lesson_id not in seen_lessons, f'课文编号重复：{lesson_id}')
            seen_lessons.add(lesson_id)
            lesson_total += 1
            _check_lesson(unit, lesson, fig_ids)
    _require(lesson_total == manifest['lessons'],
             f'数据课文数应为 {manifest["lessons"]}，实际 {lesson_total}。')

    poems = kb.get('poems')
    _require(isinstance(poems, list) and len(poems) == manifest['poems'],
             f'数据古诗文数应为 {manifest["poems"]}。')
    seen_poems = set()
    for poem in poems:
        _require(poem.get('title') not in seen_poems, '古诗文重复收录：' + str(poem.get('title')))
        seen_poems.add(poem.get('title'))
        _check_poem(poem, fig_ids)

    sayings = kb.get('sayings')
    _require(isinstance(sayings, list) and len(sayings) >= 1, '缺少日积月累分组。')
    saying_total = 0
    for group in sayings:
        _require(group.get('title') and group.get('kind') in ('名句', '谚语'),
                 '日积月累分组信息不完整。')
        _require(isinstance(group.get('items'), list) and len(group['items']) >= 3,
                 group['title'] + ' 至少 3 条。')
        saying_total += len(group['items'])
    _require(saying_total == manifest['sayings'], '日积月累条数与 manifest 不一致。')

    poly = kb.get('polyphonic')
    _require(isinstance(poly, list) and len(poly) == manifest['polyphonic'],
             f'多音字数应为 {manifest["polyphonic"]}。')
    for row in poly:
        _require(len(row) == 5 and PINYIN_RE.match(row[1]) and PINYIN_RE.match(row[3]) and row[1] != row[3],
                 '多音字格式或读音重复：' + str(row[0]))

    similar = kb.get('similar')
    _require(isinstance(similar, list) and len(similar) == manifest['similar'],
             f'形近字组数应为 {manifest["similar"]}。')

    for img in manifest.get('image_refs', []):
        _require(_image_exists(img), '图片文件缺失：' + img)

    for text in _walk_strings(kb):
        _require('<' not in text and '"' not in text and '\n' not in text and '\r' not in text,
                 '出现尖括号、英文双引号或裸换行：' + text[:24])


@lru_cache(maxsize=16)
def load_book(book):
    """读取并校验一册生成物；任何契约不符直接抛 ImproperlyConfigured。"""
    _require(bool(BOOK_SLUG_RE.match(book or '')), '册次码不合法：' + str(book))
    manifest_path = BOOKS_DIR / f'{book}.json'
    _require(manifest_path.is_file(), f'未知册次：{book}（manifest 缺失，先重跑 scripts/build_chinesebook.cjs）。')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    _require(manifest.get('book') == book, f'manifest 册次码与请求不一致：{manifest.get("book")} ≠ {book}。')
    data_path = STATIC_BOOKS_DIR / f'{book}.js'
    _require(data_path.is_file(), f'数据文件缺失：books/{book}.js。')
    text = data_path.read_text(encoding='utf-8')
    _, marker, payload = text.partition(DATA_MARKER)
    _require(bool(marker), '数据文件缺少 const KB 标记，请重跑 scripts/build_chinesebook.cjs。')
    kb = json.loads(payload.rsplit(';', 1)[0])
    validate(manifest, kb)
    return {'manifest': manifest, 'kb': kb}


def book_exists(book):
    """册次是否已注册（manifest 在位）；未注册册次由视图回 404，
    已注册但契约损坏的仍在 load_book 抛 ImproperlyConfigured 拒绝上线。"""
    return bool(BOOK_SLUG_RE.match(book or '')) and (BOOKS_DIR / f'{book}.json').is_file()


def available_books():
    """全部已同步册次的轻量摘要，按册次码排序。"""
    books = []
    for manifest_path in sorted(BOOKS_DIR.glob('*.json')):
        book = manifest_path.stem
        data = load_book(book)
        manifest, kb = data['manifest'], data['kb']
        match = VOLUME_RE.match(kb.get('textbook', ''))
        books.append({
            'book': book,
            'textbook_code': manifest.get('textbook_code', ''),
            'textbook': kb.get('textbook', ''),
            'edition': kb.get('edition', ''),
            'banner_subject': match.group(1) if match else kb.get('textbook', ''),
            'banner_volume': match.group(2) if match else '',
            'units': manifest['units'],
            'lessons': manifest['lessons'],
        })
    return books
