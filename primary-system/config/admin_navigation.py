"""后台导航徽标：先过权限再有界计数，provider 由 nova_admin 渲染层信任。"""


def badges(request, available_apps):
    user = getattr(request, 'user', None)
    if user is None or not getattr(user, 'is_active', False):
        return {}
    counts = {}
    if user.has_perm('catalog.view_contentitem'):
        from catalog.models import ContentItem
        counts['catalog.contentitem'] = ContentItem.objects.filter(status='draft').count()
    if user.has_perm('lexicon.view_entrymatch'):
        from lexicon.models import EntryMatch
        counts['lexicon.entrymatch'] = EntryMatch.objects.filter(status='pending').count()
    if user.has_perm('lexicon.view_sourcerelease'):
        from lexicon.models import SourceRelease
        counts['lexicon.sourcerelease'] = SourceRelease.objects.filter(status='importing').count()
    if user.has_perm('chain.view_chainword'):
        from chain.models import ChainWord
        counts['chain.chainword'] = ChainWord.objects.filter(game_eligible=True).count()
    # 与首页待办使用同一 ModelAdmin 查看权限和查询集。
    from django.contrib import admin
    from incentives.models import Redemption
    model_admin = admin.site._registry.get(Redemption)
    if model_admin and model_admin.has_module_permission(request) and (
        model_admin.has_view_permission(request) or model_admin.has_change_permission(request)
    ):
        counts['incentives.redemption'] = model_admin.get_queryset(request).filter(
            status=Redemption.Status.PENDING).count()
    return counts
