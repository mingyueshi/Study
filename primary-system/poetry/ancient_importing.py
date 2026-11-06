"""古文经典（ancient-classics）导入：hanzhaodeng 62 册简体古籍，独立数据集。

与 poetry.importing（90+90 简繁镜像）共享 PoetryDocument/PoetryText 表，
靠 PoetryDocument.version 圈定各自范围：本数据集 VERSION 为上游 commit
+ "+native" 后缀（正文简体原生，无简繁镜像层）。包内 layout 由
scripts/build_ancient_text_package.py 固定：ancient_text/poetry/simplified/
<collection>/<书名>.json。只建 documents 与 texts（与既有简体层同约定，
不建 PoetryNode），无排除台账。
"""

import hashlib
import json

from django.core.exceptions import ValidationError
from django.db import transaction
from lexicon.reference_importing import (
    locate,
    record_digest,
    source_digest,
    validate_existing,
)
from reference_library.models import Dataset

from .importing import parse_document
from .models import PoetryDocument, PoetryText

# 上游 commit + 简体原生层标识（区别于既有诗词包的 +t2s017 镜像层）。
VERSION = "01a1183cd9bbc243bb156967043c32b6685c0d2f+native"

ANCIENT_FILES = 62
# 正文计数由打包脚本实际输出钉死（scripts/build_ancient_text_package.py）：
# 62 册、5258 篇正文、约 1225 万字。
ANCIENT_TEXTS = 5_258
MARKER = "ancient_text/source_selection.json"


def import_data(input_root, dry_run=False):
    base = locate(input_root, MARKER).parent
    files = sorted(base.glob("poetry/simplified/**/*.json"))
    if len(files) != ANCIENT_FILES:
        raise ValidationError(f"古文经典 JSON 文件数不符：{len(files)}")
    sha = hashlib.sha256()
    parsed = []  # (relative, file_hash, data, texts)，按路径序保证与入库序一致
    count_texts = 0
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        # 包内文件已带 poetry/ 前缀（ancient_text/poetry/simplified/…），
        # 去掉存储根前缀即得与既有诗词管线一致的相对路径。
        relative = path.relative_to(base).as_posix()
        file_hash = source_digest(path)
        texts, _ = parse_document(data)
        for row in texts:
            # 古文正文较长，source_data 剔除与 paragraphs 重复的 content 键，
            # 避免正文以 paragraphs/body/source_data 三份冗余入库；详情页
            # metadata 展示本就剔除这些键，呈现不受影响。
            row["source_data"] = {
                k: v
                for k, v in row["source_data"].items()
                if k not in ("content", "paragraphs")
            }
        count_texts += len(texts)
        sha.update((relative + ":" + file_hash + "\n").encode())
        parsed.append((relative, file_hash, data, texts))
    checksum = sha.hexdigest()
    if count_texts != ANCIENT_TEXTS:
        raise ValidationError(f"古文经典正文计数不符：{count_texts}")

    result = {
        "documents": ANCIENT_FILES,
        "texts": count_texts,
        "sha256": checksum,
    }
    document_fields = [
        "version",
        "path",
        "sha256",
        "layer",
        "collection",
        "original_data",
    ]
    document_hash = record_digest(
        (VERSION, relative, file_hash, relative.split("/")[1], relative.split("/")[2], data)
        for relative, file_hash, data, _ in parsed
    )
    text_fields = [
        "document__path",
        "locator",
        "original_index",
        "title",
        "author",
        "heading_path",
        "paragraphs",
        "body",
        "source_data",
    ]

    def records(fields):
        for relative, _, _, texts in parsed:
            for row in sorted(texts, key=lambda row: row["locator"]):
                yield (relative, *(row[field] for field in fields[1:]))

    fingerprints = [
        (
            PoetryDocument.objects.filter(version=VERSION).order_by("pk"),
            document_fields,
            document_hash,
        ),
        (
            PoetryText.objects.filter(document__version=VERSION).order_by(
                "document_id", "locator"
            ),
            text_fields,
            record_digest(records(text_fields)),
        ),
    ]
    checks = [
        (PoetryDocument.objects.filter(version=VERSION), ANCIENT_FILES),
        (PoetryText.objects.filter(document__version=VERSION), count_texts),
    ]
    if dry_run:
        validate_existing("ancient-classics", VERSION, checksum, checks, fingerprints)
        return result
    with transaction.atomic():
        dataset, created = Dataset.objects.select_for_update().get_or_create(
            code="ancient-classics",
            defaults={
                "title": "古文经典固定来源版本",
                "version": VERSION,
                "input_digest": checksum,
                "state": "importing",
            },
        )
        if not created and (
            dataset.input_digest != checksum or dataset.version != VERSION
        ):
            raise ValidationError("古文经典输入改变，不覆盖旧版本")
        validate_existing("ancient-classics", VERSION, checksum, checks, fingerprints)
        if dataset.state == "ready":
            if (
                PoetryDocument.objects.filter(version=VERSION).count(),
                PoetryText.objects.filter(document__version=VERSION).count(),
            ) != (ANCIENT_FILES, count_texts):
                raise ValidationError("古文经典回执与数量不符")
            return {**result, "unchanged": count_texts}
        if PoetryDocument.objects.filter(version=VERSION).exists():
            raise ValidationError("已有半成品版本，拒绝重复追加")
        for relative, file_hash, data, texts in parsed:
            parts = relative.split("/")
            doc = PoetryDocument.objects.create(
                path=relative,
                sha256=file_hash,
                layer=parts[1],
                collection=parts[2],
                version=VERSION,
                original_data=data,
            )
            PoetryText.objects.bulk_create(
                [PoetryText(document=doc, **row) for row in texts], batch_size=500
            )
        dataset.state = "ready"
        dataset.counts = {k: v for k, v in result.items() if k != "sha256"}
        dataset.save(update_fields=["state", "counts"])
    return result
