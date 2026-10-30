from django.contrib import admin
from .models import Idiom, Round
@admin.register(Idiom)
class IdiomAdmin(admin.ModelAdmin):
    list_display=('word','pinyin','source','reading_status','game_eligible','enabled')
    search_fields=('word','meaning')
    list_filter=('source','reading_status','game_eligible','enabled')
    def save_model(self,request,obj,form,change):
        obj.import_locked=True
        super().save_model(request,obj,form,change)
    readonly_fields=('source_explanation','source_raw','source_version','source_url','first_char','last_char')
    fieldsets=(
        ('成语与保留释义', {'fields':('word','meaning','source','enabled','import_locked')}),
        ('词典完整资料', {'fields':('source_explanation','pinyin','derivation','example','abbreviation')}),
        ('审查与接龙资格', {'fields':('reading_status','game_eligible','first_char','last_char')}),
        ('来源原始记录（含全部字段）', {'fields':('source_version','source_url','source_raw')}),
    )
@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display=('id','score','hints','status','created_at')
    readonly_fields=('id','owner','chain','score','hints','revision','status','created_at')
    def has_add_permission(self,request): return False
    def has_change_permission(self,request,obj=None): return False
    def has_delete_permission(self,request,obj=None): return False
admin.site.site_header='成语接龙 · 管理'
