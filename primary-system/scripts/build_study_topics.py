#!/usr/bin/env python3
"""从 content_sources 生成专题与学习册。服务直接读取生成的文件。"""
import argparse
import json
import re
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT / 'content_sources'
TEMPLATES = PROJECT / 'templates' / 'study_topics'
STATIC = PROJECT / 'static' / 'study_topics'
TOPICS = {
    'history': ('', '', ('index',)),
    'geo': ('', '', ('index',)),
    'history-timeline': ('study-timeline', 'history-timeline', ('index', 'timeline', 'era', 'event', 'dynasties')),
    'geo-map': ('study-atlas', 'geography-atlas', ('index', 'china', 'animals', 'plants', 'world', 'world-animals', 'world-plants', 'province', 'places', 'routes', 'gallery')),
}
COURSES = ('astro', 'lit', 'sci', 'hanzi-evo')
# 数据全局名：slug 含连字符时 .upper() 不是合法 JS 标识符，需要单独映射。
COURSE_GLOBALS = {'hanzi-evo': 'HANZI_EVO'}
EVOLUTION_CHARS = PROJECT / 'hanzi' / 'evolution_chars.py'
COURSE_IMAGE = re.compile(r"(?:img|hero): '(images/[^']+)'")
HEAD_ASSET = re.compile(r'<(?:link rel="stylesheet" href|script src)="([^"]+)"[^>]*>')
MAIN = re.compile(r'<main\b([^>]*)>(.*?)</main>', re.DOTALL)
MEDIA_RENDERERS = {
    ('history-timeline', 'era-app.js'): 'image',
    ('history-timeline', 'event-app.js'): 'item',
    ('geo-map', 'media.js'): 'img',
}
LESSON_HOOKS = (
    ('].map(l => [l.id, l]));', '].map(l => [l.id, window.StudyTopicConnections.lesson(l)]));'),
    (
        '${esc(l.definition)}</p><h4',
        '${esc(l.definition)}</p>${window.StudyTopicConnections.references(l.id)}<h4',
    ),
    (
        '  if(lessonMap.has(hashLesson)) jump(hashLesson);',
        """  if(lessonMap.has(hashLesson)) jump(hashLesson);
  window.addEventListener('hashchange', () => {
    const anchor = location.hash.slice(1);
    if (anchor.startsWith('lesson-')) jump(anchor.slice('lesson-'.length));
    else if (chapters.some(chapter => chapter.id === anchor)) renderChapter(anchor, true);
  });""",
    ),
)
SCRIPT_HOOKS = {
    ('history', 'app.js'): (*LESSON_HOOKS, (
        "    'hu1-2': {name:'chronology', title:'公元纪年与世纪换算'},\n", '',
    )),
    ('geo', 'app.js'): LESSON_HOOKS,
    ('history-timeline', 'event-app.js'): ((
        '    </nav>\n  </article>',
        "    </nav>\n    ${window.StudyTopicConnections.related('events', ev.id)}\n  </article>",
    ),),
    ('history-timeline', 'era-app.js'): (
        (
            '    </header>\n    ${bands.length',
            "    </header>\n    ${window.StudyTopicConnections.related('eras', era.id)}\n    ${bands.length",
        ),
        ('ctx.rowsHTML(era)', 'ctx.rowsHTML(era, { compact: true })'),
    ),
    ('geo-map', 'map-ui.js'): ((
        '      openCard(id);',
        "      openCard(id);\n      card.insertAdjacentHTML('beforeend', window.StudyTopicConnections.related('places', id));",
    ),),
    ('geo-map', 'province-app.js'): ((
        '    window.GMMedia.preview(p.id) +',
        "    window.StudyTopicConnections.related('places', p.id) +\n    window.GMMedia.preview(p.id) +",
    ),),
}
CALENDAR_AUDIO = """<div class="study-calendar-audio">
          <p>听一听公元纪年与世纪换算</p>
          <audio controls preload="none" aria-label="公元纪年与世纪换算讲解"
                 src="{% static 'study_topics/history/assets/audio/chronology.m4a' %}"></audio>
          <a href="{% static 'study_topics/history/assets/audio/chronology.txt' %}">查看音频文字稿 ↗</a>
        </div>"""


def replace_once(source, original, replacement):
    if source.count(original) != 1:
        raise ValueError(f'找不到唯一的专题接入位置：{original}')
    return source.replace(original, replacement, 1)


def template(source, topic, page, theme, index_route):
    title = re.search(r'<title>(.*?)</title>', source).group(1)
    if '乐学堂' not in title:
        title += ' · 乐学堂'
    [(attrs, content)] = MAIN.findall(source)
    if topic == 'geo':
        title = title.replace('地理知识精讲', '地理小课堂')
        content = replace_once(content, '>地理知识精讲</h1>', '>地理小课堂</h1>')
    if (topic, page) == ('history-timeline', 'dynasties'):
        anchor = '<div class="cal-quiz" id="cal-quiz" aria-label="练一练"></div>'
        content = replace_once(content, anchor, CALENDAR_AUDIO + '\n        ' + anchor)
    if topic == 'geo-map' and page in ('china', 'world'):
        anchor = '<p class="gm-layer-hint" id="gm-layer-hint"></p>'
        link = """<a class="study-map-tool" href="{% url 'geography-study' %}#lesson-gu2-3">地图三要素与比例尺 →</a>"""
        content = replace_once(content, anchor, anchor + '\n        ' + link)
    assets = []
    for path in HEAD_ASSET.findall(source.split('</head>', 1)[0]):
        if path == 'platform-theme.css':
            continue
        asset_url = "{% static 'study_topics/" + topic + '/' + path + "' %}"
        if path.endswith('.css'):
            assets.append(f'<link rel="stylesheet" href="{asset_url}">')
        else:
            assets.append(f'<script src="{asset_url}" defer></script>')

    if theme:
        attrs = attrs.replace(' id="main"', '').replace(' tabindex="-1"', '')
        footer = re.search(r'<footer\b([^>]*)>(.*?)</footer>', source, re.DOTALL)
        local_nav = f'<div{footer[1]}>{footer[2]}</div>' if footer else ''
        content = f'<div class="{theme}">\n<div{attrs}>{content}</div>\n{local_nav}\n</div>'
        content = content.replace('href="index.html"', 'href="{% url \'' + index_route + '\' %}"')

    return '\n'.join([
        '{% extends "study_topics/page.html" %}',
        '{% load static %}',
        '{# 由 scripts/build_study_topics.py 生成。 #}',
        '{% block title %}' + title + '{% endblock %}',
        '{% block study_assets %}',
        *assets,
        '{% endblock %}',
        '{% block study_content %}',
        re.sub(r'[ \t]+$', '', content.strip('\n'), flags=re.MULTILINE),
        '{% endblock %}',
        '',
    ])


def scope_styles(source, theme):
    if theme == 'study-atlas':
        return source[source.index('.gm-topic {'):]
    tokens = re.search(r':root \{(.*?)\}', source, re.DOTALL).group(1)
    styles = source[source.index('.tl-shell {'):]
    return f'.{theme} {{{tokens}}}\n\n' + styles.replace('  html { scroll-behavior: auto; }\n', '')


def resolve_media_from_script(source, item):
    original = f'esc({item}.src)'
    if original not in source:
        raise ValueError(f'找不到待转换的素材路径：{original}')
    return source.replace(
        "  'use strict';",
        "  'use strict';\n  const mediaBase = new URL('.', document.currentScript.src);",
        1,
    ).replace(original, f'esc(new URL({item}.src, mediaBase).href)')


def course_app(source, topic):
    global_name = COURSE_GLOBALS.get(topic, topic.upper())
    source = replace_once(source, "'use strict';", f"""'use strict';

{global_name}.units.forEach(unit => {{
  unit.points = unit.points.map(window.StudyTopicConnections.lesson);
}});""")
    source = replace_once(source, "  parts.push('</article>');", """  parts.push(window.StudyTopicConnections.references(p.id, '接着学'));
  parts.push('</article>');""")
    source = replace_once(source, "    else if (act === 'home') { e.preventDefault(); window.location.href = 'index.html'; }\n", '')
    if topic == 'astro':
        return replace_once(source, '  if (pp) {', '  if (pp && p.showPhoto !== false) {')
    if topic == 'lit':
        source = replace_once(source, "'use strict';", "'use strict';\nconst courseAssets = new URL('.', document.currentScript.src);")
        for field in ('p.img', 'u.hero'):
            source = replace_once(source, f'esc({field})', f'esc(new URL({field}, courseAssets).href)')
    return source


def evolution_chars_module(data_source):
    """从汉字演变馆数据里取全部选字，生成 hanzi 应用反链用的字集模块。"""
    chars = re.findall(r"char: '(.)',", data_source)
    if len(chars) != 100 or len(set(chars)) != 100:
        raise ValueError(f'汉字演变馆应有 100 个不重复选字，当前 {len(chars)}。')
    return (
        '# 由 scripts/build_study_topics.py 生成，请勿手改。'
        '来源：content_sources/hanzi-evo-data.js。\n'
        'CHARS = frozenset(' + repr(''.join(chars)) + ')\n'
    )


def course_outputs():
    for topic in COURSES:
        dest = STATIC / topic
        data = (SOURCE / f'{topic}-data.js').read_text(encoding='utf-8')
        yield dest / f'{topic}-data.js', data.encode('utf-8')
        source = (SOURCE / f'{topic}-app.js').read_text(encoding='utf-8')
        yield dest / f'{topic}-app.js', course_app(source, topic).encode('utf-8')
        figures = f'{topic}-figures.js'
        yield dest / figures, (SOURCE / figures).read_bytes()
        styles = (SOURCE / f'{topic}.css').read_text(encoding='utf-8')
        styles = styles.replace('  body { background:', '  .study-course .study-page { background:')
        yield dest / f'{topic}.css', styles.encode('utf-8')
        for path in sorted(set(COURSE_IMAGE.findall(data))):
            yield dest / path, (SOURCE / path).read_bytes()
        if topic == 'hanzi-evo':
            yield EVOLUTION_CHARS, evolution_chars_module(data).encode('utf-8')
        if topic == 'astro':
            photos = (SOURCE / 'astro-photos.js').read_text(encoding='utf-8')
            photos = replace_once(photos, "'images/astro/'", "new URL('images/astro/', document.currentScript.src).href")
            yield dest / 'astro-photos.js', photos.encode('utf-8')
            for path in sorted((SOURCE / 'images' / 'astro').glob('*.jpg')):
                yield dest / path.relative_to(SOURCE), path.read_bytes()


def geometry_lab_data():
    content = (SOURCE / 'geometry-lab.json').read_bytes()
    modes = json.loads(content)
    if not isinstance(modes, dict) or tuple(modes) != ('translation', 'rotation', 'reflection'):
        raise ValueError('图形运动实验室需按顺序提供平移、旋转和轴对称。')
    text_fields = ('label', 'action', 'instruction', 'observation', 'example', 'task', 'success', 'hint')
    for name, mode in modes.items():
        if not isinstance(mode, dict) or set(mode) != {*text_fields, 'target'}:
            raise ValueError(f'图形运动实验室字段有误：{name}')
        for field in text_fields:
            value = mode[field]
            if not isinstance(value, str) or not value.strip() or any(char in value for char in '"\r\n'):
                raise ValueError(f'图形运动实验室文案有误：{name}.{field}')
    shift, angle, axis = (mode['target'] for mode in modes.values())
    if not (
        isinstance(shift, list) and len(shift) == 2
        and all(type(count) is int for count in shift)
        and -2 <= shift[0] <= 12 and -2 <= shift[1] <= 4
        and type(angle) is int and -180 <= angle <= 180
        and axis in ('vertical', 'horizontal')
    ):
        raise ValueError('图形运动实验室的挑战目标超出操作范围。')
    return content


def outputs():
    for topic, (theme, index_route, pages) in TOPICS.items():
        source_dir = SOURCE / topic
        for name in pages:
            path = source_dir / f'{name}.html'
            content = template(path.read_text(encoding='utf-8'), topic, name, theme, index_route)
            yield TEMPLATES / topic / path.name, content.encode('utf-8')

        resources = sorted([
            *source_dir.glob('*.js'), *source_dir.glob('*.css'), *source_dir.glob('*-SOURCES.md'),
            *(
                path for path in (source_dir / 'assets').rglob('*')
                if path.is_file() and not path.name.startswith('.')
                and path.name != 'favicon.svg' and path.parent.name != 'icons'
            ),
        ])
        for path in resources:
            if path.name == 'platform-theme.css':
                continue
            content = path.read_bytes()
            if path.name == 'styles.css' and theme:
                content = scope_styles(content.decode('utf-8'), theme).encode('utf-8')
            media_item = MEDIA_RENDERERS.get((topic, path.name))
            if media_item:
                content = resolve_media_from_script(content.decode('utf-8'), media_item).encode('utf-8')
            hooks = SCRIPT_HOOKS.get((topic, path.name))
            if hooks:
                script = content.decode('utf-8')
                for original, replacement in hooks:
                    script = replace_once(script, original, replacement)
                content = script.encode('utf-8')
            yield STATIC / topic / path.relative_to(source_dir), content
    yield from course_outputs()
    yield PROJECT / 'mathbook' / 'data' / 'geometry-lab.json', geometry_lab_data()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='只核对生成文件是否与来源一致')
    args = parser.parse_args()
    changes = 0
    files = list(outputs())
    for path, content in files:
        if path.is_file() and path.read_bytes() == content:
            continue
        changes += 1
        if args.check:
            print(f'需要同步：{path.relative_to(PROJECT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if args.check and changes:
        raise SystemExit(1)
    print(f'专题共 {len(files)} 个文件，需同步 {changes} 个。')


if __name__ == '__main__':
    main()
