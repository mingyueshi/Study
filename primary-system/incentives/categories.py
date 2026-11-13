"""奖励分类：稳定代码、中文名称与展示图标。"""

REWARD_CATEGORIES = (
    ('wish', '愿望', '🌟'),
    ('toy', '玩具', '🧸'),
    ('snack', '零食', '🍪'),
    ('entertainment', '娱乐', '🎮'),
    ('free_time', '自由时间', '🌈'),
)
CATEGORY_CHOICES = tuple((code, name) for code, name, _icon in REWARD_CATEGORIES)
CATEGORY_CODES = frozenset(code for code, _name, _icon in REWARD_CATEGORIES)
OTHER_CATEGORY = ('other', '其他', '🎁')
LEGACY_CATEGORY_ALIASES = {'game': 'entertainment', 'tablet': 'entertainment', 'phone': 'entertainment'}


def canonical_category(code):
    return LEGACY_CATEGORY_ALIASES.get(code, code)
