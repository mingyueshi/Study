"""构建「Unihan 18.0.0 全量属性」资料包（01f）：Unicode Unihan.zip 交付包。

与 01c（unihan_17）同一交付包格式：
- language/unihan-18.0.0/original/Unihan.zip 为主输入，本地文件 sha256 必须与
  lexicon/sources/registry.json 钉定值一致（同一份下载，双管线共用）。
- 另含 original/ReadMe.txt、LICENSE-UNICODE-V3.txt（unicode.org 白名单下载，
  结果记录进 download-log.json）、parse-report.json 与 normalized/character_properties.jsonl
  （selected 字段与 17.0.0 报告一致，仅作审计与人工核对用，导入层不读）。
- manifest.json / SHA256SUMS / 固定时间戳，重复构建字节一致。

用法：cd primary-system && python3 scripts/build_unihan18_package.py
输出：../references/01f_unihan_18_2026-11-06.zip
"""
import hashlib
import io
import json
import os
import stat
import sys
import tempfile
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
LOCAL_UNIHAN = BASE / "data/lexicon/unihan-18.0.0.zip"
DESTINATION = BASE.parent / "references/01f_unihan_18_2026-11-06.zip"
AUX_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/unihan18-src")

VERSION = "18.0.0"
ZIP_DATE = (2026, 11, 6, 0, 0, 0)
VERIFIED_AS_OF = "2026-11-06"
PINNED_UNIHAN_SHA = "4c93ea9c1f636451729a840978f1667a53886af37ba854fdcce109721c63d43e"
URLS = {
    "original/Unihan.zip": "https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip",
    "original/ReadMe.txt": "https://www.unicode.org/Public/18.0.0/ucd/ReadMe.txt",
    "LICENSE-UNICODE-V3.txt": "https://www.unicode.org/license.txt",
}
SELECTED_FIELDS = [
    "kDefinition", "kFrequency", "kGradeLevel", "kHanyuPinlu", "kHanyuPinyin",
    "kMandarin", "kRSUnicode", "kSimplifiedVariant", "kTotalStrokes",
    "kTraditionalVariant",
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fetch_aux(member_path):
    """白名单 https 下载辅助文件到 AUX_DIR（平铺文件名）；已存在则直接复用。"""
    target = AUX_DIR / Path(member_path).name
    if target.is_file() and target.stat().st_size > 0:
        return target.read_bytes()
    url = URLS[member_path]
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "www.unicode.org":
        raise SystemExit(f"拒绝非白名单上游地址：{url}")
    AUX_DIR.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:  # noqa: S310 白名单校验后
        payload = response.read()
    target.write_bytes(payload)
    return payload


def parse_unihan(payload):
    """与 hanzi/importing.py 同口径解析 Unihan.zip：props、定位、计数。"""
    props, locators = {}, {}
    lines = 0
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        for file in archive.namelist():
            if not file.endswith(".txt"):
                continue
            with archive.open(file) as f:
                for index, line in enumerate(io.TextIOWrapper(f, encoding="utf-8"), 1):
                    if not line.strip() or line.startswith("#"):
                        continue
                    code, name, value = line.rstrip("\r\n").split("\t", 2)
                    if name in props.setdefault(code, {}):
                        raise SystemExit("Unihan同字同属性重复")
                    props[code][name] = value
                    locators[code, name] = (file, index)
                    lines += 1
    return props, locators, lines


def write_member(archive, path, payload):
    info = zipfile.ZipInfo(path, date_time=ZIP_DATE)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (stat.S_IFREG | 0o644) << 16
    archive.writestr(info, payload)


def build_package(destination):
    payload = LOCAL_UNIHAN.read_bytes()
    if sha(payload) != PINNED_UNIHAN_SHA:
        raise SystemExit(f"本地 Unihan.zip 摘要与 registry.json 钉定值不符：{LOCAL_UNIHAN}")

    readme = fetch_aux("original/ReadMe.txt")
    license_text = fetch_aux("LICENSE-UNICODE-V3.txt")

    props, locators, lines = parse_unihan(payload)
    selected_counts = {}
    selected_chars = 0
    normalized_lines = []
    for code, p in sorted(props.items()):
        picked = {
            name: p[name] for name in SELECTED_FIELDS if name in p
        }
        if picked:
            selected_chars += 1
            row = {"codepoint": code, "character": chr(int(code[2:], 16))}
            row.update(picked)
            normalized_lines.append(
                json.dumps(row, ensure_ascii=False, separators=(",", ":"))
            )
        for name, value in picked.items():
            selected_counts[name] = selected_counts.get(name, 0) + 1

    parse_report = {
        "archive_data_lines": lines,
        "selected_fields": SELECTED_FIELDS,
        "characters_with_any_selected_property": selected_chars,
        "selected_property_counts": selected_counts,
    }
    members = {
        "language/unihan-18.0.0/original/Unihan.zip": payload,
        "language/unihan-18.0.0/original/ReadMe.txt": readme,
        "language/unihan-18.0.0/LICENSE-UNICODE-V3.txt": license_text,
        "language/unihan-18.0.0/normalized/character_properties.jsonl": (
            "\n".join(normalized_lines) + "\n"
        ).encode("utf-8"),
        "language/unihan-18.0.0/parse-report.json": json.dumps(
            parse_report, ensure_ascii=False, indent=1
        ).encode("utf-8"),
        "language/unihan-18.0.0/download-log.json": json.dumps(
            [
                {
                    "path": path,
                    "url": url,
                    "sha256": sha(payload if path == "original/Unihan.zip"
                                  else readme if path == "original/ReadMe.txt"
                                  else license_text),
                    "bytes": len(payload if path == "original/Unihan.zip"
                                 else readme if path == "original/ReadMe.txt"
                                 else license_text),
                    "verified_as_of": VERIFIED_AS_OF,
                }
                for path, url in URLS.items()
            ],
            ensure_ascii=False, indent=1,
        ).encode("utf-8"),
        "docs/资源来源与许可索引.json": json.dumps(
            [
                {
                    "id": f"unicode-unihan-{VERSION}",
                    "name": f"Unicode Unihan {VERSION} 全量汉字属性",
                    "source_url": "https://www.unicode.org/reports/tr38/tr38-41.html",
                    "license": "Unicode-3.0",
                    "records": len(props),
                    "quality_notes": (
                        "原始 Unihan.zip 原样打包，parse-report 与 normalized 层仅选列"
                        "派生供审计；全量属性行含上游版本间增删（18.0.0 较 17.0.0 字数 +1、"
                        "属性行减少），导入层按当版本计数守卫。"
                    ),
                }
            ],
            ensure_ascii=False, indent=1,
        ).encode("utf-8"),
    }
    manifest = {
        "files": [
            {"path": path, "bytes": len(item), "sha256": sha(item)}
            for path, item in sorted(members.items())
        ]
    }
    members["manifest.json"] = json.dumps(manifest, ensure_ascii=False, indent=1).encode("utf-8")
    members["SHA256SUMS"] = "".join(
        f"{sha(item)}  {path}\n"
        for path, item in sorted(members.items())
        if path != "SHA256SUMS"
    ).encode("utf-8")

    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=destination.parent, prefix=".reference-", delete=False
    ) as stage:
        stage_path = Path(stage.name)
    try:
        with zipfile.ZipFile(stage_path, "w") as archive:
            for path, item in sorted(members.items()):
                write_member(archive, path, item)
        os.replace(stage_path, destination)
    finally:
        stage_path.unlink(missing_ok=True)
    return {
        "characters": len(props),
        "property_lines": lines,
        "property_names": len({name for p in props.values() for name in p}),
        "selected_chars": selected_chars,
        "package_bytes": destination.stat().st_size,
        "package_sha256": sha(destination.read_bytes()),
    }


def main():
    counts = build_package(DESTINATION)
    print(json.dumps(counts, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
