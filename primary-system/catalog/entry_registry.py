"""玩法模块入口注册表。

教材内容走固定的目录编排，落地在「目录中转页 + 学习册列表」；玩法模块
（接龙 / 场景单词 / 音标 / 作文坊）的入口是各自应用的独立页面，首页卡片
一次直达。这里集中登记每个玩法的 URL 名、卡片徽标、落地页说明和「学习摘要」
口径，避免在目录视图与模板里散落硬编码特判。

学习摘要只汇总各自含义明确的指标——掌握单词数、完成对局数、草稿数、本周
新增——不把不同类型的玩法合成一个百分比。每个玩法另配一个 recent 收集器，
输出统一形状的「最近学习行」，由 ``catalog.learning_digest`` 与教材、成语
小游戏、飞花令、多音字的适配函数合并成学习动态流。音标精讲只读浏览，暂无
专属进度模型，摘要返回 None、无 recent。
"""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone


def _chain_summary(user):
    from chain.models import GameRound
    rounds = GameRound.objects.filter(user=user)
    finished = rounds.filter(status=GameRound.Status.FINISHED)
    return {'games': rounds.count(), 'finished': finished.count(),
            'best_score': finished.order_by('-score').values_list('score', flat=True).first() or 0,
            'week': finished.filter(finished_at__gte=timezone.now() - timedelta(days=7)).count()}


def _chain_recent(user, limit=8):
    from chain.models import GameRound
    rows = GameRound.objects.filter(user=user, status=GameRound.Status.FINISHED)[:limit]
    return [{'title': '成语接龙',
             'note': ('战胜小龙 · ' if row.ended_reason == GameRound.EndedReason.PARTNER_STUCK else '本局结束 · ') + f'{row.score} 分',
             'when': row.finished_at or row.updated_at, 'url': reverse('chain')}
            for row in rows]


def _words_summary(user):
    from words.models import WordProgress
    rows = WordProgress.objects.filter(user=user)
    return {'learned': rows.filter(learned=True).count(), 'seen': rows.count(),
            'week': rows.filter(learned=True, updated_at__gte=timezone.now() - timedelta(days=7)).count()}


def _words_recent(user, limit=8):
    from words.models import WordProgress
    rows = WordProgress.objects.filter(user=user).select_related('target')[:limit]
    return [{'title': row.target.label,
             'note': '场景单词 · 已掌握' if row.learned else '场景单词 · 学过',
             'when': row.updated_at, 'url': reverse('scenario-words')}
            for row in rows]


def _writing_summary(user):
    from writing.models import WritingDraft
    rows = WritingDraft.objects.filter(user=user)
    return {'drafts': rows.count(),
            'week': rows.filter(updated_at__gte=timezone.now() - timedelta(days=7)).count()}


def _writing_recent(user, limit=8):
    from writing.models import WritingDraft
    rows = WritingDraft.objects.filter(user=user)[:limit]
    return [{'title': row.title or row.topic_title or '无题草稿',
             'note': '作文坊 · 草稿', 'when': row.updated_at, 'url': reverse('writing')}
            for row in rows]


def _phonetics_summary(user):
    return None


ENTRIES = {
    'chain': {
        'route_name': 'chain',
        'tag': '去接龙 →',
        'headline': '成语接龙已开始',
        'blurb': '和小龙轮流接龙：用上一个成语的最后一个字接新成语的开头，接不上为止。对局、计分和提示都保存在你的账号下。',
        'button': '进入接龙',
        'learning_summary': _chain_summary,
        'recent': _chain_recent,
    },
    'words': {
        'route_name': 'scenario-words',
        'tag': '开始认词 →',
        'headline': '场景单词已开始',
        'blurb': '46 个生活场景、577 个单词：点一点听发音，跟读拆分记忆，标记已掌握的词。掌握进度跟着你的账号走。',
        'button': '进入场景单词',
        'learning_summary': _words_summary,
        'recent': _words_recent,
    },
    'phonetics': {
        'route_name': 'phonetics',
        'tag': '开始学音标 →',
        'headline': '音标学习已开始',
        'blurb': '看口型要点、听例词，把 44 个音素一个个读准。音标页只读浏览，不记学习进度。',
        'button': '进入音标',
        'learning_summary': _phonetics_summary,
    },
    'writing': {
        'route_name': 'writing',
        'tag': '打开作文坊 →',
        'headline': '作文坊已开始',
        'blurb': '打开写作锦囊，写自己的故事。草稿自动保存，跟着你的账号走。',
        'button': '进入作文坊',
        'learning_summary': _writing_summary,
        'recent': _writing_recent,
    },
}


def entry_for(code):
    """玩法模块入口；教材模块（knowledge/math/english）返回 None，走目录中转页。"""
    return ENTRIES.get(code)


def learning_overview(user):
    """登录用户的玩法学习摘要；没有专属进度口径的玩法（音标）不出现。"""
    overview = {}
    for code, entry in ENTRIES.items():
        summary = entry['learning_summary'](user)
        if summary is not None:
            overview[code] = summary
    return overview


def recent_activity(user, limit=8):
    """各玩法的最近学习行，供总览「最近学了什么」与教材等行合并。"""
    rows = []
    for entry in ENTRIES.values():
        collector = entry.get('recent')
        if collector:
            rows.extend(collector(user, limit))
    return rows
