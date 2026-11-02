from django.db import models


class Dataset(models.Model):
    code = models.SlugField(primary_key=True, max_length=100)
    title = models.CharField(max_length=200)
    version = models.CharField(max_length=200, blank=True)
    input_digest = models.CharField(max_length=64, blank=True)
    state = models.CharField(max_length=16, default="pending")
    counts = models.JSONField(default=dict)


class ArchivePackage(models.Model):
    name = models.CharField(max_length=200, unique=True)
    sha256 = models.CharField(max_length=64)
    size = models.BigIntegerField()
    imported_at = models.DateTimeField(auto_now_add=True)


class SourceFile(models.Model):
    package = models.ForeignKey(ArchivePackage, on_delete=models.PROTECT)
    path = models.CharField(max_length=500)
    sha256 = models.CharField(max_length=64)
    size = models.BigIntegerField()
    storage_path = models.CharField(max_length=700)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["package", "path"], name="reference_package_path_unique"
            )
        ]


class ImportRun(models.Model):
    manifest_digest = models.CharField(max_length=64, unique=True)
    report = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
