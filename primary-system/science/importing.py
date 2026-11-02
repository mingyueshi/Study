"""Import the retained 119 original element records without textbook inputs."""

import hashlib
import json
from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import transaction
from reference_library.models import Dataset
from .models import Element
from .labels import ELEMENT_NAMES_BY_NUMBER, CATEGORIES

VERSION = "a78c7a48fe7235cebd6153161a9e7fa70f0cfb30"
COUNTS = {"raw_elements": 119, "valid_elements": 118}


def locate(root, suffix):
    matches = list(Path(root).rglob(suffix))
    if len(matches) != 1:
        raise ValidationError(f"元素输入缺失或重复：{suffix}")
    return matches[0]


def element_values(e, index, source_hash):
    return dict(
        number=e["number"],
        symbol=e["symbol"],
        name=e["name"],
        chinese_name=ELEMENT_NAMES_BY_NUMBER.get(e["number"], ""),
        category=e.get("category", ""),
        category_zh=CATEGORIES.get(e.get("category", ""), "来源分类待中文核对"),
        phase=e.get("phase", ""),
        phase_zh={
            "Gas": "气态",
            "Solid": "固态",
            "Liquid": "液态",
            "Unknown": "未知",
        }.get(e.get("phase"), "未知"),
        period=e.get("period"),
        group=e.get("group"),
        atomic_mass=e.get("atomic_mass"),
        density_original=e.get("density"),
        density_unit=e.get("density_unit", ""),
        density_g_cm3=e.get("density_g_cm3"),
        melt_k=e.get("melt"),
        boil_k=e.get("boil"),
        summary_en=e.get("summary", ""),
        raw=e,
        valid=1 <= e["number"] <= 118,
        source_checksum=source_hash,
        source_locator=f"multisubject/elements/raw/PeriodicTableJSON.json#/elements/{index}",
    )


def existing_state(elements, source_hash):
    """Inspect actual rows without overwriting any field of an existing version."""
    dataset = Dataset.objects.filter(code="periodic-elements").first()
    existing = {row.number: row for row in Element.objects.all()}
    if dataset is None:
        if existing:
            raise ValidationError("元素有记录却缺少来源回执")
        return False
    if dataset.version != VERSION or dataset.input_digest != source_hash:
        raise ValidationError("元素既有版本／摘要漂移")
    if dataset.state != "ready":
        if existing:
            raise ValidationError("元素存在未完成或人工数据，拒绝覆盖")
        return False
    if dataset.counts != COUNTS or len(existing) != 119:
        raise ValidationError("元素既有状态／计数漂移")
    for index, source in enumerate(elements):
        row = existing.get(source["number"])
        if row is None or any(
            getattr(row, key) != value
            for key, value in element_values(source, index, source_hash).items()
        ):
            raise ValidationError("元素原始记录／有效投影漂移")
    return True


def import_data(input_root, dry_run=False):
    rawbytes = locate(input_root, "PeriodicTableJSON.json").read_bytes()
    elements = json.loads(rawbytes)["elements"]
    derived = json.loads(locate(input_root, "elements_1_118.json").read_text())
    if (
        len(elements) != 119
        or {row["number"] for row in elements} != set(range(1, 120))
        or len(derived) != 118
        or {row["number"] for row in derived} != set(range(1, 119))
    ):
        raise ValidationError("元素原始119/有效118不完整")
    originals = {row["number"]: row for row in elements}
    for row in derived:
        if any(
            originals[row["number"]].get(key) != value for key, value in row.items()
        ):
            raise ValidationError("元素有效投影与原始记录不一致")
    if (
        originals[1].get("density_unit") != "g/L"
        or originals[1].get("density_g_cm3") != 0.00008988
    ):
        raise ValidationError("氢密度单位／归一化不符")
    source_hash = hashlib.sha256(rawbytes).hexdigest()
    if dry_run:
        return {
            **COUNTS,
            "dry_run": True,
            "unchanged": existing_state(elements, source_hash),
        }
    with transaction.atomic():
        Dataset.objects.select_for_update().get_or_create(
            code="periodic-elements",
            defaults={
                "title": "化学元素资料",
                "version": VERSION,
                "input_digest": source_hash,
                "state": "importing",
            },
        )
        if existing_state(elements, source_hash):
            return {**COUNTS, "unchanged": True}
        Element.objects.bulk_create(
            [
                Element(**element_values(row, index, source_hash))
                for index, row in enumerate(elements)
            ]
        )
        Dataset.objects.filter(code="periodic-elements").update(
            state="ready", counts=COUNTS
        )
    return {**COUNTS, "created": 119}
