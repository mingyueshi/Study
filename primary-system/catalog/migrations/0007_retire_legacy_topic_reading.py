"""Also clean orphaned topic cards in databases that already applied the old 0005."""
from django.db import migrations
from ._retire_topic_reading import retire_topic_reading


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0006_remove_unit_unit_textbook_code_unique_and_more'),
        ('learning', '0001_initial'),
        ('lexicon', '0001_initial'),
    ]

    operations = [migrations.RunPython(retire_topic_reading)]
