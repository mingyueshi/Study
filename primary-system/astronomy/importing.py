import csv, gzip, hashlib, json, time, math
from pathlib import Path
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import CelestialRecord, NamedCelestialRecord

VERSION = "HYG-4.2"
EXPECTED_RECORDS = 119626
EXPECTED_NAMED = 499
EXPECTED_UNKNOWN = 10225
EXPECTED_NAMED_UNKNOWN = 6
KNOWN_ZH = {
    "Sol": "太阳",
    "Sirius": "天狼星",
    "Canopus": "老人星",
    "Arcturus": "大角星",
    "Vega": "织女星",
    "Capella": "五车二",
    "Rigel": "参宿七",
    "Procyon": "南河三",
    "Betelgeuse": "参宿四",
    "Altair": "牛郎星",
    "Aldebaran": "毕宿五",
    "Spica": "角宿一",
    "Antares": "心宿二",
    "Pollux": "北河三",
    "Fomalhaut": "北落师门",
    "Deneb": "天津四",
    "Regulus": "轩辕十四",
    "Polaris": "北极星",
}


def number(value):
    if value == "":
        return None
    n = float(value)
    if not math.isfinite(n):
        raise ValidationError("星表出现非有限数")
    return n


def locate(root, suffix):
    files = [
        p for p in Path(root).rglob(Path(suffix).name) if p.as_posix().endswith(suffix)
    ]
    if len(files) != 1:
        raise ValidationError("星表来源文件不唯一：" + suffix)
    return files[0]


def source_hash(r):
    return hashlib.sha256(
        json.dumps(
            r, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode()
    ).hexdigest()


def typed_row(r, line):
    ident = int(r["id"])
    distance = number(r["dist"])
    unknown = distance is None or distance >= 100000
    ra, dec = number(r["ra"]), number(r["dec"])
    if (
        ident < 0
        or ra is not None
        and not 0 <= ra <= 24
        or dec is not None
        and not -90 <= dec <= 90
    ):
        raise ValidationError("星表坐标／编号不合法")
    return CelestialRecord(
        source_version=VERSION,
        catalogue_id=ident,
        source_row=line,
        source_path="multisubject/hyg/raw/hygdata_v42.csv.gz",
        source_hash=source_hash(r),
        proper_name=r["proper"],
        designation=r["bf"],
        hip=r["hip"],
        hd=r["hd"],
        hr=r["hr"],
        gl=r["gl"],
        constellation=r["con"],
        ra_hours=ra,
        dec_degrees=dec,
        raw_distance_pc=distance,
        distance_pc=None if unknown else distance,
        distance_unknown=unknown,
        magnitude=number(r["mag"]),
        absolute_magnitude=number(r["absmag"]),
        spectral_type=r["spect"],
        color_index=number(r["ci"]),
        luminosity_solar=number(r["lum"]),
        component=r["comp"],
        primary_component_id=r["comp_primary"],
        variability=r["var"],
        raw=r,
        name_zh=KNOWN_ZH.get(r["proper"], ""),
    )


def stored_signature(record):
    excluded = {"name_zh", "notes"}
    values = {
        f.name: f.to_python(getattr(record, f.name))
        for f in CelestialRecord._meta.concrete_fields
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
    raw = locate(input_root, "multisubject/hyg/raw/hygdata_v42.csv.gz")
    named = locate(input_root, "multisubject/hyg/derived/named_stars.csv")
    digest = hashlib.sha256(raw.read_bytes() + named.read_bytes()).hexdigest()
    with named.open(encoding="utf-8-sig", newline="") as f:
        named_rows = list(csv.DictReader(f))
    if (
        len(named_rows) != EXPECTED_NAMED
        or len({r["id"] for r in named_rows}) != EXPECTED_NAMED
    ):
        raise ValidationError("具名子集必须499行，按id而非名称唯一")
    named_by = {int(r["id"]): (line, r) for line, r in enumerate(named_rows, 2)}
    ds = None
    if not dry_run:
        ds, _ = Dataset.objects.select_for_update().get_or_create(
            code="hyg", defaults={"title": "HYG天体星表", "version": VERSION}
        )
    else:
        ds = Dataset.objects.filter(code="hyg").first()
    if ds and (ds.version != VERSION or ds.input_digest and ds.input_digest != digest):
        raise ValidationError("来源固定版本或输入摘要漂移")
    existing = {
        r.catalogue_id: stored_signature(r)
        for r in CelestialRecord.objects.filter(source_version=VERSION).iterator(
            chunk_size=1000
        )
    }
    if ds and ds.state == "ready" and len(existing) != EXPECTED_RECORDS:
        raise ValidationError("已公开资料缺行，拒绝自动重建或公开")
    if existing and len(existing) != EXPECTED_RECORDS:
        raise ValidationError("已提交星表不完整，拒绝公开或猜测续写")
    if existing:
        selected = {
            r.record.catalogue_id: (r.source_row, r.source_path, r.source_hash)
            for r in NamedCelestialRecord.objects.filter(record__source_version=VERSION)
            .select_related("record")
            .defer("record__raw")
        }
        if len(selected) != EXPECTED_NAMED or any(
            selected.get(k)
            != (line, "multisubject/hyg/derived/named_stars.csv", source_hash(row))
            for k, (line, row) in named_by.items()
        ):
            raise ValidationError("具名关系不完整或漂移")
    seen = set()
    pending = []
    count = unknown = named_unknown = 0
    with gzip.open(raw, "rt", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if len(reader.fieldnames) != 37:
            raise ValidationError("星表字段必须37列")
        for line, r in enumerate(reader, 2):
            obj = typed_row(r, line)
            if obj.catalogue_id in seen:
                raise ValidationError("星表id重复")
            seen.add(obj.catalogue_id)
            count += 1
            unknown += obj.distance_unknown
            if obj.catalogue_id in named_by:
                nr = named_by[obj.catalogue_id][1]
                if r != nr:
                    raise ValidationError("具名子集与全表对应行不同")
                named_unknown += obj.distance_unknown
            if existing and existing.get(obj.catalogue_id) != stored_signature(obj):
                raise ValidationError("星表固定行漂移")
            if not dry_run and not existing:
                pending.append(obj)
                if len(pending) >= 1000:
                    CelestialRecord.objects.bulk_create(pending, batch_size=500)
                    pending = []
    if (
        count != EXPECTED_RECORDS
        or set(named_by) - seen
        or unknown != EXPECTED_UNKNOWN
        or named_unknown != EXPECTED_NAMED_UNKNOWN
    ):
        raise ValidationError("星表全量／子集／距离哨兵计数与审计不符")
    if not dry_run:
        if pending:
            CelestialRecord.objects.bulk_create(pending, batch_size=500)
        records = {
            r.catalogue_id: r
            for r in CelestialRecord.objects.filter(
                source_version=VERSION, catalogue_id__in=named_by
            )
        }
        if not existing:
            NamedCelestialRecord.objects.bulk_create(
                [
                    NamedCelestialRecord(
                        record=records[k],
                        source_path="multisubject/hyg/derived/named_stars.csv",
                        source_row=line,
                        source_hash=source_hash(row),
                    )
                    for k, (line, row) in named_by.items()
                ],
                batch_size=499,
            )
        else:
            selected = dict(
                NamedCelestialRecord.objects.filter(
                    record__source_version=VERSION
                ).values_list("record__catalogue_id", "source_hash")
            )
            if len(selected) != EXPECTED_NAMED or any(
                selected.get(k) != source_hash(row) for k, (_, row) in named_by.items()
            ):
                raise ValidationError("具名关系不完整或漂移")
        ds.input_digest = digest
        ds.state = "ready"
        ds.counts = {
            "records": count,
            "named": len(named_rows),
            "distance_unknown": unknown,
            "named_distance_unknown": named_unknown,
        }
        ds.save(update_fields=["input_digest", "state", "counts"])
    return {
        "dataset": "hyg",
        "count": count,
        "named": len(named_rows),
        "distance_unknown": unknown,
        "created": 0 if existing else count,
        "dry_run": dry_run,
        "seconds": round(time.monotonic() - started, 3),
    }
