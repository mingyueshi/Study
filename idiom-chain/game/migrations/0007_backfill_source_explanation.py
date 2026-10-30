from django.db import migrations


def populate(apps,schema_editor):
    Idiom=apps.get_model('game','Idiom')
    items=list(Idiom.objects.only('id','source_raw','source_explanation'))
    for item in items:
        raw=item.source_raw if isinstance(item.source_raw,dict) else {}
        text=raw.get('explanation','')
        item.source_explanation=text if isinstance(text,str) else ''
    Idiom.objects.bulk_update(items,['source_explanation'],batch_size=250)


class Migration(migrations.Migration):
    dependencies=[('game','0006_idiom_source_explanation_alter_idiom_meaning')]
    operations=[migrations.RunPython(populate,migrations.RunPython.noop)]
