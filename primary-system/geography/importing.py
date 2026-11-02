import hashlib, json, time
from pathlib import Path
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import CountryRegion

VERSION = "6031f5df137c41c76d180c55a0782185ae3ed05b"


def locate(root, suffix):
    paths = [
        p for p in Path(root).rglob(Path(suffix).name) if p.as_posix().endswith(suffix)
    ]
    if len(paths) != 1:
        raise ValidationError(f"来源文件不唯一：{suffix}")
    return paths[0]


def canonical(value):
    return hashlib.sha256(
        json.dumps(
            value, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode()
    ).hexdigest()


def stored_signature(record):
    excluded = {"editorial_name_zh", "notes"}
    values = {
        f.name: f.to_python(getattr(record, f.name))
        for f in CountryRegion._meta.concrete_fields
        if not f.primary_key and f.name not in excluded
    }
    return hashlib.sha256(
        json.dumps(
            values, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode()
    ).hexdigest()


@transaction.atomic
def import_data(input_root, dry_run=False):
    from reference_library.models import Dataset

    started = time.monotonic()
    raw_path = locate(input_root, "multisubject/countries/raw/countries.json")
    derived_path = locate(
        input_root, "multisubject/countries/derived/countries_core.json"
    )
    raw = json.loads(raw_path.read_text())
    derived = json.loads(derived_path.read_text())
    if len(raw) != 250 or len(derived) != 250:
        raise ValidationError("国家与地区必须保留250条原始及250条派生记录")
    raw_by = {r["cca3"]: r for r in raw}
    der_by = {r["cca3"]: r for r in derived}
    if len(raw_by) != 250 or set(raw_by) != set(der_by):
        raise ValidationError("国家来源代码重复或派生集合不匹配")
    digest = canonical([raw, derived])
    ds = None
    if not dry_run:
        ds, _ = Dataset.objects.select_for_update().get_or_create(
            code="countries", defaults={"title": "国家与地区", "version": VERSION}
        )
    else:
        ds = Dataset.objects.filter(code="countries").first()
    if ds and (ds.version != VERSION or ds.input_digest and ds.input_digest != digest):
        raise ValidationError("来源固定版本或输入摘要漂移")
    existing = {
        r.code: stored_signature(r)
        for r in CountryRegion.objects.filter(source_version=VERSION).iterator(
            chunk_size=500
        )
    }
    if ds and ds.state == "ready" and len(existing) != 250:
        raise ValidationError("已公开资料缺行，拒绝自动重建或公开")
    if existing and len(existing) != 250:
        raise ValidationError("国家库存在不完整已提交数据，拒绝公开或猜测续写")
    objects = []
    for i, r in enumerate(derived, 1):
        original = raw_by[r["cca3"]]
        source_hash = canonical([original, r])
        coords = r.get("latlng") or []
        objects.append(
            CountryRegion(
                source_version=VERSION,
                source_path="multisubject/countries/raw/countries.json + derived/countries_core.json",
                source_row=i,
                source_hash=source_hash,
                code=r["cca3"],
                code2=r.get("cca2", ""),
                name_en=r["name_en"],
                name_zh=r["name_zh"],
                official_name=original.get("name", {}).get("official", ""),
                capitals=r.get("capital") or [],
                region=r.get("region", ""),
                subregion=r.get("subregion", ""),
                area_km2=r.get("area_km2"),
                latitude=coords[0] if len(coords) > 0 else None,
                longitude=coords[1] if len(coords) > 1 else None,
                independent=r.get("independent"),
                un_member=r.get("un_member"),
                borders=original.get("borders") or [],
                languages=original.get("languages") or {},
                currencies=original.get("currencies") or {},
                raw=original,
                derived=r,
            )
        )
    if existing and any(
        existing.get(obj.code) != stored_signature(obj) for obj in objects
    ):
        raise ValidationError("国家实际内容与来源不符")
    if not dry_run:
        if not existing:
            CountryRegion.objects.bulk_create(objects, batch_size=250)
        ds.input_digest = digest
        ds.state = "ready"
        ds.counts = {"raw": 250, "derived": 250, "countries_regions": 250}
        ds.save(update_fields=["input_digest", "state", "counts"])
    return {
        "dataset": "countries",
        "count": 250,
        "raw": 250,
        "derived": 250,
        "created": 0 if existing else 250,
        "dry_run": dry_run,
        "seconds": round(time.monotonic() - started, 3),
    }
