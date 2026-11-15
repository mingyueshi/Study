from django import template

from geographystudy.solar_terms_content import find_term, load_content
from reference_library.models import Dataset

register = template.Library()


@register.simple_tag
def solar_term_context(code):
    """只接受文件源中的节气 ID，不接受任意返回地址。"""
    return find_term(code)


@register.inclusion_tag('study_topics/solar_journey.html')
def solar_journey(code, focus):
    term = find_term(code)
    return {
        'solar_journey': term, 'solar_focus': focus,
        'solar_poetry_ready': bool(term) and Dataset.objects.filter(code='poetry', state='ready').exists(),
    }


@register.inclusion_tag('poetry/solar_season_bridge.html')
def solar_season_bridge(code, compact=False):
    content = load_content()
    season = next((season for season in content['seasons'] if season['id'] == code), None)
    return {'solar_season': season, 'compact': compact}
