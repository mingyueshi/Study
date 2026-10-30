from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class LearnerAdmin(UserAdmin):
    list_display = ('username', 'display_name', 'grade', 'is_active', 'is_staff')
    list_filter = ('grade', 'is_active', 'is_staff', 'groups')
    fieldsets = UserAdmin.fieldsets + (('学习偏好', {'fields': ('display_name', 'grade')}),)
    add_fieldsets = UserAdmin.add_fieldsets + (('学习偏好', {'fields': ('display_name', 'grade')}),)

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
