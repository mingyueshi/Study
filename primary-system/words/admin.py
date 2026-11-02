from django.contrib import admin

from .models import LearningTarget, Scenario, ScenarioWord, WordProgress


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
    search_fields = ('en', 'target__sense__entry__headword')
    list_filter = ('scenario',)
    list_select_related = ('scenario', 'target__sense__entry')
    autocomplete_fields = ('target', 'scenario')
    readonly_fields = ('entry',)
    fieldsets = (
        ('学习目标', {'fields': ('en', 'target')}),
        ('历史引用（仅追溯，不用于释义）', {'fields': ('entry',), 'classes': ('collapse',)}),
        ('教学标注', {'fields': ('scenario', 'order', 'emoji', 'segments', 'memo', 'related')}),
    )

    @admin.display(description='词典词头')
    def entry_headword(self, obj):
        return obj.target.sense.entry.headword if obj.target.sense_id else '待复核'

    @admin.display(description='教学标注', boolean=True)
    def annotated(self, obj):
        return bool(obj.memo or obj.segments or obj.related)


@admin.register(LearningTarget)
class LearningTargetAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    list_display = ('label', 'id', 'sense', 'evidence', 'review_note')
    search_fields = ('label',)
    autocomplete_fields = ('sense', 'pronunciation', 'evidence')
    readonly_fields = ('legacy', 'capability', 'editorial_snapshot', 'chinese_version', 'presentation_revision', 'semantic_established')

    def get_readonly_fields(self, request, obj=None):
        return self.readonly_fields + (('label', 'sense', 'pronunciation', 'evidence') if obj else ())

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(WordProgress)
class WordProgressAdmin(admin.ModelAdmin):
    list_display = ('owner_display', 'target', 'learned', 'revision', 'seen_chinese_version', 'seen_presentation_revision', 'updated_at')
    list_filter = ('learned',)
    search_fields = ('target__label', 'user__username', 'guest_key')
    list_select_related = ('target', 'user')

    @admin.display(description='学习者', ordering='user__username')
    def owner_display(self, obj):
        return obj.user or f'游客 {obj.guest_key[:8]}'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


from .models import TargetChineseAdoption
@admin.register(TargetChineseAdoption)
class TargetChineseAdoptionAdmin(admin.ModelAdmin):
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
