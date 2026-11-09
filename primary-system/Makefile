# 乐学堂 primary-system 命令入口：初始化、运行、测试与数据维护。
# 默认只显示帮助；详细运行说明见 README.md 的「本地运行」。

.DEFAULT_GOAL := help
PORT ?= 8012
PYTHON := $(if $(wildcard .venv/bin/python),.venv/bin/python,python3.12)
BOOTSTRAP := $(if $(wildcard .venv/bin/python),.venv/bin/python bootstrap.py,python3.12 bootstrap.py)
MANAGE := $(PYTHON) manage.py

help: ## 显示可用命令
	@awk 'BEGIN { FS = ":.*?## " } /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## 初始化环境：建 .venv、装依赖、校验/恢复基础数据（bootstrap.py）
	$(BOOTSTRAP)

run: ## 启动开发服务器 http://127.0.0.1:$(PORT)（需先 install）
	$(MANAGE) build_feihualing_index --if-needed
	PRIMARY_DEBUG=1 $(MANAGE) runserver 127.0.0.1:$(PORT)

test: ## 跑全量测试（需先 install）
	$(MANAGE) test

test-frontend: ## 跑 Node 前端回归测试
	node --test scripts/test_frontend.cjs scripts/test_feihualing_frontend.cjs

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
