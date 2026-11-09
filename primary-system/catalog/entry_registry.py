"""玩法入口注册表：模块挂载入口 + 首页专题卡，全部代码注册。

教材内容走固定的目录编排，落地在「目录中转页 + 学习册列表」；玩法模块
（接龙 / 场景单词 / 音标 / 作文坊）挂在学习模块上，``ENTRIES`` 登记每个
模块的落地页说明、卡片徽标与「学习摘要」口径。不挂模块的专题玩法（飞花令、
成语小游戏、多音字等）由 ``SPECIAL_ENTRIES`` 登记成首页专题卡。新增一个
玩法只改这里的注册行，模板不再出现逐卡硬编码。

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
    items = []
    for row in rows:
        if row.mode == GameRound.Mode.DUEL:
            result = '获胜' if row.ended_reason == GameRound.EndedReason.P2_STUCK else '惜败'
            note = f'对决家长{result} · {row.score}:{row.p2_score}'
        else:
            note = ('战胜小龙 · ' if row.ended_reason == GameRound.EndedReason.PARTNER_STUCK else '本局结束 · ') + f'{row.score} 分'
        items.append({'title': '成语接龙', 'note': note,
                      'when': row.finished_at or row.updated_at, 'url': reverse('chain')})
    return items


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
             'when': row.updated_at, 'url': reverse('scenario-words', query={'target': row.target_id})}
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
             'note': '作文坊 · 草稿', 'when': row.updated_at,
             'url': reverse('writing', query={'draft': row.pk}, fragment='notebook')}
            for row in rows]


def _phonetics_summary(user):
    return None


def _grammar_summary(user):
    return None


def _mathbook_summary(user):
    from mathbook.records import learning_summary

    return learning_summary(user)


def _chinesebook_summary(user):
    return None


ENTRIES = {
    'chain': {
        'route_name': 'chain',
        'tag': '去接龙 →',
        'headline': '成语接龙已开始',
        'blurb': '和小龙轮流接龙，也可以开一局家长对决、同屏轮流比一比谁接不上。对局、计分和提示都保存在你的账号下。',
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
    'grammar': {
        'route_name': 'grammar',
        'tag': '开始学语法 →',
        'headline': '语法学习已开始',
        'blurb': '8 章 31 个语法点：词法、动词与句型，讲规则、辨易错。页内巩固题即时判分，同题已进挑战题库，练习记录跟着题库走。',
        'button': '进入语法',
        'learning_summary': _grammar_summary,
    },
    'writing': {
        'route_name': 'writing',
        'tag': '打开作文坊 →',
        'headline': '作文坊已开始',
        'blurb': '打开写作锦囊，写自己的故事。写到一半会暂存在这台设备，点保存才会放进作文本。',
        'button': '进入作文坊',
        'learning_summary': _writing_summary,
        'recent': _writing_recent,
    },
    # 教材模块里的文件编排例外：语文/数学教材直接走静态编排的教材册页，
    # 内容源头在 primary/（scripts/build_chinesebook.cjs / build_mathbook.cjs 同步）。
    'math': {
        'route_name': 'mathbook',
        'tag': '打开知识点 →',
        'headline': '数学教材已开始',
        'blurb': '北师大版四上知识点：图示开路，要点、例题、易错一卡一卡看明白，公式速查和易错诊所考前过一遍，同款例题已进挑战题库。',
        'button': '进入数学教材',
        'learning_summary': _mathbook_summary,
    },
    'knowledge': {
        'route_name': 'chinesebook',
        'tag': '打开课文 →',
        'headline': '语文教材已开始',
        'blurb': '统编版四上 8 个单元 27 篇课文：课文卡配作者小传、原文金句、真实百科，必背古诗文、日积月累和字词复习单独成页，可点读、可搜索、可打印。',
        'button': '进入语文教材',
        'learning_summary': _chinesebook_summary,
    },
}


def entry_for(code):
    """玩法模块入口；教材模块（english）返回 None，走目录中转页。
    knowledge/math 是文件编排例外，直接指向静态编排的语文/数学教材册。"""
    return ENTRIES.get(code)


# 首页专题卡：不挂学习模块的玩法入口，注册顺序即展示顺序。
# 字段：route（URL 名）、subject（卡片角标学科）、area（筛选分组键）、icon、
# color（卡片配色）、name、tag（徽标）、blurb（一句话介绍）。
# 例外：挑战题库跨学科、内部再按领域分卡，不进本网格——由首页专题区标题
# 右侧的特殊入口直达（见 catalog/home.html 的 section-aside）。
SPECIAL_ENTRIES = (
    {'route': 'phrases', 'subject': '英语', 'area': 'english', 'icon': 'phrases', 'color': 'english',
     'name': '日常用语', 'tag': '开口说 →',
     'blurb': '教材里的 597 条常用短语和短句：按句式记一个开头整句就出来，按话题找场景想说哪句点哪句。'},
    {'route': 'plurals', 'subject': '英语', 'area': 'english', 'icon': 'plurals', 'color': 'english',
     'name': '不规则复数', 'tag': '认一认 →',
     'blurb': 'man 变 men、foot 变 feet、knife 变 knives——不按规矩变的复数一张表看全，再来几道「给单数选复数」。'},
    {'route': 'grammar', 'subject': '英语', 'area': 'english', 'icon': 'grammar', 'color': 'english',
     'name': '英语语法', 'tag': '学语法 →',
     'blurb': '8 章 31 个语法点：词法、动词与句型，讲规则、辨易错；页内巩固题即时判分，同题已进挑战题库。'},
    {'route': 'feihualing', 'subject': '古诗词', 'area': 'poetry', 'icon': 'literature', 'color': 'chinese',
     'name': '飞花令', 'tag': '开始练诗 →',
     'blurb': '选一个令字，想一句含这个字的诗，集满五句写成自己的诗单。'},
    {'route': 'poetry-map', 'subject': '古诗词', 'area': 'poetry', 'icon': 'globe', 'color': 'chinese',
     'name': '诗词地图', 'tag': '看看这里有什么诗 →',
     'blurb': '黄鹤楼、庐山、西湖、玉门关……背过的诗按地点摆上中国地图，去哪儿玩先查查。'},
    {'route': 'poetry-seasons', 'subject': '古诗词', 'area': 'poetry', 'icon': 'seasons', 'color': 'chinese',
     'name': '诗词四季', 'tag': '跟着季节读诗 →',
     'blurb': '春风、夏蝉、秋月、冬雪——按季节读诗，也按思乡、送别、边塞这些心情找。'},
    {'route': 'words-tree', 'subject': '英语', 'area': 'english', 'icon': 'tree', 'color': 'english',
     'name': '词以类聚', 'tag': '看单词的结构 →',
     'blurb': 'WordNet 上下位把单词挂成树：动物下面有狗、猫、熊猫。从「背场景」升级到「看结构」。'},
    {'route': 'idiom-scenes', 'subject': '语文', 'area': 'chinese', 'icon': 'idioms', 'color': 'chinese',
     'name': '场景成语', 'tag': '看看生活里的成语 →',
     'blurb': '从学习、心情和身边的小事出发，读懂成语，学会在一句话里用它。'},
    {'route': 'idiom-stories', 'subject': '语文', 'area': 'chinese', 'icon': 'history', 'color': 'chinese',
     'name': '成语典故馆', 'tag': '读成语故事 →',
     'blurb': '负荆请罪、三顾茅庐、望梅止渴——按典籍翻看有人物故事的成语，顺着人物线索把典故串起来。'},
    {'route': 'idiom-quiz', 'subject': '语文', 'area': 'chinese', 'icon': 'quiz', 'color': 'chinese',
     'name': '看释义猜成语', 'tag': '来猜一猜 →',
     'blurb': '读意思，把成语缺的字补出来。难度就是亮出的提示字数——从亮 3 个字到全部藏起来。'},
    {'route': 'idiom-emoji', 'subject': '语文', 'area': 'chinese', 'icon': 'emoji', 'color': 'chinese',
     'name': '成语表情猜猜看', 'tag': '看表情猜成语 →',
     'blurb': '看 emoji 猜成语：🐍➕🦶 是哪个？四选一点一点，猜对一个收一个。'},
    {'route': 'idiom-pairs', 'subject': '语文', 'area': 'chinese', 'icon': 'pairs', 'color': 'chinese',
     'name': '成语配对', 'tag': '连线配对 →',
     'blurb': '左边找一个成语，右边配它的近义或反义。画蛇添足配谁？雪中送炭又配谁？'},
    {'route': 'hanzi-polyphones', 'subject': '语文', 'area': 'chinese', 'icon': 'polyphone', 'color': 'chinese',
     'name': '多音字', 'tag': '认一认多音字 →',
     'blurb': '乐读 yuè 还是 lè？1,010 个多音字按读音看组词，再来几道「给词选读音」。'},
    {'route': 'questionbank-olympiad', 'subject': '数学', 'area': 'math', 'icon': 'quiz', 'color': 'math',
     'name': '奥数挑战', 'tag': '来挑战 →',
     'blurb': '四年级奥数思维题：速算巧算、鸡兔同笼、盈亏还原、行程与逻辑推理，每题带思路解析，答错自动进错题本。'},
    {'route': 'math-formulas', 'subject': '数学', 'area': 'math', 'icon': 'formula', 'color': 'math',
     'name': '数学公式', 'tag': '查公式 →',
     'blurb': '小学一到六年级的公式速查手册：运算律、周长面积体积、行程植树鸡兔同笼、单位换算，初中高中在整理中。'},
)


def special_entries():
    """解析好的首页专题卡列表，字段与模块卡完全同形，模板一个循环渲染。"""
    return [{'url': reverse(spec['route']), 'icon': spec['icon'], 'color_code': spec['color'],
             'subject_label': spec['subject'], 'area': spec['area'],
             'name': spec['name'], 'blurb': spec['blurb'], 'badge': spec['tag']}
            for spec in SPECIAL_ENTRIES]


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
