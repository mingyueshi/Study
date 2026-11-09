"""One-way adapter for primary's source data; stable keys do not depend on ordering."""
import hashlib
import json
from django.core.management.base import CommandError
from catalog.models import ContentItem, Module, Placement, Textbook, TextbookBook, Unit

LABELS = {
    'overview': '内容概览', 'main': '内容梳理', 'theme': '主题感悟', 'words': '重点词语',
    'fourWords': '四字词语', 'poly': '多音字', 'synant': '近义与反义', 'craft': '写法点睛',
    'tips': '学习提示', 'recite': '背诵提示', 'items': '知识要点', 'example': '例题与例句',
    'mistakes': '易错提醒', 'recall': '记忆口诀', 'pinyin': '拼音', 'ipa': '音标',
    'memo': '记忆提示', 'parts': '拆分记忆', 'related': '关联词', 'chars': '逐字理解',
    'story': '成语故事', 'source': '出处', 'syn': '近义词', 'ant': '反义词',
    'goal': '写作目标', 'outline': '结构提纲', 'sentences': '好句积累', 'model': '范文',
    'comment': '点评', 'task': '小练笔', 'author': '作者', 'dynasty': '朝代', 'lines': '诗文',
    'note': '说明', 'oral': '口语交际', 'writing': '习作', 'garden': '语文园地', 'goals': '学习目标',
    'poems': '古诗文', 'sayings': '日积月累', 'polyphonic': '多音字复习', 'similar': '形近字',
    'formulas': '公式速查', 'facts': '知识速查', 'WORD_ZH': '关联词释义', 'IDIOM_ZH': '关联成语释义',
    'WRITING_MATERIALS': '写作素材', 'q': '问题', 'a': '答案', 'steps': '思路', 'wrong': '易错说法',
    'right': '正确说法', 'title': '标题', 'name': '名称', 'zh': '中文', 'en': '英文',
    't': '词段', 'd': '解释', 'say': '读法', 'text': '内容', 'label': '段落', 'points': '要点',
    'starts': '开头', 'ends': '结尾', 'wordGroups': '好词分类', 'unit': '所属单元', 'kind': '类别',
    # knowledge 单一数据源（content_sources/knowledge-data.js）的课文与古诗文素材字段
    'excerpts': '原文金句', 'authorLife': '作者小传', 'authorBio': '作者简介',
    'life': '人物小传', 'bio': '人物简介', 'bg': '创作背景', 'book': '快乐读书吧',
    'examples': '习作例文', 'videos': '拓展视频', 'bvid': 'B站编号', 'up': 'UP 主', 'dur': '时长（秒）',
    # math 单一数据源（content_sources/math-data.js）的视频分组字段
    'desc': '简介', 'list': '视频列表', 'groups': '视频分组', 'group': '所属分组',
}
SKIP = {'id', 'key', 'fig', 'img', 'banner', 'emoji', 'color', 'demo', 'interactive', 'tag', 'cover'}

# 导入能力由适配器决定。Module 还承载独立玩法和历史专题入口，存在并不代表有教材映射。
TEXTBOOK_ADAPTERS = {
    'knowledge': {'units': 'units', 'children': 'lessons', 'kind': 'knowledge',
                  'textbooks': {'all': 'pep-chinese-4a-2026'}},
    'math': {'units': 'units', 'children': 'points', 'kind': 'knowledge',
             'textbooks': {'all': 'bnu-math-4a-2026'},
             # 知识点的 life 是「生活中的数学」一句话，静态页按 id 合成情境照片路径。
             'labels': {'life': '生活中的数学'}, 'photo_of': None,
             },
    'english': {'units': 'ENGLISH_UNITS', 'children': 'words', 'kind': 'word',
                'textbook_children': 'ENGLISH_DIALOGUES', 'textbook_kind': 'dialogue',
                'textbooks': {'first': 'fltrp-english-4a-2026', 'second': 'fltrp-english-4b-2026'}},
}


def _math_photo(raw):
    return f'images/math/p-{raw["id"]}.jpg' if raw.get('life') and raw.get('id') else None


TEXTBOOK_ADAPTERS['math']['photo_of'] = _math_photo


def plain(value):
    if isinstance(value, dict):
        return '\n'.join(f'{LABELS.get(k, k)}：{plain(v)}' for k, v in value.items() if k not in SKIP)
    if isinstance(value, list):
        if all(not isinstance(x, (list, dict)) for x in value):
            return '\n'.join(str(x) for x in value)
        return '\n\n'.join(plain(x) for x in value)
    return str(value) if value is not None else ''


def item_defaults(raw, module, source, kind, title, labels=None, image=None):
    labels = labels or LABELS
    summary = raw.get('zh') or raw.get('overview') or raw.get('goal') or ''
    sections = [{'type': 'text', 'title': labels.get(k, k), 'text': plain(v)} for k, v in raw.items()
                if k not in SKIP | {'title', 'en', 'idiom', 'zh', 'overview', 'goal'} and v]
    fig = raw.get('fig')
    if isinstance(fig, str) and fig.strip():
        # 图示块置首位，贴近 legacy 卡片的视觉顺序；说明文字由图示库内置默认图注补齐。
        sections.insert(0, {'type': 'figure', 'fig': fig.strip()})
    img = raw.get('img') or image
    if isinstance(img, str) and img.strip():
        # 实景照片块：文件随系统本地存储（static/images/...），无网也能展示。
        sections.insert(0, {'type': 'image', 'src': img.strip(), 'alt': title})
    return {
        'module': module, 'kind': kind, 'title': title, 'summary': summary,
        'sections': sections, 'source_file': source['source_file'],
        'source_hash': source['sha256'], 'source_payload': raw,
    }


def import_snapshot(snapshot, publish=False):
    if not isinstance(snapshot, dict) or snapshot.get('schema_version') != 1 or not isinstance(snapshot.get('modules'), list):
        raise CommandError('不支持的快照结构。')
    report = {'created': 0, 'updated': 0, 'locked': 0, 'unchanged': 0, 'collections': 0}
    seen = set()
    for source in snapshot['modules']:
        code = source['code']
        if code in seen:
            raise CommandError(f'重复模块：{code}')
        seen.add(code)
        adapter = TEXTBOOK_ADAPTERS.get(code)
        if adapter is None:
            # primary.json 是全量 legacy 导出；只导入有明确教材适配器的模块。
            report.setdefault('skipped_modules', []).append(code)
            continue
        try:
            module = Module.objects.get(code=code)
        except Module.DoesNotExist as exc:
            raise CommandError(f'教材模块 {code} 尚未初始化，请先运行 seed_platform。') from exc
        data = source['data']
        if not isinstance(data, dict) or len(source.get('sha256', '')) != 64:
            raise CommandError(f'{code} 的数据或来源摘要不正确。')
        units_key = adapter['units']
        units = data[units_key]
        adapter_labels = {**LABELS, **adapter.get('labels', {})}
        photo_of = adapter.get('photo_of')
        groups = [('all', units)] if code != 'english' else [
            ('first', [u for u in units if u['book'] == '四年级上册']),
            ('second', [u for u in units if u['book'] == '四年级下册']),
        ]
        if code == 'english' and sum(len(group) for _, group in groups) != len(units):
            raise CommandError('英语包含未知册次，请扩展映射后导入。')
        for term, grouped_units in groups:
            textbook_code = adapter['textbooks'][term]
            try:
                textbook = Textbook.objects.get(code=textbook_code)
            except Textbook.DoesNotExist as exc:
                raise CommandError(f'教材册次 {textbook_code} 尚未初始化，请先运行 seed_platform。') from exc
            book, created = TextbookBook.objects.get_or_create(code=f'primary-{code}-{term}', defaults={
                'name': str(textbook), 'module': module, 'textbook': textbook, 'is_published': publish,
                'description': '单元知识与复习资料；教材对应范围请结合手中的课本核对。',
            })
            book.full_clean()
            if book.module_id != module.pk or book.textbook_id != textbook.pk:
                raise CommandError(f'{book.code} 的目录归属已人工调整，请检查导入映射。')
            if created:
                report['collections'] += 1
            for order, raw_unit in enumerate(grouped_units):
                unit_defaults = {'title': raw_unit['name'], 'description': raw_unit.get('intro', raw_unit.get('zh', '')), 'order': order}
                unit, _ = Unit.objects.get_or_create(textbook_book=book, code=raw_unit['id'], defaults=unit_defaults)
                child_key = adapter['children']
                kind = adapter['kind']
                for index, raw in enumerate(raw_unit[child_key]):
                    title = raw.get('title') or raw.get('en') or raw.get('idiom')
                    identity = raw.get('key') or raw.get('id') or title
                    # Identity includes source unit: independently tracked textbook occurrences stay distinct.
                    key = f'primary:{code}:{raw_unit["id"]}:{identity}'
                    upsert_item(key, raw, module, source, kind, title, unit, index, publish, report,
                                labels=adapter_labels, image=photo_of(raw) if photo_of else None)
                if code == 'english' and adapter.get('textbook_children'):
                    # 课文对话按 unitId 挂到同一单元；排在单词之后（100+），页面上单独成 tab。
                    dialogues = [d for d in data.get(adapter['textbook_children'], [])
                                 if d.get('unitId') == raw_unit['id']]
                    for order_d, raw_d in enumerate(dialogues):
                        title_d = raw_d.get('title') or raw_d.get('zh')
                        key_d = f'primary:{code}:{raw_unit["id"]}:{raw_d.get("id") or title_d}'
                        upsert_item(key_d, raw_d, module, source, adapter['textbook_kind'],
                                    title_d, unit, 100 + order_d, publish, report)
                # 单元级编排（目标/口语交际/习作/园地/快乐读书吧/例文）汇成「单元学习指南」卡；
                # 英语单元的 book 是册次字符串，不是板块，维持排除。
                skip_unit_keys = {child_key, 'id', 'name', 'no', 'intro', 'zh'} | SKIP
                if not isinstance(raw_unit.get('book'), dict):
                    skip_unit_keys.add('book')
                extra = {k: v for k, v in raw_unit.items() if k not in skip_unit_keys}
                if extra:
                    # 单元横幅实景图（math.banners）作为指南卡首图；引用键带 mban- 前缀（与静态页一致地剥掉）。
                    banners = data.get('banners') or {}
                    banner_ref = str(raw_unit.get('banner') or '')
                    banner_image = banners.get(banner_ref) or banners.get(banner_ref.removeprefix('mban-'))
                    upsert_item(f'primary:{code}:{raw_unit["id"]}:__overview', extra, module, source,
                                'reference', '单元学习指南', unit, 10000, publish, report,
                                labels=adapter_labels, image=banner_image)
            # Keep every ancillary dataset, rather than silently dropping poems or related definitions.
            # meta 是数据元信息、banners 已按单元并入指南卡，都不再单独立卡。
            metadata_keys = {units_key, 'textbook', 'edition', 'meta', 'banners', 'ENGLISH_BOOKS', 'ENGLISH_WORDS'}
            if code == 'english':
                # Relationship label/style/order settings drive the legacy UI, not learning cards.
                metadata_keys.update({'RELATION_META', 'RELATION_ORDER', 'ENGLISH_DIALOGUES'})
            extras = {k: v for k, v in data.items() if k not in metadata_keys}
            if extras:
                reference, _ = Unit.objects.get_or_create(textbook_book=book, code='reference', defaults={'title': '复习与资料', 'order': 10000})
                banners = data.get('banners') or {}
                for index, (key, value) in enumerate(extras.items()):
                    upsert_item(f'primary:{code}:reference:{key}', {key: value}, module, source, 'reference',
                                LABELS.get(key, key), reference, index, publish, report,
                                image=banners.get(key))
    return report


def upsert_item(key, raw, module, source, kind, title, unit, order, publish, report, labels=None, image=None):
    if not title:
        raise CommandError(f'{key} 缺少标题。')
    if len(key) > 240:
        key = f'primary:{module.code}:sha256:{hashlib.sha256(key.encode()).hexdigest()}'
    defaults = item_defaults(raw, module, source, kind, title, labels=labels, image=image)
    item, created = ContentItem.objects.get_or_create(source_key=key, defaults={
        **defaults, 'status': 'published' if publish else 'draft',
    })
    if created:
        report['created'] += 1
    elif item.import_locked:
        report['locked'] += 1
    elif any(getattr(item, k) != v for k, v in defaults.items()):
        for k, v in defaults.items():
            setattr(item, k, v)
        item.full_clean()
        item.save()
        report['updated'] += 1
    else:
        report['unchanged'] += 1
    item.full_clean()
    placement, _ = Placement.objects.get_or_create(unit=unit, item=item, defaults={'order': order})
    placement.full_clean()
