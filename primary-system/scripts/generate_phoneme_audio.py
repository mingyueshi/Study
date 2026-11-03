#!/usr/bin/env python3
"""生成 44 个音素的原声音频（开发期工具，产物提交进仓库）。

用 espeak-ng 按英式音素表合成 wav，再用 macOS 自带 afconvert 转成 m4a，
输出到 static/phonetics/audio/<id>.m4a。运行时页面只播文件，不依赖 espeak-ng。

用法：python3 scripts/generate_phoneme_audio.py
依赖：brew install espeak-ng
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'phonetics' / 'data' / 'phonemes.json'
OUT = ROOT / 'static' / 'phonetics' / 'audio'
VOICE = 'en-gb'

# IPA 符号 -> espeak-ng 音素助记符（英式音素表，Kirshenbaum 风格）。
ESPEAK_CODES = {
    'iː': 'i:', 'ɪ': 'I', 'e': 'e', 'æ': 'a', 'ɑː': 'A:', 'ʌ': 'V', 'ɒ': '0',
    'ɔː': 'O:', 'ʊ': 'U', 'uː': 'u:', 'ɜː': '3:', 'ə': '@',
    'eɪ': 'eI', 'aɪ': 'aI', 'ɔɪ': 'OI', 'əʊ': '@U', 'aʊ': 'aU',
    'ɪə': 'I@', 'eə': 'e@', 'ʊə': 'U@',
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'ɡ': 'g', 'f': 'f', 'v': 'v',
    'θ': 'T', 'ð': 'D', 's': 's', 'z': 'z', 'ʃ': 'S', 'ʒ': 'Z',
    'tʃ': 'tS', 'dʒ': 'dZ', 'm': 'm', 'n': 'n', 'ŋ': 'N', 'h': 'h',
    'l': 'l', 'r': 'r', 'w': 'w', 'j': 'j',
}


def main():
    curriculum = json.loads(DATA.read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    missing = []
    for phoneme in curriculum['phonemes']:
        symbol = phoneme['symbol'].strip('/')
        code = ESPEAK_CODES.get(symbol)
        if not code:
            missing.append(symbol)
            continue
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / 'phoneme.wav'
            subprocess.run(['espeak-ng', '-v', VOICE, '-a', '180', '-s', '120',
                            '-w', str(wav), f'[[{code}]]'], check=True)
            m4a = OUT / f"{phoneme['id']}.m4a"
            subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '48000',
                            str(wav), str(m4a)], check=True)
        print(f"{phoneme['id']} /{symbol}/ -> {m4a.relative_to(ROOT)}")
    if missing:
        print('缺少音素映射：', missing, file=sys.stderr)
        return 1
    print(f'完成：{len(curriculum["phonemes"])} 个音素 -> {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
