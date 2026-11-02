"""Imported lexical evidence candidates. Never auto-merge into selected Sense identities."""

from django.db import models


class CedictRecord(models.Model):
    version = models.CharField(max_length=100, default="2026-10-31T21:06:18Z")
    source_line = models.PositiveIntegerField()
    simplified = models.CharField(max_length=240, db_index=True)
    traditional = models.CharField(max_length=240, db_index=True)
    pinyin_numbered = models.CharField(max_length=500)
    definitions_en = models.JSONField(default=list)
    definition_text = models.TextField()
    source_path = models.CharField(max_length=300)
    matched_sense = models.ForeignKey(
        "lexicon.Sense",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="+",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "source_line"], name="ref_cedict_source_line"
            )
        ]


class CmuPronunciation(models.Model):
    version = models.CharField(
        max_length=100, default="74790861f652b15e4ac49015a90074ad62a27690"
    )
    source_row = models.PositiveIntegerField()
    entry = models.CharField(max_length=160)
    word = models.CharField(max_length=160, db_index=True)
    search_word = models.CharField(max_length=160, db_index=True)
    variant = models.PositiveIntegerField()
    phonemes = models.CharField(max_length=600)
    note = models.TextField(blank=True)
    source_path = models.CharField(max_length=300)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "source_row"], name="ref_cmu_source_row"
            )
        ]
