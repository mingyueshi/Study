"""专题探索册退场：专题内容各自成为独立玩法应用（如 chain）。

TopicBook 及 Unit.topic_book 删除；存量编排已在更名窗口清理并按教材管线重导，
Unit.textbook_book 现有行全部非空，直接收紧为 NOT NULL 安全。
"""
import catalog.models
from django.db import migrations, models
from django.db.models import PROTECT


def textbook_book_field():
    return models.ForeignKey(on_delete=PROTECT, related_name='units', to='catalog.textbookbook',
                             verbose_name='教材同步册')


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_textbookbook_topicbook_remove_collection_grades_and_more'),
    ]

    operations = [
        # SQLite 删列会重建整表：必须先移除引用 topic_book 的约束，再删列。
        migrations.RemoveConstraint(
            model_name='unit',
            name='unit_topic_code_unique',
        ),
        migrations.RemoveConstraint(
            model_name='unit',
            name='unit_book_exclusive',
        ),
        migrations.RemoveField(
            model_name='unit',
            name='topic_book',
        ),
        migrations.DeleteModel(
            name='TopicBook',
        ),
        migrations.AlterField(
            model_name='unit',
            name='textbook_book',
            field=textbook_book_field(),
        ),
    ]
