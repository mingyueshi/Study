# primary-system 本地学习基础数据：首批资源清单

**核验日期：2026-11-02。** 已实际下载并校验，不是只有推荐链接。未指定年级，按小学6–12岁家庭学习系统准备素材；不修改本机项目、不上传任何孩子数据。自用不等于版权豁免，本包按各源开放许可/古典正文边界收集。

## 先看结论

优先导入 **汉字/笔顺 + 精选诗文 + 原创口算种子**；词典、英语、地理、元素与星表可作后台素材库。**所有原始内容均未完成逐条儿童适龄审核，不要全库随机出题或默认直出给孩子。**

# 小文件交付说明与教材合并（2026-11-02）

旧大包受聊天附件大小限制，本版将全部内容无损重分为每个不超过14 MiB的小ZIP。无需下载旧大包；资料库中的旧4个文件没有被覆盖。

## 独立小包

1. `01a_cc_cedict_2026-11-02.zip`：125,346条中英词典，原始数据+JSONL。
2. `01b_hanzi_strokes_2026-11-02.zip`：9,574字结构/笔顺两表。
3. `01c_unihan_17_2026-11-02.zip`：Unicode17.0汉字属性及原始压缩包。
4. `01d_classical_poetry_2026-11-02.zip`：唐诗52,247、宋词20,143等保守正文子集。
5. `02a_geography_english_elements_math_2026-11-02.zip`：地理250、元素118导入版、英语135,166读音、原创数学543事实。
6. `02b_hyg_stars_2026-11-02.zip`：HYG原始星表及499具名子集。

以上六包均可**单独解压和使用对应数据集**，不需要拼接ZIP。解压到同一目录可恢复原有数据目录布局；重复的docs和总体说明相同，任选保留。根目录manifest.json/SHA256SUMS只覆盖当前小包；来源目录自身的旧总SHA256SUMS可能覆盖同类多个小包，应全部解压后再验，勿将缺少其他小包误判为损坏。

## 教材三包（必须齐备后合并原始EPUB）

- `03a_science_epub_part001_2026-11-02.zip`
- `03b_science_epub_part002_2026-11-02.zip`
- `03c_science_epub_part003_2026-11-02.zip`

这是**标准二进制分片再各自ZIP封装**，不是三个可独立阅读的EPUB，也不是zip软件专用分卷。三ZIP均可单独解压；解压到同一目录后，在`textbooks/raw/`能看到`.part001`、`.part002`、`.part003`。三个包都附教材许可/来源/目录/合并说明，任一缺失都不能重建完整教材。不要更改分片文件名、不要用文本编辑器打开并另存。

### macOS / Linux

在终端进入包含分片的`textbooks/raw/`目录，运行：

```bash
file='Gr4_NaturalSciences_Learner_Eng_CC-BY.epub'
cat "$file.part001" "$file.part002" "$file.part003" > "$file"
# macOS 校验
shasum -a 256 "$file"
# Linux 可改用
sha256sum "$file"
```

### Windows PowerShell

将终端当前目录切换到含分片的`textbooks\raw`，运行以下二进制流合并（不要用普通文本Get-Content合并）：

```powershell
$name = 'Gr4_NaturalSciences_Learner_Eng_CC-BY.epub'
$parts = @("$name.part001", "$name.part002", "$name.part003")
foreach ($p in $parts) { if (!(Test-Path -LiteralPath $p)) { throw "Missing part: $p" } }
$outPath = Join-Path (Get-Location).Path $name
$out = [System.IO.File]::Create($outPath)
try {
  foreach ($p in $parts) {
    $inStream = [System.IO.File]::OpenRead((Join-Path (Get-Location).Path $p))
    try { $inStream.CopyTo($out) } finally { $inStream.Dispose() }
  }
} finally { $out.Dispose() }
Get-FileHash -Algorithm SHA256 -LiteralPath $outPath
(Get-Item -LiteralPath $outPath).Length
```

### 合并成功标准

- 文件名：`Gr4_NaturalSciences_Learner_Eng_CC-BY.epub`
- 精确大小：**40,926,007字节**
- SHA256：`48f0d1027ea9e12abceb1aeca17372c9ddd7357c35e23f0d8c001a0a7901322a`
- 只有大小与SHA256均一致才打开EPUB或导入；不一致时保留分片，检查三包是否齐全、顺序与解压CRC，不能把残缺文件当成功。
- 合并会创建/覆盖同名EPUB；若已有个人修改版，先备份或在空目录操作。确认完整后才可自行删分片。

分片本体的大小和SHA256：

| 分片 | 字节数 | SHA256 |
|---|---:|---|
| `Gr4_NaturalSciences_Learner_Eng_CC-BY.epub.part001` | 14000000 | `f629310a0f21b038244ad0e6e3b4ee88fca22efa9d0a5412532c1a128e4960bf` |
| `Gr4_NaturalSciences_Learner_Eng_CC-BY.epub.part002` | 14000000 | `815fcc97cd476e1c0eef83c04fb373d123c39dac44c3457da5c2375dfa17fe6f` |
| `Gr4_NaturalSciences_Learner_Eng_CC-BY.epub.part003` | 12926007 | `5340dd54ee8388b6f5b0e442c9c0e284f23ed47f0e5b1f58b83061b492a17af1` |

**边界未改变**：所有素材仍是待审数据，不自动等同适龄课程。教材为英文南非CAPS、CC BY4.0；有过时日期，学生端须隔离答案/教师层，实验需成人审核监护。原始文件逐字节保持；本次仅改变交付包装，无新下载或重新采集。


## 一、字词与汉字

| 资源 | 实测规模 | 许可 | 重要差异 |
|---|---:|---|---|
| [CC-CEDICT官方导出](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) | 125,346词条 | CC BY-SA 4.0 | 2026-10-31导出；**英文释义**，不是现代汉语中文词典；已提供JSONL |
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) | 9,574字，两表一一对应 | 字典LGPL3+；图形Arphic Public License | 可做笔顺/描红/结构；缺解释58、空拼音9；非大陆笔顺规范认证 |
| [Unihan17.0固定版](https://www.unicode.org/Public/17.0.0/ucd/) | 102,998码位；其中普通话属性44,348 | Unicode License V3 | 不是小学10万常用字；固定17版，不声称最新；香港旧分级不能当大陆年级 |

现代中文释义是本批明显缺口。[chinese-xinhua](https://github.com/pwxcoo/chinese-xinhua#copyright)虽标MIT，作者说明内容来自多站抓取；第三方现代释义原权利未证实，因此**不扩打包其他数据，也不重复系统已有30,895条成语**。

## 二、古诗文：实报筛选后的规模

来自 [chinese-poetry官方仓库](https://github.com/chinese-poetry/chinese-poetry)，固定commit `b8594f81a89752241442f2ce267d6f66f96704ee`。上游声明MIT；本批优先古典正文，不把现代注释/译文误当公版。发现现代说明可混入正文，已按保守规则隔离可疑条目，变换和剔除索引全部保留。**规则筛查不等于逐篇版权、校勘或适龄认证，不叫“最新全唐诗/最全小学诗库”。**

| 子集 | 实际记录 | 计数单位 |
|---|---:|---|
| 唐诗保守筛选正文子集 | 52247 | array_records |
| 宋词保守筛选正文子集 | 20143 | array_records |
| 唐诗三百首（上游选集名；筛选后） | 358 | array_records |
| 宋词三百首（上游选集名；筛选后） | 280 | array_records |
| 诗经 | 305 | array_records |
| 楚辞 | 64 | array_records |
| 论语 | 20 | array_records |
| 千家诗 | 219 | nested_title_entries_226_leaf_poems |
| 千字文 | 1 | work |
| 百家姓 | 1 | work |
| 三字经传统版 | 1 | work |
| 声律启蒙（去现代摘要） | 30 | nested_rhyme_chapters |

“唐诗三百首/宋词三百首”是上游选集名称，不保证各300条。选集与主体有重叠；《论语》的20是篇章，《千字文/百家姓/三字经》的1是整部作品；《千家诗》的标题节点与叶子诗计数详见子包，不能误合计。古文的时代观念、战争、酒色等内容须家长精选。

## 三、英语、地理、科学与数学

| 资源 | 可直接用的入口 | 许可/边界 |
|---|---|---|
| [国家与地区](https://github.com/mledoze/countries) | `countries/derived/countries_core.json`，250条，含中文名 | ODbL1.0；不是250主权国家；不含地图/旗帜图片；首都/地区口径需审 |
| [元素周期表](https://github.com/Bowserinator/Periodic-Table-JSON) | `elements/derived/elements_1_118.json` | CC BY-SA3.0；原始119号为未确认项已从导入版排除；温度K，数值含缺失/预测 |
| [CMU发音词典](https://github.com/cmusphinx/cmudict) | `cmudict/derived/pronunciations.csv`，135,166读音/126,052拼写 | CMU两条款BSD风格；美式ARPAbet，**无音频/中文义**；含敏感词，必加小学词白名单 |
| [HYG星表](https://www.astronexus.com/projects/hyg) | `hyg/derived/named_stars.csv`，499具名条目；原始119,626记录 | CC BY-SA4.0；v4.2固定快照，包含太阳/多星组件，非实时导航库 |
| 原创数学事实种子 | `math_seed/*.csv`，81乘法+231加法+231减法 | 原创编排CC0；**是本任务计算生成，不冒称下载题库或官方教材**；已独立重算 |

## 四、教材：真实可打包与仅给入口严格分开

已下载 [Siyavula Grade4科学与技术](https://www.siyavula.com/read)无品牌英文EPUB，原件 **40,926,007字节**。具体EPUB版权页明示 **CC BY4.0**，以文件内授权为准。18章/28子主题/前言，目录47行；只提取目录，未把书自动转换成合格题库。

- 南非CAPS课程，不是中国课标同步教材；原书元数据2013年，已有“下一闰年2016”过时表述。
- 检出327个problem、327个solution、288个教师指引标记；**学生端必须隔离答案和教师层**。
- 科学实验需成人逐项审查和监护；外链视频未下载，版权与适龄未逐项复核。

[国家中小学智慧教育电子教材](https://basic.smartedu.cn/tchMaterial)与[人教教材入口](https://jc.pep.com.cn/)仅列链接：本次访问受403限制，未绕过，亦未确认可批量重用授权。没有“打包中国现行教材”的伪交付。[CK-12现行许可](https://help.ck12.org/hc/en-us/articles/50990257420955-CK-12-Curriculum-Materials-License)有自动化衍生等限制，本批不作为通用底库。更多候选及原因见 `textbooks/sources.*`。

## 五、怎么导入

1. 解压后按包内 `SHA256SUMS`/`manifest.json`验文件，不覆盖现有数据库。
2. 先建原始快照层，保留来源/版本/许可；再建独立家长审核白名单，默认`review_status=pending`。
3. 字形、释义、诗文、题干、答案与学习记录分表；年级/教材映射留空，不用模型猜成官方数据。
4. 先少量人工验证字体、拼音、多值、换行、坐标、单位和答案隔离，再逐步导入。

完整字段类型与质量缺口在各数据目录metadata/README；全量来源字段许可索引在 `资源来源与许可索引.csv/json`；建议数据模型和玩法在 `导入模型与学习玩法.md`。

**仍缺：** 中国现行教材合法可重组正文、完整现代汉语中文释义、音频、课标年级映射、经过逐题校验的数学题库、完整儿童适龄审核。本批是可追溯基础原料，不是开箱即用已审课程。

## 本版实际小文件大小与整体SHA256

| 文件 | MiB | SHA256 |
|---|---:|---|
| `01a_cc_cedict_2026-11-02.zip` | 12.44 | `af26852227ee53fc95da58111cd04650452fe608673bd532e42f243e684d9930` |
| `01b_hanzi_strokes_2026-11-02.zip` | 12.27 | `a4a7dcd1caa29a055de5f81d45d4300007a2ed8cffdc96791608509270cccf01` |
| `01c_unihan_17_2026-11-02.zip` | 9.71 | `293e29e0d7eb5158fda4d182927bd6adeaf7eebad8cbac17a19d169ed9a50306` |
| `01d_classical_poetry_2026-11-02.zip` | 11.46 | `12122bfc6e2f8bbc33ca4c80f2785f16583333b251d251e6630dd641d0c9079a` |
| `02a_geography_english_elements_math_2026-11-02.zip` | 2.37 | `04870c025abc27d778368a710c7a5ca71bb553b8a4ba6760c15344277c9bea72` |
| `02b_hyg_stars_2026-11-02.zip` | 13.12 | `0fa4d85d0a70f67477732b5d0812b5ee5dc08669d9fc3dd1bd52b51f3cc4bab3` |
| `03a_science_epub_part001_2026-11-02.zip` | 13.41 | `74f7b6fe46e980a94cefaf5b742daf4934ebc881fb0c6dbd3c0137448e49f51c` |
| `03b_science_epub_part002_2026-11-02.zip` | 13.41 | `a3354bf571d5a3ca621c62b95b29655da28a79fee595ca7e377e4a3fb1642f99` |
| `03c_science_epub_part003_2026-11-02.zip` | 12.36 | `dcb8d3e87c45c86551b41b8c9b57fd5683014c5b5cd1dbb5ece07f17beba2e06` |

所有ZIP均≤14 MiB，CRC与逐文件SHA256通过；原三大包中173个来源文件已逐字节核对无丢失/改写（教材经三片合并复原）。旧大包不要重复下载或发送。
