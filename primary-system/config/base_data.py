"""SQLite-only, fixed-table development baseline; never a general database sync."""

import gzip
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath
import shutil
import sqlite3
import tempfile
from datetime import datetime
from uuid import UUID, uuid4

TABLES = (
    "astronomy_celestialrecord",
    "astronomy_namedcelestialrecord",
    "catalog_contentitem",
    "catalog_grade",
    "catalog_module",
    "catalog_placement",
    "catalog_stage",
    "catalog_subject",
    "catalog_textbook",
    "catalog_textbookbook",
    "catalog_textbookedition",
    "catalog_unit",
    "chain_chainword",
    "geography_countryregion",
    "hanzi_hanziasset",
    "hanzi_unihancharacter",
    "hanzi_unihanproperty",
    "lexicon_cedictrecord",
    "lexicon_chinesebatchreceipt",
    "lexicon_chinesereview",
    "lexicon_chinesesenseversion",
    "lexicon_cmupronunciation",
    "lexicon_contententrylink",
    "lexicon_contentlinkselection",
    "lexicon_entryform",
    "lexicon_entrymatch",
    "lexicon_lexicalentry",
    "lexicon_lexiconaudit",
    "lexicon_lexiconsource",
    "lexicon_pronunciation",
    "lexicon_sense",
    "lexicon_sourcebinding",
    "lexicon_sourcerecord",
    "lexicon_sourcerelease",
    "poetry_poetrydocument",
    "poetry_poetryexclusion",
    "poetry_poetrynode",
    "poetry_poetrytext",
    "reference_library_archivepackage",
    "reference_library_dataset",
    "reference_library_importrun",
    "reference_library_sourcefile",
    "science_element",
    "words_learningtarget",
    "words_relatedgloss",
    "words_scenario",
    "words_scenarioword",
    "words_targetchineseadoption",
)
PERSONAL = (
    "learning_progress", "words_wordprogress", "chain_gameround",
    "writing_writingdraft", "questionbank_answerrecord", "hanzi_polyphoneanswer",
    "idioms_playrecord", "phrases_phraseanswer", "plurals_pluralanswer",
    "poetry_feihualinground", "incentives_pointevent", "incentives_redemption",
    "incentives_checkin", "incentives_badgeaward",
)
LIMIT = 40 * 1024 * 1024
SHARD_BYTES = 30 * 1024 * 1024


class BaselineError(ValueError):
    pass


def sql(*parts):
    """SQL 标识符无法参数化：所有动态片段必须先经 quote() 白名单校验再拼接。"""
    return "".join(parts)


def encoded(value):
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def sha_file(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def quote(value):
    # SQL 标识符无法参数化：表名/列名只允许来自项目自身结构的受限字符集。
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", str(value)):
        raise BaselineError(f"非法 SQL 标识符：{value!r}")
    return '"' + value.replace('"', '""') + '"'


def open_readonly(path):
    return sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True)


def backup_database(path, directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / (
        Path(path).stem
        + "-"
        + datetime.now().strftime("%Y%m%d-%H%M%S")
        + "-"
        + uuid4().hex[:8]
        + ".sqlite3"
    )
    descriptor = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(descriptor)
    with open_readonly(path) as source, sqlite3.connect(target) as destination:
        source.backup(destination)
    return str(target)


def schema(database, table):
    rows = list(database.execute(sql("PRAGMA table_info(", quote(table), ")")))
    if not rows:
        raise BaselineError(f"缺少基础表 {table}；请先在副本应用项目迁移。")
    return [[row[1], row[2], row[3], row[5]] for row in rows]


def rows(database, table, columns):
    primary = [column[0] for column in columns if column[3]]
    if len(primary) != 1:
        raise BaselineError("基础表必须有单一主键：" + table)
    columns_part = ",".join(quote(c[0]) for c in columns)
    return database.execute(
        sql(
            "SELECT ", columns_part, " FROM ", quote(table), " ORDER BY ", quote(primary[0])
        )
    )


def migrations(database):
    return [
        list(row)
        for row in database.execute(
            "SELECT app,name FROM django_migrations ORDER BY app,name"
        )
    ]


def export_package(source_path, output, *, replace=False):
    output = Path(output)
    if output.is_symlink():
        raise BaselineError("输出目录不能是符号链接。")
    if output.exists() and not replace:
        raise BaselineError("输出目录已存在；请使用新目录或明确 --replace。")
    if output.exists():
        # Never rename/delete an arbitrary directory supplied by --output.
        read_manifest(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".base-export-", dir=output.parent))
    try:
        with tempfile.TemporaryDirectory(prefix="primary-base-readonly-") as temporary:
            snapshot = Path(temporary) / "snapshot.sqlite3"
            with open_readonly(source_path) as source, sqlite3.connect(
                snapshot
            ) as destination:
                source.backup(destination)
            with sqlite3.connect(snapshot) as database:
                if list(database.execute("PRAGMA foreign_key_check")):
                    raise BaselineError("导出源存在外键错误。")
                manifest = {
                    "format": 1,
                    "database": "sqlite",
                    "required_migrations": migrations(database),
                    "tables": [],
                }
                for table in TABLES:
                    columns = schema(database, table)
                    table_hash = hashlib.sha256()
                    parts, count, part_count, raw_size = [], 0, 0, 0
                    compressed = None
                    handle = None
                    part_hash = None

                    def close_part():
                        nonlocal compressed, handle
                        if compressed is None:
                            return
                        compressed.close()
                        handle.close()
                        if path.stat().st_size >= LIMIT:
                            raise BaselineError("单个压缩分片超过40MiB：" + str(path))
                        parts.append(
                            {
                                "path": path.name,
                                "rows": part_count,
                                "bytes": path.stat().st_size,
                                "sha256": sha_file(path),
                                "data_sha256": part_hash.hexdigest(),
                            }
                        )
                        compressed = handle = None

                    try:
                        for row in rows(database, table, columns):
                            value = list(row)
                            if table == "lexicon_lexiconaudit":
                                value[[c[0] for c in columns].index("actor_id")] = None
                            line = encoded(value) + b"\n"
                            if compressed is None or raw_size + len(line) > SHARD_BYTES:
                                close_part()
                                path = stage / (
                                    table
                                    + "-"
                                    + str(len(parts) + 1).zfill(4)
                                    + ".jsonl.gz"
                                )
                                handle = path.open("wb")
                                compressed = gzip.GzipFile(
                                    filename="",
                                    fileobj=handle,
                                    mode="wb",
                                    compresslevel=6,
                                    mtime=0,
                                )
                                raw_size = part_count = 0
                                part_hash = hashlib.sha256()
                            compressed.write(line)
                            part_hash.update(line)
                            table_hash.update(line)
                            raw_size += len(line)
                            part_count += 1
                            count += 1
                    finally:
                        close_part()
                    manifest["tables"].append(
                        {
                            "name": table,
                            "columns": columns,
                            "rows": count,
                            "data_sha256": table_hash.hexdigest(),
                            "files": parts,
                        }
                    )
        manifest["digest"] = hashlib.sha256(encoded(manifest)).hexdigest()
        (stage / "manifest.json").write_bytes(encoded(manifest) + b"\n")
        verify_package(stage)
        if output.exists():
            read_manifest(output)
            old = output.with_name("." + output.name + "-old-" + uuid4().hex)
            os.replace(output, old)
            try:
                os.replace(stage, output)
            except BaseException:
                os.replace(old, output)
                raise
            shutil.rmtree(old)
        else:
            os.replace(stage, output)
        return {
            "digest": manifest["digest"],
            "tables": len(TABLES),
            "rows": sum(t["rows"] for t in manifest["tables"]),
            "files": sum(len(t["files"]) for t in manifest["tables"]),
            "output": str(output),
        }
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def read_manifest(root):
    root = Path(root)
    if root.is_symlink() or (root / "manifest.json").is_symlink():
        raise BaselineError("基础包不能使用符号链接。")
    manifest = json.loads((root / "manifest.json").read_text())
    content = {k: v for k, v in manifest.items() if k != "digest"}
    if (
        manifest.get("format") != 1
        or manifest.get("database") != "sqlite"
        or hashlib.sha256(encoded(content)).hexdigest() != manifest.get("digest")
    ):
        raise BaselineError("基础包格式或总摘要不符。")
    names = [t["name"] for t in manifest["tables"]]
    if names != list(TABLES):
        raise BaselineError("基础包表白名单或顺序不符。")
    expected = {"manifest.json"}
    for table in manifest["tables"]:
        if not table["columns"] or len({c[0] for c in table["columns"]}) != len(
            table["columns"]
        ):
            raise BaselineError("基础包列清单不符。")
        for index, part in enumerate(table["files"], 1):
            name = part["path"]
            if (
                name != table["name"] + "-" + str(index).zfill(4) + ".jsonl.gz"
                or PurePosixPath(name).name != name
                or name in expected
            ):
                raise BaselineError("基础包含未知、重复或越界路径。")
            if (root / name).is_symlink():
                raise BaselineError("基础包分片不能使用符号链接。")
            expected.add(name)
    if {p.name for p in root.iterdir()} != expected:
        raise BaselineError("基础包文件覆盖不符。")
    return manifest


def package_rows(root, table):
    for part in table["files"]:
        with gzip.open(Path(root) / part["path"], "rb") as stream:
            for line in stream:
                row = json.loads(line)
                if (
                    not isinstance(row, list)
                    or len(row) != len(table["columns"])
                    or any(
                        not isinstance(v, (str, int, float, type(None))) for v in row
                    )
                ):
                    raise BaselineError("分片行格式不符：" + part["path"])
                yield row


def verify_package(root):
    manifest = read_manifest(root)
    for table in manifest["tables"]:
        total = 0
        table_hash = hashlib.sha256()
        primary = [i for i, c in enumerate(table["columns"]) if c[3]]
        if len(primary) != 1:
            raise BaselineError("基础包主键定义不符。")
        previous = None
        for part in table["files"]:
            path = Path(root) / part["path"]
            if (
                path.stat().st_size != part["bytes"]
                or path.stat().st_size >= LIMIT
                or sha_file(path) != part["sha256"]
            ):
                raise BaselineError("压缩分片摘要/大小不符：" + path.name)
            count, part_hash = 0, hashlib.sha256()
            with gzip.open(path, "rb") as stream:
                for line in stream:
                    row = json.loads(line)
                    if (
                        not isinstance(row, list)
                        or len(row) != len(table["columns"])
                        or any(
                            not isinstance(v, (str, int, float, type(None)))
                            for v in row
                        )
                        or encoded(row) + b"\n" != line
                    ):
                        raise BaselineError("分片行不是规范JSONL：" + path.name)
                    key = row[primary[0]]
                    if previous is not None and key <= previous:
                        raise BaselineError("分片主键重复或排序不符。")
                    previous = key
                    table_hash.update(line)
                    part_hash.update(line)
                    count += 1
            if count != part["rows"] or part_hash.hexdigest() != part["data_sha256"]:
                raise BaselineError("解压分片计数/摘要不符：" + path.name)
            total += count
        if total != table["rows"] or table_hash.hexdigest() != table["data_sha256"]:
            raise BaselineError("表计数/摘要不符：" + table["name"])
    return manifest


def compare_database(database, manifest):
    if migrations(database) != manifest["required_migrations"]:
        raise BaselineError(
            "迁移状态与基础包不兼容；请使用 --refresh-data 先备份并升级，或使用新 --database 路径。"
        )
    differences = []
    for table in manifest["tables"]:
        if schema(database, table["name"]) != table["columns"]:
            raise BaselineError("表结构与基础包不符：" + table["name"])
        h, count = hashlib.sha256(), 0
        for row in rows(database, table["name"], table["columns"]):
            h.update(encoded(list(row)) + b"\n")
            count += 1
        if count != table["rows"] or h.hexdigest() != table["data_sha256"]:
            differences.append(
                {"table": table["name"], "current": count, "baseline": table["rows"]}
            )
    return differences


def is_subset(database, root, manifest):
    for table in manifest["tables"]:
        index = next(i for i, c in enumerate(table["columns"]) if c[3])
        iterator = iter(rows(database, table["name"], table["columns"]))
        current = next(iterator, None)
        if current is None:
            continue
        for expected in package_rows(root, table):
            if current is not None and current[index] < expected[index]:
                return False
            if current is not None and current[index] == expected[index]:
                if encoded(list(current)) != encoded(expected):
                    return False
                current = next(iterator, None)
                if current is None:
                    break
        if current is not None:
            return False
    return True


def inherited_baseline_links(root, manifest):
    """Compare old imports by provenance, without equating environment-local UUIDs."""

    def records(name):
        table = next(t for t in manifest["tables"] if t["name"] == name)
        names = [c[0] for c in table["columns"]]
        return (dict(zip(names, row)) for row in package_rows(root, table))

    contents = {r["id"]: r["source_key"] for r in records("catalog_contentitem")}
    links = list(records("lexicon_contententrylink"))
    selected = {r["evidence_id"] for r in links}
    evidence = {
        r["id"]: r for r in records("lexicon_sourcerecord") if r["id"] in selected
    }
    selected = {r["binding_id"] for r in evidence.values()}
    bindings = {
        r["id"]: r for r in records("lexicon_sourcebinding") if r["id"] in selected
    }
    sources = {r["id"]: r["code"] for r in records("lexicon_lexiconsource")}
    return {
        (
            contents[link["content_id"]],
            link["slot"],
            sources[bindings[evidence[link["evidence_id"]]["binding_id"]]["source_id"]],
            bindings[evidence[link["evidence_id"]]["binding_id"]]["external_key"],
            evidence[link["evidence_id"]]["lexical_hash"],
        )
        for link in links
    }


def initial_inherited_selection(database, history, equivalent_links):
    """Only the unmodified automatic first selection may be replaced on old installs."""
    if history["revision"] != 1 or history["reason"] not in {
        "首次明确选择／继承教学关联",
        "继承旧关联：冻结迁移时选择，不逆推历史学习版本",
    }:
        return False
    cursor = database.execute(
        "SELECT * FROM lexicon_contententrylink WHERE id=?", (history["link_id"],)
    )
    row = cursor.fetchone()
    if row is None:
        return False
    link = dict(zip((c[0] for c in cursor.description), row))
    if (
        link["selection_revision"] != 1
        or link["presentation_revision"] != 0
        or link["chinese_version_id"] is not None
        or link["method"] != "inherited"
        or link["review_note"] != "沿用现有教学词卡的释义与读音；不代表权威词典审校。"
    ):
        return False
    if (
        database.execute(
            "SELECT count(*) FROM lexicon_contentlinkselection WHERE link_id=?",
            (link["id"],),
        ).fetchone()[0]
        != 1
    ):
        return False
    evidence = database.execute(
        """SELECT r.headword,b.sense_id,b.pronunciation_id,
        c.source_key,l.slot,s.code,b.external_key,r.lexical_hash
        FROM lexicon_sourcerecord r JOIN lexicon_sourcebinding b ON r.binding_id=b.id
        JOIN lexicon_lexiconsource s ON s.id=b.source_id
        JOIN lexicon_contententrylink l ON l.evidence_id=r.id
        JOIN catalog_contentitem c ON c.id=l.content_id WHERE l.id=?""",
        (link["id"],),
    ).fetchone()
    if (
        evidence is None
        or evidence[:3]
        != (link["selected_headword"], link["sense_id"], link["pronunciation_id"])
        or evidence[3:] not in equivalent_links
    ):
        return False
    sense = database.execute(
        "SELECT revision,editorial_definition FROM lexicon_sense WHERE id=?",
        (link["sense_id"],),
    ).fetchone()
    pronunciation = database.execute(
        "SELECT revision,editorial_value FROM lexicon_pronunciation WHERE id=?",
        (link["pronunciation_id"],),
    ).fetchone()
    if sense is None or link["pronunciation_id"] and pronunciation is None:
        return False
    editorial = {
        "sense_revision": sense[0],
        "definition": sense[1],
        "pronunciation_revision": pronunciation[0] if pronunciation else None,
        "pronunciation": pronunciation[1] if pronunciation else "",
    }
    if json.loads(link["editorial_snapshot"]) != editorial:
        return False

    def uuid_text(value):
        return str(UUID(value)) if value else None

    expected = {
        "sense_id": uuid_text(link["sense_id"]),
        "pronunciation_id": uuid_text(link["pronunciation_id"]),
        "evidence_id": uuid_text(link["evidence_id"]),
        "editorial_snapshot": json.loads(link["editorial_snapshot"]),
        "headword": link["selected_headword"],
        "chinese_version_id": None,
        "presentation_revision": 0,
    }
    return json.loads(history["selection"]) == expected


def replacement_blockers(database, root, manifest):
    available = {
        r[0]
        for r in database.execute("SELECT name FROM sqlite_master WHERE type='table'")
    }
    blockers = []
    for name in PERSONAL:
        if name in available:
            count = database.execute(
                sql("SELECT count(*) FROM ", quote(name))
            ).fetchone()[0]
            if count:
                blockers.append(f"{name}: {count}条个人记录")
    checks = [
        ("catalog_contentitem", "import_locked=1", "受保护人工内容"),
        ("lexicon_sense", "revision>0 OR editorial_definition!=''", "人工修订释义"),
        ("lexicon_pronunciation", "revision>0 OR editorial_value!=''", "人工修订读音"),
    ]
    for name, where, label in checks:
        if database.execute(
            sql("SELECT count(*) FROM ", quote(name), " WHERE ", where)
        ).fetchone()[0]:
            blockers.append(label)
    equivalent_links = inherited_baseline_links(root, manifest)
    for name in (
        "lexicon_chinesesenseversion",
        "lexicon_chinesereview",
        "lexicon_contentlinkselection",
        "words_targetchineseadoption",
    ):
        table = next(t for t in manifest["tables"] if t["name"] == name)
        pk_index = next(i for i, c in enumerate(table["columns"]) if c[3])
        expected = {r[pk_index]: encoded(r) for r in package_rows(root, table)}
        for row in rows(database, name, table["columns"]):
            if name == "lexicon_contentlinkselection":
                fields = [c[0] for c in table["columns"]]
                if initial_inherited_selection(
                    database, dict(zip(fields, row)), equivalent_links
                ):
                    continue
            if expected.get(row[pk_index]) != encoded(list(row)):
                blockers.append("本地额外或已修改的中文版本/核对/采用历史：" + name)
                break
    table = next(t for t in manifest["tables"] if t["name"] == "catalog_contentitem")
    source_index = next(
        i for i, c in enumerate(table["columns"]) if c[0] == "source_key"
    )
    source_keys = {r[source_index] for r in package_rows(root, table)}
    if any(
        not key or key not in source_keys
        for key, in database.execute("SELECT source_key FROM catalog_contentitem")
    ):
        blockers.append("本地额外内容，不能覆盖")
    return blockers


def restore_package(
    database_path,
    root,
    *,
    refresh=False,
    verify_only=False,
    backup_dir=None,
    backup_already=None,
):
    manifest = verify_package(root)  # No target writes before all package checks pass.
    database = open_readonly(database_path) if verify_only else sqlite3.connect(
        database_path, isolation_level=None,
    )
    try:
        database.execute("PRAGMA foreign_keys=ON")
        database.execute("BEGIN IMMEDIATE" if not verify_only else "BEGIN")
        differences = compare_database(database, manifest)
        if not differences:
            database.rollback()
            return {
                "status": "unchanged",
                "digest": manifest["digest"],
                "rows": sum(t["rows"] for t in manifest["tables"]),
            }
        has_rows = any(
            database.execute(
                sql("SELECT EXISTS(SELECT 1 FROM ", quote(name), ")")
            ).fetchone()[0]
            for name in TABLES
        )
        if verify_only or not refresh and has_rows:
            raise BaselineError(
                "现有库与基线不一致，未改动。请运行 python3.12 bootstrap.py --refresh-data；若需保留独立内容，请运行 python3.12 bootstrap.py --database "
                + str(Path(database_path).with_name("db.baseline.sqlite3"))
                + "。差异："
                + json.dumps(differences, ensure_ascii=False)
            )
        subset = is_subset(database, root, manifest)
        if not subset:
            blockers = replacement_blockers(database, root, manifest)
            if blockers:
                raise BaselineError(
                    "保留原库，拒绝替换："
                    + "；".join(blockers)
                    + "。可完整运行基线：python3.12 bootstrap.py --database "
                    + str(Path(database_path).with_name("db.baseline.sqlite3"))
                )
        backup = backup_already
        has_rows = any(
            database.execute(
                sql("SELECT EXISTS(SELECT 1 FROM ", quote(name), ")")
            ).fetchone()[0]
            for name in TABLES
        )
        if (has_rows or refresh) and not backup:
            backup = backup_database(
                database_path,
                backup_dir or Path(database_path).parent / ".backups/base-data",
            )
        grade_mapping = []
        if not subset:
            grade = next(t for t in manifest["tables"] if t["name"] == "catalog_grade")
            names = [c[0] for c in grade["columns"]]
            incoming = {
                r[names.index("code")]: r[names.index("id")]
                for r in package_rows(root, grade)
            }
            for user_id, code in database.execute(
                "SELECT u.id,g.code FROM accounts_user u JOIN catalog_grade g ON u.grade_id=g.id"
            ):
                if code not in incoming:
                    raise BaselineError("账号年级在基线中不存在：" + code)
                grade_mapping.append((incoming[code], user_id))
        database.execute("PRAGMA defer_foreign_keys=ON")
        if not subset:
            for name in reversed(TABLES):
                database.execute(sql("DELETE FROM ", quote(name)))
        for table in manifest["tables"]:
            names = [c[0] for c in table["columns"]]
            pk = next(c[0] for c in table["columns"] if c[3])
            columns_part = ",".join(map(quote, names))
            placeholders = ",".join("?" for _ in names)
            insert_sql = sql(
                "INSERT INTO ", quote(table["name"]),
                " (", columns_part, ") VALUES (", placeholders, ")",
            )
            if subset:
                insert_sql = sql(insert_sql, " ON CONFLICT(", quote(pk), ") DO NOTHING")
            batch = []
            for row in package_rows(root, table):
                batch.append(row)
                if len(batch) >= 1000:
                    database.executemany(insert_sql, batch)
                    batch.clear()
            if batch:
                database.executemany(insert_sql, batch)
        if grade_mapping:
            database.executemany(
                "UPDATE accounts_user SET grade_id=? WHERE id=?", grade_mapping
            )
        for table in manifest["tables"]:
            primary = next(c for c in table["columns"] if c[3])
            if primary[1].upper() == "INTEGER":
                maximum = (
                    database.execute(
                        sql(
                            "SELECT max(", quote(primary[0]),
                            ") FROM ", quote(table["name"]),
                        )
                    ).fetchone()[0]
                    or 0
                )
                database.execute(
                    "UPDATE sqlite_sequence SET seq=? WHERE name=?",
                    (maximum, table["name"]),
                )
        if list(database.execute("PRAGMA foreign_key_check")):
            raise BaselineError("恢复后外键校验失败，整次回滚。")
        remaining = compare_database(database, manifest)
        if remaining:
            raise BaselineError("恢复后摘要不符，整次回滚。")
        database.commit()
        return {
            "status": "completed_missing" if subset else "refreshed",
            "digest": manifest["digest"],
            "backup": backup,
            "tables": len(TABLES),
            "rows": sum(t["rows"] for t in manifest["tables"]),
        }
    except BaseException:
        database.rollback()
        raise
    finally:
        database.close()
