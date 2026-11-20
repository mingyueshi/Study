import json
from django.conf import settings

# 识别图和星表筛选共用 IAU 缩写与中文名。
ATLAS = json.loads((settings.BASE_DIR / 'content_sources' / 'astro-constellations.json').read_text(encoding='utf-8'))
CONSTELLATIONS = {code: item['name'] for code, item in ATLAS.items()}
