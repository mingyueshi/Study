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

VERSION = "b8594f81a89752241442f2ce267d6f66f96704ee"


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
    files = sorted([*base.glob("raw/**/*.json"), *base.glob("derived/**/*.json")])
    if len(files) != 90:
        raise ValidationError(f"古诗文JSON文件数不符：{len(files)}")
    documents = []
    count_text = count_nodes = 0
    sha = hashlib.sha256()
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        relative = "poetry/" + path.relative_to(base).as_posix()
        file_hash = source_digest(path)
        texts, nodes = parse_document(data)
        count_text += len(texts)
        count_nodes += len(nodes)
        sha.update((relative + ":" + file_hash + "\n").encode())
        documents.append((relative, file_hash, data, len(texts), len(nodes)))
    excluded = list(
        csv.DictReader(
            (base / "excluded_records.csv").open(encoding="utf-8-sig", newline="")
        )
    )
    sha.update(source_digest(base / "excluded_records.csv").encode())
    checksum = sha.hexdigest()
    if count_text != 73676 or len(excluded) != 6276:
        raise ValidationError(
            f"古诗文解析计数不符：正文{count_text}，排除{len(excluded)}"
        )
    result = {
        "documents": 90,
        "texts": count_text,
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
        for relative, file_hash, data, _, _ in documents
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
        for relative, file_hash, data, _, _ in documents:
            texts, nodes = parse_document(data)
            for row in sorted(
                texts if kind == "text" else nodes, key=lambda row: row["locator"]
            ):
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
        (PoetryDocument.objects.order_by("pk"), document_fields, document_hash),
        (
            PoetryText.objects.order_by("document_id", "locator"),
            text_fields,
            record_digest(records("text", text_fields)),
        ),
        (
            PoetryNode.objects.order_by("document_id", "locator"),
            node_fields,
            record_digest(records("node", node_fields)),
        ),
        (PoetryExclusion.objects.order_by("row"), exclusion_fields, exclusion_hash),
    ]
    checks = [
        (PoetryDocument.objects.all(), 90),
        (PoetryText.objects.all(), count_text),
        (PoetryNode.objects.all(), count_nodes),
        (PoetryExclusion.objects.all(), 6276),
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
                PoetryDocument.objects.count(),
                PoetryText.objects.count(),
                PoetryNode.objects.count(),
                PoetryExclusion.objects.count(),
            ) != (90, count_text, count_nodes, 6276):
                raise ValidationError("古诗文回执与数量不符")
            return {**result, "unchanged": count_text}
        if PoetryDocument.objects.exists():
            raise ValidationError("已有半成品版本，拒绝重复追加")
        for relative, file_hash, data, _, _ in documents:
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
