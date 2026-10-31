from django.contrib import admin
from .models import Stage, Grade, Subject, TextbookEdition, Textbook, Module, TextbookBook, TopicBook, Unit, ContentItem, Placement
from lexicon.models import ContentEntryLink


class LexiconLinkInline(admin.TabularInline):
    model = ContentEntryLink
    fields = ('slot', 'sense', 'pronunciation', 'evidence', 'method')
    readonly_fields = fields
    extra = 0
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.has_perm('lexicon.view_contententrylink')


class NamedAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'order')
    search_fields = ('name', 'code')
    ordering = ('order', 'pk')


admin.site.register(Stage, NamedAdmin)
admin.site.register(Subject, NamedAdmin)


@admin.register(Grade)
class GradeAdmin(NamedAdmin):
    list_display = ('name', 'stage', 'code', 'order')
    list_filter = ('stage',)


@admin.register(TextbookEdition)
class EditionAdmin(NamedAdmin):
    list_display = ('name', 'subject', 'publisher', 'version')
    list_filter = ('subject', 'publisher')


@admin.register(Textbook)
class TextbookAdmin(NamedAdmin):
    list_display = ('name', 'edition', 'grade', 'term', 'revision')
    list_filter = ('edition__subject', 'edition', 'grade', 'term')
    autocomplete_fields = ('edition', 'grade')


@admin.register(Module)
class ModuleAdmin(NamedAdmin):
    list_display = ('name', 'subject', 'is_active', 'interactive_ready', 'order')
    list_filter = ('subject', 'is_active')


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0
    show_change_link = True


@admin.register(TextbookBook)
class TextbookBookAdmin(NamedAdmin):
    list_display = ('name', 'module', 'textbook', 'is_published')
    list_filter = ('module', 'textbook__grade', 'is_published')
    autocomplete_fields = ('textbook',)
    inlines = (UnitInline,)


@admin.register(TopicBook)
class TopicBookAdmin(NamedAdmin):
    list_display = ('name', 'module', 'is_published')
    list_filter = ('module', 'is_published')
    filter_horizontal = ('grades',)
    inlines = (UnitInline,)


class PlacementInline(admin.TabularInline):
    model = Placement
    extra = 0
    autocomplete_fields = ('item',)


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('title', 'book_kind', 'book_name', 'order')
    search_fields = ('title',)
    list_filter = ('textbook_book__module', 'topic_book__module', 'textbook_book', 'topic_book')
    inlines = (PlacementInline,)

    @admin.display(description='册类型')
    def book_kind(self, obj):
        return '教材同步' if obj.book_kind == 'textbook' else '主题探索'

    @admin.display(description='所属学习册', ordering='textbook_book__name')
    def book_name(self, obj):
        return str(obj.book)


@admin.register(ContentItem)
class ContentAdmin(admin.ModelAdmin):
    inlines = (LexiconLinkInline,)
    list_display = ('title', 'module', 'kind', 'status', 'import_locked', 'updated_at')
    list_filter = ('module', 'kind', 'status', 'import_locked')
    search_fields = ('title', 'summary', 'body', 'source_key')
    list_per_page = 30
    readonly_fields = ('id', 'schema_version', 'source_key', 'source_file', 'source_hash', 'source_payload', 'created_at', 'updated_at')
    fieldsets = (
        ('内容', {'fields': ('module', 'kind', 'title', 'summary', 'body', 'sections')}),
        ('发布与导入保护', {'fields': ('status', 'import_locked')}),
        ('来源留档', {'fields': ('id', 'schema_version', 'source_key', 'source_file', 'source_hash', 'source_payload', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def save_model(self, request, obj, form, change):
        # Explicitly unchecking a previously set lock permits a later import.
        if 'import_locked' not in form.changed_data:
            obj.import_locked = True
        super().save_model(request, obj, form, change)


@admin.register(Placement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = ('unit', 'item', 'order')
    search_fields = ('unit__title', 'item__title')
    list_filter = ('unit__textbook_book', 'unit__topic_book')
    autocomplete_fields = ('unit', 'item')
