"""激励规则表：纯数据，改分值、上限、称号与勋章只动这个文件。

口径纪律：完成整课/整局给主要分，逐题答对给小额分，答错不扣分；每类动作
都有每日上限防刷。发分与勋章判定全部在服务端（``services``），本文件不写
逻辑，只有数据与两把小刷子（``event_cats``、``validate_rules``）。
"""

# ---------------------------------------------------------------------------
# 积分事件：code → 分值 / 每日上限 / 中文说明 / 所属玩法家族
# cat 同时用于「全科探索」勋章的家族统计与勋章按事件分类的定向刷新。
# manual=True 的事件（兑换扣分/退回）由服务层运行时给定分值，不走每日上限。
# ---------------------------------------------------------------------------
EVENT_RULES = {
    'textbook_mastered':    {'points': 10, 'daily_cap': 30, 'label': '教材一课标掌握', 'cat': 'textbook'},
    'textbook_started':     {'points': 2,  'daily_cap': 10, 'label': '教材一课开始学', 'cat': 'textbook'},
    'words_learned':        {'points': 2,  'daily_cap': 20, 'label': '场景单词标掌握', 'cat': 'words'},
    'idiom_quiz_correct':   {'points': 1,  'daily_cap': 15, 'label': '看释义猜成语答对', 'cat': 'idiom'},
    'idiom_pairs_round':    {'points': 4,  'daily_cap': 12, 'label': '成语配对完成一局', 'cat': 'idiom'},
    'idiom_emoji_round':    {'points': 4,  'daily_cap': 12, 'label': '表情猜猜完成一局', 'cat': 'idiom'},
    'chain_round_finished': {'points': 5,  'daily_cap': 15, 'label': '成语接龙完成一局', 'cat': 'chain'},
    'feihualing_completed': {'points': 6,  'daily_cap': 12, 'label': '飞花令完整接满一局', 'cat': 'feihualing'},
    'feihualing_exhausted': {'points': 3,  'daily_cap': 6,  'label': '飞花令收局', 'cat': 'feihualing'},
    'polyphone_correct':    {'points': 1,  'daily_cap': 10, 'label': '多音字答对', 'cat': 'polyphone'},
    'plural_correct':       {'points': 1,  'daily_cap': 10, 'label': '不规则复数答对', 'cat': 'plural'},
    'phrase_correct':       {'points': 1,  'daily_cap': 10, 'label': '日常用语答对', 'cat': 'phrase'},
    'questionbank_correct': {'points': 2,  'daily_cap': 20, 'label': '挑战题库答对', 'cat': 'questionbank'},
    'writing_draft':        {'points': 8,  'daily_cap': 16, 'label': '作文坊保存新一篇', 'cat': 'writing'},
    'redeem':               {'points': 0,  'daily_cap': 0,  'label': '兑换奖励', 'cat': 'redeem', 'manual': True},
    'redeem_refund':        {'points': 0,  'daily_cap': 0,  'label': '兑换退回', 'cat': 'redeem', 'manual': True},
}

# 玩法家族（redeem 不算玩法）：全科探索勋章按孩子出现过的家族数点亮。
FAMILY_CATS = ('textbook', 'words', 'idiom', 'chain', 'feihualing',
               'polyphone', 'plural', 'phrase', 'questionbank', 'writing')

FAMILY_LABELS = {
    'textbook': '读课文', 'words': '记单词', 'idiom': '玩成语', 'chain': '接龙',
    'feihualing': '飞花令', 'polyphone': '多音字', 'plural': '不规则复数',
    'phrase': '日常用语', 'questionbank': '挑战题库', 'writing': '作文坊',
}

# ---------------------------------------------------------------------------
# 称号等级：按学习获得的积分累计，兑换和退款只影响余额。
# ---------------------------------------------------------------------------
LEVELS = [
    {'since': 0,    'icon': '🌱', 'name': '新芽学者'},
    {'since': 200,  'icon': '🌿', 'name': '上进少年'},
    {'since': 600,  'icon': '⭐', 'name': '学习小达人'},
    {'since': 1500, 'icon': '🏆', 'name': '博学之星'},
    {'since': 3000, 'icon': '👑', 'name': '智慧大师'},
]

TIER_LABELS = {'bronze': '铜', 'silver': '银', 'gold': '金'}


def _badge(code, name, icon, tier, key, target, cats, description):
    """一枚阈值勋章：stats[key] ≥ target 点亮；锁定时用同一对数字画进度条。"""
    return {'code': code, 'name': name, 'icon': icon, 'tier': tier, 'key': key,
            'target': target, 'cats': tuple(cats), 'description': description}


# ---------------------------------------------------------------------------
# 勋章墙：全部是「某项口径达到阈值」型勋章，判定取源数据表计数（对已有的
# 学习记录天然追溯补发）；只有全科探索按积分流水的家族统计。
# ---------------------------------------------------------------------------
BADGES = [
    # 打卡系
    _badge('checkin_first', '第一次打卡', '🌟', 'bronze', 'checkin_days', 1, ('core',), '完成第一次学习打卡'),
    _badge('streak_7', '连续一周', '🔥', 'silver', 'streak_best', 7, ('core',), '连续打卡满 7 天'),
    _badge('streak_21', '习惯成自然', '💪', 'gold', 'streak_best', 21, ('core',), '连续打卡满 21 天'),
    _badge('streak_100', '百日坚持', '🌈', 'gold', 'streak_best', 100, ('core',), '连续打卡满 100 天'),
    # 积分系（按累计获得）
    _badge('points_100', '初有积蓄', '🎒', 'bronze', 'points_earned', 100, ('core',), '累计获得 100 积分'),
    _badge('points_500', '小金库', '🪙', 'silver', 'points_earned', 500, ('core',), '累计获得 500 积分'),
    _badge('points_2000', '积分富翁', '💎', 'gold', 'points_earned', 2000, ('core',), '累计获得 2000 积分'),
    # 教材掌握
    _badge('mastered_5', '课文起步', '📖', 'bronze', 'textbook_mastered', 5, ('textbook',), '标记掌握 5 课教材内容'),
    _badge('mastered_20', '课文达人', '📚', 'silver', 'textbook_mastered', 20, ('textbook',), '标记掌握 20 课教材内容'),
    _badge('mastered_50', '课文小博士', '🎓', 'gold', 'textbook_mastered', 50, ('textbook',), '标记掌握 50 课教材内容'),
    # 场景单词
    _badge('words_30', '词汇萌芽', '🐣', 'bronze', 'words_learned', 30, ('words',), '标记掌握 30 个场景单词'),
    _badge('words_100', '词汇小树', '🌳', 'silver', 'words_learned', 100, ('words',), '标记掌握 100 个场景单词'),
    # 成语三小游戏
    _badge('quiz_50', '成语小将', '🧩', 'bronze', 'idiom_quiz_correct', 50, ('idiom',), '看释义猜成语答对 50 题'),
    _badge('quiz_200', '成语大师', '🐉', 'gold', 'idiom_quiz_correct', 200, ('idiom',), '看释义猜成语答对 200 题'),
    _badge('idiom_rounds_20', '成语玩家', '🃏', 'silver', 'idiom_rounds', 20, ('idiom',), '配对与表情猜猜完成 20 局'),
    # 成语接龙
    _badge('chain_best_15', '接龙高手', '⛓️', 'silver', 'chain_best', 15, ('chain',), '单局接龙拿到 15 分'),
    _badge('chain_rounds_20', '接龙常客', '🔗', 'bronze', 'chain_rounds', 20, ('chain',), '完成 20 局成语接龙'),
    # 飞花令
    _badge('fh_3', '飞花初令', '🌸', 'bronze', 'feihualing_completed', 3, ('feihualing',), '完整接满 3 局飞花令'),
    _badge('fh_10', '飞花令主', '🏮', 'silver', 'feihualing_completed', 10, ('feihualing',), '完整接满 10 局飞花令'),
    # 逐题练习
    _badge('poly_30', '正音小师', '📢', 'bronze', 'polyphone_correct', 30, ('polyphone',), '多音字答对 30 题'),
    _badge('plural_30', '词形小专家', '🔤', 'bronze', 'plural_correct', 30, ('plural',), '不规则复数答对 30 题'),
    _badge('phrase_50', '开口小达人', '💬', 'bronze', 'phrase_correct', 50, ('phrase',), '日常用语答对 50 题'),
    _badge('qb_100', '解题小将', '🧠', 'silver', 'questionbank_correct', 100, ('questionbank',), '挑战题库答对 100 题'),
    _badge('qb_500', '解题大师', '🚀', 'gold', 'questionbank_correct', 500, ('questionbank',), '挑战题库答对 500 题'),
    # 作文坊
    _badge('writing_5', '初试笔锋', '✏️', 'bronze', 'writing_drafts', 5, ('writing',), '保存 5 篇作文'),
    _badge('writing_20', '小作家', '🖋️', 'gold', 'writing_drafts', 20, ('writing',), '保存 20 篇作文'),
    # 全科探索
    _badge('families_6', '多面小手', '🎨', 'bronze', 'families', 6, ('core',), '玩过 6 种不同的学习玩法'),
    _badge('families_10', '十八般武艺', '🎪', 'gold', 'families', 10, ('core',), '十种学习玩法都玩过'),
]

BADGE_CODES = {badge['code'] for badge in BADGES}


def validate_rules():
    """规则表自检：字段齐全、数字合法、code 唯一；异常时抛 ValueError。

    在 incentives.tests 里调用，规则改动先过测试再上线。"""
    seen = set()
    for code, rule in EVENT_RULES.items():
        if code in seen:
            raise ValueError(f'积分事件 code 重复：{code}')
        seen.add(code)
        if set(rule) - {'points', 'daily_cap', 'label', 'cat', 'manual'}:
            raise ValueError(f'{code} 含未知字段：{rule.keys()}')
        if not rule.get('manual'):
            if rule['points'] <= 0 or rule['daily_cap'] <= 0:
                raise ValueError(f'{code} 的分值与每日上限必须为正')
        if rule['cat'] not in FAMILY_CATS and rule['cat'] != 'redeem':
            raise ValueError(f'{code} 的 cat 不在已知家族：{rule["cat"]}')
        if not rule['label']:
            raise ValueError(f'{code} 缺中文说明')
    seen_badges = set()
    for badge in BADGES:
        if badge['code'] in seen_badges:
            raise ValueError(f'勋章 code 重复：{badge["code"]}')
        seen_badges.add(badge['code'])
        if badge['tier'] not in TIER_LABELS:
            raise ValueError(f'{badge["code"]} 的档位未知：{badge["tier"]}')
        if badge['target'] <= 0:
            raise ValueError(f'{badge["code"]} 的阈值必须为正')
        unknown = set(badge['cats']) - set(FAMILY_CATS) - {'core'}
        if unknown:
            raise ValueError(f'{badge["code"]} 引用了未知事件分类：{unknown}')
    for previous, level in zip(LEVELS, LEVELS[1:]):
        if level['since'] <= previous['since']:
            raise ValueError('称号等级阈值必须严格递增')
    return True


def event_cats(codes):
    """一组事件 code → 所属玩法家族集合（未知 code 忽略）。"""
    return {EVENT_RULES[code]['cat'] for code in codes if code in EVENT_RULES} - {'redeem'}
