"""Read versioned topic data and report unavailable course content."""
import json
import logging
from functools import wraps

from django.conf import settings
from django.shortcuts import render

logger = logging.getLogger(__name__)


class ContentError(ValueError):
    pass


def content_page(title, *, error_type=ContentError):
    def decorate(view):
        @wraps(view)
        def page(request, *args, **kwargs):
            try:
                return view(request, *args, **kwargs)
            except error_type as error:
                logger.error('%s：%s', title, error)
                return render(request, 'study_topics/content_unavailable.html', {'title': title}, status=503)
        return page
    return decorate


def read_course(filename):
    source = settings.BASE_DIR / 'content_sources' / filename
    try:
        course = json.loads(source.read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        raise ContentError(f'{filename} 读取失败：{error}') from error
    if not isinstance(course, dict) or type(course.get('schema_version')) is not int or course['schema_version'] != 1:
        raise ContentError(f'{filename} 的数据版本不受支持。')
    return course


def choice_label(item):
    choices = item.get('choices')
    answer = item.get('answer')
    if isinstance(choices, list) and isinstance(answer, str) and answer:
        labels = [choice.get('label') for choice in choices if isinstance(choice, dict) and choice.get('id') == answer]
        if len(labels) == 1 and isinstance(labels[0], str) and labels[0].strip():
            return labels[0]
    raise ContentError(f'{item.get("id")} 的正确选项无效。')
