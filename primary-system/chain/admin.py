from django.contrib import admin

from .models import ChainWord, GameRound


@admin.register(ChainWord)
class ChainWordAdmin(admin.ModelAdmin):
    list_display = ('headword', 'first_char', 'last_char', 'game_eligible', 'updated_at')
    list_filter = ('game_eligible',)
    search_fields = ('entry__headword',)
    autocomplete_fields = ('entry',)
    list_select_related = ('entry',)
    actions = ('mark_eligible', 'mark_ineligible')
    fieldsets = ((None, {'fields': ('entry', 'game_eligible', 'first_char', 'last_char', 'note')}),)

    @admin.display(description='词头', ordering='entry__headword')
    def headword(self, obj):
        return obj.entry.headword

    @admin.action(description='设为可接龙')
    def mark_eligible(self, request, queryset):
        queryset.update(game_eligible=True)

    @admin.action(description='移出接龙')
    def mark_ineligible(self, request, queryset):
        queryset.update(game_eligible=False)


@admin.register(GameRound)
class GameRoundAdmin(admin.ModelAdmin):
    """对局记录只读展示：链 JSON 概览、归属与终局；不改玩家数据。"""

    list_display = ('owner_display', 'round_length', 'score', 'hints', 'status', 'ended_reason', 'updated_at')
    list_filter = ('status', 'ended_reason')
    search_fields = ('user__username', 'guest_key')
    list_select_related = ('user',)

    @admin.display(description='玩家')
    def owner_display(self, obj):
        return obj.user or f'游客 {obj.guest_key[:8]}'

    @admin.display(description='已接手数')
    def round_length(self, obj):
        return max(0, len(obj.chain) - 1)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
