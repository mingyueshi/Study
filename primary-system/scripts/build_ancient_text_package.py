#!/usr/bin/env python3
"""构建「古文经典」资料包（01e）：hanzhaodeng/chinese-ancient-text 62 册简体古籍。

来源：GitHub hanzhaodeng/chinese-ancient-text（正文简体、原典公版，仓库未声明
license；rights_evidence 记「原典公版+转录来源」并钉死上游 commit）。每册规范化
为诗词管线 canonical 树 {"title": 书名, "description": 简介, "content":
[{"title": 篇/卷名, "content": [句, …]}]}，poetry.importing.parse_document 直接
可解析；单篇册或篇名与书名相同时以书名为题。包内 layout 与诗词包同构
（poetry/simplified/<collection>/<书名>.json），由独立 dataset「ancient-classics」
导入，不触碰既有 90+90 简繁镜像契约。

用法：.venv/bin/python scripts/build_ancient_text_package.py [--source 本地克隆目录]
      --source 指向 hanzhaodeng/chinese-ancient-text 的本地浅克隆（HEAD 校验
      等于钉定 commit），网络不佳时用整克隆替代逐册抓取。
产物：../references/01e_ancient_classics_2026-11-06.zip（本地产物，不进 Git），
      并打印正文计数、ZIP bytes/sha256 供固定清单登记。
"""

import argparse
import hashlib
import ipaddress
import json
import os
import socket
import stat
import sys
import tempfile
import time
import urllib.parse
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from poetry.ancient_sources import (  # noqa: E402
    UPSTREAM_COMMIT,
    UPSTREAM_HOST,
    UPSTREAM_REPO,
    book_collection,
    normalize,
)
from poetry.importing import parse_document  # noqa: E402

ZIP_NAME = "01e_ancient_classics_2026-11-06.zip"
REFERENCES = Path(__file__).resolve().parent.parent.parent / "references"
MARKER_DIR = "ancient_text"
# 固定时间戳与文件属性，保证同内容重复打包字节一致（固定清单登记依据）。
ZIP_DATE = (2026, 11, 6, 0, 0, 0)
# --source 本地浅克隆目录；None 走网络逐册抓取。
SOURCE_DIR = None


def resolved_hosts(hostname):
    """解析域名并断言全部 IP 为公网地址，阻断内网/环回/链路本地。"""
    infos = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    for address in {info[4][0] for info in infos}:
        ip = ipaddress.ip_address(address)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise SystemExit(f"上游域名解析到受限地址：{address}")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # 拒绝任何重定向，防止跳到白名单外


def fetch_once(url):
    opener = urllib.request.build_opener(NoRedirect)
    with opener.open(url, timeout=60) as response:  # noqa: S310
        if response.status != 200:
            raise SystemExit(f"上游返回 {response.status}")
        return response.read()


def verify_clone(source):
    """校验本地浅克隆 HEAD 等于 pinned commit，防止从漂移来源打包。"""
    import subprocess

    head = subprocess.run(
        ["git", "-C", str(source), "rev-parse", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    if head != UPSTREAM_COMMIT:
        raise SystemExit(f"克隆 HEAD {head} 与钉定 commit {UPSTREAM_COMMIT} 不符")


def fetch_book(name):
    """读取单册：--source 时从已校验本地克隆取，否则按 pinned commit 网络抓取。

    网络路径带域名白名单 + 解析 IP 边界 + 禁重定向；上游偶发瞬时超时，
    统一重试三次并线性退避。
    """
    if SOURCE_DIR is not None:
        return json.loads((SOURCE_DIR / f"{name}.json").read_text(encoding="utf-8"))
    filename = urllib.parse.quote(f"{name}.json")
    url = f"https://{UPSTREAM_HOST}/{UPSTREAM_REPO}/{UPSTREAM_COMMIT}/{filename}"
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != UPSTREAM_HOST:
        raise SystemExit(f"拒绝非白名单上游地址：{url}")
    resolved_hosts(parsed.hostname)
    last_error = None
    for attempt in range(3):
        if attempt:
            time.sleep(2 * attempt)
        try:
            return json.loads(fetch_once(url).decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
    raise SystemExit(f"下载 {name} 三次失败：{last_error}")


def write_member(archive, path, payload):
    """确定性写入 ZIP 成员：固定时间戳、常规文件属性、DEFLATED 压缩。"""
    info = zipfile.ZipInfo(path, date_time=ZIP_DATE)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (stat.S_IFREG | 0o644) << 16
    archive.writestr(info, payload)


def build_package(destination):
    mapping = book_collection()
    books = sorted(mapping)
    members = {}  # 包内路径 → 字节，最后统一确定性打包
    counts = {"books": len(books), "chapters": 0, "texts": 0, "chars": 0}
    for name in books:
        normalized = normalize(fetch_book(name), name)
        texts, _ = parse_document(normalized)
        if not texts:
            raise SystemExit(f"{name}：规范化后解析不到正文")
        counts["chapters"] += len(normalized["content"])
        counts["texts"] += len(texts)
        counts["chars"] += sum(len(line) for row in texts for line in row["paragraphs"])
        relative = f"{MARKER_DIR}/poetry/simplified/{mapping[name]}/{name}.json"
        members[relative] = json.dumps(
            normalized, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8")

    members[f"{MARKER_DIR}/source_selection.json"] = json.dumps(
        {
            "scope": "ancient-classics",
            "upstream": UPSTREAM_REPO,
            "commit": UPSTREAM_COMMIT,
            "layer": "simplified",
            "books": len(books),
        },
        ensure_ascii=False,
        indent=1,
    ).encode("utf-8")
    members["docs/资源来源与许可索引.json"] = json.dumps(
        [
            {
                "id": "hanzhaodeng-chinese-ancient-text",
                "name": "chinese-ancient-text 62 册简体古籍",
                "source_url": f"https://github.com/{UPSTREAM_REPO}/tree/{UPSTREAM_COMMIT}",
                "license": "未声明；原典公版，转录来源为上游仓库",
                "records": len(books),
                "quality_notes": (
                    "正文简体原生，未做繁简转换；书名与篇名来自上游原文，"
                    "未逐字校勘。导入层不做内容改写，仅按 canonical 树重塑结构。"
                ),
            }
        ],
        ensure_ascii=False,
        indent=1,
    ).encode("utf-8")

    manifest = {
        "files": [
            {
                "path": path,
                "bytes": len(payload),
                "sha256": hashlib.sha256(payload).hexdigest(),
            }
            for path, payload in sorted(members.items())
        ]
    }
    members["manifest.json"] = json.dumps(
        manifest, ensure_ascii=False, indent=1
    ).encode("utf-8")
    members["SHA256SUMS"] = "".join(
        f"{hashlib.sha256(payload).hexdigest()}  {path}\n"
        for path, payload in sorted(members.items())
        if path != "SHA256SUMS"
    ).encode("utf-8")

    with tempfile.NamedTemporaryFile(
        dir=destination.parent, prefix=".reference-", delete=False
    ) as stage:
        stage_path = Path(stage.name)
    try:
        with zipfile.ZipFile(stage_path, "w") as archive:
            for path, payload in sorted(members.items()):
                write_member(archive, path, payload)
        os.replace(stage_path, destination)
    finally:
        stage_path.unlink(missing_ok=True)
    return counts


def main():
    global SOURCE_DIR
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=None,
        help="本地浅克隆目录（HEAD 须等于钉定 commit）；缺省走网络逐册抓取",
    )
    arguments = parser.parse_args()
    if arguments.source:
        verify_clone(arguments.source)
        SOURCE_DIR = arguments.source
    REFERENCES.mkdir(parents=True, exist_ok=True)
    destination = REFERENCES / ZIP_NAME
    counts = build_package(destination)
    payload = destination.read_bytes()
    print(
        f"包已生成：{destination}\n"
        f"册数 {counts['books']}，篇目 {counts['chapters']}，"
        f"正文 {counts['texts']}，约 {counts['chars']} 字\n"
        f"bytes {len(payload)}\nsha256 {hashlib.sha256(payload).hexdigest()}"
    )


if __name__ == "__main__":
    main()
