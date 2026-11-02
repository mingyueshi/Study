"""Carry only the existing reference filters between fixed internal routes."""
from django import template

register = template.Library()
FILTERS = ("q", "collection", "layer", "region", "category", "named", "con", "page")


@register.simple_tag(takes_context=True)
def reference_query(context):
    request = context.get("request")
    if request is None:
        return ""
    values = request.GET.copy()
    for key in list(values):
        if key not in FILTERS or not values.get(key):
            del values[key]
    encoded = values.urlencode()
    return "?" + encoded if encoded else ""
