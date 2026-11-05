# 多音字数据说明

`polyphones.json` 由 `scripts/build_polyphones.py` 从词库参考表 CedictRecord（CC-CEDICT，CC-BY-4.0）推导生成，产物提交进仓库，运行时离线只读。

## 推导口径

- 取 2~4 字、音字数对齐的词条；机构/地名类噪声词（县|省|市|学院|公司|协会|政策…）不参与推导与组词
- 某字在词里出现 **2 种及以上读音**（含声调）即为多音字；读音按证据词数排序
- 每读音附 4~6 个组词（2 字词优先；整词声调拼音 + 目标字位置 + 英文释义首条）
- 数字调转声调符（zhong1→zhōng，u:→ü）；第 5 声为轻声、不标调，页面上标「轻」
- 全量排序，重复构建字节一致；来源版本随基础包 CedictRecord.version 固定

## 重新生成

```sh
cd primary-system
make polyphone-data
```

页面读 `polyphones.json`（`hanzi/polyphones.py`），不改词库、不写学习记录。
