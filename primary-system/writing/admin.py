from django.contrib import admin

from .models import WritingDraft


@admin.register(WritingDraft)
class WritingDraftAdmin(admin.ModelAdmin):
    """草稿是私人内容：后台只读 + 可删除（清理滥用），禁手工新增/修改。"""

    list_display = ('title', 'owner_display', 'topic_title', 'word_count', 'updated_at')
    search_fields = ('title', 'content', 'user__username')
    list_filter = ('updated_at',)
    ordering = ('-updated_at',)

    @admin.display(description='字数')
    def word_count(self, obj):
        return len(obj.content)

    @admin.display(description='归属')
    def owner_display(self, obj):
        return str(obj.user) if obj.user_id else f'游客 {obj.guest_key[:8]}'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
