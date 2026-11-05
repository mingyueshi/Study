"""Rebuildable read-only practice index. Never part of the formal content database."""

from contextlib import closing, contextmanager
from functools import lru_cache
import hashlib
import importlib.metadata
from itertools import product
import json
import os
from pathlib import Path
import re
import sqlite3
import tempfile
import time
import fcntl

from django.conf import settings
from django.db import connection
from django.db.models import Q
from django.urls import reverse
from opencc import OpenCC

from reference_library.models import Dataset, SourceFile
from .models import PoetryDocument, PoetryText
from .feihualing import Answer, ExerciseError, KEYWORDS, TARGET, clean, digest
from .importing import simplified_relative

FORMAT = "feihualing-complete-sentences-v4"
HAN = re.compile(r"^[\u3400-\u9fff\uf900-\ufaff\U00020000-\U000323af]+$")
SPLIT = re.compile(r"[，,、；;：:]+")
TERMINALS = frozenset("。！？.!?")
CLOSERS = frozenset('」』”’"')


@lru_cache(maxsize=1)
def converter():
    if importlib.metadata.version("opencc-python-reimplemented") != "0.1.7":
        raise ExerciseError("诗句字形工具需要更新，请稍后再来。", 503)
    return OpenCC("t2s")


@lru_cache(maxsize=32768)
def normalize(value):
    return converter().convert(clean(value))


def scope():
    # 简体镜像层只作展示元数据，不作为独立作答来源。
    return (
        Q(collection__in=("全唐诗", "宋词", "楚辞", "诗经"))
        | Q(path="poetry/raw/蒙学/qianjiashi.json")
    ) & ~Q(layer="simplified")


def sentence_units(paragraph):
    """Keep comma clauses together; never cross an original paragraph boundary."""
    if not isinstance(paragraph, str):
        return [], 1
    units, start, pos = [], 0, 0
    while pos < len(paragraph):
        if paragraph[pos] not in TERMINALS:
            pos += 1
            continue
        end = pos + 1
        while end < len(paragraph) and (
            paragraph[end] in TERMINALS or paragraph[end] in CLOSERS
        ):
            end += 1
        text = paragraph[start:end].strip()
        if text:
            units.append(text)
        start = pos = end
    tail = paragraph[start:].strip()
    rejected = 0
    if tail:
        # Structured Chu Ci couplets may have no final stop. Hanging commas/notes are not complete.
        if ("，" in tail or "," in tail) and HAN.fullmatch(tail[-1:]):
            units.append(tail)
        else:
            rejected = 1
    return units, rejected


def readable(sentence):
    if any(mark in sentence for mark in "[]【】（）()<>：:"):
        return False
    for opening, closing in (("“", "”"), ("「", "」"), ("『", "』")):
        if sentence.count(opening) != sentence.count(closing):
            return False
    text = clean(sentence)
    clauses = [
        clean(part)
        for part in re.split(r"[，。！？；：、,.!?;:]+", sentence)
        if clean(part)
    ]
    return (
        bool(text)
        and len(text) <= 90
        and HAN.fullmatch(text) is not None
        and all(1 <= len(part) <= 25 for part in clauses)
    )


def overlay_path():
    return Path(
        getattr(
            settings,
            "FEIHUALING_CORPUS_PATH",
            settings.BASE_DIR / "poetry/data/feihualing.json",
        )
    )


def context():
    dataset = (
        Dataset.objects.filter(code="poetry", state="ready")
        .values("version", "input_digest")
        .first()
    )
    if not dataset:
        raise ExerciseError("古诗文资料暂未就绪，练习先休息一下。", 503)
    documents = list(
        PoetryDocument.objects.filter(scope())
        .values("id", "version", "path", "sha256")
        .order_by("path", "id")
    )
    registry = dict(
        SourceFile.objects.filter(path__startswith="poetry/").values_list(
            "path", "sha256"
        )
    )
    valid = {
        doc["id"]: doc
        for doc in documents
        if doc["version"] == dataset["version"]
        and (not registry or registry.get(doc["path"]) == doc["sha256"])
    }
    try:
        overlay = json.loads(overlay_path().read_text(encoding="utf-8"))
        if (
            not isinstance(overlay, dict)
            or overlay.get("schema_version") != 1
            or not isinstance(overlay.get("poems"), list)
        ):
            raise ValueError("preferred overlay")
    except (ValueError, OSError):
        raise ExerciseError("诗句优先版本正在核对，请稍后再来。", 503) from None
    signature = digest(
        {
            "format": FORMAT,
            "dataset": dataset,
            "documents": documents,
            "registry": registry,
            "overlay": overlay,
            "opencc": "0.1.7",
        }
    )
    return {
        "dataset": dataset,
        "documents": valid,
        "overlay": overlay,
        "signature": signature,
        "document_count": len(documents),
    }


def index_path():
    config = connection.settings_dict
    name = str(config.get("NAME", ""))
    identity = {
        "engine": config.get("ENGINE"),
        "name": name,
        "host": config.get("HOST"),
        "port": config.get("PORT"),
        "user": config.get("USER"),
    }
    if connection.vendor == "sqlite":
        if name == ":memory:" or "mode=memory" in name:
            identity["memory"] = [os.getpid(), id(connection.connection)]
        else:
            path = Path(name).resolve()
            identity["name"] = str(path)
            try:
                stat = path.stat()
                identity["file"] = [stat.st_dev, stat.st_ino]
            except OSError:
                pass
    root = Path(
        getattr(
            settings, "FEIHUALING_INDEX_ROOT", settings.BASE_DIR / ".feihualing-cache"
        )
    )
    return root / (digest(identity)[:24] + ".sqlite3")


def readonly(path):
    return sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True)


@contextmanager
def source_rows(documents):
    names = ("id", "document_id", "locator", "title", "author", "paragraphs", "body")
    config = connection.settings_dict
    name = str(config.get("NAME", ""))
    if (
        connection.vendor == "sqlite"
        and not connection.in_atomic_block
        and name != ":memory:"
        and "mode=memory" not in name
    ):
        # Take only the poetry projection under one short read; convert after closing it.
        # In particular, no backup of accounts, sessions or dictionary tables is created.
        if not documents:
            yield iter(())
            return
        query = (
            "SELECT "
            + ",".join(names)
            + " FROM poetry_poetrytext WHERE document_id IN ("
            + ",".join("?" for doc in documents)
            + ") ORDER BY document_id,id"
        )
        with closing(readonly(name)) as database:
            projection = database.execute(query, tuple(documents)).fetchall()

        def rows():
            for row in projection:
                value = dict(zip(names, row))
                value["paragraphs"] = json.loads(value["paragraphs"])
                yield value

        yield rows()

    else:
        yield PoetryText.objects.filter(document_id__in=documents).order_by(
            "document_id", "pk"
        ).values(*names).iterator(chunk_size=500)


def row_hash(row):
    return digest(
        [
            row["document_id"],
            row["locator"],
            row["title"],
            row["author"],
            row["paragraphs"],
            row["body"],
        ]
    )


SCHEMA = """
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE poems (id INTEGER PRIMARY KEY, document_id INTEGER, locator TEXT, fingerprint TEXT,
    title TEXT, author TEXT, note TEXT, simplified_fingerprint TEXT);
CREATE TABLE answers (key TEXT PRIMARY KEY, poem_id INTEGER, paragraph INTEGER, position INTEGER,
    source_digest BLOB, text TEXT, priority INTEGER) WITHOUT ROWID;
CREATE TABLE lookup (text TEXT, answer_key TEXT, PRIMARY KEY(text,answer_key)) WITHOUT ROWID;
CREATE INDEX lookup_answer ON lookup(answer_key);
CREATE TABLE uses (keyword TEXT, clause_key TEXT, answer_key TEXT,
    PRIMARY KEY(keyword,clause_key,answer_key)) WITHOUT ROWID;
CREATE INDEX uses_answer ON uses(answer_key);
CREATE TABLE hint_pool (keyword TEXT, rank INTEGER, answer_key TEXT, priority INTEGER,
    PRIMARY KEY(keyword,rank)) WITHOUT ROWID;
"""


def clauses(text):
    return [part for segment in SPLIT.split(text) if (part := clean(segment))]


def source_digest(text):
    return hashlib.sha256(text.encode()).digest()[:16]


def aligned_aliases(display, source):
    shown, original = normalize(display), normalize(source)
    if (
        len(shown) == len(original)
        and sum(a != b for a, b in zip(shown, original)) <= 6
    ):
        return {
            "".join(chars)
            for chars in product(*(tuple({a, b}) for a, b in zip(shown, original)))
        }
    return {shown, original}


def build(ctx=None, path=None):
    ctx = ctx or context()
    path = Path(path or index_path())
    path.parent.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    descriptor, temporary = tempfile.mkstemp(
        prefix=".build-", suffix=".sqlite3", dir=path.parent
    )
    os.close(descriptor)
    temporary = Path(temporary)
    counts = {
        "scanned_texts": 0,
        "scanned_paragraphs": 0,
        "sentence_units": 0,
        "incomplete_tails": 0,
        "unreadable_units": 0,
        "without_keyword": 0,
        "duplicate_sentences": 0,
        "preferred_poems": 0,
        "disabled_preferred": 0,
    }
    source_hash = hashlib.sha256()
    present = set()
    by_source = {}
    for poem in ctx["overlay"]["poems"]:
        if isinstance(poem, dict) and isinstance(poem.get("source"), dict):
            source = poem["source"]
            locator = tuple(source.get(key) for key in ("version", "path", "locator"))
            if all(isinstance(value, str) for value in locator):
                by_source[locator] = poem
    simplified_docs = {
        doc["path"]: doc["id"]
        for doc in PoetryDocument.objects.filter(
            version=ctx["dataset"]["version"], layer="simplified"
        ).values("id", "path")
    }
    counterparts = {
        doc_id: simplified_docs[simplified_relative(doc["path"])]
        for doc_id, doc in ctx["documents"].items()
        if simplified_relative(doc["path"]) in simplified_docs
    }
    simplified_rows = {}
    for simplified in (
        PoetryText.objects.filter(document_id__in=set(counterparts.values()))
        .values("document_id", "locator", "title", "author", "paragraphs", "body")
        .iterator(chunk_size=500)
    ):
        simplified_rows[(simplified["document_id"], simplified["locator"])] = simplified
    try:
        with closing(sqlite3.connect(temporary)) as db:
            db.executescript(SCHEMA)
            db.execute("PRAGMA journal_mode=OFF")
            db.execute("PRAGMA synchronous=OFF")
            with source_rows(ctx["documents"]) as rows:
                for row in rows:
                    counts["scanned_texts"] += 1
                    fingerprint = row_hash(row)
                    source_hash.update(fingerprint.encode())
                    doc = ctx["documents"][row["document_id"]]
                    preferred = by_source.get(
                        (doc["version"], doc["path"], row["locator"])
                    )
                    paragraphs = (
                        row["paragraphs"] if isinstance(row["paragraphs"], list) else []
                    )
                    overrides = {}
                    if preferred:
                        items = preferred.get("paragraphs", [])
                        if (
                            preferred["source"].get("sha256") == doc["sha256"]
                            and isinstance(items, list)
                            and isinstance(preferred.get("title"), str)
                            and isinstance(preferred.get("author"), str)
                            and all(
                                isinstance(item, dict)
                                and isinstance(item.get("text"), str)
                                and item.get("source_text") in paragraphs
                                for item in items
                            )
                        ):
                            overrides = {
                                item["source_text"]: item["text"] for item in items
                            }
                            counts["preferred_poems"] += 1
                        else:
                            preferred = None
                            counts["disabled_preferred"] += 1
                    simplified_row = simplified_rows.get(
                        (counterparts.get(row["document_id"]), row["locator"])
                    )
                    simplified_fingerprint = (
                        row_hash(simplified_row) if simplified_row else ""
                    )
                    db.execute(
                        "INSERT INTO poems VALUES (?,?,?,?,?,?,?,?)",
                        (
                            row["id"],
                            row["document_id"],
                            row["locator"],
                            fingerprint,
                            (
                                preferred["title"]
                                if preferred
                                else (
                                    simplified_row["title"]
                                    if simplified_row
                                    else converter().convert(row["title"])
                                )
                            ),
                            (
                                (
                                    preferred["author"]
                                    if preferred
                                    else (
                                        simplified_row["author"]
                                        if simplified_row
                                        else converter().convert(row["author"])
                                    )
                                ).strip()
                                or "来源未署作者"
                            ),
                            preferred.get("editorial_note", "") if preferred else "",
                            simplified_fingerprint,
                        ),
                    )
                    for paragraph_index, paragraph in enumerate(paragraphs):
                        counts["scanned_paragraphs"] += 1
                        raw_units, excluded = sentence_units(paragraph)
                        counts["incomplete_tails"] += excluded
                        if not raw_units:
                            continue
                        layer_paragraph = None
                        if simplified_row is not None and paragraph_index < len(
                            simplified_row["paragraphs"]
                        ):
                            candidate = simplified_row["paragraphs"][paragraph_index]
                            candidate_units, _ = sentence_units(candidate)
                            if len(candidate_units) == len(raw_units):
                                layer_paragraph = candidate
                        shown_units, _ = sentence_units(
                            overrides.get(paragraph)
                            or layer_paragraph
                            or converter().convert(paragraph)
                        )
                        override_ok = len(raw_units) == len(shown_units)
                        for position, source_sentence in enumerate(raw_units):
                            counts["sentence_units"] += 1
                            display = (
                                shown_units[position]
                                if override_ok
                                else converter().convert(source_sentence)
                            )
                            if not readable(source_sentence) or not readable(display):
                                counts["unreadable_units"] += 1
                                continue
                            canonical = normalize(display)
                            # 全句入索引（不再按预置令字过滤）：自定义令字靠运行时
                            # instr 检索任意汉字，预置令字仍走 uses/hint_pool 预计算。
                            raw_clauses, shown_clauses = clauses(
                                source_sentence
                            ), clauses(display)
                            if len(raw_clauses) != len(shown_clauses):
                                counts["unreadable_units"] += 1
                                continue
                            key = digest(canonical)[:24]
                            priority = int(preferred is not None)
                            existing = db.execute(
                                "SELECT priority FROM answers WHERE key=?", (key,)
                            ).fetchone()
                            if existing:
                                counts["duplicate_sentences"] += 1
                            present.add(row["id"])
                            if existing and priority <= existing[0]:
                                continue
                            if existing:
                                db.execute(
                                    "DELETE FROM lookup WHERE answer_key=?", (key,)
                                )
                                db.execute(
                                    "DELETE FROM uses WHERE answer_key=?", (key,)
                                )
                            db.execute(
                                "INSERT OR REPLACE INTO answers VALUES (?,?,?,?,?,?,?)",
                                (
                                    key,
                                    row["id"],
                                    paragraph_index,
                                    position,
                                    source_digest(source_sentence),
                                    display,
                                    priority,
                                ),
                            )
                            aliases = (
                                aligned_aliases(display, source_sentence)
                                if priority
                                else {canonical, normalize(source_sentence)}
                            )
                            for raw_clause, clause in zip(raw_clauses, shown_clauses):
                                aliases.update(
                                    aligned_aliases(clause, raw_clause)
                                    if priority
                                    else (normalize(raw_clause), normalize(clause))
                                )
                            db.executemany(
                                "INSERT OR IGNORE INTO lookup VALUES (?,?)",
                                [(alias, key) for alias in aliases],
                            )
                            for clause in shown_clauses:
                                normalized = normalize(clause)
                                clause_key = digest(normalized)[:24]
                                for keyword in KEYWORDS:
                                    if keyword in normalized:
                                        db.execute(
                                            "INSERT OR IGNORE INTO uses VALUES (?,?,?)",
                                            (keyword, clause_key, key),
                                        )
            db.execute(
                """INSERT INTO hint_pool
                SELECT keyword, row_number() OVER(PARTITION BY keyword ORDER BY priority DESC,answer_key)-1, answer_key,priority
                FROM (SELECT DISTINCT u.keyword,u.answer_key,a.priority FROM uses u JOIN answers a ON a.key=u.answer_key)"""
            )
            counts["disabled_preferred"] = (
                len(ctx["overlay"]["poems"]) - counts["preferred_poems"]
            )
            counts["excluded_documents"] = ctx["document_count"] - len(ctx["documents"])
            counts["indexed_sentences"] = db.execute(
                "SELECT count(*) FROM answers"
            ).fetchone()[0]
            counts["indexed_poems"] = len(present)
            counts["lookup_keys"] = db.execute(
                "SELECT count(*) FROM lookup"
            ).fetchone()[0]
            counts["keyword_counts"] = {
                keyword: db.execute(
                    "SELECT count(*) FROM hint_pool WHERE keyword=?", (keyword,)
                ).fetchone()[0]
                for keyword in KEYWORDS
            }
            counts["preferred_counts"] = {
                keyword: db.execute(
                    "SELECT count(*) FROM hint_pool WHERE keyword=? AND priority=1",
                    (keyword,),
                ).fetchone()[0]
                for keyword in KEYWORDS
            }
            meta = {
                "format": FORMAT,
                "source_signature": ctx["signature"],
                "fingerprint": digest([ctx["signature"], source_hash.hexdigest()]),
                "counts": counts,
            }
            db.executemany(
                "INSERT INTO meta VALUES (?,?)",
                [
                    (key, json.dumps(value, ensure_ascii=False))
                    for key, value in meta.items()
                ],
            )
            db.execute("PRAGMA user_version=3")
            # These indexes are needed only while replacing duplicate preferred rows.
            db.execute("DROP INDEX lookup_answer")
            db.execute("DROP INDEX uses_answer")
            db.commit()
            db.execute("VACUUM")
            if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise ExerciseError("诗句资料暂未完整准备，请稍后再试。", 503)
        if context()["signature"] != ctx["signature"]:
            raise ExerciseError("诗句资料正在更新，请稍后重新开始。", 409)
        os.replace(temporary, path)
        path.with_suffix(".dirty").unlink(missing_ok=True)
        return {
            **meta,
            "path": str(path),
            "bytes": path.stat().st_size,
            "seconds": round(time.perf_counter() - started, 3),
        }
    finally:
        temporary.unlink(missing_ok=True)


@lru_cache(maxsize=12)
def _check_file(path, inode, size, modified):
    with closing(readonly(path)) as db:
        if (
            db.execute("PRAGMA user_version").fetchone()[0] != 3
            or db.execute("PRAGMA quick_check").fetchone()[0] != "ok"
        ):
            raise sqlite3.DatabaseError("invalid derived index")
    return True


def valid(path, ctx):
    try:
        stat = path.stat()
        _check_file(str(path), stat.st_ino, stat.st_size, stat.st_mtime_ns)
        with closing(readonly(path)) as db:
            value = db.execute(
                "SELECT value FROM meta WHERE key='source_signature'"
            ).fetchone()
        return (
            value
            and json.loads(value[0]) == ctx["signature"]
            and not path.with_suffix(".dirty").exists()
        )
    except (OSError, sqlite3.DatabaseError, ValueError):
        return False


def ensure_index(force=False):
    ctx = context()
    path = index_path()
    if force or not valid(path, ctx):
        path.parent.mkdir(parents=True, exist_ok=True)
        with (path.with_suffix(".lock")).open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            try:
                ctx = context()
                if force or not valid(path, ctx):
                    build(ctx, path)
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)
    return ctx, path


class IndexedCorpus:
    """Request-scoped SQLite lookups; only chosen source rows are loaded from Django."""

    def __init__(self, ctx, path):
        self.context = ctx
        self.path = path
        self.db = readonly(path)
        try:
            self.meta = {
                key: json.loads(value)
                for key, value in self.db.execute("SELECT key,value FROM meta")
            }
            if self.meta.get("source_signature") != ctx["signature"]:
                raise ExerciseError("诗句资料正在更新，请重新开始。", 409)
        except (ValueError, sqlite3.DatabaseError):
            self.db.close()
            raise
        self.version = FORMAT
        self.fingerprint = self.meta["fingerprint"]
        self.poem_count = self.meta["counts"]["indexed_poems"]
        self.sentence_count = self.meta["counts"]["indexed_sentences"]
        self.disabled_count = self.meta["counts"]["disabled_preferred"]
        self._answers = {}
        self._sources = {}
        self.answers = self
        self.lines = self

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def close(self):
        self.db.close()

    def _query(self, sql, params=()):
        try:
            return self.db.execute(sql, params)
        except sqlite3.DatabaseError:
            self.path.with_suffix(".dirty").touch()
            raise ExerciseError("诗句资料正在更新，请重新开始。", 409) from None

    def _source(self, poem_id):
        if poem_id not in self._sources:
            cached = self._query(
                "SELECT document_id,locator,fingerprint,title,author,note,"
                "simplified_fingerprint FROM poems WHERE id=?",
                (poem_id,),
            ).fetchone()
            doc = self.context["documents"].get(cached[0]) if cached else None
            row = (
                PoetryText.objects.filter(
                    document__version=doc["version"],
                    document__path=doc["path"],
                    document__sha256=doc["sha256"],
                    locator=cached[1],
                )
                .values(
                    "id",
                    "document_id",
                    "locator",
                    "title",
                    "author",
                    "paragraphs",
                    "body",
                )
                .first()
                if doc
                else None
            )
            if not row or row_hash(row) != cached[2]:
                self.path.with_suffix(".dirty").touch()
                raise ExerciseError("这句诗的资料正在更新，请重新开始再练。", 409)
            if cached[6]:
                simplified_row = (
                    PoetryText.objects.filter(
                        document__version=doc["version"],
                        document__path=simplified_relative(doc["path"]),
                        locator=cached[1],
                    )
                    .values(
                        "id",
                        "document_id",
                        "locator",
                        "title",
                        "author",
                        "paragraphs",
                        "body",
                    )
                    .first()
                )
                if not simplified_row or row_hash(simplified_row) != cached[6]:
                    self.path.with_suffix(".dirty").touch()
                    raise ExerciseError("这句诗的资料正在更新，请重新开始再练。", 409)
            self._sources[poem_id] = (row, cached[3:6])
        return self._sources[poem_id]

    def get(self, key):
        if key not in self._answers:
            row = self._query(
                "SELECT key,poem_id,paragraph,position,source_digest,text FROM answers WHERE key=?",
                (key,),
            ).fetchone()
            if not row:
                return None
            source, (title, author, note) = self._source(row[1])
            paragraphs = source["paragraphs"]
            if not isinstance(paragraphs, list) or row[2] >= len(paragraphs):
                self.path.with_suffix(".dirty").touch()
                raise ExerciseError("诗句资料已变化，请重新开始。", 409)
            units, _ = sentence_units(paragraphs[row[2]])
            if row[3] >= len(units) or source_digest(units[row[3]]) != row[4]:
                self.path.with_suffix(".dirty").touch()
                raise ExerciseError("诗句资料已变化，请重新开始。", 409)
            parts = tuple(
                (digest(value)[:24], value)
                for part in clauses(row[5])
                if (value := normalize(part))
            )
            self._answers[key] = Answer(
                row[0],
                row[5],
                normalize(row[5]),
                parts,
                title,
                author,
                reverse("poetry-detail", args=[source["id"]]),
                note,
            )
        return self._answers[key]

    def __getitem__(self, key):
        answer = self.get(key)
        if answer is None:
            raise KeyError(key)
        return answer

    def __contains__(self, key):
        return isinstance(key, str) and self.get(key) is not None

    def match(self, value):
        value = normalize(value)
        if not HAN.fullmatch(value):
            return None
        row = self._query(
            "SELECT l.answer_key FROM lookup l JOIN answers a ON a.key=l.answer_key WHERE l.text=? ORDER BY a.priority DESC,l.answer_key LIMIT 1",
            (value,),
        ).fetchone()
        return self.get(row[0]) if row else None

    def contains_keyword(self, value, keyword):
        return keyword in normalize(value)

    def count(self, keyword, used=(), answer_keys=()):
        # 预置令字走 uses/hint_pool 预计算；自定义令字运行时按句文本检索。
        if keyword not in self.meta["counts"]["keyword_counts"]:
            return self.custom_count(keyword, answer_keys)
        total = self.meta["counts"]["keyword_counts"][keyword]
        if not used:
            return total
        placeholders = ",".join("?" for key in used)
        blocked = self._query(
            "SELECT count(DISTINCT answer_key) FROM uses WHERE keyword=? AND clause_key IN ("
            + placeholders
            + ")",
            (keyword, *used),
        ).fetchone()[0]
        return total - blocked

    def choose(self, keyword, used, seed, answer_keys=()):
        if keyword not in self.meta["counts"]["keyword_counts"]:
            return self.custom_choose(keyword, seed, answer_keys)
        counts = self.meta["counts"]
        total = counts["keyword_counts"][keyword]
        preferred = counts["preferred_counts"][keyword]
        size = preferred or total
        if not size:
            return None
        offset = int(digest([seed, sorted(used)])[:8], 16) % size
        for start, end in ((offset, size), (0, offset), (size, total)):
            if start == end:
                continue
            sql = "SELECT p.answer_key FROM hint_pool p WHERE p.keyword=? AND p.rank>=? AND p.rank<?"
            params = [keyword, start, end]
            if used:
                sql += (
                    " AND NOT EXISTS (SELECT 1 FROM uses x WHERE x.keyword=p.keyword AND x.answer_key=p.answer_key AND x.clause_key IN ("
                    + ",".join("?" for key in used)
                    + "))"
                )
                params.extend(used)
            row = self._query(sql + " ORDER BY p.rank LIMIT 1", params).fetchone()
            if row:
                return self.get(row[0])
        return None

    def custom_count(self, keyword, answer_keys=()):
        """自定义令字：索引表未覆盖，按句文本实时检索；已用整句按句键排除。"""
        total = self._query(
            "SELECT count(*) FROM answers WHERE instr(text, ?) > 0", (keyword,)
        ).fetchone()[0]
        if not answer_keys:
            return total
        blocked = sum(
            1
            for key in set(answer_keys)
            if (answer := self.answers.get(key)) and answer.targets(keyword)
        )
        return max(total - blocked, 0)

    def custom_choose(self, keyword, seed, answer_keys=()):
        params = [keyword]
        sql = "SELECT key FROM answers WHERE instr(text, ?) > 0"
        if answer_keys:
            sql += " AND key NOT IN (" + ",".join("?" for _ in answer_keys) + ")"
            params.extend(answer_keys)
        rows = self._query(sql + " ORDER BY priority DESC, key", params).fetchall()
        if not rows:
            return None
        offset = int(digest([seed, sorted(answer_keys)])[:8], 16) % len(rows)
        return self.get(rows[offset][0])

    def keywords(self):
        return [
            {
                "char": key,
                "count": self.meta["counts"]["keyword_counts"][key],
                "enabled": self.meta["counts"]["keyword_counts"][key] >= TARGET,
            }
            for key in KEYWORDS
        ]


def load():
    try:
        ctx, path = ensure_index()
        return IndexedCorpus(ctx, path)
    except (sqlite3.DatabaseError, OSError) as error:
        raise ExerciseError("诗句资料正在准备，请稍后再来。", 503) from error
