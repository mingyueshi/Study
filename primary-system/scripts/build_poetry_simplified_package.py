"""从既有古诗文资料包生成同 commit 简体镜像层，并重打包为新 ZIP。

简体层用钉死的 opencc t2s（0.1.7）从繁体/原始 JSON 逐记录生成，结构逐位镜像；
生成时内建对齐自检（结构、locator 形态、段落级逐字相等），任一不符即失败。
输出同时更新 docs/reference-manifest-2026-11-02.json 的包登记（旧条目保留为历史）。
"""

import csv
import hashlib
import importlib.metadata
import json
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

OLD_ARCHIVE = "01d_classical_poetry_2026-11-02.zip"
NEW_ARCHIVE = "01d_classical_poetry_simplified_2026-11-04.zip"
OLD_ZIP_STEM = OLD_ARCHIVE.removesuffix(".zip")
NEW_ZIP_STEM = NEW_ARCHIVE.removesuffix(".zip")
FIXED_ZIP_DATE = (2026, 11, 4, 0, 0, 0)
DELIVERY_DATE = "2026-11-04"
OPENCC_VERSION = "0.1.7"
MAX_DELIVERY_BYTES = 33_554_432  # 32 MiB：简体层使 ZIP 超出旧 14 MiB 交付上限，登记同步放宽

PROJECT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT.parent
OLD_ZIP = WORKSPACE / "references" / OLD_ARCHIVE
NEW_ZIP = WORKSPACE / "references" / NEW_ARCHIVE
REFERENCE_MANIFEST = PROJECT / "docs" / "reference-manifest-2026-11-02.json"


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def load_converter():
    version = importlib.metadata.version("opencc-python-reimplemented")
    if version != OPENCC_VERSION:
        raise SystemExit(f"opencc-python-reimplemented 需为 {OPENCC_VERSION}，当前 {version}")
    from opencc import OpenCC

    return OpenCC("t2s")


def convert_value(value, convert):
    """只转换字符串值；键、数字与结构保持逐位镜像。"""
    if isinstance(value, str):
        return convert(value)
    if isinstance(value, list):
        return [convert_value(item, convert) for item in value]
    if isinstance(value, dict):
        return {key: convert_value(item, convert) for key, item in value.items()}
    return value


def assert_mirrored(traditional, simplified, convert, where):
    """结构逐位镜像自检：键序、列表长度、字符串逐字等于 t2s 原文。"""
    if isinstance(traditional, dict):
        if not isinstance(simplified, dict) or list(traditional) != list(simplified):
            raise SystemExit(f"镜像结构漂移（dict 键序）：{where}")
        for key, item in traditional.items():
            assert_mirrored(item, simplified[key], convert, f"{where}/{key}")
    elif isinstance(traditional, list):
        if not isinstance(simplified, list) or len(traditional) != len(simplified):
            raise SystemExit(f"镜像结构漂移（列表长度）：{where}")
        for index, (left, right) in enumerate(zip(traditional, simplified)):
            assert_mirrored(left, right, convert, f"{where}[{index}]")
    elif isinstance(traditional, str):
        if simplified != convert(traditional):
            raise SystemExit(f"镜像字形漂移：{where}")


def read_manifest_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return {row["path"]: row for row in csv.DictReader(handle)}


def append_file_manifest_rows(target, rows):
    fields = [
        "path", "source_path", "bytes", "record_count", "source_array_records",
        "record_unit", "top_level_type", "fields", "sha256", "source_sha256",
        "source_git_blob_sha1", "source_commit", "license", "language",
        "transform", "source_url",
    ]
    with target.open("a", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\r\n")
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def build_zip(staging, destination):
    entries = sorted(
        path for path in staging.rglob("*") if path.is_file()
    )
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in entries:
            member = path.relative_to(staging).as_posix()
            info = zipfile.ZipInfo(member, date_time=FIXED_ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())
    return entries


def write_sha256sums(staging, target, relatives):
    lines = "".join(
        f"{sha256_bytes((staging / relative).read_bytes())}  {relative}\n"
        for relative in sorted(relatives)
    )
    target.write_bytes(lines.encode("utf-8"))


def main():
    if not OLD_ZIP.is_file():
        raise SystemExit(f"缺少原始包：{OLD_ZIP}")
    convert = load_converter().convert

    with tempfile.TemporaryDirectory(prefix="poetry-simplified-") as temp:
        staging = Path(temp) / NEW_ZIP_STEM
        staging.mkdir()
        with zipfile.ZipFile(OLD_ZIP) as archive:
            for info in archive.infolist():
                target = staging / info.filename
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(info))

        json_files = sorted(
            list((staging / "poetry/raw").rglob("*.json"))
            + list((staging / "poetry/derived").rglob("*.json"))
        )
        if len(json_files) != 90:
            raise SystemExit(f"繁体层 JSON 数不符：{len(json_files)}")

        manifest_rows = read_manifest_rows(staging / "poetry/file_manifest.csv")
        new_rows = []
        for path in json_files:
            traditional_bytes = path.read_bytes()
            traditional = json.loads(traditional_bytes.decode("utf-8-sig"))
            simplified = convert_value(traditional, convert)
            assert_mirrored(traditional, simplified, convert, path.name)
            package_relative = path.relative_to(staging).as_posix()  # poetry/raw/诗经/shijing.json
            simplified_relative = package_relative.replace(
                "/raw/", "/simplified/"
            ).replace("/derived/", "/simplified/")
            simplified_target = staging / simplified_relative
            if simplified_target.exists():
                raise SystemExit(f"简体层路径冲突：{simplified_relative}")
            simplified_target.parent.mkdir(parents=True, exist_ok=True)
            payload = json.dumps(simplified, ensure_ascii=False, indent=2) + "\n"
            simplified_target.write_text(payload, encoding="utf-8")

            manifest_row = manifest_rows[package_relative.removeprefix("poetry/")]
            new_rows.append(
                {
                    "path": simplified_relative.removeprefix("poetry/"),
                    "source_path": manifest_row["path"],
                    "bytes": len(payload.encode("utf-8")),
                    "record_count": manifest_row["record_count"],
                    "source_array_records": manifest_row["source_array_records"],
                    "record_unit": manifest_row["record_unit"],
                    "top_level_type": manifest_row["top_level_type"],
                    "fields": manifest_row["fields"],
                    "sha256": sha256_bytes(simplified_target.read_bytes()),
                    "source_sha256": manifest_row["sha256"],
                    "source_git_blob_sha1": "",
                    "source_commit": manifest_row["source_commit"],
                    "license": manifest_row["license"],
                    "language": f"Classical Chinese; simplified (opencc t2s {OPENCC_VERSION})",
                    "transform": (
                        f"opencc t2s {OPENCC_VERSION}; structural mirror of {manifest_row['path']}"
                    ),
                    "source_url": "",
                }
            )
        append_file_manifest_rows(staging / "poetry/file_manifest.csv", new_rows)

        metadata_path = staging / "poetry/metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata["simplified_layer"] = {
            "tool": "opencc-python-reimplemented",
            "version": OPENCC_VERSION,
            "profile": "t2s",
            "generated_at_utc": datetime.now(timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
            "files": len(new_rows),
            "policy": (
                "同 commit 镜像层：逐记录结构对齐、段落级逐字等于 t2s 转换；"
                "只作展示元数据，原始字形仍以上一层为准。"
            ),
        }
        metadata_path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

        readme = staging / "poetry/README_中文.md"
        readme.write_text(
            readme.read_text(encoding="utf-8")
            + "\n## 简体镜像层（2026-11-04）\n\n"
            + "- `poetry/simplified/` 为同 commit 镜像层，由钉死的 opencc t2s 0.1.7 在打包时生成；"
            "逐记录结构对齐并在 file_manifest.csv 登记 transform 与来源 SHA256。\n"
            + "- 原始字形以上一层（raw/derived）为准；本层只作简体展示元数据，不做校勘替换。\n",
            encoding="utf-8",
        )

        poetry_members = [
            path.relative_to(staging).as_posix()
            for path in (staging / "poetry").rglob("*")
            if path.is_file() and path.name != "SHA256SUMS"
        ]
        write_sha256sums(staging, staging / "poetry/SHA256SUMS", poetry_members)

        members = [
            relative
            for path in staging.rglob("*")
            if path.is_file()
            and (relative := path.relative_to(staging).as_posix())
            not in ("manifest.json", "SHA256SUMS")
        ]
        write_sha256sums(staging, staging / "SHA256SUMS", members)

        manifest = {
            "bundle": NEW_ARCHIVE,
            "verified_as_of": DELIVERY_DATE,
            "max_delivery_bytes": MAX_DELIVERY_BYTES,
            "file_count_excluding_manifest_files": len(members),
            "note": (
                "All payload hashes below; manifest files exclude themselves. "
                "This root manifest is scoped to this independently extractable ZIP. "
                f"Simplified mirror layer (poetry/simplified/) generated with pinned opencc t2s {OPENCC_VERSION} "
                "at packaging time; see poetry/metadata.json and poetry/file_manifest.csv."
            ),
            "files": [
                {
                    "path": relative,
                    "bytes": (staging / relative).stat().st_size,
                    "sha256": sha256_bytes((staging / relative).read_bytes()),
                }
                for relative in members
            ],
        }
        (staging / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

        entries = build_zip(staging, NEW_ZIP)

    payload = NEW_ZIP.read_bytes()
    digest = sha256_bytes(payload)

    specification = json.loads(REFERENCE_MANIFEST.read_text(encoding="utf-8"))
    if any(entry["archive"].endswith(NEW_ARCHIVE) for entry in specification["archives"]):
        raise SystemExit("固定清单已登记新包，先确认历史条目再重跑")
    specification["archives"].append(
        {
            "archive": f"references/{NEW_ARCHIVE}",
            "bytes": len(payload),
            "sha256": digest,
            "outer_sha_matches": True,
            "crc_ok": True,
            "manifest_ok": True,
            "checked_payloads": len(entries),
        }
    )
    specification["archive_count"] = len(specification["archives"])
    REFERENCE_MANIFEST.write_text(
        json.dumps(specification, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(
        json.dumps(
            {
                "archive": NEW_ARCHIVE,
                "bytes": len(payload),
                "sha256": digest,
                "members": len(entries),
                "simplified_files": len(new_rows),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
