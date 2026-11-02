"""Verified package storage plus narrow, independently atomic domain importers."""

import hashlib, importlib, json, os, stat, tempfile, time, zipfile
from pathlib import Path, PurePosixPath
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import ArchivePackage, SourceFile, ImportRun
from .scope import ACTIVE_ARCHIVES, SCOPE, retains_member

IMPORTERS = [
    ("lexicon.reference_importing", "词典与读音"),
    ("hanzi.importing", "汉字与Unihan"),
    ("poetry.importing", "古诗文"),
    ("geography.importing", "国家地区"),
    ("astronomy.importing", "天文"),
    ("science.importing", "化学元素"),
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def prepare(input_root, storage_root, *, persist):
    specification = json.loads(
        (settings.BASE_DIR / "docs/reference-manifest-2026-11-02.json").read_text()
    )
    reports = []
    for expected in specification["archives"]:
        archive_name = Path(expected["archive"]).name
        if archive_name not in ACTIVE_ARCHIVES:
            continue
        path = Path(input_root) / archive_name
        if not path.is_file() or path.stat().st_size != expected["bytes"]:
            raise ValidationError(f"包缺失或大小不符：{path.name}")
        if sha(path.read_bytes()) != expected["sha256"]:
            raise ValidationError(f"包摘要不符：{path.name}")
        files = []
        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            if len(names) != len(set(names)):
                raise ValidationError("ZIP重复路径")
            manifest = json.loads(archive.read("manifest.json"))
            declared = {f["path"]: f for f in manifest["files"]}
            if set(names) - {"manifest.json", "SHA256SUMS"} != set(declared):
                raise ValidationError("包内文件覆盖不符")
            for info in archive.infolist():
                member = PurePosixPath(info.filename)
                if (
                    member.is_absolute()
                    or ".." in member.parts
                    or "\\" in info.filename
                    or stat.S_ISLNK(info.external_attr >> 16)
                ):
                    raise ValidationError("不安全ZIP路径")
                data = archive.read(
                    info
                )  # CRC checked by zipfile, once with the hash verification.
                checksum = sha(data)
                if info.filename in declared:
                    item = declared[info.filename]
                    if len(data) != item["bytes"] or checksum != item["sha256"]:
                        raise ValidationError("包内载荷摘要不符")
                # Excluded payloads are still SHA/CRC verified, never stored or registered.
                if not retains_member(path.name, info.filename):
                    continue
                target = Path(storage_root) / path.stem / member
                if target.exists():
                    if sha(target.read_bytes()) != checksum:
                        raise ValidationError(f"已有来源文件漂移：{info.filename}")
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with tempfile.NamedTemporaryFile(
                        dir=target.parent, prefix=".reference-", delete=False
                    ) as stage:
                        stage.write(data)
                        stage_path = Path(stage.name)
                    try:
                        os.chmod(stage_path, 0o600)
                        os.replace(stage_path, target)
                    finally:
                        stage_path.unlink(missing_ok=True)
                files.append(
                    {
                        "path": info.filename,
                        "sha256": checksum,
                        "size": len(data),
                        "storage_path": (
                            str(target.relative_to(settings.REFERENCE_STORAGE_ROOT))
                            if persist
                            else ""
                        ),
                    }
                )
        reports.append(
            {
                "name": path.name,
                "sha256": expected["sha256"],
                "size": expected["bytes"],
                "files": files,
            }
        )
    if {package["name"] for package in reports} != ACTIVE_ARCHIVES:
        raise ValidationError("当前六包范围与固定清单不符")
    return reports


def check_registry(packages):
    """Preview and apply share the same checks of already registered sources."""
    for package in packages:
        for item in package["files"]:
            target = (
                settings.REFERENCE_STORAGE_ROOT
                / "packages"
                / Path(package["name"]).stem
                / item["path"]
            )
            if target.exists() and sha(target.read_bytes()) != item["sha256"]:
                raise ValidationError(f"已有来源文件漂移：{item['path']}")
        row = ArchivePackage.objects.filter(name=package["name"]).first()
        if row is None:
            continue
        if row.sha256 != package["sha256"] or row.size != package["size"]:
            raise ValidationError("已登记包漂移")
        existing = {f.path: f for f in SourceFile.objects.filter(package=row)}
        expected = {f["path"] for f in package["files"]}
        if set(existing) != expected:
            raise ValidationError("已登记包的文件覆盖不符")
        for item in package["files"]:
            obj = existing[item["path"]]
            relative = str(Path("packages") / Path(package["name"]).stem / item["path"])
            if (
                obj.sha256 != item["sha256"]
                or obj.size != item["size"]
                or obj.storage_path != relative
            ):
                raise ValidationError("已登记文件漂移")


def run_import(input_root, *, dry_run=False):
    started = time.monotonic()
    results = {}
    if dry_run:
        # Temporary decompression is scratch, never published/project assets; always removed.
        with tempfile.TemporaryDirectory(prefix="primary-reference-preview-") as temp:
            packages = prepare(input_root, Path(temp), persist=False)
            with transaction.atomic():
                check_registry(packages)
                for module, label in IMPORTERS:
                    tick = time.monotonic()
                    results[label] = {
                        "counts": importlib.import_module(module).import_data(
                            Path(temp), dry_run=True
                        ),
                        "seconds": round(time.monotonic() - tick, 3),
                    }
                transaction.set_rollback(True)
        return {
            "dry_run": True,
            "scope": SCOPE,
            "packages": len(packages),
            "files": sum(len(p["files"]) for p in packages),
            "datasets": results,
            "seconds": round(time.monotonic() - started, 3),
        }
    root = settings.REFERENCE_STORAGE_ROOT / "packages"
    packages = prepare(input_root, root, persist=True)
    # File storage is private and content-address-checked. Published data is only ready datasets.
    with transaction.atomic():
        check_registry(packages)
        for package in packages:
            row, created = ArchivePackage.objects.get_or_create(
                name=package["name"],
                defaults={k: package[k] for k in ["sha256", "size"]},
            )
            if row.sha256 != package["sha256"] or row.size != package["size"]:
                raise ValidationError("已登记包漂移")
            for item in package["files"]:
                obj, new = SourceFile.objects.get_or_create(
                    package=row,
                    path=item["path"],
                    defaults={k: v for k, v in item.items() if k != "path"},
                )
                if any(getattr(obj, k) != v for k, v in item.items()):
                    raise ValidationError("已登记文件漂移")
    for module, label in IMPORTERS:
        tick = time.monotonic()
        results[label] = {
            "counts": importlib.import_module(module).import_data(root, dry_run=False),
            "seconds": round(time.monotonic() - tick, 3),
        }
    manifest_digest = sha(json.dumps(packages, sort_keys=True).encode())
    result = {
        "dry_run": False,
        "scope": SCOPE,
        "packages": len(packages),
        "files": sum(len(p["files"]) for p in packages),
        "datasets": results,
        "seconds": round(time.monotonic() - started, 3),
    }
    ImportRun.objects.get_or_create(
        manifest_digest=manifest_digest, defaults={"report": result}
    )
    return result
