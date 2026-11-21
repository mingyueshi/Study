"""标点专题采用文件编排，练习仅在当前浏览器按账号保存。"""
import json
import logging
import re
from hashlib import sha256

from django.conf import settings
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from catalog.file_content import ContentError, content_page, read_course

logger = logging.getLogger(__name__)
PUNCTUATION = re.compile(r'[，。？！、；：“”‘’《》（）—…]*')


def prepare_questions(course):
    ids = {}
    for field in ('groups', 'levels', 'marks'):
        rows = course.get(field)
        if not isinstance(rows, list) or not rows or any(
            not isinstance(row, dict) or not isinstance(row.get('id'), str) for row in rows
        ):
            raise ContentError(f'标点符号实验室的 {field} 数据无效。')
        ids[field] = {row['id'] for row in rows}

    questions = course.get('questions')
    if not isinstance(questions, list) or not questions:
        raise ContentError('标点符号实验室缺少练习题。')
    for question in questions:
        if not isinstance(question, dict):
            raise ContentError('标点练习题的格式无效。')
        question_id = question.get('id')
        chunks, answers = question.get('chunks'), question.get('answers')
        if (
            not isinstance(chunks, list) or len(chunks) < 2 or any(not isinstance(chunk, str) for chunk in chunks)
            or not isinstance(answers, list) or not answers
            or any(
                not isinstance(answer, list) or len(answer) != len(chunks) - 1
                or any(not isinstance(token, str) or not PUNCTUATION.fullmatch(token) for token in answer)
                for answer in answers
            )
        ):
            raise ContentError(f'{question_id} 的标点答案格式无效。')
        group, level, marks = question.get('group'), question.get('level'), question.get('mark_ids')
        if (
            not isinstance(group, str) or group not in ids['groups']
            or not isinstance(level, str) or level not in ids['levels']
            or not isinstance(marks, list) or not marks
            or any(not isinstance(mark, str) or mark not in ids['marks'] for mark in marks)
        ):
            raise ContentError(f'{question_id} 的分组、层次或标点引用无效。')
        question['revision'] = sha256(json.dumps(question, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
        question['references'] = [
            ''.join(chunk + token for chunk, token in zip(chunks, [*answer, ''], strict=True))
            for answer in answers
        ]


@never_cache
@require_safe
@content_page('标点符号实验室')
def laboratory(request):
    course = read_course('punctuation.json')
    prepare_questions(course)
    view = request.GET.get('view', 'usage')
    if view not in ('usage', 'errors', 'practice'):
        view = 'usage'
    assets = {}
    for suffix in ('css', 'js'):
        path = f'study_topics/punctuation.{suffix}'
        try:
            content = (settings.BASE_DIR / 'static' / path).read_bytes()
        except OSError as error:
            logger.warning('标点符号实验室资源不可用：%s', error)
            continue
        assets[suffix] = {'path': path, 'version': sha256(content).hexdigest()[:12]}
    return render(request, 'study_topics/punctuation.html', {
        'study_area': 'chinese', 'course': course, 'view': view, 'assets': assets,
    })
