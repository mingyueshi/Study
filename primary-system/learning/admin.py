from django.contrib import admin
from .models import Progress

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'status', 'bookmarked', 'updated_at')
    list_filter = ('status', 'bookmarked', 'item__module')
    search_fields = ('user__username', 'item__title')
    readonly_fields = ('user', 'item', 'status', 'bookmarked', 'note', 'revision', 'updated_at')

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
