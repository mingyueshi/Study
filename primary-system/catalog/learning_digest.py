"""全学科学习总览聚合：各领域学了多少、最近学了什么。

口径约定（延续 docs/system-design.md 的 P1）：每个领域只展示自己含义明确的
指标，不把「读完内容」「会拼写」「玩了一局」合成一个掌握百分比。教材与玩法
的数字口径在各自应用里（``learning.services.textbook_summary``、
``catalog.entry_registry``、``idioms/poetry/hanzi`` 的 ``records``），这里只做
两件事：把数字装配成总览卡，把各应用的「最近学习行」按时间合并成动态流。
纯代码注册，新增领域时在 ``AREA_CARDS`` 加一个装配函数即可。
"""
from django.urls import reverse

from .entry_registry import ENTRIES, learning_overview, recent_activity


def _latest(rows):
    return rows[0] if rows else None


def _entry_latest(code, user):
    """玩法最近一条学习行：直接取该玩法注册的 recent 收集器。"""
    collector = ENTRIES[code].get('recent')
    return _latest(collector(user, 1)) if collector else None


def _week_text(count, unit):
    return f'本周{unit}{count}' if count else ''


def _textbook_card(user, _overview):
    from learning.services import textbook_recent, textbook_summary

    summary = textbook_summary(user)
    return {
        'key': 'textbook', 'name': '教材学习', 'icon': 'book', 'color': 'chinese',
        'url': reverse('my-learning'), 'url_label': '查看学习足迹 →',
        'headlines': [(summary['started'], '开始学习'), (summary['mastered'], '已经掌握'),
                      (summary['bookmarked'], '我的收藏')],
        'week': _week_text(summary['week'], '学过 '),
        'footnote': ' · '.join(f'{name} {count}' for name, count in summary['subjects'][:3]),
        'latest': _latest(textbook_recent(user, 1)),
    }


def _words_card(user, overview):
    summary = overview.get('words')
    if not summary:
        return None
    return {
        'key': 'words', 'name': '场景单词', 'icon': 'english', 'color': 'english',
        'url': reverse('scenario-words'),
        'url_label': '去继续认词 →' if summary['seen'] else '去认几个词 →',
        'headlines': [(summary['learned'], '已掌握'), (summary['seen'], '学过')],
        'week': _week_text(summary['week'], '新掌握 '),
        'footnote': '',
        'latest': _entry_latest('words', user),
    }


def _chain_card(user, overview):
    summary = overview.get('chain')
    if not summary:
        return None
    return {
        'key': 'chain', 'name': '成语接龙', 'icon': 'dragon', 'color': 'history',
        'url': reverse('chain'),
        'url_label': '去继续接龙 →' if summary['games'] else '去接一局 →',
        'headlines': [(summary['finished'], '完成对局'), (summary['best_score'], '最高分')],
        'week': _week_text(summary['week'], '完成 '),
        'footnote': '',
        'latest': _entry_latest('chain', user),
    }


def _writing_card(user, overview):
    summary = overview.get('writing')
    if not summary:
        return None
    return {
        'key': 'writing', 'name': '作文坊', 'icon': 'writing', 'color': 'science',
        'url': reverse('writing'),
        'url_label': '去继续写 →' if summary['drafts'] else '去写一篇 →',
        'headlines': [(summary['drafts'], '草稿')],
        'week': _week_text(summary['week'], '动过笔 '),
        'footnote': '',
        'latest': _entry_latest('writing', user),
    }


def _idioms_card(user, _overview):
    from idioms.records import learning_summary, recent

    summary = learning_summary(user)
    rounds = summary['pairs_rounds'] + summary['emoji_rounds']
    return {
        'key': 'idioms', 'name': '成语挑战', 'icon': 'idioms', 'color': 'math',
        'url': reverse('idiom-scenes'),
        'url_label': '去继续玩 →' if summary['quiz_asked'] + rounds else '去玩一局 →',
        'headlines': [(summary['quiz_asked'], '猜成语答题'), (summary['quiz_correct'], '猜对'),
                      (rounds, '完成局数')],
        'week': _week_text(summary['week'], '玩了 '),
        'footnote': '',
        'latest': _latest(recent(user, 1)),
    }


def _feihualing_card(user, _overview):
    from poetry.records import learning_summary, recent

    summary = learning_summary(user)
    return {
        'key': 'feihualing', 'name': '飞花令', 'icon': 'literature', 'color': 'geography',
        'url': reverse('feihualing'),
        'url_label': '去继续开令 →' if summary['rounds'] else '去开一令 →',
        'headlines': [(summary['rounds'], '完成次数'), (summary['completed'], '集满五句')],
        'week': _week_text(summary['week'], '完成 '),
        'footnote': '',
        'latest': _latest(recent(user, 1)),
    }


def _polyphone_card(user, _overview):
    from hanzi.records import learning_summary, recent

    summary = learning_summary(user)
    return {
        'key': 'polyphones', 'name': '多音字', 'icon': 'literature', 'color': 'chinese',
        'url': reverse('hanzi-polyphones'),
        'url_label': '去继续练 →' if summary['asked'] else '去练一题 →',
        'headlines': [(summary['asked'], '练习题数'), (summary['correct'], '答对')],
        'week': _week_text(summary['week'], '练了 '),
        'footnote': '',
        'latest': _latest(recent(user, 1)),
    }


AREA_CARDS = (_textbook_card, _words_card, _chain_card, _writing_card,
              _idioms_card, _feihualing_card, _polyphone_card)


def merged_recent(user, limit=10):
    """各领域「最近学习行」按时间合并：家长看孩子最近在学什么。"""
    from hanzi.records import recent as hanzi_recent
    from idioms.records import recent as idioms_recent
    from learning.services import textbook_recent
    from poetry.records import recent as poetry_recent

    rows = textbook_recent(user, limit) + recent_activity(user, limit)
    rows += idioms_recent(user, limit) + poetry_recent(user, limit) + hanzi_recent(user, limit)
    rows.sort(key=lambda row: row['when'], reverse=True)
    return rows[:limit]


def learning_digest(user):
    """登录用户的完整学习总览：areas 为总览卡，recent 为最近学习动态流。"""
    overview = learning_overview(user)
    areas = [card for card in (fn(user, overview) for fn in AREA_CARDS) if card is not None]
    return {'areas': areas, 'recent': merged_recent(user)}
