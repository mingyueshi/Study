"""语文教材改为文件编排（chinesebook）：下架旧扁平阅读器的同步册入口。

语文内容页由 chinesebook 应用承载（内容源头 primary/knowledge-data.js），
catalog 里 primary-knowledge-all 同步册从书架与模块书网格隐藏；
ContentItem 保持 published，学习总览与搜索口径不变。可逆操作。
"""
from django.db import migrations

BOOK_CODE = 'primary-knowledge-all'


def hide_book(apps, schema_editor):
    TextbookBook = apps.get_model('catalog', 'TextbookBook')
    TextbookBook.objects.filter(code=BOOK_CODE).update(is_published=False)


def show_book(apps, schema_editor):
    TextbookBook = apps.get_model('catalog', 'TextbookBook')
    TextbookBook.objects.filter(code=BOOK_CODE).update(is_published=True)


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0008_hide_primary_math_book'),
    ]

    operations = [migrations.RunPython(hide_book, show_book)]
