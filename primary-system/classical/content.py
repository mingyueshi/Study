"""古文课程的文件契约与呈现数据；校验器也可脱离 Django 执行。"""
import hashlib
import copy
import json
import re
from pathlib import Path
from urllib.parse import urlsplit


SOURCE_DIR = Path(__file__).resolve().parent.parent / 'content_sources' / 'classical'
ID_RE = re.compile(r'^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$')


class InvalidContent(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise InvalidContent('古文精读馆：' + message)


def text(value):
    require(isinstance(value, str) and bool(value.strip()), '缺少正文。')
    require(not any(char in value for char in ('"', '\n', '\r', '<', '>')), '正文须用中文标点，不能含裸换行或 HTML。')


def unique_ids(rows):
    require(isinstance(rows, list) and bool(rows), '清单不能为空。')
    require(all(isinstance(row, dict) and isinstance(row.get('id'), str) and ID_RE.fullmatch(row['id']) for row in rows), '编号格式有误。')
    require(len({row['id'] for row in rows}) == len(rows), '编号重复。')


def walk_text(value):
    if isinstance(value, str):
        text(value)
    elif isinstance(value, list):
        for child in value:
            walk_text(child)
    elif isinstance(value, dict):
        for child in value.values():
            walk_text(child)


def note_span(sentence, note):
    quote = note['quote']
    occurrence = note.get('occurrence', 1)
    require(type(occurrence) is int and occurrence > 0, '词语出现次数须为正整数。')
    starts = [match.start() for match in re.finditer(re.escape(quote), sentence['text'])]
    require(len(starts) >= occurrence, f'词语「{quote}」未出现在指定句子或次数有误。')
    start = starts[occurrence - 1]
    return start, start + len(quote)


def validate_pin(pin):
    require(isinstance(pin, dict), '原典定位格式有误。')
    for key in ('version', 'path', 'locator', 'sha256', 'anchor_text'):
        text(pin.get(key))
    require(bool(re.fullmatch(r'[0-9a-f]{64}', pin['sha256'])), '原典来源指纹有误。')
    require(pin['path'].startswith('poetry/') and '..' not in Path(pin['path']).parts, '原典来源路径有误。')
    require(pin['locator'].startswith('/') and len(pin['anchor_text']) >= 10, '原典段落定位有误。')


def validate_source_url(value):
    text(value)
    url = urlsplit(value)
    require(url.scheme == 'https' and bool(url.netloc), '出处须为 HTTPS 地址。')


def validate_article(article, catalog):
    require(isinstance(article, dict) and type(article.get('schema_version')) is int and article['schema_version'] == 1, '篇目版本有误。')
    walk_text(article)
    for key in ('id', 'title', 'attribution', 'intro', 'background', 'editorial_note'):
        text(article.get(key))
    require(bool(ID_RE.fullmatch(article['id'])), '篇目编号有误。')
    require(article.get('unit_label', '句') in ('句', '则'), '精读单位只能为句或则。')
    for field, group in (('level', 'levels'), ('genre', 'genres')):
        require(article.get(field) in {row['id'] for row in catalog[group]}, f'{field} 引用有误。')
    require(isinstance(article.get('skills'), list) and bool(article['skills']), '缺少阅读本领。')
    require(set(article['skills']) <= {row['id'] for row in catalog['skills']}, '阅读本领引用有误。')
    source = article.get('source')
    require(isinstance(source, dict), '缺少出处。')
    for key in ('work', 'section', 'url', 'note'):
        text(source.get(key))
    validate_source_url(source['url'])
    pin = article.get('source_ref')
    if pin is not None:
        validate_pin(pin)
    edition = article.get('edition')
    if edition is not None:
        require(isinstance(edition, dict), '译注来源格式有误。')
        for key in ('label', 'revision', 'license', 'note'):
            text(edition.get(key))
        validate_source_url(edition.get('url'))
        require(bool(re.fullmatch(r'[0-9a-f]{40}', edition['revision'])), '译注版本须固定到提交。')
    curriculum = article.get('curriculum')
    if curriculum is not None:
        require(isinstance(curriculum, dict) and curriculum.get('book') == '4a', '首版只登记已核实的四上关联。')
        text(curriculum.get('label'))
        require(article['title'] in ('精卫填海', '王戎不取道旁李'), '教材关联未核实。')
    sentences = article.get('sentences')
    unique_ids(sentences)
    require(len(sentences) >= 2, '至少需要两句。')
    sections = article.get('sections')
    if sections is not None:
        unique_ids(sections)
        for section in sections:
            require(set(section) == {'id', 'title', 'intro', 'sentences'}, '分段须登记编号、标题、导读和句子编号。')
            text(section.get('title'))
            text(section.get('intro'))
            require(isinstance(section.get('sentences'), list) and bool(section['sentences'])
                    and all(isinstance(value, str) for value in section['sentences']), '分段句子清单有误。')
        require([value for section in sections for value in section['sentences']] == [row['id'] for row in sentences],
                '分段必须按原文顺序完整覆盖每句，不能重复或遗漏。')
    for sentence in sentences:
        reference = sentence.get('reference')
        if article.get('unit_label') == '则':
            require(reference is not None, '章句选读须逐则注明出处。')
        if reference is not None:
            require(isinstance(reference, dict), '章句出处格式有误。')
            text(reference.get('label'))
            validate_source_url(reference.get('url'))
            validate_pin(reference.get('source_ref'))
        for key in ('text', 'translation', 'explanation'):
            text(sentence.get(key))
        if 'translation_entry' in sentence:
            require(type(sentence['translation_entry']) is int and sentence['translation_entry'] > 0, '译注条目编号有误。')
        breaks = sentence.get('chunks')
        require(isinstance(breaks, list) and bool(breaks) and all(isinstance(chunk, str) and chunk for chunk in breaks), '缺少朗读停顿。')
        require(''.join(breaks) == sentence['text'], '朗读停顿必须完整还原原文。')
        hints = sentence.get('hints')
        require(isinstance(hints, list) and bool(hints) and all(isinstance(hint, str) and hint in sentence['text'] for hint in hints), '背诵关键词未出现在原句。')
        notes = sentence.get('notes')
        unique_ids(notes)
        spans = []
        for note in notes:
            for key in ('quote', 'meaning'):
                text(note.get(key))
            require(note.get('kind') in ('word', 'referent'), '词语类型有误。')
            if note['kind'] == 'referent':
                text(note.get('refers_to'))
                text(note.get('reason'))
            spans.append(note_span(sentence, note))
        spans.sort()
        require(all(left[1] <= right[0] for left, right in zip(spans, spans[1:])), '同一句的词语标注重叠。')
    overview = article.get('overview')
    require(isinstance(overview, dict), '缺少篇章梳理。')
    require(isinstance(overview.get('sequence'), list) and len(overview['sequence']) >= 3, '故事梳理至少三个步骤。')
    for key in ('question', 'answer', 'takeaway'):
        text(overview.get(key))
    questions = article.get('questions')
    unique_ids(questions)
    if sections is None:
        require(3 <= len(questions) <= 5, '每篇需要三至五道练习。')
    else:
        for section in sections:
            require(3 <= sum(question.get('sentence') in section['sentences'] for question in questions) <= 5,
                    '长文每段需要三至五道练习。')
    sentence_ids = {row['id'] for row in sentences}
    for question in questions:
        for key in ('prompt', 'explanation'):
            text(question.get(key))
        require(question.get('sentence') in sentence_ids, '练习关联句子不存在。')
        require(question.get('skill') in article['skills'], '练习本领未在篇目登记。')
        require(question.get('type') in ('choice', 'selfcheck'), '不支持的练习类型。')
        if question['type'] == 'choice':
            choices = question.get('choices')
            require(isinstance(choices, list) and len(choices) >= 2 and all(isinstance(choice, str) for choice in choices), '练习选项有误。')
            require(len(set(choices)) == len(choices), '练习选项重复。')
            answer = question.get('answer')
            require(type(answer) is int and 0 <= answer < len(choices), '练习答案越界。')
        else:
            text(question.get('answer'))


def registered_ids(catalog):
    ids = catalog.get('articles')
    require(isinstance(ids, list) and bool(ids) and all(isinstance(slug, str) and ID_RE.fullmatch(slug) for slug in ids), '篇目文件编号有误。')
    retired = catalog.get('retired_articles', [])
    require(isinstance(retired, list), '合并篇目须为清单。')
    if retired:
        unique_ids(retired)
    for row in retired:
        require(set(row) == {'id', 'collection'}, '合并篇目须登记原编号与目标全书。')
        require(isinstance(row['collection'], str) and bool(ID_RE.fullmatch(row['collection'])), '合并篇目的全书编号有误。')
    all_ids = ids + [row['id'] for row in retired]
    require(len(set(all_ids)) == len(all_ids), '篇目重复或合并篇目仍在公开目录中。')
    return all_ids


def retired_targets(catalog, articles):
    """从稳定的复用关系取得旧章句的新位置，避免按题名或文字猜跳转。"""
    targets = {}
    for entry in catalog.get('retired_articles', []):
        collection = next((row for row in catalog.get('collections', []) if row['id'] == entry['collection']), None)
        require(collection is not None, '合并篇目的目标全书不存在。')
        parts = {row['id'] for row in collection['parts']}
        units = {}
        for article in articles:
            if article['id'] not in parts:
                continue
            for unit in article['sentences']:
                reuse = unit.get('reuse')
                if reuse and reuse['article'] == entry['id']:
                    require(reuse['sentence'] not in units, '旧章句有多个合并目标。')
                    units[reuse['sentence']] = {'article': article['id'], 'sentence': unit['id']}
        original = next(row for row in articles if row['id'] == entry['id'])
        require(set(units) == {row['id'] for row in original['sentences']}, '合并篇目有章句尚未纳入全书。')
        targets[entry['id']] = {'collection': entry['collection'], 'units': units}
    return targets


def validate_library(catalog, articles):
    require(isinstance(catalog, dict) and type(catalog.get('schema_version')) is int and catalog['schema_version'] == 1, '目录版本有误。')
    walk_text(catalog)
    for key in ('title', 'intro'):
        text(catalog.get(key))
    for group in ('levels', 'genres', 'skills'):
        unique_ids(catalog.get(group))
        for row in catalog[group]:
            text(row.get('label'))
    ids = catalog['articles']
    require([article.get('id') for article in articles] == registered_ids(catalog), '目录与篇目文件不一致。')
    require(len({article.get('title') for article in articles}) == len(articles), '篇名重复。')
    resolved = resolve_articles(articles)
    for article in resolved:
        validate_article(article, catalog)
    collections = catalog.get('collections', [])
    require(isinstance(collections, list), '全书目录须为清单。')
    if collections:
        unique_ids(collections)
    assigned = set()
    for collection in collections:
        for key in ('title', 'intro'):
            text(collection.get(key))
        require(collection.get('part_label', '篇') in ('篇', '章'), '全书篇章单位有误。')
        parts = collection.get('parts')
        unique_ids(parts)
        landmarks = collection.get('landmarks', [])
        require(isinstance(landmarks, list), '全书分卷导航须为清单。')
        for landmark in landmarks:
            require(isinstance(landmark, dict), '全书分卷导航格式有误。')
            text(landmark.get('label'))
            require(landmark.get('article') in {part['id'] for part in parts}, '全书分卷导航目标不存在。')
        require(len({row['article'] for row in landmarks}) == len(landmarks), '全书分卷导航目标重复。')
        for part in parts:
            require(part['id'] in ids and part['id'] not in assigned, '全书篇目重复或未登记。')
            assigned.add(part['id'])
            require(type(part.get('count')) is int and part['count'] >= 2, '全书章句数有误。')
            require(bool(re.fullmatch(r'[0-9a-f]{64}', str(part.get('text_sha256', '')))), '全书原文指纹有误。')
            article = next(row for row in resolved if row['id'] == part['id'])
            require(len(article['sentences']) == part['count'], '全书章句有遗漏。')
            original = '|'.join(''.join(re.findall(r'[\u3400-\u9fff]', row['text'])) for row in article['sentences'])
            require(hashlib.sha256(original.encode()).hexdigest() == part['text_sha256'], '全书原文顺序或文字发生变化。')
    retired_targets(catalog, articles)
    return resolved[:len(ids)]


def resolve_articles(articles):
    """选读中的六则只有一份教学正文；完整篇章通过稳定编号复用。"""
    resolved = copy.deepcopy(articles)
    by_id = {row.get('id'): row for row in articles}
    for article in resolved:
        sentences = article.get('sentences')
        unique_ids(sentences)
        for index, sentence in enumerate(sentences):
            reuse = sentence.get('reuse')
            if reuse is None:
                continue
            require(set(sentence) == {'id', 'reuse', 'reference'}, '复用章句只能覆盖编号和出处。')
            require(isinstance(reuse, dict) and set(reuse) == {'article', 'sentence'}, '复用章句定位有误。')
            origin = by_id.get(reuse['article'])
            require(origin is not None and origin['id'] != article['id'], '复用篇目不存在或引用自身。')
            unit = next((row for row in origin.get('sentences', []) if row.get('id') == reuse['sentence']), None)
            require(unit is not None and 'reuse' not in unit, '复用章句不存在或形成嵌套引用。')
            sentences[index] = {**copy.deepcopy(unit), 'id': sentence['id'], 'reference': sentence['reference']}
    return resolved


def load_library(source_dir=SOURCE_DIR):
    """直接读随项目发布的文件；不联网，不连接数据库，不持久缓存旧内容。"""
    try:
        catalog = json.loads((source_dir / 'catalog.json').read_text(encoding='utf-8'))
        ids = registered_ids(catalog)
        articles = [json.loads((source_dir / f'{slug}.json').read_text(encoding='utf-8')) for slug in ids]
        published = validate_library(catalog, articles)
        catalog['retired_targets'] = retired_targets(catalog, articles)
        articles = published
    except (OSError, json.JSONDecodeError, KeyError, TypeError, AttributeError) as error:
        raise InvalidContent('古文精读馆：课程文件缺失或结构损坏。') from error
    for article in articles:
        article['revision'] = hashlib.sha256(json.dumps(article, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        article.setdefault('unit_label', '句')
        article['level_label'] = next(row['label'] for row in catalog['levels'] if row['id'] == article['level'])
        article['genre_label'] = next(row['label'] for row in catalog['genres'] if row['id'] == article['genre'])
        article['skill_labels'] = [row['label'] for row in catalog['skills'] if row['id'] in article['skills']]
        article['character_count'] = sum(len(re.findall(r'[\u3400-\u9fff]', row['text'])) for row in article['sentences'])
    for collection in catalog.get('collections', []):
        collection.setdefault('part_label', '篇')
    return catalog, articles


def prepare_article(article):
    """词语按明确句子与出现次数切片，绝不对全文作替换。"""
    for section in article.get('sections', []):
        section['first_sentence'] = section['sentences'][0]
        next(row for row in article['sentences'] if row['id'] == section['first_sentence'])['section_heading'] = section
        first_question = next(row for row in article['questions'] if row['sentence'] in section['sentences'])
        first_question['section_title'] = section['title']
    for number, sentence in enumerate(article['sentences'], 1):
        sentence['number'] = number
        parts, cursor = [], 0
        for note in sorted(sentence['notes'], key=lambda row: note_span(sentence, row)):
            start, end = note_span(sentence, note)
            if start > cursor:
                parts.append({'text': sentence['text'][cursor:start]})
            parts.append({'text': sentence['text'][start:end], 'note': note})
            cursor = end
        if cursor < len(sentence['text']):
            parts.append({'text': sentence['text'][cursor:]})
        sentence['parts'] = parts
    for number, question in enumerate(article['questions'], 1):
        question['number'] = number
        question['answer_text'] = question['choices'][question['answer']] if question['type'] == 'choice' else question['answer']
        question['sentence_number'] = next(index for index, sentence in enumerate(article['sentences'], 1) if sentence['id'] == question['sentence'])
    return article


if __name__ == '__main__':
    _, rows = load_library()
    print(f'古文精读馆：{len(rows)} 篇、{sum(len(row["sentences"]) for row in rows)} 个精读段、{sum(len(row["questions"]) for row in rows)} 道练习通过结构校验。')
