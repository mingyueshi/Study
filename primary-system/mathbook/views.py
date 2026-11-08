"""数学教材册：零模型只读浏览，按册编排（照 grammar 先例）。

``/mathbook/`` 是册次列表——点教材卡先看到可选册次，再进具体册页；
``/mathbook/<册>/`` 是册页，内容与交互全在前端（math-app.js + books/<册>.js），
视图只做加载期校验并把结构摘要交给页面文案；GET 不写任何记录。
"""
from django.http import Http404
from django.shortcuts import render
from django.templatetags.static import static as static_url
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .content import available_books, book_exists, load_book


@never_cache
@require_safe
def index(request):
    return render(request, 'mathbook/book_list.html', {'books': available_books()})


@never_cache
@require_safe
def reader(request, book):
    if not book_exists(book):
        raise Http404('未注册的教材册次。')
    data = load_book(book)
    manifest, mkb = data['manifest'], data['mkb']
    # 数据文件版本号取来源内容 sha256 前 8 位：源头变了缓存自动失效。
    data_src = static_url(f'mathbook/books/{book}.js') + f"?v={manifest['source_sha256'][:8]}"
    return render(request, 'mathbook/reader.html', {
        'book': book,
        'data_src': data_src,
        'textbook': mkb.get('textbook', ''),
        'meta': mkb.get('meta', {}),
        'unit_total': manifest['units'],
        'point_total': manifest['points'],
    })
