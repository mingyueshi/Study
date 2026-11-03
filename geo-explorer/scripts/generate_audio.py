#!/usr/bin/env python3
"""Regenerate four optional Chinese revision clips using installed macOS voices.
The delivered M4A files work without macOS; this script is only for regeneration.
"""
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPS = {
    'scale': ('比例尺与单位换算', '比例尺表示图上距离和实际距离的比。计算前，必须把距离换成相同的单位。例如，图上三厘米，代表实际三千米。三千米等于三十万厘米，三比三十万，化简得到一比十万。这表示图上一厘米，对应实际一千米。已知比例尺和图上距离，可以计算实际距离；已知实际距离，也可以反过来求图上距离。注意，数字比例尺相同的地图如果被打印缩放，原来的数值就不能直接套用。'),
    'seasons': ('地轴倾斜与四季', '四季主要由地轴倾斜和地球公转共同造成，不是由地球离太阳的远近决定。地轴相对公转轨道面的垂线倾斜约二十三点五度，一年中空间朝向基本保持不变。当地轴北端倾向太阳时，北半球获得的阳光较直，白昼也较长；南半球情况相反。夏至太阳直射北回归线，冬至直射南回归线，春分和秋分直射赤道。太阳直射点和白昼长短的变化，是理解四季的两条线索。'),
    'water-cycle': ('水循环的主要过程', '水循环是水在海洋、陆地和大气之间，通过状态变化和运动不断交换的过程。阳光提供能量，液态水蒸发成为看不见的水蒸气。水蒸气遇冷可以凝结为小水滴，云由小水滴或冰晶组成。达到一定条件后，水以雨雪等形式返回地面。一部分沿地表形成径流，一部分下渗进入地下，还可以经过植物蒸腾回到空气。并不是每一滴水都沿着同一条路线运动。'),
    'longitude': ('经度与地方时计算', '在简化的地方时计算中，地球约二十四小时转一周，也就是三百六十度。所以，经度每相差十五度，地方时约相差一小时；相差一度，约相差四分钟。同一时刻，往东地方时加，往西地方时减。例如，东经一百二十度的地方时是十二点，东经九十度在它西边三十度，地方时就减两小时，得到十点。地方时不等于法定时区时间，日常旅行还要查目的地的统一用时。'),
}

def main():
    output = ROOT / 'assets' / 'audio'
    output.mkdir(parents=True, exist_ok=True)
    for slug, (title, text) in CLIPS.items():
        (output / (slug + '.txt')).write_text(text + '\n', encoding='utf-8')
        with tempfile.TemporaryDirectory(prefix='geo-knowledge-audio-') as tmp:
            raw = Path(tmp) / 'speech.aiff'
            subprocess.run(['/usr/bin/say', '-v', 'Tingting', '-r', '180', '-o', str(raw), text], check=True)
            subprocess.run(['/usr/bin/afconvert', '-f', 'm4af', '-d', 'aac@44100', '-b', '64000', str(raw), str(output / (slug + '.m4a'))], check=True)
        print('Generated:', title, flush=True)
    (output / 'manifest.json').write_text(json.dumps({k: {'title': v[0], 'file': k + '.m4a', 'transcript': k + '.txt', 'credit': 'macOS Tingting 中文语音合成；知识摘要由本页编写'} for k, v in CLIPS.items()}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
