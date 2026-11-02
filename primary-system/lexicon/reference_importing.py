import csv, hashlib, json
from pathlib import Path
from django.db import transaction
from django.core.exceptions import ValidationError
from reference_library.models import Dataset
from .reference_models import CedictRecord, CmuPronunciation


def locate(root, suffix):
    files = [
        p for p in Path(root).rglob(Path(suffix).name) if p.as_posix().endswith(suffix)
    ]
    if len(files) != 1:
        raise ValidationError(f"固定输入路径缺失或重复：{suffix}")
    return files[0]


def source_digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1048576), b""):
            h.update(chunk)
    return h.hexdigest()


def record_digest(rows):
    digest = hashlib.sha256()
    for row in rows:
        digest.update(
            json.dumps(
                list(row), ensure_ascii=False, sort_keys=True, separators=(",", ":")
            ).encode("utf8")
        )
        digest.update(b"\n")
    return digest.hexdigest()


def validate_existing(code, version, checksum, checks, fingerprints=()):
    """Read-only preview guard; callers repeat it after their Dataset row lock."""
    dataset = Dataset.objects.filter(code=code).first()
    if dataset is None:
        if any(query.count() for query, expected in checks):
            raise ValidationError(f"{code}有记录却缺少来源回执")
        return False
    if dataset.version != version or dataset.input_digest != checksum:
        raise ValidationError(f"{code}来源版本或摘要漂移，不覆盖")
    if dataset.state == "ready":
        if any(query.count() != expected for query, expected in checks):
            raise ValidationError(f"{code}来源回执与实际行数不符")
        for query, fields, expected_digest in fingerprints:
            if (
                record_digest(query.values_list(*fields).iterator(chunk_size=2000))
                != expected_digest
            ):
                raise ValidationError(f"{code}来源字段逐行漂移，不覆盖")
        return True
    if any(query.exists() for query, expected in checks):
        raise ValidationError(f"{code}存在半成品，拒绝追加")
    return False


def publish(code, title, version, sha, model, rows, expected, dry_run):
    if len(rows) != expected:
        raise ValidationError(f"{code}数量不符：{len(rows)} != {expected}")
    fields = [
        field.name
        for field in model._meta.concrete_fields
        if field.name not in ("id", "matched_sense")
    ]
    ordering = "source_line" if model is CedictRecord else "source_row"
    fingerprint = (
        model.objects.filter(version=version).order_by(ordering),
        fields,
        record_digest(
            tuple(getattr(row, field) for field in fields)
            for row in sorted(rows, key=lambda row: getattr(row, ordering))
        ),
    )
    if dry_run:
        unchanged = validate_existing(
            code,
            version,
            sha,
            [(model.objects.filter(version=version), expected)],
            [fingerprint],
        )
        return {
            "count": len(rows),
            "dry_run": True,
            "unchanged": expected if unchanged else 0,
            "sha256": sha,
        }
    with transaction.atomic():
        dataset, created = Dataset.objects.select_for_update().get_or_create(
            code=code,
            defaults={
                "title": title,
                "version": version,
                "input_digest": sha,
                "state": "importing",
            },
        )
        validate_existing(
            code,
            version,
            sha,
            [(model.objects.filter(version=version), expected)],
            [fingerprint],
        )
        if not created:
            if dataset.input_digest != sha or dataset.version != version:
                raise ValidationError(f"{code}既有版本不匹配，不覆盖")
            if dataset.state == "ready":
                if model.objects.filter(version=version).count() != expected:
                    raise ValidationError("既有回执与行数不符")
                return {"count": expected, "unchanged": expected, "sha256": sha}
            if model.objects.filter(version=version).exists():
                raise ValidationError("半成品版本须维护者核查，不能重复追加")
        model.objects.bulk_create(rows, batch_size=2000)
        dataset.state = "ready"
        dataset.counts = {"records": expected}
        dataset.save(update_fields=["state", "counts"])
    return {"count": expected, "created": expected, "sha256": sha}


def import_data(input_root, dry_run=False):
    path = locate(input_root, "language/cc-cedict/normalized/entries.jsonl")
    rows = []
    keys = set()
    with path.open(encoding="utf8") as f:
        for line in f:
            r = json.loads(line)
            key = int(r["source_line"])
            if (
                key in keys
                or not r["simplified"]
                or not isinstance(r["definitions_en"], list)
            ):
                raise ValidationError("CC-CEDICT记录身份重复或格式非法")
            keys.add(key)
            rows.append(
                CedictRecord(
                    source_line=key,
                    simplified=r["simplified"],
                    traditional=r["traditional"],
                    pinyin_numbered=r["pinyin_numbered"],
                    definitions_en=r["definitions_en"],
                    definition_text=" / ".join(r["definitions_en"]),
                    source_path="language/cc-cedict/original/cedict_ts.u8",
                )
            )
    result = {
        "cc-cedict": publish(
            "cc-cedict",
            "CC-CEDICT中文词头与英文原释义",
            "2026-10-31T21:06:18Z",
            source_digest(path),
            CedictRecord,
            rows,
            125346,
            dry_run,
        )
    }
    del rows
    path = locate(input_root, "multisubject/cmudict/derived/pronunciations.csv")
    rows = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        for index, r in enumerate(csv.DictReader(f), 2):
            if not r["word"] or not r["phonemes"]:
                raise ValidationError("CMU空词形或读音")
            rows.append(
                CmuPronunciation(
                    source_row=index,
                    entry=r["entry"],
                    word=r["word"],
                    search_word=r["word"].casefold(),
                    variant=int(r["variant"]),
                    phonemes=r["phonemes"],
                    note=r.get("note", ""),
                    source_path="multisubject/cmudict/derived/pronunciations.csv",
                )
            )
    result["cmudict"] = publish(
        "cmudict",
        "美式英语ARPAbet读音来源",
        "74790861f652b15e4ac49015a90074ad62a27690",
        source_digest(path),
        CmuPronunciation,
        rows,
        135166,
        dry_run,
    )
    return result
