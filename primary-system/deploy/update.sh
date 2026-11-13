#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ "${PULL:-1}" = 1 ]; then
    git rev-parse --is-inside-work-tree >/dev/null
    if [ -n "$(git status --porcelain)" ]; then
        echo '工作区有未提交修改，未拉取、未停服。请先提交/整理，或明确使用 make update PULL=0 部署当前代码。' >&2
        exit 1
    fi
    git pull --ff-only
fi
exec sh deploy/compose.sh deploy
