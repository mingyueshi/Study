"""抽题、判分落库、错题本与统计口径。

练习页一次抽一组题（领域筛选 + 数量），逐题作答、逐题 POST 判分。错题本
取「最近一次作答答错」的题——重练答对后自动退出错题本。数字口径各自
含义明确：答题数、答对数、按学科分计，不合成跨学科掌握百分比。
"""
from datetime import timedelta
import random

from django.db.models import Count, Q
from django.utils import timezone

from . import types
from .models import AnswerRecord, Question

SIZES = (5, 10, 20)
DEFAULT_SIZE = 10


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
    item = {'uuid': str(question.uuid), 'type': question.type,
            'area': question.area, 'stem': question.stem, 'tags': question.tags or []}
    if question.type == 'choice':
        item['options'] = question.payload.get('options', [])
    elif question.type == 'selfcheck':
        item['answer'] = question.payload.get('answer', '')
        item['steps'] = question.payload.get('steps', '')
    return item


def latest_wrong_ids(scope, limit=None):
    """错题本口径：每人每题取最近一次作答，答错的进入错题列表（新错在前）。"""
    if not scope:
        return []
    records = AnswerRecord.objects.filter(**scope).order_by('-created_at').only('id', 'question_id', 'correct')
    latest = {}
    for record in records:
        latest.setdefault(record.question_id, record.correct)
    wrong = [question_id for question_id, correct in latest.items() if not correct]
    return wrong[:limit] if limit else wrong


def record_answer(question, given, owner):
    """判分并落一条作答记录；given 形状不合法由 types.judge 抛 InvalidAnswer。"""
    correct = types.judge(question.type, question.payload, given)
    record = AnswerRecord.objects.create(
        question=question, given=given or {}, correct=correct, **owner)
    return record, {
        'correct': correct,
        'reveal': types.reveal(question.type, question.payload),
        'explanation': question.payload.get('explanation', ''),
        'steps': question.payload.get('steps', ''),
    }


def owner_summary(scope, track=''):
    """主页统计卡数字：答题数、答对数、本周新增（只读路径，不建会话）。

    track 给定时经题目 FK 只统计该轨别的作答。"""
    if not scope:
        return {'answered': 0, 'correct': 0, 'week': 0, 'areas': {}}
    rows = AnswerRecord.objects.filter(**scope)
    if track in Question.Track.values:
        rows = rows.filter(question__track=track)
    week_cutoff = timezone.now() - timedelta(days=7)
    return {
        'answered': rows.count(),
        'correct': rows.filter(correct=True).count(),
        'week': rows.filter(created_at__gte=week_cutoff).count(),
        'areas': area_counts(rows),
    }


def track_wrong_ids(scope, track):
    """错题池 ∩ 轨别：错题重练与各入口的错题条都按轨别取子集。"""
    wrong_ids = latest_wrong_ids(scope)
    if not wrong_ids:
        return []
    return list(Question.objects.filter(pk__in=wrong_ids, track=track, active=True)
                .values_list('id', flat=True))


def tag_counts(track):
    """某轨别在库题目的标签计数：[(tag, count), …]，按数量降序、同数按名排。"""
    counter = {}
    for tags in Question.objects.filter(active=True, track=track).values_list('tags', flat=True):
        for tag in tags or []:
            counter[tag] = counter.get(tag, 0) + 1
    return sorted(counter.items(), key=lambda item: (-item[1], item[0]))


def area_counts(answer_rows):
    """按学科分计答题与答对：返回 {area: {'answered', 'correct'}}。"""
    grouped = (answer_rows.values('question__area')
               .annotate(total=Count('id'), right=Count('id', filter=Q(correct=True))))
    return {row['question__area']: {'answered': row['total'], 'correct': row['right']}
            for row in grouped}
