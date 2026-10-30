from django.db import migrations

def populate(apps,schema_editor):
    Idiom=apps.get_model('game','Idiom')
    for item in Idiom.objects.all().iterator():
        item.first_char=item.word[:1]
        item.last_char=item.word[-1:]
        item.save(update_fields=['first_char','last_char'])

class Migration(migrations.Migration):
    dependencies=[('game','0003_idiom_abbreviation_idiom_derivation_idiom_example_and_more')]
    operations=[migrations.RunPython(populate,migrations.RunPython.noop)]
