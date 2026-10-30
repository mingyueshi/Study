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
    if user.has_perm('games.view_chainword'):
        from games.models import ChainWord
        counts['games.chainword'] = ChainWord.objects.filter(game_eligible=True).count()
    return counts
