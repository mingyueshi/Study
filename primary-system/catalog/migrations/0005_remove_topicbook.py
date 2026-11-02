"""专题探索册退场：专题内容各自成为独立玩法应用（如 chain）。

用户已确认清理旧专题阅读；先清理其专属编排、内容及阅读关联，再删除表和字段。
教材内容、学习记录、词库及独立玩法数据保留。数据清理不可逆，升级前需备份。
"""
from django.db import migrations, models
from django.db.models import PROTECT
from ._retire_topic_reading import retire_topic_reading


def textbook_book_field():
    return models.ForeignKey(on_delete=PROTECT, related_name='units', to='catalog.textbookbook',
                             verbose_name='教材同步册')


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_textbookbook_topicbook_remove_collection_grades_and_more'),
    ]

    operations = [
        migrations.RunPython(retire_topic_reading),
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
