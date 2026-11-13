# Docker 部署与日常维护

本方案面向单台服务器：已有 Nginx／宝塔负责域名、证书和 HTTPS，转发到 `127.0.0.1:8012`；应用容器使用 Gunicorn、WhiteNoise，数据库运行在独立的 **PostgreSQL 16 Docker 容器**中。数据库仅在 Compose 内网提供 5432，不向宿主机发布端口。所有部署文件、内容包及素材都在 `primary-system/` 内，可将本目录单独复制到服务器。

## 首次部署

服务器需安装 Docker Engine（启用默认的 BuildKit 构建器）、Docker Compose v2.20+ 和 GNU Make。首次构建需访问 Python／PostgreSQL 镜像、Debian／PostgreSQL 软件源、PyPI 与 requirements 中固定提交的两个 GitHub 依赖；初始化学习内容不访问外网。无需宿主机 Python、Node 或 PostgreSQL。

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

### 按改动选择更新方式

首次部署使用 `make deploy`；已有站点无需每次执行完整部署。以下快捷命令要求数据库已运行、站点已有完整部署记录。

首次从旧版部署脚本升级到本版，先 `git pull --ff-only`，再 `make update-app PULL=0`，将新增的维护脚本装入应用镜像；之后才能在该镜像上使用各项快捷维护命令。

| 场景 | 命令 | 执行范围 |
| --- | --- | --- |
| 只同步服务器工作区 | `make pull` | 仅 `git pull --ff-only`；运行中的页面不变 |
| 修改模板、CSS、JS、文件型专题或无迁移的 Python 代码／依赖 | `make update-app` | 拉取、构建镜像（含静态资源）、检查兼容性、替换应用并等待健康 |
| 代码已拉取／复制到服务器 | `make update-app PULL=0` | 同上，省略 Git 拉取 |
| 镜像已通过 `make build` 构建 | `make apply` | 检查后启用已构建镜像，不再拉取和构建 |
| 修改域名、CSRF、HTTPS、应用端口或应用内存等配置 | `make reload-config` | 使用已构建镜像和当前配置重建应用，不构建镜像或重建数据库 |
| 应用进程需要重启 | `make restart` | 重启现有容器，保留原镜像和环境；不加载新配置 |
| 只处理已构建镜像中的数据库迁移 | `make db-migrate` | 预检查、停应用、备份、迁移、启用应用；不导入题库或重建索引 |
| 首次导入／补充积分兑换目录 | `make rewards-preview` → `make rewards-import` | 预览无写入；正式导入先备份，只补缺及补齐分类，不停应用 |
| 只导入题库批次 | `make questions-import` | 先备份，再校验和导入镜像内各批次，不停应用 |
| 同步基础目录及权限组 | `make permissions-sync` | 先备份，再执行两项幂等配置命令，不停应用 |
| 飞花令索引缺失或需要重建 | `make index-rebuild` | 原子重建可丢弃缓存，不备份、不停应用 |
| 涉及迁移、权限、题库等多项变更，或不确定更新范围 | `make update` | 保留完整更新流程 |

`update-app`、`apply` 和 `reload-config` 不创建全量备份，不执行迁移、题库导入、资料扫描或索引重建，也不会重建 PostgreSQL 容器。它们在替换应用**之前**检查基础包身份、部署就绪状态、数据库连接和迁移兼容性；有待执行迁移时失败并保留现有应用。发现这种情况改用 `make update PULL=0`，或明确只需要结构迁移时使用 `make db-migrate`。健康检查失败则停止新应用并返回错误，不报告成功。

这些命令不能自动判断 Python 代码是否包含业务数据升级要求。涉及数据契约、题库批次、资料库或初始化逻辑的变更，应按对应升级步骤或完整更新处理；快捷命令不会自动补做这些步骤。

应用代码和资源封装在镜像中：只 `git pull` 或 `restart` 不会更新页面。文件型课程仍须在开发机先生成发布文件并提交；服务器不临时运行 Node 生成步骤。只改文件型课程可用 `update-app`，修改题库源需先构建并启用新镜像，再执行 `questions-import`。数据维护命令同样读取**已构建镜像**中的文件，不读取宿主机未构建的修改。不要并行执行 Git 拉取与构建／部署。

构建时将基础包校验单独缓存：只改页面或业务代码时，不再重复扫描约 250 万行 JSONL；基础包或校验器改变时自动重新验证。静态文件仍在镜像构建时收集，无需宿主机手工执行 `collectstatic`。

例如，更新兑换目录后：

```sh
make update-app
make rewards-preview
make rewards-import
```

只导入当前镜像内已有的 22 项兑换奖励，直接执行后两条即可。自定义源文件或下架旧目录等高级参数仍通过 `make manage ARGS='import_rewards ...'` 操作。

`reload-config` 不修改数据库角色密码，也不应用 PostgreSQL 容器的内存等配置；数据库配置调整应走数据库维护流程。若刚构建了尚未启用的应用镜像，`apply` 与 `reload-config` 都会启用该镜像。`db-migrate` 失败时保持应用停止和未就绪标记，可修复后重试；它不承担权限组或内容数据同步。

### 其他日常操作

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

原有 `install`、`run`、`test`、`test-frontend`、`migrate`、`shell`、`superuser` 等继续面向**本地开发环境**。线上操作使用上表 Docker 命令，结构迁移由 `deploy/update` 或 `db-migrate` 备份后执行。

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

`make test-docker` 会实际构建镜像和 PostgreSQL 容器、导入全量基础数据，在独立测试库运行学习进度、单词状态及积分的并发测试，检查普通数据库账号、自增序列、首页、后台、资料页、静态资源、HTTPS 代理头、登录和 Cookie。它会验证快捷更新不备份且不重建数据库、重启不加载新环境、配置刷新生效、待迁移拦截、单独迁移及兑换／题库／权限／索引维护，再验证完整更新保留学习记录、pg_dump 导出、备份导入、pg_restore 恢复及删除容器后的数据持久性。结束时只清理该次随机项目的容器、卷与镜像，不接触日常开发库和服务。生产服务器的 DNS、证书及真实 Nginx 入口仍需上线时验证。

实现依据：[Docker Compose 健康等待](https://docs.docker.com/reference/cli/docker/compose/up/)、[PostgreSQL pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html)、[pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html)、[Psycopg COPY](https://www.psycopg.org/psycopg3/docs/basic/copy.html)、[Django 部署检查](https://docs.djangoproject.com/en/dev/howto/deployment/checklist/)、[WhiteNoise 静态文件服务](https://whitenoise.readthedocs.io/en/stable/django.html)。
