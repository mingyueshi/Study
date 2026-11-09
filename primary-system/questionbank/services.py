"""抽题、判分落库、错题本与统计口径。

练习页一次抽一组题（领域筛选 + 数量），逐题作答、逐题 POST 判分。错题本
取「最近一次作答答错」的题——重练答对后自动退出错题本。数字口径各自
含义明确：答题数、答对数、按学科分计，不合成跨学科掌握百分比。
"""
from datetime import timedelta
import random
from uuid import uuid4

from django.db.models import Count, Q
from django.http import Http404
from django.utils import timezone

from . import types
from .models import AnswerRecord, Question

SIZES = (5, 10, 20)
DEFAULT_SIZE = 10
SELF_CHECK = Q(question__type=Question.Type.SELFCHECK)


class AttemptConflict(Exception):
    """同一个作答标识已用于另一份提交。"""


def pick_questions(*, area='', track='', count=DEFAULT_SIZE, ids=None, tag=''):
    """按轨别与学科抽题：active 且可选轨别、领域过滤；ids 用于错题重练等限定池。

    标签过滤在 Python 侧完成：JSON 数组包含查找仅 PostgreSQL 支持，而题库
    规模可控，先取整池再按标签筛选后随机取样。"""
    rows = Question.objects.filter(active=True)
    if track in Question.Track.values:
        rows = rows.filter(track=track)
    if area in Question.Area.values:
        rows = rows.filter(area=area)
    if ids is not None:
        rows = rows.filter(pk__in=ids)
    if tag:
        pool = [question for question in rows if tag in (question.tags or [])]
        return pool if len(pool) <= count else random.sample(pool, count)
    return list(rows.order_by('?')[:count])


def client_question(question):
    """练习页内嵌给前端的题目形状。

    选择/判断题不带答案与解析，判分走服务端；自评题的答案与思路本来就是
    给孩子对照用的，直接内嵌（与多音字页内嵌读音表同思路）。
    """
    item = {'uuid': str(question.uuid), 'attempt_id': str(uuid4()), 'type': question.type,
            'area': question.area, 'stem': question.stem, 'tags': question.tags or []}
    if question.type == 'choice':
        item['options'] = question.payload.get('options', [])
    elif question.type == 'selfcheck':
        item['answer'] = question.payload.get('answer', '')
        item['steps'] = question.payload.get('steps', '')
    return item


def grammar_pool(chapter_id):
    """用讲义的知识点编号限定题池，避免按题干或标签猜测章节。"""
    from grammar.catalog import SOURCE_CODE, chapters_with_lessons

    chapter = next((item for item in chapters_with_lessons() if item['id'] == chapter_id), None)
    if chapter is None:
        raise Http404('找不到这一章语法。')
    refs = [f"grammar:{lesson['id']}:quiz" for lesson in chapter['lessons']]
    ids = Question.objects.filter(
        active=True, track=Question.Track.REGULAR, area=Question.Area.ENGLISH,
        source_key=SOURCE_CODE, source_ref__in=refs,
    ).values_list('pk', flat=True)
    return chapter, ids


def latest_wrong_ids(scope, limit=None, *, track='', ids=None):
    """可重练的错题：只看仍启用的题，每题取最近一次作答。"""
    if not scope:
        return []
    records = AnswerRecord.objects.filter(question__active=True, **scope)
    if track in Question.Track.values:
        records = records.filter(question__track=track)
    if ids is not None:
        records = records.filter(question_id__in=ids)
    latest = {}
    for question_id, correct in records.order_by('-created_at', '-pk').values_list('question_id', 'correct').iterator():
        latest.setdefault(question_id, correct)
    wrong = [question_id for question_id, correct in latest.items() if not correct]
    return wrong[:limit] if limit else wrong


def record_answer(question, given, owner, attempt_id=None, *, request=None):
    """判分并落一条作答记录；given 形状不合法由 types.judge 抛 InvalidAnswer。"""
    correct = types.judge(question.type, question.payload, given)
    values = {'question': question, 'given': given, 'correct': correct, **owner}
    if attempt_id is None:
        record, created = AnswerRecord.objects.create(**values), True
    else:
        record, created = AnswerRecord.objects.get_or_create(attempt_id=attempt_id, defaults=values)
        if (record.question_id != question.pk or record.given != given
                or record.user_id != getattr(owner.get('user'), 'pk', None)
                or record.guest_key != owner.get('guest_key', '')):
            raise AttemptConflict('这次作答已经提交。请刷新后再练习。')
    if created and record.correct and request is not None and request.user.is_authenticated:
        from incentives.services import record_event
        record_event(request.user, 'questionbank_correct', request=request)
    return record, {
        'correct': record.correct,
        'reveal': types.reveal(question.type, question.payload),
        'explanation': question.payload.get('explanation', ''),
        'steps': question.payload.get('steps', ''),
    }


def owner_summary(scope, track=''):
    """主页统计卡数字：答题数、答对数、本周新增（只读路径，不建会话）。

    track 给定时经题目 FK 只统计该轨别的作答。"""
    rows = AnswerRecord.objects.filter(**scope) if scope else AnswerRecord.objects.none()
    if track in Question.Track.values:
        rows = rows.filter(question__track=track)
    return {**answer_counts(rows), 'areas': area_counts(rows)}


def answer_counts(rows):
    return rows.aggregate(
        answered=Count('pk'),
        correct=Count('pk', filter=Q(correct=True) & ~SELF_CHECK),
        selfchecked=Count('pk', filter=SELF_CHECK),
        week=Count('pk', filter=Q(created_at__gte=timezone.now() - timedelta(days=7))),
    )


def track_wrong_ids(scope, track):
    """错题池 ∩ 轨别：错题重练与各入口的错题条都按轨别取子集。"""
    return latest_wrong_ids(scope, track=track) if track in Question.Track.values else []


def tag_counts(track):
    """某轨别在库题目的标签计数：[(tag, count), …]，按数量降序、同数按名排。"""
    counter = {}
    for tags in Question.objects.filter(active=True, track=track).values_list('tags', flat=True):
        for tag in tags or []:
            counter[tag] = counter.get(tag, 0) + 1
    return sorted(counter.items(), key=lambda item: (-item[1], item[0]))


def area_counts(answer_rows):
    """按学科分计作答、客观答对和自评次数。"""
    grouped = (answer_rows.values('question__area')
               .annotate(total=Count('id'), right=Count('id', filter=Q(correct=True) & ~SELF_CHECK),
                         selfchecked=Count('id', filter=SELF_CHECK)))
    return {row['question__area']: {'answered': row['total'], 'correct': row['right'],
                                  'selfchecked': row['selfchecked']}
            for row in grouped}
