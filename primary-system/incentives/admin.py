"""Nova 后台注册：家长在这里配置奖励项、核销兑换；流水/打卡/勋章只读。

兑换处理只有两个动作：核销（标记已发放）与取消（积分原路退回），都走
服务层保证流水一致；核销备注可在详情页补充。
"""
from django.contrib import admin

from . import services
from .models import BadgeAward, CheckIn, PointEvent, Redemption, RewardItem


@admin.register(RewardItem)
class RewardItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'cost', 'is_active', 'sort')
    list_editable = ('cost', 'is_active', 'sort')
    search_fields = ('name',)
    list_display_links = ('name',)


@admin.register(Redemption)
class RedemptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'item_name', 'cost', 'status', 'requested_at', 'resolved_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'item_name')
    actions = ('mark_done', 'cancel_and_refund')
    readonly_fields = ('user', 'item', 'item_name', 'cost', 'status', 'requested_at', 'resolved_at')

    @admin.action(description='标记为已发放（核销）')
    def mark_done(self, request, queryset):
        count = 0
        for redemption in queryset.filter(status=Redemption.Status.PENDING):
            services.mark_redemption_done(redemption)
            count += 1
        self.message_user(request, f'已核销 {count} 条兑换记录。')

    @admin.action(description='取消兑换并退回积分')
    def cancel_and_refund(self, request, queryset):
        count = 0
        for redemption in queryset.filter(status=Redemption.Status.PENDING):
            services.cancel_redemption(redemption)
            count += 1
        self.message_user(request, f'已取消 {count} 条兑换记录，积分已退回。')


class ReadOnlyAdmin(admin.ModelAdmin):
    """激励流水类记录由系统产生，后台只看不改。"""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PointEvent)
class PointEventAdmin(ReadOnlyAdmin):
    list_display = ('user', 'code', 'points', 'note', 'created_at')
    list_filter = ('code',)
    search_fields = ('user__username', 'note')


@admin.register(CheckIn)
class CheckInAdmin(ReadOnlyAdmin):
    list_display = ('user', 'date', 'created_at')


@admin.register(BadgeAward)
class BadgeAwardAdmin(ReadOnlyAdmin):
    list_display = ('user', 'badge', 'awarded_at')
    search_fields = ('user__username', 'badge')
