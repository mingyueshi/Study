from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.html import format_html, format_html_join
from .forms import SenseForm, PronunciationForm
from .models import (ContentEntryLink, EntryForm, EntryMatch, LexicalEntry, LexiconAudit, LexiconSource,
                     Pronunciation, Sense, SourceBinding, SourceRecord, SourceRelease)
from .services import activate_release, link_state, merge_match, release_diff, review_objects, revise


class NoDeleteAdmin(admin.ModelAdmin):
    def has_delete_permission(self, request, obj=None):
        return False


class ReadOnlyAdmin(NoDeleteAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]


@admin.register(LexiconSource)
class SourceAdmin(NoDeleteAdmin):
    list_display = ('name', 'code', 'active_release', 'public_allowed', 'enabled', 'priority')
    search_fields = ('name', 'code')
    list_filter = ('public_allowed', 'enabled')
    readonly_fields = ('active_release',)
    fields = ('code', 'name', 'url', 'attribution', 'code_license', 'data_license', 'license_url', 'changes', 'rights_evidence', 'public_allowed', 'enabled', 'priority', 'active_release')

    def has_add_permission(self, request):
        return request.user.has_perm('lexicon.manage_sources') and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return request.user.has_perm('lexicon.manage_sources') and super().has_change_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return ('active_release', 'code') if obj else ('active_release',)

    @transaction.atomic
    def save_model(self, request, obj, form, change):
        editable = ['name', 'url', 'attribution', 'code_license', 'data_license', 'license_url', 'changes', 'rights_evidence', 'public_allowed', 'enabled', 'priority']
        old = LexiconSource.objects.select_for_update().get(pk=obj.pk) if change else None
        before = {f: getattr(old, f) for f in editable} if old else {}
        if old:
            obj.active_release_id = old.active_release_id
            obj.save(update_fields=editable)
        else:
            obj.save()
        LexiconAudit.objects.create(action='source_policy', source=obj, actor=request.user,
                                   reason=obj.rights_evidence or '更新来源元数据', before=before,
                                   after={f: getattr(obj, f) for f in editable})


@admin.register(SourceRelease)
class ReleaseAdmin(ReadOnlyAdmin):
    list_display = ('source', 'version', 'status', 'processed', 'total', 'created_at')
    list_filter = ('source', 'status')
    search_fields = ('version', 'source__name', 'checksum')
    list_select_related = ('source',)
    actions = ['activate']

    def get_actions(self, request):
        return super().get_actions(request) if request.user.has_perm('lexicon.manage_sources') else {}

    @admin.action(description='查看差异并启用／回退所选版本')
    def activate(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, '一次只能切换一个来源版本。', messages.ERROR)
            return
        release = queryset.select_related('source').get()
        if request.POST.get('confirm') == 'yes':
            try:
                activate_release(release.pk, expected_current=request.POST.get('expected_current'),
                                 reason=request.POST.get('reason', ''), actor=request.user)
            except ValidationError as exc:
                self.message_user(request, '; '.join(exc.messages), messages.ERROR)
            else:
                self.message_user(request, '版本已切换；公开准入和教学关联保持各自的审核状态。', messages.SUCCESS)
            return HttpResponseRedirect(request.get_full_path())
        return TemplateResponse(request, 'admin/lexicon/confirm_action.html', {
            **self.admin_site.each_context(request), 'title': '核对来源版本差异', 'opts': self.model._meta,
            'selected': release.pk, 'action_name': 'activate', 'object_label': str(release),
            'expected_current': str(release.source.active_release_id or ''), 'impact': release_diff(release),
            'description': '启用后只读取所选完整版本。旧版记录继续留档；此操作不授予公开展示权限。',
        })


class ReviewAdmin(NoDeleteAdmin):
    actions = ['publish', 'unpublish']

    def has_add_permission(self, request):
        return False

    def get_actions(self, request):
        return super().get_actions(request) if request.user.has_perm('lexicon.publish_lexicon') else {}

    @admin.action(description='审核通过（仍须来源已启用且准许公开）')
    def publish(self, request, queryset):
        try:
            review_objects(queryset, publish=True, actor=request.user)
        except ValidationError as exc:
            self.message_user(request, '; '.join(exc.messages), messages.ERROR)
        else:
            self.message_user(request, '审查状态已更新。')

    @admin.action(description='撤回审查通过状态')
    def unpublish(self, request, queryset):
        review_objects(queryset, publish=False, actor=request.user)
        self.message_user(request, '已撤回。')


@admin.register(LexicalEntry)
class EntryAdmin(ReviewAdmin):
    list_display = ('headword', 'language', 'kind', 'status', 'id')
    search_fields = ('headword', 'lookup_key')
    list_filter = ('language', 'kind', 'status')
    readonly_fields = ('id', 'language', 'headword', 'lookup_key', 'kind', 'status', 'merged_into', 'created_at')
    fields = readonly_fields + ('notes',)


class EditorialAdmin(ReviewAdmin):
    @transaction.atomic
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        if request.method == 'POST' and object_id:
            try:
                self.model.objects.select_for_update().filter(pk=object_id).first()
            except (ValidationError, ValueError):
                pass
        return super().changeform_view(request, object_id, form_url, extra_context)

    def get_readonly_fields(self, request, obj=None):
        return ('id', 'entry', 'revision', 'source_text') + self.extra_readonly

    @admin.display(description='当前来源文本（原始证据）')
    def source_text(self, obj):
        from .models import active_records
        records = active_records().filter(**{self.record_filter: obj.pk}).select_related('release__source')[:10]
        return '\n\n'.join(f'{record.release.source.name} / {record.release.version}\n{getattr(record, self.source_field)}' for record in records) or '暂无生效来源；请在来源版本中核对并启用。'

    def save_model(self, request, obj, form, change):
        current = revise(obj, value=form.cleaned_data[self.editorial_field], note=form.cleaned_data['editorial_note'],
                         expected_revision=form.cleaned_data['expected_revision'], actor=request.user)
        obj.revision = current.revision
        if isinstance(current, Sense):
            obj.status = current.status
        else:
            obj.is_reviewed = current.is_reviewed


@admin.register(Sense)
class SenseAdmin(EditorialAdmin):
    form = SenseForm
    list_display = ('entry', 'gloss_language', 'status', 'revision')
    list_filter = ('status', 'gloss_language')
    search_fields = ('entry__headword', 'editorial_definition')
    list_select_related = ('entry',)
    extra_readonly = ('gloss_language', 'status')
    record_filter, source_field, editorial_field = 'binding__sense_id', 'definition', 'editorial_definition'
    fields = ('id', 'entry', 'gloss_language', 'source_text', 'editorial_definition', 'editorial_note', 'expected_revision', 'revision', 'status')


@admin.register(Pronunciation)
class PronunciationAdmin(EditorialAdmin):
    form = PronunciationForm
    list_display = ('entry', 'system', 'region', 'is_reviewed', 'revision')
    list_filter = ('system', 'is_reviewed')
    search_fields = ('entry__headword', 'editorial_value')
    list_select_related = ('entry',)
    extra_readonly = ('system', 'region', 'is_reviewed')
    record_filter, source_field, editorial_field = 'binding__pronunciation_id', 'pronunciation_value', 'editorial_value'
    fields = ('id', 'entry', 'system', 'region', 'source_text', 'editorial_value', 'editorial_note', 'expected_revision', 'revision', 'is_reviewed')


@admin.register(SourceBinding)
class BindingAdmin(ReadOnlyAdmin):
    list_display = ('source', 'external_key', 'sense', 'pronunciation')
    list_filter = ('source',)
    search_fields = ('external_key', 'sense__entry__headword')
    list_select_related = ('source', 'sense__entry', 'pronunciation__entry')


@admin.register(SourceRecord)
class RecordAdmin(ReadOnlyAdmin):
    list_display = ('headword', 'release', 'part_of_speech', 'pronunciation_value')
    list_filter = ('release__source', 'release')
    search_fields = ('headword', 'binding__external_key')
    list_select_related = ('release__source',)
    show_full_result_count = False
    list_per_page = 30


@admin.register(EntryForm)
class FormAdmin(ReadOnlyAdmin):
    list_display = ('text', 'role', 'source_path')
    list_filter = ('role', 'record__release__source')
    search_fields = ('text', 'lookup_key')


@admin.register(ContentEntryLink)
class LinkAdmin(NoDeleteAdmin):
    list_display = ('content', 'sense', 'method', 'source_state')
    list_select_related = ('content', 'sense__entry', 'evidence__release__source', 'evidence__binding')
    list_filter = ('method', 'evidence__release__source')
    search_fields = ('content__title', 'sense__entry__headword')
    autocomplete_fields = ('content', 'sense', 'pronunciation', 'evidence')
    readonly_fields = ('updated_at', 'method', 'source_state')

    @admin.display(description='来源变化检查')
    def source_state(self, obj):
        return link_state(obj) if obj else ''

    def save_model(self, request, obj, form, change):
        before = ContentEntryLink.objects.filter(pk=obj.pk).values('sense_id', 'pronunciation_id', 'evidence_id').first() if change else {}
        obj.method = 'manual'
        obj.save()
        LexiconAudit.objects.create(action='link_content', actor=request.user, reason=obj.review_note or '人工确认教学关联',
                                   before={k: str(v or '') for k, v in (before or {}).items()},
                                   after={'content': str(obj.content_id), 'sense': str(obj.sense_id), 'record': str(obj.evidence_id)})


@admin.register(EntryMatch)
class MatchAdmin(NoDeleteAdmin):
    list_display = ('left', 'right', 'status', 'note')
    list_filter = ('status', 'left__language', 'left__kind')
    search_fields = ('left__headword', 'right__headword')
    list_select_related = ('left', 'right')
    readonly_fields = ('left', 'right', 'status', 'comparison')
    actions = ['merge', 'keep_distinct']

    def has_add_permission(self, request):
        return False

    @admin.display(description='双方来源与义项（每方最近 20 条证据）')
    def comparison(self, obj):
        if not obj:
            return ''
        panels = []
        for entry in (obj.left, obj.right):
            records = SourceRecord.objects.filter(binding__sense__entry=entry).select_related(
                'release__source', 'binding__sense', 'binding__pronunciation'
            ).order_by('-release__created_at', 'pk')[:20]
            rows = []
            for record in records:
                pronunciation = record.binding.pronunciation
                rows.append((
                    reverse('admin:lexicon_sourcerecord_change', args=[record.pk]),
                    str(record.release), record.release.get_status_display(),
                    str(record.binding.sense_id), record.definition[:1500] or '未提供',
                    record.pronunciation_value or '未提供',
                    record.binding.sense.editorial_definition or '未修订',
                    pronunciation.editorial_value if pronunciation and pronunciation.editorial_value else '未修订',
                ))
            evidence = format_html_join('', '<li><a href="{}">{}</a>（{}）<br>义项：{}<br>来源释义：{}<br>来源读音：{}<br>人工释义：{}<br>人工读音：{}</li>', rows)
            panels.append((entry.headword, str(entry.pk), evidence))
        return format_html_join('', '<section><h3>{}</h3><p>{}</p><ul>{}</ul></section>', panels)

    @admin.action(description='确认同一词条，归并词头并保留各义项', permissions=['change'])
    def merge(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, '一次仅核对一对词条。', messages.ERROR)
            return
        candidate = queryset.get()
        if request.POST.get('confirm') == 'yes':
            try:
                merge_match(candidate.pk, reason=request.POST.get('reason', ''), actor=request.user)
            except ValidationError as exc:
                self.message_user(request, '; '.join(exc.messages), messages.ERROR)
            else:
                self.message_user(request, '已归并词条，全部义项、读音和教学引用保留。')
            return HttpResponseRedirect(request.get_full_path())
        return TemplateResponse(request, 'admin/lexicon/confirm_action.html', {
            **self.admin_site.each_context(request), 'opts': self.model._meta, 'title': '核对同形词',
            'selected': candidate.pk, 'action_name': 'merge', 'object_label': f'{candidate.left} ← {candidate.right}',
            'comparison': self.comparison(candidate),
            'description': '仅在确定属于同一词条时归并。各来源义项分别保留，原词条 UUID 保留为重定向；不会推断义项相同。',
        })

    @admin.action(description='确认为不同词条', permissions=['change'])
    def keep_distinct(self, request, queryset):
        for obj in queryset.filter(status='pending'):
            obj.status = 'distinct'
            obj.note = obj.note or '后台人工判定为不同词条。'
            obj.save(update_fields=['status', 'note'])
            LexiconAudit.objects.create(action='distinct_entries', actor=request.user, reason=obj.note,
                                       before={'candidate': obj.pk}, after={'status': 'distinct'})


@admin.register(LexiconAudit)
class AuditAdmin(ReadOnlyAdmin):
    list_display = ('action', 'source', 'actor', 'created_at')
    list_filter = ('action', 'source')
    search_fields = ('reason',)
    list_select_related = ('source', 'actor')
