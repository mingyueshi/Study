from functools import lru_cache

from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from django.utils.crypto import salted_hmac

from .content import available_books, load_book
from .models import BookProgress


def account_scope(user):
    return salted_hmac('mathbook.progress', f'{user.pk}:{user.date_joined.isoformat()}').hexdigest()


@lru_cache(maxsize=16)
def book_index(book):
    units = load_book(book)['mkb']['units']
    return ({unit['id']: unit for unit in units},
            {point['id']: unit['id'] for unit in units for point in unit['points']})


def read_progress(user, book):
    return BookProgress.objects.filter(user=user, book=book).first() or BookProgress(user=user, book=book)


def payload(row):
    units, points = book_index(row.book)
    return {
        'read_points': sorted({point for point in row.read_points if point in points}),
        'learned': sorted({point for point in row.learned if point in points}),
        'last_unit': row.last_unit if row.last_unit in units else '',
        'local_imported': row.local_imported,
        'revision': row.revision,
    }


def validate_change(book, data):
    if not isinstance(data, dict) or type(data.get('revision')) is not int or data['revision'] < 0:
        raise ValueError('进度版本有误，请刷新页面。')
    units, points = book_index(book)
    action = data.get('action')
    if action in ('read', 'learn'):
        point = data.get('point')
        flag = 'read' if action == 'read' else 'learned'
        if not isinstance(point, str) or point not in points or type(data.get(flag)) is not bool:
            raise ValueError('找不到这个知识点，或学习标记有误。')
    elif action == 'resume':
        unit = data.get('unit')
        if not isinstance(unit, str) or unit not in units:
            raise ValueError('找不到这个单元。')
    elif action == 'import':
        learned, unit = data.get('learned'), data.get('unit')
        read_points = data.get('read_points', [])
        if (any(not isinstance(marks, list) or len(marks) > len(points)
                or any(not isinstance(point, str) or point not in points for point in marks)
                for marks in (learned, read_points))
                or not isinstance(unit, str) or (unit and unit not in units)
                or not (learned or read_points or unit)):
            raise ValueError('这份本机进度读不出来。')
    else:
        raise ValueError('无法保存这次操作。')


@transaction.atomic
def save_progress(user, book, data):
    # 与教材进度写入一致，先锁账号以串行化尚未创建册次记录时的并发写入。
    get_user_model().objects.select_for_update().get(pk=user.pk)
    row = read_progress(user, book)
    if data['revision'] != row.revision or (data['action'] == 'import' and row.local_imported):
        return row, False

    before = (row.read_points, row.learned, row.last_unit, row.local_imported)
    action = data['action']
    if action in ('read', 'learn'):
        point = data['point']
        flag, field = ('read', 'read_points') if action == 'read' else ('learned', 'learned')
        marks = set(getattr(row, field))
        if data[flag]:
            marks.add(point)
        else:
            marks.discard(point)
        setattr(row, field, sorted(marks))
        row.last_unit = book_index(book)[1][point]
    elif action == 'resume':
        row.last_unit = data['unit']
    else:
        row.read_points = sorted(set(row.read_points).union(data.get('read_points', [])))
        row.learned = sorted(set(row.learned).union(data['learned']))
        if row.last_unit not in book_index(book)[0]:
            row.last_unit = data['unit']
        row.local_imported = True
    if (row.read_points, row.learned, row.last_unit, row.local_imported) != before:
        row.revision += 1
        row.save()
    return row, True


def learning_summary(user):
    books = {item['book']: item for item in available_books()}
    rows = BookProgress.objects.filter(user=user, book__in=books).order_by('-updated_at', '-pk')
    read = learned = 0
    recent = []
    for row in rows:
        state = payload(row)
        read += len(state['read_points'])
        learned += len(state['learned'])
        unit = state['last_unit']
        if unit:
            book = books[row.book]
            meta = book['meta']
            label = meta.get('grade', '') + meta.get('volume', '') or book['textbook']
            recent.append({
                'title': f"{label} · {book_index(row.book)[0][unit]['name']}",
                'note': '数学教材 · 上次学到这里', 'when': row.updated_at,
                'url': reverse('mathbook-book', args=[row.book], fragment=unit),
            })
    return {'read': read, 'learned': learned, 'total': sum(book['points'] for book in books.values()), 'recent': recent}
