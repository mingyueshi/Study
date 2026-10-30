from django.contrib import admin

from .models import ChainWord


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
