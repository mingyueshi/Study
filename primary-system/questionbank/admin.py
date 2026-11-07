from django.contrib import admin

from .models import AnswerRecord, ImportReceipt, Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('stem', 'type', 'area', 'track', 'grade', 'source_key', 'source_ref', 'active')
    list_filter = ('area', 'track', 'type', 'grade', 'source_key', 'active')
    search_fields = ('stem', 'source_ref')
    readonly_fields = ('uuid', 'checksum', 'created_at', 'updated_at')


@admin.register(AnswerRecord)
class AnswerRecordAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'correct', 'created_at')
    list_filter = ('correct',)
    raw_id_fields = ('question',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ImportReceipt)
class ImportReceiptAdmin(admin.ModelAdmin):
    list_display = ('batch_id', 'digest', 'total', 'imported', 'duplicated', 'created_at')
    search_fields = ('batch_id',)
    readonly_fields = ('digest', 'created_at', 'updated_at')
