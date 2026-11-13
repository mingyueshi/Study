#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
action=${1:-deploy}
case "$action" in deploy|update-app|pull) ;; *) echo '未知更新模式。' >&2; exit 1;; esac
case "${PULL:-1}" in 0|1) ;; *) echo 'PULL 只能为 0 或 1。' >&2; exit 1;; esac
if [ "${PULL:-1}" = 1 ] || [ "$action" = pull ]; then
    git rev-parse --is-inside-work-tree >/dev/null
    if [ -n "$(git status --porcelain)" ]; then
        echo '工作区有未提交修改，未拉取、未停服。请先提交/整理，或明确使用 make update PULL=0 部署当前代码。' >&2
        exit 1
    fi
    git pull --ff-only
fi
if [ "$action" = pull ]; then
    echo '代码已同步；运行中的容器未变更，页面和代码更新请继续执行 make update-app PULL=0。'
    exit 0
fi
exec sh deploy/compose.sh "$action"
