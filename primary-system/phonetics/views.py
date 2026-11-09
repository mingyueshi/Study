from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .catalog import grouped_phonemes, pronunciation_theory


@never_cache
@require_safe
def index(request):
    # 只读浏览：不写学习记录；页面数据每次按词库当前生效版本实时解析。
    groups = grouped_phonemes()
    return render(request, 'phonetics/index.html', {'groups': groups, 'theory': pronunciation_theory(groups)})
