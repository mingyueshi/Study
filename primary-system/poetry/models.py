from django.db import models


class PoetryDocument(models.Model):
    version = models.CharField(
        max_length=100, default="b8594f81a89752241442f2ce267d6f66f96704ee+t2s017"
    )
    path = models.CharField(max_length=300)
    sha256 = models.CharField(max_length=64)
    layer = models.CharField(max_length=12)
    collection = models.CharField(max_length=100, db_index=True)
    original_data = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "path"], name="poetry_document_version_path"
            )
        ]


class PoetryText(models.Model):
    document = models.ForeignKey(
        PoetryDocument, on_delete=models.PROTECT, related_name="texts"
    )
    locator = models.CharField(max_length=400)
    original_index = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=1000, db_index=True)
    author = models.CharField(max_length=500, blank=True, db_index=True)
    heading_path = models.JSONField(default=list)
    paragraphs = models.JSONField(default=list)
    body = models.TextField()
    source_data = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document", "locator"], name="poetry_text_document_locator"
            )
        ]


class PoetryNode(models.Model):
    document = models.ForeignKey(
        PoetryDocument, on_delete=models.PROTECT, related_name="nodes"
    )
    locator = models.CharField(max_length=400)
    parent_locator = models.CharField(max_length=400, blank=True)
    label = models.CharField(max_length=1000, blank=True)
    kind = models.CharField(max_length=40)
    position = models.PositiveIntegerField(default=0)
    source_data = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["document", "locator"], name="poetry_node_document_locator"
            )
        ]


class PoetryExclusion(models.Model):
    version = models.CharField(
        max_length=100, default="b8594f81a89752241442f2ce267d6f66f96704ee+t2s017"
    )
    row = models.PositiveIntegerField()
    source_path = models.CharField(max_length=300)
    source_locator = models.CharField(max_length=400)
    source_id = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=1000, blank=True, db_index=True)
    author = models.CharField(max_length=500, blank=True)
    reasons = models.TextField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["version", "row"], name="poetry_exclusion_source_row"
            )
        ]
