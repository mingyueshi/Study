ELEMENT_NAMES = list(
    "氢氦锂铍硼碳氮氧氟氖钠镁铝硅磷硫氯氩钾钙钪钛钒铬锰铁钴镍铜锌镓锗砷硒溴氪铷锶钇锆铌钼锝钌铑钯银镉铟锡锑碲碘氙铯钡镧铈镨钕钷钐铕钆铽镝钬铒铥镱镥铪钽钨铼锇铱铂金汞铊铅铋钋砹氡钫镭锕钍镤铀镎钚镅锔锫锎锿镄钔锘铹"
)
# 113/115/117/118: CNCTST official names, 2017 announcement (2023 archive).
ELEMENT_NAMES_BY_NUMBER = {i + 1: name for i, name in enumerate(ELEMENT_NAMES)}
# Chinese Chemical Society's own 2019-01-23 table, visually verified against
# https://www.chemsoc.org.cn/library/a2611.html ; simplified variants cross-checked
# with the packaged original Unihan 17 kTraditionalVariant (109/112 kDefinition).
ELEMENT_NAME_SOURCE = "https://www.chemsoc.org.cn/library/a2611.html"
ELEMENT_NAMES_BY_NUMBER.update(
    {
        104: "𬬻",
        105: "𬭊",
        106: "𬭳",
        107: "𬭛",
        108: "𬭶",
        109: "鿏",
        110: "𫟼",
        111: "𬬭",
        112: "鿔",
        113: "鿭",
        114: "𫓧",
        115: "镆",
        116: "𫟷",
        117: "鿬",
        118: "鿫",
    }
)
ELEMENT_NAME_COMPONENTS = {
    104: "钅＋卢",
    105: "钅＋杜",
    106: "钅＋喜",
    107: "钅＋波",
    108: "钅＋黑",
    109: "钅＋麦",
    110: "钅＋达",
    111: "钅＋仑",
    112: "钅＋哥",
    113: "钅＋尔",
    114: "钅＋夫",
    115: "钅＋莫",
    116: "钅＋立",
    117: "石＋田",
    118: "气＋奥",
}
CATEGORIES = {
    "diatomic nonmetal": "双原子非金属",
    "noble gas": "稀有气体",
    "alkali metal": "碱金属",
    "alkaline earth metal": "碱土金属",
    "metalloid": "类金属",
    "polyatomic nonmetal": "多原子非金属",
    "post-transition metal": "后过渡金属",
    "transition metal": "过渡金属",
    "lanthanide": "镧系元素",
    "actinide": "锕系元素",
    "unknown, probably transition metal": "未知（预测为过渡金属）",
    "unknown, probably post-transition metal": "未知（预测为后过渡金属）",
    "unknown, probably metalloid": "未知（预测为类金属）",
    "unknown, predicted to be noble gas": "未知（预测为稀有气体）",
}
