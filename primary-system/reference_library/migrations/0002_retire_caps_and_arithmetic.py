from django.db import migrations

RETIRED_ARCHIVES = (
    "03a_science_epub_part001_2026-11-02.zip",
    "03b_science_epub_part002_2026-11-02.zip",
    "03c_science_epub_part003_2026-11-02.zip",
)
RETIRED_MODELS = (
    "sciencebook",
    "sciencedocument",
    "sciencesection",
    "scienceimage",
    "scienceactivity",
    "sciencequestion",
    "restrictedscience",
)


def retire_scope(apps, schema_editor):
    alias = schema_editor.connection.alias
    SourceFile = apps.get_model("reference_library", "SourceFile")
    ArchivePackage = apps.get_model("reference_library", "ArchivePackage")
    Dataset = apps.get_model("reference_library", "Dataset")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")
    SourceFile.objects.using(alias).filter(package__name__in=RETIRED_ARCHIVES).delete()
    SourceFile.objects.using(alias).filter(
        package__name="02a_geography_english_elements_math_2026-11-02.zip",
        path__startswith="math_seed/",
    ).delete()
    ArchivePackage.objects.using(alias).filter(name__in=RETIRED_ARCHIVES).delete()
    Dataset.objects.using(alias).filter(
        code__in=("science-caps4", "arithmetic")
    ).delete()
    retired = ContentType.objects.using(alias).filter(
        app_label="science", model__in=RETIRED_MODELS
    ) | ContentType.objects.using(alias).filter(
        app_label="arithmetic", model="arithmeticfact"
    )
    Permission.objects.using(alias).filter(content_type__in=retired).delete()
    retired.delete()
    # ImportRun is historical evidence; its old scope/counts deliberately remain intact.


class Migration(migrations.Migration):
    dependencies = [
        ("reference_library", "0001_initial"),
        ("science", "0003_retire_textbook_and_arithmetic"),
        ("arithmetic", "0002_retire_textbook_and_arithmetic"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]
    operations = [migrations.RunPython(retire_scope)]
