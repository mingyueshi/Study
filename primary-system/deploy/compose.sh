#!/bin/sh
# Host requirements: POSIX shell, make, Docker Engine + Compose v2.20+.
set -eu
cd "$(dirname "$0")/.."
export PRIMARY_ENV_FILE="${ENV_FILE:-.env.production}"
action=${1:-help}
shift || true

init_env() {
    if [ -f "$PRIMARY_ENV_FILE" ] && grep -q '^PRIMARY_DB_PASSWORD=' "$PRIMARY_ENV_FILE" && grep -q '^PRIMARY_PG_ADMIN_PASSWORD=' "$PRIMARY_ENV_FILE"; then return; fi
    umask 077
    temporary=$(mktemp "${PRIMARY_ENV_FILE}.XXXXXX")
    if ! docker run --rm python:3.12-slim-bookworm python -c 'import secrets; print("\n".join(secrets.token_urlsafe(64) for _ in range(3)))' > "$temporary"; then
        rm -f "$temporary"; exit 1
    fi
    secret=$(sed -n '1p' "$temporary")
    db_secret=$(sed -n '2p' "$temporary")
    admin_secret=$(sed -n '3p' "$temporary")
    sed -e "s/PRIMARY_SECRET_KEY=CHANGE_ME/PRIMARY_SECRET_KEY=$secret/" \
        -e "s/PRIMARY_DB_PASSWORD=CHANGE_DB_PASSWORD/PRIMARY_DB_PASSWORD=$db_secret/" \
        -e "s/PRIMARY_PG_ADMIN_PASSWORD=CHANGE_ADMIN_PASSWORD/PRIMARY_PG_ADMIN_PASSWORD=$admin_secret/" \
        .env.production.example > "$temporary"
    if [ -n "${DOMAIN:-}" ]; then
        case "$DOMAIN" in *[!a-zA-Z0-9.-]*|.*|-*|*..*|*.) rm -f "$temporary"; echo 'DOMAIN 应为不带协议和端口的域名。' >&2; exit 1;; esac
        sed "s/study.example.com/$DOMAIN/g" "$temporary" > "${temporary}.domain"
        mv "${temporary}.domain" "$temporary"
    fi
    if [ -f "$PRIMARY_ENV_FILE" ]; then
        # 仅补旧配置缺少的 PostgreSQL 字段；不更换已有密钥、密码或域名。
        awk -F= 'FNR==NR { present[$1]=1; print; next } /^(PRIMARY_DB_|PRIMARY_PG_ADMIN_PASSWORD)/ && !($1 in present) { print }' \
            "$PRIMARY_ENV_FILE" "$temporary" > "${temporary}.merged"
        mv "${temporary}.merged" "$PRIMARY_ENV_FILE"
        echo '已补充缺少的 PostgreSQL 配置，原有配置保持不变。'
    elif ln "$temporary" "$PRIMARY_ENV_FILE" 2>/dev/null; then
        echo "已创建 ${PRIMARY_ENV_FILE}（权限 0600）。"
    fi
    rm -f "$temporary"
}

compose() { docker compose --env-file "$PRIMARY_ENV_FILE" -f compose.yaml "$@"; }
runtime() { compose run --rm --no-deps -T ops python deploy/runtime.py "$@"; }
build_app() {
    export PRIMARY_REVISION=$(git rev-parse HEAD 2>/dev/null || printf unknown)
    compose build app
}
ensure_db() {
    if ! compose up -d --wait --wait-timeout 180 db; then
        compose logs --tail=60 db
        echo 'PostgreSQL 未就绪，操作中止；请检查数据库日志和配置。' >&2
        return 1
    fi
}
wait_app() {
    if ! compose up -d --no-deps --no-build --wait --wait-timeout 180 "$@" app; then
        compose logs --tail=80 app
        compose stop app
        echo '健康检查失败，服务已停止；未报告部署成功。' >&2
        return 1
    fi
}
wait_up() { ensure_db; wait_app; }

if [ "$action" = env ]; then init_env; exit 0; fi
if [ "$action" = deploy ]; then init_env; fi
if [ ! -f "$PRIMARY_ENV_FILE" ]; then echo '请先运行 make env DOMAIN=你的域名。' >&2; exit 1; fi
docker compose version >/dev/null
compose config --quiet

# 宿主机锁覆盖停服、备份、迁移、启动整个流程。容器内另有数据操作锁。
lock="${PRIMARY_ENV_FILE}.deploy-lock"
case "$action" in deploy|update|restore|start|stop|restart|down|build|backup|backup-import|db-update|update-app|apply|reload-config|db-migrate|rewards-preview|rewards-import|questions-import|permissions-sync|index-rebuild)
    if ! mkdir "$lock" 2>/dev/null; then echo "另一个运维命令正在执行；若上次异常退出，请核实后移除 ${lock}。" >&2; exit 1; fi
    trap 'rmdir "$lock"' EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
esac

case "$action" in
    deploy|update)
        # 构建和配置校验均在停服前完成；update 使用当前检出的代码。
        build_app
        ensure_db
        runtime preflight
        compose stop app
        runtime backup
        if ! runtime prepare; then
            echo '更新中止，服务保持停止。请保留上方备份，修复后重跑 make update，或按部署文档恢复。' >&2
            exit 1
        fi
        wait_up
        compose ps
        echo '部署完成，健康检查已通过。'
        ;;
    build) build_app;;
    update-app|apply|reload-config)
        if [ "$action" = update-app ]; then build_app; fi
        # 在替换应用之前检查配置、卷身份和迁移；不启动或重建数据库。
        runtime check-app
        wait_app --force-recreate
        runtime mark-release
        echo '应用更新完成；未执行数据库迁移、内容导入或索引重建。'
        ;;
    db-migrate)
        runtime check-migrate
        compose stop app
        runtime backup
        runtime migrate
        wait_app --force-recreate
        echo '数据库迁移及应用启动完成。'
        ;;
    rewards-preview|rewards-import|questions-import|permissions-sync|index-rebuild)
        runtime "$action"
        ;;
    start) wait_up;;
    stop) compose stop app db;;
    restart)
        # restart 使用现有容器的镜像和环境；配置改动由 reload-config 显式应用。
        compose restart app
        wait_app --no-recreate
        ;;
    down) compose down;;
    status) compose ps -a;;
    logs) compose logs --tail=100 --follow app;;
    check) compose exec -T app python manage.py check --deploy; compose exec -T app python deploy/healthcheck.py;;
    manage) compose exec app python manage.py "$@";;
    sh) compose exec app sh;;
    backup) ensure_db; runtime backup;;
    backups) runtime backups;;
    db-logs) compose logs --tail=100 --follow db;;
    db-shell) ensure_db; compose exec db sh -c 'PGPASSWORD="$PRIMARY_DB_PASSWORD" exec psql -h 127.0.0.1 -U "$PRIMARY_DB_USER" -d "$PRIMARY_DB_NAME"';;
    db-update)
        compose pull db
        compose start db
        compose up -d --no-deps --no-recreate --wait --wait-timeout 180 db
        compose stop app
        runtime backup
        ensure_db
        wait_up
        ;;
    backup-import)
        : "${FILE:?请提供 FILE=宿主机备份文件路径}"
        ensure_db
        runtime import "$(basename "$FILE")" < "$FILE"
        ;;
    backup-export)
        : "${BACKUP:?请提供 BACKUP=备份文件名}" "${DEST:?请提供 DEST=宿主机新文件路径}"
        if [ -e "$DEST" ]; then echo 'DEST 已存在，拒绝覆盖。' >&2; exit 1; fi
        umask 077
        temporary=$(mktemp "${DEST}.XXXXXX")
        if runtime export "$BACKUP" > "$temporary"; then
            if ! ln "$temporary" "$DEST"; then rm -f "$temporary"; exit 1; fi
            rm -f "$temporary"
            echo "已导出到 $DEST"
        else rm -f "$temporary"; exit 1; fi
        ;;
    restore)
        : "${BACKUP:?请提供 BACKUP=备份文件名}"
        ensure_db
        runtime validate-backup "$BACKUP"
        compose stop app
        runtime backup
        runtime restore "$BACKUP"
        wait_up
        ;;
    *) echo "未知部署命令：$action" >&2; exit 1;;
esac
