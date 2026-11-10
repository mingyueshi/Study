#!/usr/bin/env python3
"""从 hanziyuan.net（汉字叔叔字源网）抓取汉字演变馆选字的古字形。

字形在该站是 potrace 矢量化的内联 SVG，按「甲骨文 / 金文 / 篆字」三段展示。
本脚本对每个选字请求一次 etymology 页面，提取各段第一个字形，
解码保存为 content_sources/images/glyphs/heNNN-<拼音>-<段>.svg，
并生成 content_sources/hanzi-evo-availability.json 供数据作者与测试核对。

请求配方（由站点 main.js 得出）：
  GET https://hanziyuan.net/            取得名为 Bronze 的 cookie
  POST https://hanziyuan.net/etymology  表单 chinese=<字>&Bronze=<cookie>，
                                        头 Chinese=<码点>、Seal=<cookie>
注意：站点对非浏览器客户端的 POST 一律返回 404，纯脚本跑不通时，
可在浏览器页面上下文里执行同样的 fetch（配合本地中转落盘）。
站上个别字需借前身字取形（云→雲、电→申、蛇→它、草→屮、万→萬），
缺某段古形时数据中以「未见于某文」诚实标注，不硬凑。

用法：
  python3 scripts/fetch_hanzi_glyphs.py            # 增量抓取，已有文件跳过
  python3 scripts/fetch_hanzi_glyphs.py --force    # 全部重抓
"""
import argparse
import base64
import json
import re
import sys
import time
from pathlib import Path
from urllib import error, parse, request

PROJECT = Path(__file__).resolve().parents[1]
GLYPH_DIR = PROJECT / 'content_sources' / 'images' / 'glyphs'
REPORT = PROJECT / 'content_sources' / 'hanzi-evo-availability.json'
SITE = 'https://hanziyuan.net'

# 汉字演变馆选字表：10 字族 100 字，(字, 声调拼音)。顺序即字形文件编号。
CHARS = [
    # 天文气象
    ('日', 'ri4'), ('月', 'yue4'), ('星', 'xing1'), ('云', 'yun2'), ('雨', 'yu3'),
    ('雪', 'xue3'), ('雷', 'lei2'), ('电', 'dian4'), ('风', 'feng1'), ('天', 'tian1'),
    # 大地山川
    ('山', 'shan1'), ('川', 'chuan1'), ('水', 'shui3'), ('火', 'huo3'), ('土', 'tu3'),
    ('石', 'shi2'), ('田', 'tian2'), ('井', 'jing3'), ('谷', 'gu3'), ('泉', 'quan2'),
    # 飞禽走兽
    ('马', 'ma3'), ('牛', 'niu2'), ('羊', 'yang2'), ('犬', 'quan3'), ('豕', 'shi3'),
    ('鹿', 'lu4'), ('虎', 'hu3'), ('兔', 'tu4'), ('蛇', 'she2'), ('鱼', 'yu2'),
    ('鸟', 'niao3'), ('龙', 'long2'),
    # 草木禾稼
    ('木', 'mu4'), ('林', 'lin2'), ('森', 'sen1'), ('禾', 'he2'), ('米', 'mi3'),
    ('瓜', 'gua1'), ('果', 'guo3'), ('竹', 'zhu2'), ('草', 'cao3'), ('桑', 'sang1'),
    # 身体密码
    ('人', 'ren2'), ('大', 'da4'), ('女', 'nv3'), ('子', 'zi3'), ('目', 'mu4'),
    ('口', 'kou3'), ('耳', 'er3'), ('手', 'shou3'), ('足', 'zu2'), ('心', 'xin1'),
    # 一举一动
    ('见', 'jian4'), ('走', 'zou3'), ('步', 'bu4'), ('行', 'xing2'), ('立', 'li4'),
    ('休', 'xiu1'), ('从', 'cong2'), ('得', 'de2'), ('及', 'ji2'), ('涉', 'she4'),
    # 身边器物
    ('门', 'men2'), ('户', 'hu4'), ('车', 'che1'), ('舟', 'zhou1'), ('网', 'wang3'),
    ('弓', 'gong1'), ('矢', 'shi3'), ('戈', 'ge1'), ('鼎', 'ding3'), ('册', 'ce4'),
    ('衣', 'yi1'),
    # 数字从哪来
    ('一', 'yi1'), ('二', 'er4'), ('三', 'san1'), ('四', 'si4'), ('五', 'wu3'),
    ('六', 'liu4'), ('七', 'qi1'), ('八', 'ba1'), ('九', 'jiu3'), ('十', 'shi2'),
    ('万', 'wan4'),
    # 四方与上下
    ('上', 'shang4'), ('下', 'xia4'), ('中', 'zhong1'), ('东', 'dong1'), ('西', 'xi1'),
    ('南', 'nan2'), ('北', 'bei3'),
    # 家里的时光
    ('家', 'jia1'), ('安', 'an1'), ('明', 'ming2'), ('旦', 'dan4'), ('莫', 'mo4'),
    ('春', 'chun1'), ('秋', 'qiu1'), ('年', 'nian2'), ('学', 'xue2'),
]

STAGES = (('ob', 'Oracle characters'), ('bronze', 'Bronze characters'), ('seal', 'Seal characters'))
DATA_URI = re.compile(r'data:image/svg\+\w*(;base64)?,([\'"]?)([^\'")\s]+)\2')


def http(url, data=None, headers=None, timeout=25):
    body = parse.urlencode(data).encode() if data is not None else None
    head = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Referer': SITE + '/',
    }
    if headers:
        head.update(headers)
    req = request.Request(url, data=body, headers=head)
    with request.urlopen(req, timeout=timeout) as resp:
        return resp.headers, resp.read()


def get_bronze_cookie():
    headers, _ = http(SITE + '/')
    for value in headers.get_all('Set-Cookie') or []:
        if value.startswith('Bronze='):
            return parse.unquote(value.split(';', 1)[0].split('=', 1)[1])
    raise SystemExit('未取得 Bronze cookie，站点可能改版。')


def decode_svg(match):
    if match.group(1):
        return base64.b64decode(match.group(3)).decode('utf-8', 'replace')
    return parse.unquote(match.group(3))


def extract_forms(html):
    """按段标题切分响应，各取第一个字形 SVG；同时取读音与本义。"""
    marks = []
    for key, label in STAGES:
        pos = html.find(label)
        marks.append((key, pos))
    lookup = re.search(r'Main pronunciation 主要发音:\s*</?\w[^>]*>?\s*([^<]{1,40})', html)
    meaning = re.search(r'Original meaning 本义:\s*</?\w[^>]*>?\s*([^<]{1,200})', html)
    forms = {}
    for index, (key, pos) in enumerate(marks):
        if pos < 0:
            forms[key] = None
            continue
        end = marks[index + 1][1] if index + 1 < len(marks) and marks[index + 1][1] > 0 else len(html)
        chunk = html[pos:end]
        match = DATA_URI.search(chunk)
        forms[key] = decode_svg(match) if match else None
    return forms, (lookup.group(1).strip() if lookup else ''), (meaning.group(1).strip() if meaning else '')


def sanitize_svg(svg, index, stage):
    if '<svg' not in svg:
        return None
    # potrace 产出的 SVG 自带 viewBox 与黑色填充，仅确保根标签存在即可。
    return svg


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--force', action='store_true', help='忽略已存在文件全部重抓')
    parser.add_argument('--sleep', type=float, default=0.6, help='请求间隔秒数')
    args = parser.parse_args()

    if len(CHARS) != 100:
        raise SystemExit(f'选字表应为 100 字，当前 {len(CHARS)}。')
    if len({char for char, _ in CHARS}) != 100:
        raise SystemExit('选字表有重复。')

    cookie = get_bronze_cookie()
    print(f'Bronze cookie 取得：{cookie[:16]}…')
    GLYPH_DIR.mkdir(parents=True, exist_ok=True)

    existing_report = []
    if REPORT.is_file() and not args.force:
        try:
            existing_report = json.loads(REPORT.read_text(encoding='utf-8'))
        except ValueError:
            existing_report = []
    old_by_index = {item['index']: item for item in existing_report}

    records = []
    missing = {'ob': [], 'bronze': [], 'seal': []}
    for index, (char, py) in enumerate(CHARS, start=1):
        stem = f'he{index:03d}-{py}'
        record = {
            'index': index, 'char': char, 'py': py, 'family': None,
            'site_pinyin': '', 'meaning': '',
            'files': {}, 'missing': [],
        }
        cached = old_by_index.get(index)
        need_fetch = args.force or not cached or cached.get('char') != char or not cached.get('fetched')
        if need_fetch:
            for attempt in range(3):
                try:
                    _, body = http(
                        SITE + '/etymology',
                        data={'chinese': char, 'Bronze': cookie},
                        headers={'Chinese': str(ord(char)), 'Seal': cookie},
                    )
                    break
                except error.URLError as exc:
                    if attempt == 2:
                        raise SystemExit(f'{char} 请求失败：{exc}')
                    time.sleep(2 * (attempt + 1))
            html = body.decode('utf-8', 'replace')
            forms, site_py, meaning = extract_forms(html)
            record['site_pinyin'] = site_py
            record['meaning'] = meaning
            for key, _ in STAGES:
                svg = sanitize_svg(forms.get(key) or '', index, key)
                if svg:
                    path = GLYPH_DIR / f'{stem}-{key}.svg'
                    path.write_text(svg, encoding='utf-8')
                    record['files'][key] = path.name
                else:
                    record['missing'].append(key)
                    missing[key].append(char)
            record['fetched'] = True
            time.sleep(args.sleep)
        else:
            record.update({k: cached[k] for k in ('site_pinyin', 'meaning', 'files', 'missing') if k in cached})
            record['fetched'] = True
            for key in ('ob', 'bronze', 'seal'):
                if key not in record['files']:
                    missing[key].append(char)
        records.append(record)
        state = '、'.join(k for k in ('ob', 'bronze', 'seal') if k in record['files']) or '无字形'
        print(f'{index:3d} {char} {py:8s} {state}')

    REPORT.write_text(json.dumps(records, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'\n报告已写入 {REPORT.relative_to(PROJECT)}')
    print(f'甲骨文 {100 - len(missing["ob"])}/100，金文 {100 - len(missing["bronze"])}/100，'
          f'篆字 {100 - len(missing["seal"])}/100')
    for key, label in STAGES:
        if missing[key]:
            print(f'{label} 缺失：{" ".join(missing[key])}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
