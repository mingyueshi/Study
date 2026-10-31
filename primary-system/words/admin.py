from django.contrib import admin

from .models import Scenario, ScenarioWord, WordProgress


@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ('emoji', 'zh', 'name', 'code', 'order')
    list_editable = ('order',)
    search_fields = ('name', 'zh', 'code')
    ordering = ('order', 'pk')
    inlines = ()

    def has_delete_permission(self, request, obj=None):
        # 场景被词位 PROTECT 引用；删除请先清空词位，避免误删整组内容。
        return False


@admin.register(ScenarioWord)
class ScenarioWordAdmin(admin.ModelAdmin):
    list_display = ('en', 'scenario', 'entry_headword', 'emoji', 'annotated')
    search_fields = ('en', 'entry__headword')
    list_filter = ('scenario',)
    list_select_related = ('scenario', 'entry')
    autocomplete_fields = ('entry', 'scenario')
    fieldsets = (
        ('词典源（内容源，经导入挂接）', {'fields': ('en', 'entry')}),
        ('教学标注', {'fields': ('scenario', 'emoji', 'segments', 'memo', 'related')}),
    )

    @admin.display(description='词典词头')
    def entry_headword(self, obj):
        return obj.entry.headword

    @admin.display(description='教学标注', boolean=True)
    def annotated(self, obj):
        return bool(obj.memo or obj.segments or obj.related)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(WordProgress)
class WordProgressAdmin(admin.ModelAdmin):
    list_display = ('owner_display', 'word', 'learned', 'updated_at')
    list_filter = ('learned',)
    search_fields = ('word__en', 'user__username', 'guest_key')
    list_select_related = ('word', 'user')

    @admin.display(description='学习者', ordering='user__username')
    def owner_display(self, obj):
        return obj.user or f'游客 {obj.guest_key[:8]}'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
