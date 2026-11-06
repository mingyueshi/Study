"""古文经典来源定义：hanzhaodeng/chinese-ancient-text 62 册的 collection 归类
与 canonical 树规范化。打包脚本（scripts/build_ancient_text_package.py）与
导入守卫共用本模块，保证登记、打包、校验三者口径一致。
"""

UPSTREAM_HOST = "raw.githubusercontent.com"
UPSTREAM_REPO = "hanzhaodeng/chinese-ancient-text"
UPSTREAM_COMMIT = "01a1183cd9bbc243bb156967043c32b6685c0d2f"
BOOK_COUNT = 62

# 62 册全收，按九个 collection 归类；collection 均为全新命名，
# 不与既有 全唐诗/宋词/诗经/楚辞/蒙学 重叠，避免详情页双层配对串册。
COLLECTIONS = {
    "蒙学读物": ["三字经", "千字文", "弟子规", "百家姓", "声律启蒙"],
    "儒家经典": [
        "论语", "孟子", "大学章句集注", "中庸", "孝经", "周易", "易传",
        "尚书", "礼记", "周礼", "仪礼", "左传", "孔子家语",
    ],
    "史书典籍": [
        "史记", "汉书", "后汉书", "三国志", "资治通鉴", "续资治通鉴",
        "战国策", "山海经", "水经注",
    ],
    "诸子百家": [
        "老子", "庄子", "列子", "荀子", "韩非子", "淮南子", "吕氏春秋",
        "公孙龙子",
    ],
    "兵法谋略": [
        "孙子兵法", "孙膑兵法", "吴子", "六韬", "尉缭子", "司马法", "将苑",
        "百战奇略", "三十六计", "素书", "反经", "智囊(选录)",
    ],
    "笔记杂谈": [
        "世说新语", "搜神记", "笑林广记", "菜根谭", "颜氏家训", "了凡四训",
        "文心雕龙", "冰鉴",
    ],
    "科技博物": ["天工开物", "梦溪笔谈", "本草纲目"],
    "医学典籍": ["黄帝内经", "伤寒论"],
    "佛典经文": ["金刚经", "地藏经"],
}


def book_collection():
    """书名 → collection 的展平映射，并断言册数无遗漏无重复。"""
    mapping = {}
    for collection, books in COLLECTIONS.items():
        for name in books:
            if name in mapping:
                raise ValueError(f"书名重复登记：{name}")
            mapping[name] = collection
    if len(mapping) != BOOK_COUNT:
        raise ValueError(f"登记册数应为 {BOOK_COUNT}，实际 {len(mapping)}")
    return mapping


def normalize(data, name):
    """上游 {name, description, articles:[{title, content}]} → canonical 树。

    篇名与书名相同或单篇册时以书名为题；正文必须是逐句字符串数组
    （单字符串视为一段）。输出树由 poetry.importing.parse_document 直接解析。
    """
    articles = data.get("articles")
    if not isinstance(articles, list) or not articles:
        raise ValueError(f"{name}：缺少 articles 正文结构")
    chapters = []
    for article in articles:
        title = str(article.get("title") or "").strip()
        content = article.get("content")
        if isinstance(content, str):
            content = [content]
        if (
            not isinstance(content, list)
            or not content
            or not all(isinstance(line, str) and line.strip() for line in content)
        ):
            raise ValueError(f"{name}：篇目《{title}》正文不是非空字符串数组")
        if len(articles) == 1 or title == name or not title:
            title = name
        chapters.append({"title": title, "content": content})
    return {
        "title": name,
        "description": str(data.get("description") or "").strip(),
        "content": chapters,
    }
