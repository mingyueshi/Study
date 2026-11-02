import io, zipfile, json, hashlib
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
from .models import HanziAsset, UnihanCharacter, UnihanProperty


def import_data(input_root, dry_run=False):
    dictionary = locate(input_root, "language/makemeahanzi/original/dictionary.txt")
    graphics = locate(input_root, "language/makemeahanzi/original/graphics.txt")
    chars = {
        r["character"]: (i, r)
        for i, r in enumerate(
            (json.loads(line) for line in dictionary.open(encoding="utf8")), 1
        )
    }
    images = {
        r["character"]: r
        for r in (json.loads(line) for line in graphics.open(encoding="utf8"))
    }
    if len(chars) != 9574 or chars.keys() != images.keys():
        raise ValidationError("字典与图形字集不匹配9574")
    for char, graphic in images.items():
        if len(graphic["strokes"]) != len(graphic["medians"]):
            raise ValidationError("笔画与中线数量不一致")
    sha = hashlib.sha256(
        (source_digest(dictionary) + source_digest(graphics)).encode()
    ).hexdigest()
    result = {
        "makemeahanzi": {
            "dictionary": len(chars),
            "graphics": len(images),
            "sha256": sha,
        }
    }
    asset_fields = [
        "version",
        "character",
        "source_row",
        "definition_en",
        "pinyin",
        "decomposition",
        "radical",
        "dictionary_data",
        "strokes",
        "medians",
    ]
    asset_hash = record_digest(
        (
            "bddc96d41bef78427ed0e034e9f7e31d71fd1b92",
            c,
            i,
            r.get("definition", ""),
            r.get("pinyin", []),
            r.get("decomposition", ""),
            r.get("radical", ""),
            r,
            images[c]["strokes"],
            images[c]["medians"],
        )
        for c, (i, r) in sorted(chars.items(), key=lambda item: item[1][0])
    )
    asset_fingerprints = [
        (HanziAsset.objects.order_by("source_row"), asset_fields, asset_hash)
    ]
    if dry_run:
        validate_existing(
            "makemeahanzi",
            "bddc96d41bef78427ed0e034e9f7e31d71fd1b92",
            sha,
            [(HanziAsset.objects.all(), 9574)],
            asset_fingerprints,
        )
    if not dry_run:
        with transaction.atomic():
            dataset, created = Dataset.objects.select_for_update().get_or_create(
                code="makemeahanzi",
                defaults={
                    "title": "汉字字典与笔顺",
                    "version": "bddc96d41bef78427ed0e034e9f7e31d71fd1b92",
                    "input_digest": sha,
                    "state": "importing",
                },
            )
            if not created and (
                dataset.input_digest != sha
                or dataset.version != "bddc96d41bef78427ed0e034e9f7e31d71fd1b92"
            ):
                raise ValidationError("笔顺输入版本改变，不覆盖")
            validate_existing(
                "makemeahanzi",
                "bddc96d41bef78427ed0e034e9f7e31d71fd1b92",
                sha,
                [(HanziAsset.objects.all(), 9574)],
                asset_fingerprints,
            )
            if dataset.state == "ready":
                if HanziAsset.objects.count() != 9574:
                    raise ValidationError("笔顺回执数量不符")
                result["makemeahanzi"]["unchanged"] = 9574
            else:
                if HanziAsset.objects.exists():
                    raise ValidationError("笔顺存在半成品，拒绝追加")
                HanziAsset.objects.bulk_create(
                    [
                        HanziAsset(
                            character=c,
                            source_row=i,
                            definition_en=r.get("definition", ""),
                            pinyin=r.get("pinyin", []),
                            decomposition=r.get("decomposition", ""),
                            radical=r.get("radical", ""),
                            dictionary_data=r,
                            strokes=images[c]["strokes"],
                            medians=images[c]["medians"],
                        )
                        for c, (i, r) in chars.items()
                    ],
                    batch_size=200,
                )
                dataset.state = "ready"
                dataset.counts = {"dictionary": 9574, "graphics": 9574}
                dataset.save(update_fields=["state", "counts"])
    asset_chars = set(chars)
    del chars, images
    original = locate(input_root, "language/unihan-17.0.0/original/Unihan.zip")
    props = {}
    locators = {}
    property_count = 0
    with zipfile.ZipFile(original) as archive:
        for file in archive.namelist():
            if not file.endswith(".txt"):
                continue
            with archive.open(file) as f:
                for index, line in enumerate(io.TextIOWrapper(f, encoding="utf-8"), 1):
                    if not line.strip() or line.startswith("#"):
                        continue
                    code, name, value = line.rstrip("\r\n").split("\t", 2)
                    if name in props.setdefault(code, {}):
                        raise ValidationError("Unihan同字同属性重复，不能覆盖")
                    props[code][name] = value
                    locators[code, name] = (file, index)
                    property_count += 1
    if (
        len(props) != 102998
        or property_count != 1555629
        or len({name for p in props.values() for name in p}) != 99
    ):
        raise ValidationError(
            f"Unihan原始计数不符：{len(props)}字，{property_count}属性行"
        )
    sha = source_digest(original)
    result["unihan17"] = {
        "characters": len(props),
        "properties": property_count,
        "property_names": 99,
        "outside_bmp": sum(int(code[2:], 16) > 65535 for code in props),
        "stroke_only_components": len(
            asset_chars - {chr(int(code[2:], 16)) for code in props}
        ),
        "sha256": sha,
    }
    character_fields = [
        "version",
        "codepoint",
        "character",
        "mandarin",
        "definition_en",
        "total_strokes",
        "properties",
    ]
    char_hash = record_digest(
        (
            "17.0.0",
            code,
            chr(int(code[2:], 16)),
            p.get("kMandarin", ""),
            p.get("kDefinition", ""),
            p.get("kTotalStrokes", ""),
            p,
        )
        for code, p in sorted(props.items())
    )
    property_fields = [
        "character__codepoint",
        "name",
        "value",
        "source_file",
        "source_line",
    ]
    property_hash = record_digest(
        (code, name, value, *locators[code, name])
        for code, p in sorted(props.items())
        for name, value in sorted(p.items())
    )
    unihan_fingerprints = [
        (UnihanCharacter.objects.order_by("codepoint"), character_fields, char_hash),
        (
            UnihanProperty.objects.order_by("character__codepoint", "name"),
            property_fields,
            property_hash,
        ),
    ]
    if dry_run:
        validate_existing(
            "unihan17",
            "17.0.0",
            sha,
            [
                (UnihanCharacter.objects.all(), 102998),
                (UnihanProperty.objects.all(), property_count),
            ],
            unihan_fingerprints,
        )
    if not dry_run:
        with transaction.atomic():
            dataset, created = Dataset.objects.select_for_update().get_or_create(
                code="unihan17",
                defaults={
                    "title": "Unihan17完整汉字属性",
                    "version": "17.0.0",
                    "input_digest": sha,
                    "state": "importing",
                },
            )
            if not created and (
                dataset.input_digest != sha or dataset.version != "17.0.0"
            ):
                raise ValidationError("Unihan17版本漂移")
            validate_existing(
                "unihan17",
                "17.0.0",
                sha,
                [
                    (UnihanCharacter.objects.all(), 102998),
                    (UnihanProperty.objects.all(), property_count),
                ],
                unihan_fingerprints,
            )
            if dataset.state == "ready":
                if (
                    UnihanCharacter.objects.count() != 102998
                    or UnihanProperty.objects.count() != property_count
                ):
                    raise ValidationError("Unihan回执行数不符")
                result["unihan17"]["unchanged"] = 102998
            else:
                if UnihanCharacter.objects.exists():
                    raise ValidationError("Unihan已有半成品，拒绝追加")
                UnihanCharacter.objects.bulk_create(
                    [
                        UnihanCharacter(
                            codepoint=code,
                            character=chr(int(code[2:], 16)),
                            mandarin=p.get("kMandarin", ""),
                            definition_en=p.get("kDefinition", ""),
                            total_strokes=p.get("kTotalStrokes", ""),
                            properties=p,
                        )
                        for code, p in props.items()
                    ],
                    batch_size=500,
                )
                ids = dict(UnihanCharacter.objects.values_list("codepoint", "pk"))
                buffer = []
                for code, p in props.items():
                    for name, value in p.items():
                        file, index = locators[code, name]
                        buffer.append(
                            UnihanProperty(
                                character_id=ids[code],
                                name=name,
                                value=value,
                                source_file=file,
                                source_line=index,
                            )
                        )
                        if len(buffer) >= 2000:
                            UnihanProperty.objects.bulk_create(buffer, batch_size=1000)
                            buffer = []
                if buffer:
                    UnihanProperty.objects.bulk_create(buffer, batch_size=1000)
                dataset.state = "ready"
                dataset.counts = {"characters": 102998, "properties": property_count}
                dataset.save(update_fields=["state", "counts"])
    return result
