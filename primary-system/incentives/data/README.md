# 兑换奖励目录

奖励内容维护在本系统的 `content_sources/rewards.json`，当前为 22 项、50～5000 积分。包括 5～500 元愿望额度、10～100 元玩具预算、5～20 元零食预算，以及统一娱乐时长、自由时间和电影。金额表示购买预算，设备项目表示使用时长，具体兑现由家长安排。名称、图标、分值和说明与导入逻辑分开；读取时先校验版本、字段、长度、整数分值、中文标点和名称唯一性。

当前目录使用版本 2，每项包含 `category`，稳定分类代码为 `wish`、`toy`、`snack`、`entertainment`、`free_time`，依次对应愿望、玩具、零食、娱乐、自由时间。分类名称与图标维护在 `incentives/categories.py`；「电影任选一部」归自由时间。娱乐内容统一为「手机、平板娱乐、游戏」，提供 15 分钟／50 积分、30 分钟／90 积分、1 小时／160 积分三档，兑换的是共同娱乐时长。旧版本 1 的活动目录仍可读取。

在 `primary-system/` 内运行：

```sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py import_rewards --dry-run
.venv/bin/python manage.py import_rewards
.venv/bin/python manage.py import_rewards --retire-source content_sources/rewards-activities.json
.venv/bin/python manage.py import_rewards --retire-source content_sources/rewards-device-time.json
.venv/bin/python manage.py test incentives
```

默认导入只新增目录中缺少的名称，不修改已有奖励的价格、说明、排序或上下架状态，也不修改账号、学习记录、积分流水与兑换历史。反复执行不会重复添加同名奖励。名称是匹配依据，后台手动改名后会被视为不同奖励；修改既有项目的价格与说明直接在管理后台进行。

迁移 `0002_rewarditem_category` 增加可选分类字段；导入时会按目录补齐同名项目的空白分类，保留家长已设置的分类。管理后台可按分类筛选并直接调整。未分类的自定奖励显示在「其他」，有此类项目时才出现该筛选项。

`--source` 可指定同结构的本地 JSON 文件。写入目标使用当前 Django 数据库配置；对已有家庭数据库导入前先备份，运行预览后再正式导入。默认排序跟随源文件顺序，间隔为 10，便于家长插入自定奖励。

原来的 18 项活动目录保存在 `content_sources/rewards-activities.json`。指定 `--retire-source` 时，仅下架名称、图标、价格、说明与排序都未修改的旧项目，家长已修改的旧配置保留；不删除奖励，也不改动已有兑换记录。新旧目录不能有同名项。此操作支持 `--dry-run`，重复执行不会重复下架或重新上架旧项目。

主导航「积分兑换」进入 `/rewards/shop/`，游客无需登录即可浏览已上架项目；游客不查询任何账号余额或兑换历史，点击「登录后兑换」登录并返回该页。登录后查看本人积分及最近十条兑换记录，兑换提交与「我的奖励」总览仍需登录。主导航「我的学习」仅登录后显示。`/rewards/` 保留原有奖励总览，两处复用同一份兑换卡片。兑换仍提交到原有服务端端点，扣分与创建兑换记录保持原子完成，再由家长核销或取消退分。

兑换页默认按五类分组，可用「全部」和分类按钮筛选，并展示各类上架数量。筛选链接使用 `?category=toy#reward-shop` 等参数，支持直接打开；无效分类回到全部。分类暂无项目时可返回全部。登录入口与兑换成功、失败后的跳转保留当前分类，兑换历史不随奖励筛选而隐藏。

迁移 `0003_entertainment_category` 更新分类选项。旧的 9 项手机、平板和游戏时长配置保存在 `content_sources/rewards-device-time.json`，其中 `sort` 保存原排序，仅用于核对下架。导入含娱乐项目的新目录时，会把旧的三类代码统一为 `entertainment`；配合该旧目录的 `--retire-source`，仅下架未修改的旧时长项目并新增三档统一娱乐，保留其价格、名称与兑换历史。普通目录不接受旧分类和 `sort`，只有下架目录允许；家长修改过的旧项目继续保留。旧筛选链接 `?category=game`、`tablet`、`phone` 继续进入娱乐分类。
