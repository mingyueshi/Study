#!/bin/sh
# 只读取 Makefile 中的 ##@ 分组和 ## 命令说明，不依赖 Python 或 Docker。
set -eu

use_color=0
case "${COLOR:-auto}" in
    auto)
        if [ -t 1 ] && [ "${TERM:-}" != dumb ]; then
            use_color=1
        fi
        ;;
    always) use_color=1 ;;
    never) ;;
    *)
        printf 'COLOR 仅支持 auto、always、never。\n' >&2
        exit 2
        ;;
esac
if [ -n "${NO_COLOR:-}" ]; then
    use_color=0
fi

if [ "$#" -eq 0 ]; then
    set -- Makefile
fi

awk -v use_color="$use_color" '
    function example(name, args, description) {
        printf "  %s%-22s%s %s%-29s%s %s\n", command, name, reset, parameter, args, reset, description
    }
    BEGIN {
        if (use_color) {
            bold = "\033[1m"
            section = "\033[1;36m"
            command = "\033[32m"
            parameter = "\033[33m"
            reset = "\033[0m"
        }
        printf "%s乐学堂 · Make 命令速查%s\n", bold, reset
        printf "用法：make <命令> [参数=值]\n\n"
    }
    /^##@ / {
        printf "\n%s[%s]%s\n", section, substr($0, 5), reset
        next
    }
    /^[a-zA-Z0-9_-]+:.*## / {
        name = $0
        sub(/:.*/, "", name)
        description = $0
        sub(/^[^:]+:.*##[[:space:]]*/, "", description)
        printf "  %s%-22s%s %s\n", command, name, reset, description
    }
    END {
        printf "\n%s[常用示例]%s\n", section, reset
        example("make deploy", "DOMAIN=study.example.com", "首次上线")
        example("make update-app", "PULL=0", "已同步代码，快速更新应用")
        example("make rewards-preview", "", "预览积分兑换目录")
        printf "\n颜色：COLOR=auto（默认）/always/never；NO_COLOR=1 优先关闭颜色。\n"
        printf "说明：README.md · docs/docker-deployment.md\n"
    }
' "$@"
