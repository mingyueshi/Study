# 场景成语清单维护

`scenarios.json` 记录场景与词典义项的对应关系。场景例句、用法提示和情境题由专题维护。释义、出处、词典原例句和读音从 Lexicon 当前生效记录读取。

- `groups` 和 `scenes` 按页面显示顺序排列。分类和场景各自使用唯一的稳定短标识，场景的 `group` 指向分类标识。
- `idioms` 每个词典绑定仅存一份。多处练习共用 `idiom_id`，并各自撰写 `example` 和 `note`。例句应包含对应成语，并能用当前选定的义项解释。
- 选择义项时用 `idioms.catalog.dictionary_records()` 检索固定来源 `chinese-xinhua-idioms` 的当前成语记录。逐条核对词头、义项、读音与场景文案，记录 `binding_id`（同时用作 `id`）、`sense_id`、`entry_id`、`pronunciation_id`、`source_key` 和 `lexical_hash`。UUID 使用带短横线的字符串，无读音时写 `null`。
- 从选中的 `SourceRecord` 填写 `evidence_id` 和 `source_version` 作为核对时的证据，`editorial_snapshot` 使用 `lexicon.models.editorial_values(sense, pronunciation)`。未修改过释义或读音的编辑值留空。
- 来源停用、义项停用、词条归并或语义证据变化时，受影响的词卡显示「待核对」。版本更替后，只要词头、词条、义项、读音、核心摘要和人工修订一致，词卡继续可读。词典的出处和原例句可随当前有效版本更新。需要恢复暂停的词卡时，先按新义项核对所有关联场景，再更新证据和必要的教学文案。
- 这些标识对应维护时所用的 Lexicon 数据库。正常跨机启动由 `bootstrap.py` 恢复 Git 基础包，保留 UUID，无需重新导入成语。另建数据库并重新导入来源时，如果产生了新的 UUID，需要核对该数据库中的义项再更新清单；不能按词头自动换绑。
- 在 `primary-system` 运行 `.venv/bin/python manage.py test idioms`，然后用当前词典逐条核对 `matches_pin` 并打开受影响的场景和词典详情。
