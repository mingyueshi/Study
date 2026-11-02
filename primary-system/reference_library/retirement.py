"""Exact, hash-checked cleanup of the two retired reference domains."""

import hashlib
import json
from pathlib import Path, PurePosixPath

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import connection
from .models import ArchivePackage, Dataset, SourceFile

RETIRED_TABLES = {
    "arithmetic_arithmeticfact",
    "science_sciencebook",
    "science_sciencedocument",
    "science_sciencesection",
    "science_scienceimage",
    "science_scienceactivity",
    "science_sciencequestion",
    "science_restrictedscience",
}


def load_manifest():
    return json.loads(Path(__file__).with_name("retirement_manifest.json").read_text())


def checked_relative(value):
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "\\" in value or not path.parts:
        raise ValidationError("退役清单含不安全路径")
    return Path(*path.parts)


def checked_file(base, relative, expected):
    target = base / relative
    for ancestor in [relative, *relative.parents]:
        if (base / ancestor).is_symlink():
            raise ValidationError(f"拒绝清理符号链接：{relative}")
    if not target.exists():
        return False
    if not target.is_file():
        raise ValidationError(f"退役目标不是普通文件：{relative}")
    if (
        target.stat().st_size != expected["size"]
        or hashlib.sha256(target.read_bytes()).hexdigest() != expected["sha256"]
    ):
        raise ValidationError(f"退役文件漂移，未删除任何文件：{relative}")
    return True


def cleanup_retired_assets(*, apply=False):
    manifest = load_manifest()
    base = Path(settings.REFERENCE_STORAGE_ROOT).absolute()
    if base.is_symlink():
        raise ValidationError("资料根目录不能是符号链接")
    roots = [checked_relative(value) for value in manifest["roots"]]
    files = {checked_relative(item["path"]): item for item in manifest["files"]}
    if len(files) != len(manifest["files"]):
        raise ValidationError("退役清单有重复路径")
    directories = set(roots)
    for relative in files:
        if not any(relative.is_relative_to(root) for root in roots):
            raise ValidationError("退役文件超出专属目录")
        directories.update(
            parent
            for parent in relative.parents
            if any(parent.is_relative_to(root) for root in roots)
        )
    # All targets must pass before the first unlink. Unknown files/empty directories
    # are never swept up by recursive deletion.
    for root in roots:
        target = base / root
        if any((base / parent).is_symlink() for parent in [root, *root.parents]):
            raise ValidationError(f"退役目录或父路径是符号链接：{root}")
        if target.exists() and not target.is_dir():
            raise ValidationError(f"退役目录类型不符：{root}")
        for item in target.rglob("*"):
            relative = item.relative_to(base)
            if (
                item.is_symlink()
                or (item.is_dir() and relative not in directories)
                or (not item.is_dir() and relative not in files)
            ):
                raise ValidationError(f"发现清单外文件或目录，拒绝清理：{relative}")
    present = [
        relative
        for relative, item in files.items()
        if checked_file(base, relative, item)
    ]
    if apply:
        if RETIRED_TABLES.intersection(connection.introspection.table_names()):
            raise ValidationError("请先应用退役迁移，再清理文件")
        if (
            Dataset.objects.filter(code__in=("science-caps4", "arithmetic")).exists()
            or ArchivePackage.objects.filter(
                name__in=[
                    root.name + ".zip"
                    for root in roots
                    if root.parts[0] == "packages" and root.name.startswith("03")
                ]
            ).exists()
            or SourceFile.objects.filter(
                package__name="02a_geography_english_elements_math_2026-11-02.zip",
                path__startswith="math_seed/",
            ).exists()
        ):
            raise ValidationError("退役来源登记尚未清理")
        for relative in present:
            if checked_file(base, relative, files[relative]):
                (base / relative).unlink()
        for relative in sorted(
            directories, key=lambda path: len(path.parts), reverse=True
        ):
            target = base / relative
            if target.is_dir():
                target.rmdir()
    return {
        "scope": manifest["scope"],
        "dry_run": not apply,
        "manifest_sha256": hashlib.sha256(
            json.dumps(manifest, sort_keys=True).encode()
        ).hexdigest(),
        "planned_files": len(present),
        "bytes": sum(files[path]["size"] for path in present),
        "already_absent": len(files) - len(present),
        "deleted_files": len(present) if apply else 0,
        "roots": manifest["roots"],
        "files": [str(path) for path in present],
    }
