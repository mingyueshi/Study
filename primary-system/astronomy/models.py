from django.db import models


class CelestialRecord(models.Model):
    source_version = models.CharField(max_length=80, editable=False)
    catalogue_id = models.PositiveIntegerField("HYG编号", db_index=True)
    source_row = models.PositiveIntegerField(editable=False)
    source_path = models.CharField(max_length=300, editable=False)
    source_hash = models.CharField(max_length=64, editable=False)
    proper_name = models.CharField(max_length=150, blank=True, db_index=True)
    designation = models.CharField(max_length=150, blank=True, db_index=True)
    hip = models.CharField(max_length=30, blank=True, db_index=True)
    hd = models.CharField(max_length=30, blank=True, db_index=True)
    hr = models.CharField(max_length=30, blank=True)
    gl = models.CharField(max_length=80, blank=True)
    constellation = models.CharField(max_length=8, blank=True, db_index=True)
    ra_hours = models.FloatField(null=True)
    dec_degrees = models.FloatField(null=True)
    raw_distance_pc = models.FloatField(null=True)
    distance_pc = models.FloatField(null=True)
    distance_unknown = models.BooleanField(default=False, db_index=True)
    magnitude = models.FloatField(null=True)
    absolute_magnitude = models.FloatField(null=True)
    spectral_type = models.CharField(max_length=100, blank=True)
    color_index = models.FloatField(null=True)
    luminosity_solar = models.FloatField(null=True)
    component = models.CharField(max_length=30, blank=True)
    primary_component_id = models.CharField(max_length=30, blank=True)
    variability = models.CharField(max_length=80, blank=True)
    raw = models.JSONField(default=dict, editable=False)
    name_zh = models.CharField(
        "已确认常用中文名", max_length=150, blank=True, db_index=True
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("catalogue_id",)
        constraints = [
            models.UniqueConstraint(
                fields=("source_version", "catalogue_id"), name="astro_hyg_version_id"
            )
        ]

    @property
    def display_name(self):
        if self.name_zh:
            return self.name_zh
        original = self.proper_name or self.designation
        return f"HYG {self.catalogue_id}号天体" + (f" · {original}" if original else "")

    @property
    def object_kind(self):
        return "太阳（本太阳系恒星）" if self.catalogue_id == 0 else "星表天体"

    def __str__(self):
        return self.display_name


class NamedCelestialRecord(models.Model):
    record = models.OneToOneField(
        CelestialRecord, on_delete=models.PROTECT, related_name="named_selection"
    )
    source_path = models.CharField(max_length=300, editable=False)
    source_row = models.PositiveIntegerField(editable=False)
    source_hash = models.CharField(max_length=64, editable=False)

    class Meta:
        ordering = ("record__catalogue_id",)
