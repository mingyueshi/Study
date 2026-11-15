from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe

from .catalog import grouped_phonemes, pronunciation_theory
from .practice import practice_material


@never_cache
@require_safe
def index(request):
    # 服务端只读；自测进度仅在浏览器按账号保存。
    groups = grouped_phonemes()
    theory = pronunciation_theory(groups)
    return render(request, 'phonetics/index.html', {
        'groups': groups, 'theory': theory, 'practice': practice_material(groups, theory),
        'practice_storage_key': f'phonetics_practice_v1:user-{request.user.pk}'
        if request.user.is_authenticated else 'phonetics_practice_v1:guest',
    })
