from django.db import models


class HanziAsset(models.Model):
    version = models.CharField(
        max_length=100, default="bddc96d41bef78427ed0e034e9f7e31d71fd1b92"
    )
    character = models.CharField(max_length=4, db_index=True)
    definition_en = models.TextField(blank=True)
    pinyin = models.JSONField(default=list)
    decomposition = models.TextField(blank=True)
    radical = models.CharField(max_length=20, blank=True)
    dictionary_data = models.JSONField(default=dict)
    strokes = models.JSONField(default=list)
    medians = models.JSONField(default=list)
    source_row = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "character"], name="hanzi_asset_character_version"
            )
        ]


class UnihanCharacter(models.Model):
    version = models.CharField(max_length=30, default="17.0.0")
    codepoint = models.CharField(max_length=12, db_index=True)
    character = models.CharField(max_length=4, db_index=True)
    mandarin = models.CharField(max_length=1000, blank=True, db_index=True)
    definition_en = models.TextField(blank=True)
    total_strokes = models.CharField(max_length=100, blank=True)
    properties = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "codepoint"], name="hanzi_unihan_codepoint_version"
            )
        ]


class UnihanProperty(models.Model):
    character = models.ForeignKey(
        UnihanCharacter, on_delete=models.PROTECT, related_name="property_rows"
    )
    name = models.CharField(max_length=100, db_index=True)
    value = models.TextField()
    source_file = models.CharField(max_length=100)
    source_line = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["character", "name"], name="hanzi_unihan_property_unique"
            )
        ]
