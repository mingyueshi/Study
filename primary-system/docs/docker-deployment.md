# Docker 部署与日常维护

本方案面向单台服务器：已有 Nginx／宝塔负责域名、证书和 HTTPS，转发到 `127.0.0.1:8012`；应用容器使用 Gunicorn、WhiteNoise，数据库运行在独立的 **PostgreSQL 16 Docker 容器**中。数据库仅在 Compose 内网提供 5432，不向宿主机发布端口。所有部署文件、内容包及素材都在 `primary-system/` 内，可将本目录单独复制到服务器。

## 首次部署

服务器需安装 Docker Engine、Docker Compose v2.20+ 和 GNU Make。首次构建需访问 Python／PostgreSQL 镜像、Debian／PostgreSQL 软件源、PyPI 与 requirements 中固定提交的两个 GitHub 依赖；初始化学习内容不访问外网。无需宿主机 Python、Node 或 PostgreSQL。

```sh
cd primary-system
make deploy DOMAIN=study.example.com
make admin
```

将 `study.example.com` 替换成自己的域名。`make deploy` 自动创建权限为 0600 的 `.env.production`，分别生成 Django 密钥、应用数据库密码和数据库管理密码。已有配置只补充缺少的 PostgreSQL 字段，不更换已有密钥、密码或域名。需要预先调整配置时先运行 `make env DOMAIN=study.example.com`，编辑后再 `make deploy`。

部署流程：构建镜像及静态资源 → 等待数据库健康 → 校验配置 → 停应用 → 备份已有数据 → 初始化或升级 → 构建飞花令索引 → 启动 → 等待健康检查。只有最后检查通过才显示「部署完成」。首次需解压和恢复约 250 万行基础内容，通常比以后更新耗时更长。磁盘应同时容纳镜像、数据库、WAL 日志、私有资料、备份及恢复时的临时副本，建议至少预留 20 GiB 可用空间，之后按备份增长扩容。

新卷使用项目发布的基础包，不会带入开发机的账号、学习历史或人工修订，也不创建默认账号。管理账号通过 `make admin` 创建，普通学习账号可以从注册页创建。已有线上库更新时不恢复或刷新基础包，不调用 `bootstrap.py --refresh-data`。

首次初始化在独立的临时 PostgreSQL 数据库中，通过 Django 创建基础包声明的历史结构，将发布包的 JSONL 导入 PostgreSQL。导入按历史模型转换 UUID、布尔、JSON 和 UTC 时间，逐表读回核对语义摘要与行数，验证外键并重置自增序列，再正常应用后续迁移。完成后切换数据库和资料目录；失败不会把半成品标记为可用。发布包仍保持原始摘要，不伪造迁移记录或对已有库执行向后迁移。

## Nginx／宝塔

为域名申请并配置证书，启用 HTTP → HTTPS 跳转。将以下规则放入该域名的 HTTPS `server` 块；完整片段见 [nginx.conf.example](../deploy/nginx.conf.example)。

```nginx
location / {
    proxy_pass http://127.0.0.1:8012;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_read_timeout 90s;
    proxy_redirect off;
}
```

宝塔若已有匹配 CSS、JS、图片的正则 `location`，关闭这些规则或改为同样转发，避免它们绕过应用而产生 404。容器会提供 `/static/` 下的全部资源，无需在宿主机重复执行 `collectstatic`。私有资料不会作为静态目录公开。

代理必须覆盖 `X-Forwarded-Proto`，不要直接透传客户端的同名请求头。默认仅绑定同机回环地址，不需要开放服务器 8012 防火墙端口。代理运行在另一台机器或另一个 Docker 网络时，需要自行配置可信内网连接并限制后端来源；不能一边公开后端端口，一边信任任意请求的代理头。

上线后访问 `https://自己的域名/` 和 `/admin/`。`/healthz/` 返回最小数据库就绪结果，正常为 200，数据库异常为 503；该路径允许 HTTP，便于容器内部探测，其余路径仍强制 HTTPS。

## 配置

| 配置 | 默认值或用途 |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | `primary-system`；决定容器、网络和卷名称，上线后保持不变 |
| `PRIMARY_SECRET_KEY` | 自动生成，不应在更新时重建；另行安全备份配置文件 |
| `PRIMARY_DB_NAME` / `PRIMARY_DB_USER` | `primary_system` / `primary_app`；首次部署后保持不变 |
| `PRIMARY_DB_PASSWORD` | 应用数据库账号随机密码；账号无超级用户、建库和建角色权限 |
| `PRIMARY_PG_ADMIN_PASSWORD` | 数据库管理随机密码，仅数据库和临时维护容器接收，应用容器不接收 |
| `PRIMARY_ALLOWED_HOSTS` | 域名及 `localhost,127.0.0.1`；保留这两个本机名称供探针使用，不使用通配符 |
| `PRIMARY_CSRF_TRUSTED_ORIGINS` | 带 `https://` 的外部域名，多项用逗号分隔 |
| `PRIMARY_BIND` / `PRIMARY_PORT` | `127.0.0.1` / `8012`；容器内始终使用 8012 |
| `PRIMARY_MEMORY_LIMIT` | `1g`；限制服务及一次性维护容器的内存与文件缓存，需要时可提高到 `2g` |
| `PRIMARY_DB_MEMORY_LIMIT` | `1g`；PostgreSQL 容器内存上限 |
| `PRIMARY_HTTPS` | `1`：强制 HTTPS、Secure Cookie 和 HSTS；仅本地 HTTP 演练可改为 `0` |
| `PRIMARY_TRUST_PROXY` | `1`：信任同机代理覆盖后的协议头 |

所有 Make 运维命令支持 `ENV_FILE=/绝对路径/配置文件`。配置由 Compose 加载，不通过 shell `source` 执行。生产、调试、数据库类型和持久化路径由 Compose 固定，避免误连接开发库。

数据库用户、密码和空库只在 PostgreSQL 数据卷首次创建时初始化。修改已有配置文件中的密码不会自动修改数据库角色密码；密码轮换需同步更新角色和配置后重建相关容器，不能删除数据卷来重置密码。

默认开启当前域名的 HSTS，但没有承诺所有子域都只支持 HTTPS，也没有启用浏览器 HSTS 预加载。因此 Django 部署检查中的 `security.W005` 和 `security.W021` 为预期提示，不影响健康检查；只有确认子域和长期 HTTPS 运维条件后，才应调整相应设置。

应用和维护容器以 UID/GID 10001 运行，应用镜像只读。PostgreSQL 数据保存在 `<项目名>_postgres` 卷；私有资料和部署状态在 `<项目名>_data` 卷的 `current/`，可重建的飞花令索引位于 `cache/`；备份在独立的 `<项目名>_backups` 卷。数据库与部署状态通过唯一标记关联，挂错卷时拒绝启动。`stop`、`down`、重建镜像和容器都不会删除这些卷。**不要运行 `docker compose down -v` 或对这些卷执行清理**。

飞花令索引沿用应用的只读 SQLite 缓存文件，可随时从 PostgreSQL 内容重建；账号、学习记录和业务数据均保存在 PostgreSQL。

## 一键更新

```sh
make update
```

这会检查 Git 工作区干净，执行当前分支的 `git pull --ff-only`，然后部署。拉取或构建失败时原服务继续运行。服务器需配置好 Git 远端和访问权限；不会自动切分支、强制覆盖修改或处理合并冲突。

如果代码通过文件复制、发布系统或人工 Git 操作提前同步，使用：

```sh
make update PULL=0
```

更新停服后先生成恢复点，再应用 Django 迁移、幂等权限配置和题库批次。题库原指纹不符时拒绝覆盖。文件型教材与专题随新镜像生效；数据库基础包摘要若改变则在停服前拒绝更新，需要为保留账号和学习历史设计专用升级流程，不能把重置库当更新。

这是有短暂停服的单机部署。数据库已使用 PostgreSQL；验证码仍使用进程内缓存，因此配置保留 **1 个 Gunicorn 进程、4 个线程**。增加应用进程或副本前，需要先接入共享缓存并验证验证码流程。

`make update` 更新应用。PostgreSQL 16 的小版本镜像升级使用 `make db-update`：先拉取镜像，再停应用并备份，最后重建数据库容器、等待就绪并启动应用。不要直接修改镜像大版本号复用旧数据卷；跨大版本升级需要单独演练。

## 日常命令

| 命令 | 用途 |
| --- | --- |
| `make` | 查看全部命令 |
| `make status` / `make logs` | 状态／实时日志；日志自动轮转 |
| `make check-deploy` | Django 部署检查和健康探针 |
| `make stop` / `make start` / `make restart` | 停止两项服务／启动两项服务／重启应用，保留数据 |
| `make down` | 删除容器和网络，保留卷；随后用 `make start` 重建 |
| `make build` | 只构建镜像，不停服 |
| `make admin` | 在容器内创建管理员 |
| `make app-shell` / `make container-shell` | Django shell／容器 shell |
| `make db-shell` / `make db-logs` | 使用应用账号进入 psql／查看数据库日志 |
| `make db-update` | 备份后更新 PostgreSQL 16 小版本镜像 |
| `make manage ARGS='showmigrations'` | 查看迁移状态 |
| `make manage ARGS='changepassword 用户名'` | 重置指定账号密码 |
| `make manage ARGS='clearsessions'` | 清理过期 Django 会话 |
| `make backup` / `make backups` | 创建／列出恢复点 |
| `make test-deploy` | 本地部署逻辑回归测试，需本地开发依赖，不需要数据库容器 |
| `make test-docker` | 用独立项目、回环端口和临时卷执行真实 Docker 演练 |

原有 `install`、`run`、`test`、`test-frontend`、`migrate`、`shell`、`superuser` 等继续面向**本地开发环境**。线上操作使用上表 Docker 命令，结构迁移由 `deploy/update` 统一备份后执行。

## 备份与恢复

```sh
make backup
make backups
make backup-export BACKUP=primary-时间-标识.tar.gz DEST=/安全目录/primary-时间-标识.tar.gz
```

备份通过 PostgreSQL 16 的 `pg_dump` 自定义格式取得数据库一致快照，再与私有资料、部署元数据和 SHA-256 校验清单打包，文件权限 0600。包含账号、学习记录及业务数据；不包含整个集群的角色、密钥或飞花令缓存。角色由首次初始化创建，缓存恢复时重建，因此需单独安全保存 `.env.production`。文件名采用 UTC 时间，恢复点不会自动覆盖或自动删除。备份卷仍在同一服务器，定期导出并复制到独立存储才能应对主机故障。

恢复会用备份内容替换当前数据，备份之后新增的学习记录将不在恢复后的库中。先选择正确的恢复点与对应代码版本，再运行：

```sh
make restore BACKUP=primary-时间-标识.tar.gz
```

工具先校验归档路径和摘要，在独立临时库中通过 `pg_restore --single-transaction --exit-on-error` 实际恢复，检查部署身份、资料文件和迁移兼容性；通过后再停应用，为当前库另存恢复点，重新恢复并切换数据库和资料目录，重建缓存，最后等待健康检查。不兼容备份不会直接覆盖当前库。只导入自己可信来源的备份，数据库归档包含可执行的数据库对象定义。

在新主机或需要导入离机备份时，先准备同版本代码、原配置和镜像，再导入并恢复；可在空卷上恢复，无须重新初始化基础包：

```sh
make build
make backup-import FILE=/安全目录/primary-时间-标识.tar.gz
make restore BACKUP=primary-时间-标识.tar.gz
```

`backup-import` 在临时 PostgreSQL 库中完成恢复验证后存入备份卷，不修改当前库，拒绝覆盖同名文件。部署脚本拒绝直接接管没有部署元数据的已有库或旧 SQLite 部署卷。此方案部署新站点，不自动搬运本机 SQLite 账号和学习记录；已有个人数据迁移需另行设计与验证，不能直接换连接配置。旧 SQLite 试用部署与新的 PostgreSQL 部署应使用不同的 `COMPOSE_PROJECT_NAME`。

## 失败处理与验证

迁移或健康检查失败时命令返回非零，服务保持停止，终端会列出备份文件名。先看 `make logs` 和命令输出；修复后可重跑 `make update PULL=0`。需要退回旧代码时，检出对应版本、`make build`，再用匹配恢复点执行 `make restore`，不要只重启旧镜像而忽略已经变化的数据库。备份中的 `current/deployment.json` 记录代码提交与基础包摘要。

并发部署用宿主机目录锁、卷内文件锁和 PostgreSQL advisory lock 拒绝。若宿主机异常退出遗留 `<配置文件>.deploy-lock`，确认没有运维命令和临时初始化容器仍在执行后，再删除该空锁目录。断电可能遗留 `primary_stage_*` 临时库或暂存资料；先核实数据库与资料的部署身份、保留恢复点，再处理残留，不批量删除。切换过程中的普通异常会回滚数据库和目录，强制中断后的未就绪状态会阻止应用启动。

`make test-docker` 会实际构建镜像和 PostgreSQL 容器、导入全量基础数据，在独立测试库运行学习进度、单词状态及积分的并发测试，检查普通数据库账号、自增序列、首页、后台、资料页、静态资源、HTTPS 代理头、登录和 Cookie。它还会写入专用测试账号和学习记录，验证更新保留记录、pg_dump 导出、备份导入、pg_restore 恢复及删除容器后的数据持久性。结束时只清理该次随机项目的容器、卷与镜像，不接触日常开发库和服务。生产服务器的 DNS、证书及真实 Nginx 入口仍需上线时验证。

实现依据：[Docker Compose 健康等待](https://docs.docker.com/reference/cli/docker/compose/up/)、[PostgreSQL pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html)、[pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html)、[Psycopg COPY](https://www.psycopg.org/psycopg3/docs/basic/copy.html)、[Django 部署检查](https://docs.djangoproject.com/en/dev/howto/deployment/checklist/)、[WhiteNoise 静态文件服务](https://whitenoise.readthedocs.io/en/stable/django.html)。
