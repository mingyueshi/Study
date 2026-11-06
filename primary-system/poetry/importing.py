import csv, json, hashlib
from pathlib import Path
from django.db import transaction
from django.core.exceptions import ValidationError
from reference_library.models import Dataset
from lexicon.reference_importing import (
    locate,
    source_digest,
    validate_existing,
    record_digest,
)
from .models import PoetryDocument, PoetryText, PoetryNode, PoetryExclusion

# 上游 commit + 简体镜像层修订号（钉死 opencc t2s 0.1.7，见 scripts/build_poetry_simplified_package.py）。
VERSION = "b8594f81a89752241442f2ce267d6f66f96704ee+t2s017"

TRADITIONAL_FILES = 90
SIMPLIFIED_FILES = 90
TRADITIONAL_TEXTS = 73_676
EXCLUSIONS = 6_276


def simplified_relative(relative):
    """poetry/raw/诗经/shijing.json -> poetry/simplified/诗经/shijing.json

    非 raw/derived 层的路径没有简体对应，返回 None。
    """
    parts = relative.split("/")
    if len(parts) < 3 or parts[1] not in ("raw", "derived"):
        return None
    return f"poetry/simplified/{'/'.join(parts[2:])}"


def parse_document(value):
    texts = []
    nodes = []

    def walk(v, locator="", headings=(), author="", parent="", position=0):
        if isinstance(v, dict):
            label = str(
                v.get("title")
                or v.get("chapter")
                or v.get("rhythmic")
                or v.get("section")
                or v.get("type")
                or ""
            )
            inherited_author = str(v.get("author") or author)
            labels = []
            for field in (
                "type",
                "chapter",
                "section",
                "title",
                "rhythmic",
                "subchapter",
            ):
                text = str(v.get(field) or "")
                if text and text not in labels:
                    labels.append(text)
            path = (*headings, *labels)
            text_title = label or (headings[-1] if headings else "来源未提供题名")
            if v.get("subchapter"):
                text_title += " · " + str(v["subchapter"])
            nodes.append(
                {
                    "locator": locator or "/",
                    "parent_locator": parent,
                    "label": label,
                    "kind": (
                        "text"
                        if any(
                            isinstance(v.get(k), list)
                            and v[k]
                            and all(isinstance(x, str) for x in v[k])
                            for k in ("paragraphs", "content")
                        )
                        else "group"
                    ),
                    "position": position,
                    "source_data": {
                        k: x for k, x in v.items() if k not in ("paragraphs", "content")
                    },
                }
            )
            for key in ("paragraphs", "content"):
                lines = v.get(key)
                if isinstance(lines, str):
                    lines = [lines]
                if (
                    isinstance(lines, list)
                    and lines
                    and all(isinstance(x, str) for x in lines)
                ):
                    texts.append(
                        {
                            "locator": locator or "/",
                            "original_index": v.get("source_record_index"),
                            "title": text_title,
                            "author": inherited_author,
                            "heading_path": list(path),
                            "paragraphs": lines,
                            "body": "\n".join(lines),
                            "source_data": v,
                        }
                    )
                    break
            for k, x in v.items():
                if (
                    isinstance(x, dict)
                    or isinstance(x, list)
                    and any(isinstance(y, (dict, list)) for y in x)
                ):
                    walk(
                        x, locator + "/" + k, path, inherited_author, locator or "/", 0
                    )
        elif isinstance(v, list):
            for i, x in enumerate(v):
                if isinstance(x, (dict, list)):
                    walk(x, locator + "/" + str(i), headings, author, parent, i)

    walk(value)
    return texts, nodes


def import_data(input_root, dry_run=False):
    base = locate(input_root, "poetry/source_selection.json").parent
    traditional_files = sorted(
        [*base.glob("raw/**/*.json"), *base.glob("derived/**/*.json")]
    )
    simplified_files = sorted(base.glob("simplified/**/*.json"))
    if len(traditional_files) != TRADITIONAL_FILES:
        raise ValidationError(f"古诗文繁体JSON文件数不符：{len(traditional_files)}")
    if len(simplified_files) != SIMPLIFIED_FILES:
        raise ValidationError(f"古诗文简体JSON文件数不符：{len(simplified_files)}")
    documents = []
    simplified_documents = []
    count_text = count_nodes = count_simplified = 0
    sha = hashlib.sha256()
    for path in traditional_files:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        relative = "poetry/" + path.relative_to(base).as_posix()
        file_hash = source_digest(path)
        texts, nodes = parse_document(data)
        count_text += len(texts)
        count_nodes += len(nodes)
        sha.update((relative + ":" + file_hash + "\n").encode())
        documents.append((relative, file_hash, data))
    for path in simplified_files:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        relative = "poetry/" + path.relative_to(base).as_posix()
        file_hash = source_digest(path)
        texts, _ = parse_document(data)
        count_simplified += len(texts)
        sha.update((relative + ":" + file_hash + "\n").encode())
        simplified_documents.append((relative, file_hash, data, texts))
    expected_texts = {
        simplified_relative(relative): parse_document(data)[0]
        for relative, _, data in documents
    }
    for relative, _, _, texts in simplified_documents:
        source_texts = expected_texts.get(relative)
        if source_texts is None:
            raise ValidationError(f"古诗文简体层缺少繁体对应：{relative}")
        if [row["locator"] for row in source_texts] != [row["locator"] for row in texts]:
            raise ValidationError(f"古诗文简体层 locator 不对齐：{relative}")
        for source_row, simplified_row in zip(source_texts, texts):
            if len(source_row["paragraphs"]) != len(simplified_row["paragraphs"]):
                raise ValidationError(f"古诗文简体层段落数不对齐：{relative}")
    excluded = list(
        csv.DictReader(
            (base / "excluded_records.csv").open(encoding="utf-8-sig", newline="")
        )
    )
    sha.update(source_digest(base / "excluded_records.csv").encode())
    checksum = sha.hexdigest()
    if (
        count_text != TRADITIONAL_TEXTS
        or count_simplified != TRADITIONAL_TEXTS
        or len(excluded) != EXCLUSIONS
    ):
        raise ValidationError(
            f"古诗文解析计数不符：正文{count_text}，简体{count_simplified}，排除{len(excluded)}"
        )
    result = {
        "documents": TRADITIONAL_FILES + SIMPLIFIED_FILES,
        "documents_simplified": SIMPLIFIED_FILES,
        "texts": count_text,
        "texts_simplified": count_simplified,
        "nodes": count_nodes,
        "excluded": len(excluded),
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
        (
            VERSION,
            relative,
            file_hash,
            relative.split("/")[1],
            relative.split("/")[2],
            data,
        )
        for relative, file_hash, data in [
            *documents,
            *[(row[0], row[1], row[2]) for row in simplified_documents],
        ]
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
    node_fields = [
        "document__path",
        "locator",
        "parent_locator",
        "label",
        "kind",
        "position",
        "source_data",
    ]

    def records(kind, fields):
        for relative, _, data in documents:
            texts, nodes = parse_document(data)
            for row in sorted(
                texts if kind == "text" else nodes, key=lambda row: row["locator"]
            ):
                yield (relative, *(row[field] for field in fields[1:]))
        if kind == "text":
            for relative, _, _, texts in simplified_documents:
                for row in sorted(texts, key=lambda row: row["locator"]):
                    yield (relative, *(row[field] for field in fields[1:]))

    exclusion_fields = [
        "version",
        "row",
        "source_path",
        "source_locator",
        "source_id",
        "title",
        "author",
        "reasons",
    ]
    exclusion_hash = record_digest(
        (VERSION, i, *(row[field] for field in exclusion_fields[2:]))
        for i, row in enumerate(excluded, 2)
    )
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
            record_digest(records("text", text_fields)),
        ),
        (
            PoetryNode.objects.filter(document__version=VERSION).order_by(
                "document_id", "locator"
            ),
            node_fields,
            record_digest(records("node", node_fields)),
        ),
        (
            PoetryExclusion.objects.filter(version=VERSION).order_by("row"),
            exclusion_fields,
            exclusion_hash,
        ),
    ]
    checks = [
        (PoetryDocument.objects.filter(version=VERSION), TRADITIONAL_FILES + SIMPLIFIED_FILES),
        (PoetryText.objects.filter(document__version=VERSION), count_text + count_simplified),
        (PoetryNode.objects.filter(document__version=VERSION), count_nodes),
        (PoetryExclusion.objects.filter(version=VERSION), EXCLUSIONS),
    ]
    if dry_run:
        validate_existing("poetry", VERSION, checksum, checks, fingerprints)
        return result
    with transaction.atomic():
        dataset, created = Dataset.objects.select_for_update().get_or_create(
            code="poetry",
            defaults={
                "title": "古诗文固定来源版本",
                "version": VERSION,
                "input_digest": checksum,
                "state": "importing",
            },
        )
        if not created and (
            dataset.input_digest != checksum or dataset.version != VERSION
        ):
            raise ValidationError("古诗文输入改变，不覆盖旧版本")
        validate_existing("poetry", VERSION, checksum, checks, fingerprints)
        if dataset.state == "ready":
            if (
                PoetryDocument.objects.filter(version=VERSION).count(),
                PoetryText.objects.filter(document__version=VERSION).count(),
                PoetryNode.objects.filter(document__version=VERSION).count(),
                PoetryExclusion.objects.filter(version=VERSION).count(),
            ) != (
                TRADITIONAL_FILES + SIMPLIFIED_FILES,
                count_text + count_simplified,
                count_nodes,
                EXCLUSIONS,
            ):
                raise ValidationError("古诗文回执与数量不符")
            return {**result, "unchanged": count_text}
        if PoetryDocument.objects.filter(version=VERSION).exists():
            raise ValidationError("已有半成品版本，拒绝重复追加")
        for relative, file_hash, data in documents:
            parts = relative.split("/")
            doc = PoetryDocument.objects.create(
                path=relative,
                sha256=file_hash,
                layer=parts[1],
                collection=parts[2],
                original_data=data,
            )
            texts, nodes = parse_document(data)
            PoetryText.objects.bulk_create(
                [PoetryText(document=doc, **r) for r in texts], batch_size=500
            )
            PoetryNode.objects.bulk_create(
                [PoetryNode(document=doc, **r) for r in nodes], batch_size=500
            )
        for relative, file_hash, data, texts in simplified_documents:
            parts = relative.split("/")
            doc = PoetryDocument.objects.create(
                path=relative,
                sha256=file_hash,
                layer=parts[1],
                collection=parts[2],
                original_data=data,
            )
            PoetryText.objects.bulk_create(
                [PoetryText(document=doc, **r) for r in texts], batch_size=500
            )
        PoetryExclusion.objects.bulk_create(
            [
                PoetryExclusion(
                    row=i,
                    source_path=r["source_path"],
                    source_locator=r["source_locator"],
                    source_id=r["source_id"],
                    title=r["title"],
                    author=r["author"],
                    reasons=r["reasons"],
                )
                for i, r in enumerate(excluded, 2)
            ],
            batch_size=1000,
        )
        dataset.state = "ready"
        dataset.counts = {k: v for k, v in result.items() if k != "sha256"}
        dataset.save(update_fields=["state", "counts"])
    return result
