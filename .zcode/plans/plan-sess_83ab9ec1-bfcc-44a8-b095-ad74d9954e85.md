# 乐学堂后台搭建：导航精装修 + 成语接龙词池

## Context

primary-system 的后台骨架已存在并验收过（nova_admin 0.6.1 主题 + 滑块验证码，catalog/lexicon/learning/accounts 四组模型全部注册，73 个测试通过）。但 nova-admin 的导航扩展能力（分组、图标、收藏、常用模型、计数徽标）全部未启用，后台 20+ 模型是一长条未组织的列表；同时成语接龙还没有 game app，「接龙配置」无处可管。

本次按用户确认的范围：**① 启用 nova 导航扩展精装修后台；② 新建成语接龙 game app（词池旁表 + 后台）**。这正是架构评审定的迁移路线第一步（新 game app 验证扩展表模式）。

沿用评审已定的决策：`game_eligible/first_char/last_char` 放游戏 app 旁表、不进 lexicon；取词走 `active_records()` **不加 public 过滤**（教学成语来源内部启用、未公开也能用）。

## 现状关键事实

- 数据：教学成语 257 条已内部启用；chinese-xinhua 30,895 条仅暂存未启用（本次不启用）。
- `lexicon.active_records(public=False)` 在 `lexicon/models.py:297`，返回生效版本的 SourceRecord，已排除 merged/archived 词条。
- 权限组由 `seed_platform`（内容编辑）和 `seed_lexicon_roles`（词库两组）建立，bootstrap.py 自动调用。
- 12 模块种子中已有 `chain 成语接龙` 占位模块。

## 变更清单

### 1. 新建 games app（成语接龙词池）

`primary-system/games/`（新目录）：

- `models.py` — `ChainWord`（接龙词池，verbose_name「接龙词池」）：
  - `entry = OneToOneField('lexicon.LexicalEntry', PROTECT, related_name='chain_word', limit_choices_to={'kind': 'idiom'})`
  - `game_eligible = BooleanField(default=False)`（默认不可接龙，后台批量开启）
  - `first_char` / `last_char = CharField(max_length=1)`，`clean()` 里自动从 `entry.headword` 首尾字派生（可人工覆盖）；校验 entry 必须为 idiom 且非 merged/archived
  - `note`、`created_at`、`updated_at`；索引 `(game_eligible, first_char)`、`(game_eligible, last_char)` 供接龙取词
- `services.py` — `eligible_chain_records()`：`active_records()` 过滤 `kind='idiom'` 且 `entry__chain_word__game_eligible=True`，不加 public 过滤（评审决策）；游戏对局后续直接消费此函数
- `admin.py` — ChainWordAdmin：列表显示词头/首字/尾字/可接龙，`list_filter`（game_eligible）、搜索 `entry__headword`、`autocomplete_fields=('entry',)`；批量动作「设为可接龙/移出接龙」
- `tests.py` — 模型校验（首尾字自动派生、非成语拒绝）、服务层（只取生效来源、不要求 public_allowed）、后台（列表渲染、批量动作、`游戏管理`组可管理而`内容编辑`组不行），写法对齐 `lexicon/tests/test_admin.py`

### 2. 后台信息架构（nova 导航扩展）

`config/settings.py` 追加：

```python
NOVA_ADMIN_NAVIGATION = True
NOVA_ADMIN_NAV_FAVORITES = True
NOVA_ADMIN_NAV_GROUPS = [
    {'key': 'catalog',  'label': '课程内容',   'apps': ['catalog']},
    {'key': 'lexicon',  'label': '基础词库',   'apps': ['lexicon']},
    {'key': 'games',    'label': '游戏中心',   'apps': ['games']},
    {'key': 'learning', 'label': '学习记录',   'apps': ['learning']},
    {'key': 'people',   'label': '账号与权限', 'apps': ['accounts', 'auth']},
]
NOVA_ADMIN_NAV_COMMON_MODELS = ['catalog.contentitem', 'catalog.collection', 'lexicon.lexicalentry', 'games.chainword']
NOVA_ADMIN_NAV_ICONS = {…}          # app/模型级图标，从主题内置 320 图标子集选（对照 django-nova-admin ICONS.md 校验名称）
NOVA_ADMIN_NAV_BADGE_PROVIDER = 'config.admin_navigation.badges'
```

`config/admin_navigation.py`（新）— 徽标 provider：待核对同形词（entrymatch pending）、导入中/失败任务（sourcerelease）、草稿内容（contentitem draft）、可接龙词数。每项先查 `request.user.has_perm()` 再聚合查询，遵守 demo 中「有界查询、尊重 ModelAdmin 权限」的要求。

### 3. 权限组与注册

- `config/settings.py` INSTALLED_APPS 追加 `'games'`（lexicon 之后）。
- `catalog/management/commands/seed_platform.py` 追加：建立 `游戏管理` 组并授予 games app 全部权限（幂等 get_or_create，与现有 内容编辑 组并列）。bootstrap.py 无需改动。

### 4. 文档

- `README.md`：「现在可以使用」补两条（接龙词池后台、导航分组）；后台说明补游戏管理组。
- `VALIDATION.md`：追加 2026-10-31 验证条目。

## 不做的事

- 不建对局/计分模型（评审：通用内容表不承担对局，游戏逻辑等前台接入时再做）
- 不启用 chinese-xinhua 30,895 条快照（属词库运维，按 lexicon-operations.md 单独执行）
- 不改 pip 固定提交（主题同为 0.6.1；本地仓库未提交候选不纳入）
- 不动 lexicon 模型与导入流程

## 验证

```sh
cd primary-system
.venv/bin/python manage.py check                 # nova 自检无警告
.venv/bin/python manage.py makemigrations --check --dry-run
.venv/bin/python manage.py test --noinput        # 73 现有 + 新增 games 测试全过
.venv/bin/python manage.py seed_platform         # 幂等，建游戏管理组
PRIMARY_DEBUG=1 .venv/bin/python manage.py runserver 127.0.0.1:8012
```

最后用浏览器打开 `/admin/` 实际核对：五个导航分组与图标渲染、徽标计数、收藏/常用模型可用、接龙词池列表与批量动作正常、非 superuser 权限隔离不变。
