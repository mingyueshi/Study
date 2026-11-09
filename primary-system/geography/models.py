from django.db import models


class CountryRegion(models.Model):
    dataset_code = models.CharField(max_length=80, default="countries", editable=False)
    source_version = models.CharField(max_length=100, editable=False)
    source_path = models.CharField(max_length=300, editable=False)
    source_row = models.PositiveIntegerField(editable=False)
    source_hash = models.CharField(max_length=64, editable=False)
    code = models.CharField("来源代码", max_length=8, db_index=True)
    code2 = models.CharField(max_length=8, blank=True)
    name_en = models.CharField(max_length=200, db_index=True)
    name_zh = models.CharField(max_length=200, db_index=True)
    official_name = models.CharField(max_length=300, blank=True)
    capitals = models.JSONField(default=list)
    region = models.CharField(max_length=80, db_index=True)
    subregion = models.CharField(max_length=100, blank=True)
    area_km2 = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    independent = models.BooleanField(null=True, blank=True)
    un_member = models.BooleanField(null=True, blank=True)
    borders = models.JSONField(default=list)
    languages = models.JSONField(default=dict)
    currencies = models.JSONField(default=dict)
    raw = models.JSONField(default=dict, editable=False)
    derived = models.JSONField(default=dict, editable=False)
    editorial_name_zh = models.CharField("人工确认中文名", max_length=200, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("code",)
        constraints = [
            models.UniqueConstraint(
                fields=("source_version", "code"), name="geo_country_version_code"
            ),
            models.CheckConstraint(
                condition=models.Q(area_km2__isnull=True) | models.Q(area_km2__gte=0),
                name="geo_country_nonnegative_area",
            ),
        ]

    @property
    def display_name(self):
        return self.editorial_name_zh or self.name_zh or self.name_en

    def __str__(self):
        return self.display_name
