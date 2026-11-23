from functools import lru_cache
import json

from django.conf import settings

from .models import ENGLISH_RELATION_TAGS


@lru_cache(maxsize=1)
def _curated_word_links():
    source = settings.BASE_DIR / 'content_sources/english-word-links.json'
    units = json.loads(source.read_text(encoding='utf-8'))
    return {
        f'primary:english:{unit}:{unit}:{word}': [
            {'type': relation, 'en': en, 'zh': zh}
            for relation in ENGLISH_RELATION_TAGS
            for en, zh in groups.get(relation, [])
        ]
        for unit, words in units.items()
        for word, groups in words.items()
    }


def english_word_links(item):
    """为已有教材词卡应用发布的关联词编排，受保护的卡继续使用库内内容。"""
    source_key = item.source_key or ''
    if source_key.startswith('primary:english:') and not item.import_locked:
        curated = _curated_word_links().get(source_key)
        if curated is not None:
            return curated
    payload = item.source_payload if isinstance(item.source_payload, dict) else {}
    links = payload.get('links')
    return links if isinstance(links, list) else []
