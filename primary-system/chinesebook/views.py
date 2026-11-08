"""语文教材册：零模型只读浏览，按册编排（照 mathbook 先例）。

``/chinesebook/`` 是册次列表——点教材卡先看到可选册次，再进具体册页；
``/chinesebook/<册>/`` 是册页，内容与交互全在前端（knowledge-app.js +
books/<册>.js），视图只做加载期校验并把结构摘要交给页面文案；GET 不写记录。
"""
import re

from django.http import Http404
from django.shortcuts import render
from django.templatetags.static import static as static_url
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .content import available_books, book_exists, load_book

# 教材名拆横幅：'人教版（统编版·新课标）语文四年级上册' → 学科段 + 册次段。
VOLUME_RE = re.compile(r'^(.+?)([一二三四五六\d]+年级[上下]册)$')


@never_cache
@require_safe
def index(request):
    return render(request, 'chinesebook/book_list.html', {'books': available_books()})


@never_cache
@require_safe
def reader(request, book):
    if not book_exists(book):
        raise Http404('未注册的教材册次。')
    data = load_book(book)
    manifest, kb = data['manifest'], data['kb']
    match = VOLUME_RE.match(kb.get('textbook', ''))
    # 数据文件版本号取来源内容 sha256 前 8 位：源头变了缓存自动失效。
    data_src = static_url(f'chinesebook/books/{book}.js') + f"?v={manifest['source_sha256'][:8]}"
    return render(request, 'chinesebook/reader.html', {
        'book': book,
        'data_src': data_src,
        'textbook': kb.get('textbook', ''),
        'edition': kb.get('edition', ''),
        'banner_subject': match.group(1) if match else kb.get('textbook', ''),
        'banner_volume': match.group(2) if match else '',
        'unit_total': manifest['units'],
        'lesson_total': manifest['lessons'],
        'poem_total': manifest['poems'],
    })
