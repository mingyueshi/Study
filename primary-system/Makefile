# 乐学堂 primary-system 命令入口：初始化、运行、测试与数据维护。
# 默认只显示帮助；详细运行说明见 README.md 的「本地运行」。

.DEFAULT_GOAL := help
PORT ?= 8012
PYTHON := $(if $(wildcard .venv/bin/python),.venv/bin/python,python3.12)
ENV_FILE ?= .env.production
PULL ?= 1
DEPLOY := ENV_FILE="$(ENV_FILE)" sh deploy/compose.sh
BOOTSTRAP := $(if $(wildcard .venv/bin/python),.venv/bin/python bootstrap.py,python3.12 bootstrap.py)
MANAGE := $(PYTHON) manage.py

help: ## 显示可用命令
	@awk 'BEGIN { FS = ":.*?## " } /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

env: ## 创建生产配置和随机密钥：make env DOMAIN=study.example.com（已有配置不覆盖）
	@DOMAIN="$(DOMAIN)" $(DEPLOY) env

deploy: ## Docker 一键部署当前代码：构建、备份、初始化/迁移、启动、健康检查
	@DOMAIN="$(DOMAIN)" $(DEPLOY) deploy

update: ## 快进拉取 Git 后部署；已同步代码或本地测试用 make update PULL=0
	@ENV_FILE="$(ENV_FILE)" PULL="$(PULL)" sh deploy/update.sh

pull: ## 只快进拉取代码，不改变运行中的容器
	@sh deploy/update.sh pull

update-app: ## 快速更新页面/代码/静态资源：拉取、构建、检查迁移、仅替换应用（支持 PULL=0）
	@ENV_FILE="$(ENV_FILE)" PULL="$(PULL)" sh deploy/update.sh update-app

apply: ## 启用已构建镜像：检查后仅替换应用，不拉取、不构建、不迁移
	@$(DEPLOY) apply

reload-config: ## 修改 .env.production 后重建应用容器，不构建镜像、不重建数据库
	@$(DEPLOY) reload-config

db-migrate: ## 已构建镜像的结构迁移：检查、停应用、备份、迁移、启用应用
	@$(DEPLOY) db-migrate

rewards-preview: ## 预览镜像内的积分兑换目录，不写数据库
	@$(DEPLOY) rewards-preview

rewards-import: ## 备份后补齐积分兑换目录，保留已有设置与兑换历史，不停应用
	@$(DEPLOY) rewards-import

questions-import: ## 备份后导入镜像内题库批次，不停应用
	@$(DEPLOY) questions-import

permissions-sync: ## 备份后同步基础目录和权限组，不停应用
	@$(DEPLOY) permissions-sync

index-rebuild: ## 仅原子重建飞花令缓存，不备份、不停应用
	@$(DEPLOY) index-rebuild

build: ## 只构建 Docker 镜像，不停服
	@$(DEPLOY) build

start: ## 启动已部署容器，等待健康检查（首次请用 deploy）
	@$(DEPLOY) start

stop: ## 停止 Docker 服务，保留数据
	@$(DEPLOY) stop

restart: ## 重启应用容器，等待健康检查
	@$(DEPLOY) restart

down: ## 删除容器与网络，保留数据库和备份卷
	@$(DEPLOY) down

status: ## 查看 Docker 服务状态
	@$(DEPLOY) status

db-shell: ## 进入 PostgreSQL psql（应用账号）
	@$(DEPLOY) db-shell

db-logs: ## 查看 PostgreSQL 容器日志
	@$(DEPLOY) db-logs

db-update: ## 更新 PostgreSQL 16 小版本镜像：停应用、备份、更新数据库并恢复服务
	@$(DEPLOY) db-update

logs: ## 持续查看最近 100 行容器日志（Ctrl+C 退出）
	@$(DEPLOY) logs

check-deploy: ## 检查线上安全配置和容器健康
	@$(DEPLOY) check

manage: ## 在运行容器中执行 Django 命令：make manage ARGS='showmigrations'
	@$(DEPLOY) manage $(ARGS)

admin: ## 在 Docker 中交互创建管理员（无默认账号）
	@$(DEPLOY) manage createsuperuser

app-shell: ## 进入 Docker 内的 Django shell
	@$(DEPLOY) manage shell

container-shell: ## 进入容器 sh
	@$(DEPLOY) sh

backup: ## 备份线上数据库、私有资料与部署记录（pg_dump 一致快照）
	@$(DEPLOY) backup

backups: ## 列出独立备份卷中的恢复点
	@$(DEPLOY) backups

backup-export: ## 导出备份到宿主机：BACKUP=文件名 DEST=/安全目录/文件.tar.gz
	@BACKUP="$(BACKUP)" DEST="$(DEST)" $(DEPLOY) backup-export

backup-import: ## 校验并导入宿主机备份：FILE=/安全目录/primary-*.tar.gz（不覆盖线上库）
	@FILE="$(FILE)" $(DEPLOY) backup-import

restore: ## 恢复指定备份：BACKUP=文件名；先校验，再停服、备份当前库并替换
	@BACKUP="$(BACKUP)" $(DEPLOY) restore

test-deploy: ## 部署脚本与生产配置回归测试（不操作 Docker 或日常库）
	$(PYTHON) -m unittest discover -s deploy/tests -v
	$(MANAGE) test config.test_deployment

test-docker: ## Docker 完整演练：初始化、更新保留记录、备份恢复、重建持久化（独立卷）
	$(PYTHON) deploy/smoke.py

install: ## 初始化环境：建 .venv、装依赖、校验/恢复基础数据（bootstrap.py）
	$(BOOTSTRAP)

run: ## 启动开发服务器 http://127.0.0.1:$(PORT)（需先 install）
	$(MANAGE) build_feihualing_index --if-needed
	PRIMARY_DEBUG=1 $(MANAGE) runserver 127.0.0.1:$(PORT)

test: ## 跑全量测试（需先 install）
	$(MANAGE) test

test-frontend: ## 跑 Node 前端回归测试
	node --test scripts/test_frontend.cjs scripts/test_feihualing_frontend.cjs scripts/test_classical_frontend.cjs

test-content-sources: ## 校验教材与专题的文件源
	@set -e; for test in content_sources/test/test-*.js; do node "$$test"; done

check: ## Django system check（快速体检）
	$(MANAGE) check

makemigrations: ## 生成迁移（按需 APP=writing 指定应用）
	$(MANAGE) makemigrations $(APP)

migrate: ## 应用迁移
	$(MANAGE) migrate

seed: ## 幂等初始化学段/年级/学科/模块/教材与权限组
	$(MANAGE) seed_platform

superuser: ## 创建管理后台超级用户（交互式）
	$(MANAGE) createsuperuser

shell: ## 进入 Django shell
	$(MANAGE) shell

repair-data: ## 旧开发库修复：备份后恢复基础内容（先停服务；保护个人数据需库中可识别）
	python3.12 bootstrap.py --refresh-data

content-data: ## 重生成教材、专题、作文坊、语法、日常用语和题库批次
	$(MAKE) -j1 writing-data questionbank-data grammar-data phrases-data mathbook-data chinesebook-data study-topics-data

writing-data: ## 从 content_sources/ 重新生成作文坊 topics.json（需 node）
	node scripts/convert_writing_data.js

questionbank-data: ## 从教材源重新生成题库批次 JSON（需 node）
	node scripts/build_questionbank.cjs

grammar-data: ## 从 content_sources/grammar/ 重新生成语法课程与题库批次（需 node）
	node scripts/build_grammar.cjs

phrases-data: ## 从英语教材源重新生成日常用语数据（需 node）
	node scripts/build_phrases.cjs

mathbook-data: ## 从数学教材源生成数据与图示资产（需 node）
	node scripts/build_mathbook.cjs

chinesebook-data: ## 从语文教材源生成数据与图片资产（需 node）
	node scripts/build_chinesebook.cjs

study-topics-data: ## 从 content_sources/ 生成数学、历史、地理、天文、文学和科学专题
	$(PYTHON) scripts/build_study_topics.py

word-tree: ## 重新生成词以类聚的 WordNet 上下位树（words/tree_data/tree.json）
	$(PYTHON) scripts/build_word_tree.py

polyphone-data: ## 从 CC-CEDICT 重新生成多音字数据（hanzi/polyphone_data/polyphones.json）
	$(PYTHON) scripts/build_polyphones.py

phoneme-audio: ## 重新生成 44 个音素原声 m4a（需 espeak-ng，见 scripts/generate_phoneme_audio.py）
	python3 scripts/generate_phoneme_audio.py

ancient-text: ## 重新生成古文经典资料包 01e（--source 传本地克隆可免逐册联网，见 scripts/build_ancient_text_package.py）
	$(PYTHON) scripts/build_ancient_text_package.py

unihan18-package: ## 重新生成 Unihan 18.0.0 全量属性资料包 01f（辅助文件缓存目录见 scripts/build_unihan18_package.py）
	$(PYTHON) scripts/build_unihan18_package.py

.PHONY: help install run test test-frontend test-content-sources check makemigrations migrate seed superuser shell repair-data content-data writing-data questionbank-data grammar-data phrases-data mathbook-data chinesebook-data study-topics-data phoneme-audio word-tree ancient-text unihan18-package
.PHONY: env deploy update build start stop restart down status logs check-deploy manage admin app-shell container-shell backup backups backup-export backup-import restore test-deploy test-docker polyphone-data

.PHONY: db-shell db-logs db-update
.PHONY: pull update-app apply reload-config db-migrate rewards-preview rewards-import questions-import permissions-sync index-rebuild
