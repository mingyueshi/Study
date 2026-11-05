#!/usr/bin/env python3
"""Regenerate the optional revision clips with an installed macOS Chinese voice.
The delivered M4A files play independently of macOS. Text is authored for this page.
"""
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPS = {
    'chronology': ('公元纪年与世纪换算', '公元纪年没有零年，公元前一年之后，紧接着是公元一年。公元前的年份，数字越大，时间越早。例如，公元前二百二十一年，早于公元前二百年。一个世纪是一百年。公元一年到一百年，是第一世纪；公元六百零一年到七百年，是第七世纪。所以，唐朝建立的六百一十八年，属于第七世纪。计算跨越公元前后的间隔，要把两边年份相加，再减去一，因为中间没有零年。'),
    'qin-system': ('秦朝统一与郡县制度', '公元前二百二十一年，秦王嬴政统一六国，建立秦朝，自称始皇帝。秦朝在全国推行郡县制，地方长官由中央任免，王位世袭的诸侯管理方式受到改变。统一文字、货币和度量衡，有助于政令传达、商品交换和数量核算。但是，统一文字并不等于各地的人都说一样的口音。制度与标准能够加强国家联系，秦朝的繁重赋役、严酷刑罚和战争负担，也给社会带来了压力。'),
    'silk-road': ('丝绸之路的网络与交流', '丝绸之路是长期形成的交通与交流网络，不是一条从头到尾完全固定的道路。西汉张骞两次出使西域，增进了汉朝与西域各地的联系。商旅经过河西走廊、敦煌和西域等地，货物往往经过许多人的分段运输。除了丝绸，工艺、宗教、艺术和知识也沿路传播。交流有来有往，不能只画一个方向的箭头。今天的路线动画只是教学示意，不能当作准确的古代道路地图。'),
    'inventions': ('四大发明的演进与区别', '造纸术、印刷术、指南针和火药，合称中国古代四大发明。它们并不是同时出现，也不是四个人各自一次完成。西汉已经有纸，东汉蔡伦改进造纸术。雕版印刷把一整页刻在版上，北宋毕昇的泥活字，可以拆开重新排列。宋代指南针用于航海，但今天看到的勺形司南模型，是现代复原展示。火药从古代炼丹等实践中逐步发展，后来用于军事。学习技术史，要分清出现、改进、应用和传播。'),
}


def main():
    output = ROOT / 'assets' / 'audio'
    output.mkdir(parents=True, exist_ok=True)
    for slug, (title, text) in CLIPS.items():
        (output / (slug + '.txt')).write_text(text + '\n', encoding='utf-8')
        with tempfile.TemporaryDirectory(prefix='history-knowledge-audio-') as tmp:
            raw = Path(tmp) / 'speech.aiff'
            subprocess.run(['/usr/bin/say', '-v', 'Tingting', '-r', '180', '-o', str(raw), text], check=True)
            subprocess.run(['/usr/bin/afconvert', '-f', 'm4af', '-d', 'aac@44100', '-b', '64000', str(raw), str(output / (slug + '.m4a'))], check=True)
        print('Generated:', title, flush=True)
    manifest = {k: {'title': v[0], 'file': k + '.m4a', 'transcript': k + '.txt', 'credit': 'macOS Tingting 中文语音合成；知识摘要由本页编写'} for k, v in CLIPS.items()}
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
