/* 英语音标正文：第一至第四章（元音），18个知识点，覆盖 20 个元音。 */
'use strict';

window.PHONETICS_LESSONS_VOWELS = [
  {
    id: 'ph1-1', title: '什么是音标',
    definition: '音标是给单词标注发音的符号，写在 / / 中间。学会音标，看到生词就能读出来，不用再猜。',
    essentials: [
      '词典里单词后面的斜体符号就是音标：cat 标作 /kæt/，一个符号对应一个发音。',
      '同一个字母在不同单词里发音可能不同：a 在 cat 里读 /æ/，在 cake 里读 /eɪ/。',
      '英语共有 48 个音标：20 个元音加 28 个辅音，本册会一个一个认识它们。',
      '先学音标再背单词，读音自己就能搞定，不用老师领读。',
    ],
    facts: [{ label: '48 个音标', value: '20 个元音（12 单元音 + 8 双元音）+ 28 个辅音' }, { label: '写法', value: '音标写在 / / 中间，如 /kæt/' }],
    example: { question: 'cat /kæt/ 里三个音标分别对应什么？', steps: ['/k/ 对应字母 c，/æ/ 对应字母 a。', '/t/ 对应字母 t，三个音连起来就是 cat。'], answer: '/k/ + /æ/ + /t/，按顺序连读就是「猫」。' },
    misconception: { wrong: '以为音标是另一个国家的文字。', right: '音标只是记音的符号，就像给发音做笔记，学会了受益六年。' },
    quiz: { question: '学会音标最大的用处是什么？', options: ['单词写得更漂亮', '见到生词自己会读', '作文写得更好'], answer: 1, explanation: '音标注音，见音能读；这是自学单词的基本功。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph1-2', title: '元音和辅音',
    definition: '元音发音时气流从口腔顺利通过、不受阻碍；辅音发音时气流会受到唇、齿、舌的阻碍。元音 20 个，辅音 28 个。',
    essentials: [
      '单元音 12 个：5 个长元音（/iː/ /ɜː/ /ɑː/ /ɔː/ /uː/）+ 7 个短元音（/ɪ/ /e/ /æ/ /ʌ/ /ɒ/ /ʊ/ /ə/）。',
      '双元音 8 个，发音时口型从一个音滑向另一个音：/eɪ/ /aɪ/ /ɔɪ/ /aʊ/ /əʊ/ /ɪə/ /eə/ /ʊə/。',
      '辅音大多清浊成对，发音部位相同、只是声带振不振动。',
      '音节的核心是元音：一个单词有几个元音音素，大致就有几个音节。',
    ],
    comparison: { headers: ['家族', '成员', '特点'], rows: [['长元音', '/iː/ /ɜː/ /ɑː/ /ɔː/ /uː/', '读音长而紧'], ['短元音', '/ɪ/ /e/ /æ/ /ʌ/ /ɒ/ /ʊ/ /ə/', '短促放松'], ['双元音', '/eɪ/ /aɪ/ /ɔɪ/ /aʊ/ /əʊ/ /ɪə/ /eə/ /ʊə/', '前长后短，滑动'], ['辅音', '28 个', '气流受阻，多数清浊成对']] },
    example: { question: 'sea /siː/ 和 sit /sɪt/ 各有几个音节？', steps: ['数元音音素：sea 里是 /iː/，一个。', 'sit 里是 /ɪ/，也是一个。'], answer: '都是单音节词——元音决定音节数量。' },
    misconception: { wrong: '以为字母数量等于音节数量。', right: '数音节要数元音音素：make /meɪk/ 五个字母却只有一个音节。' },
    quiz: { question: '下面哪个是双元音？', options: ['/iː/', '/aʊ/', '/p/'], answer: 1, explanation: '/aʊ/ 由 /a/ 滑向 /ʊ/，是双元音；/iː/ 是单元音，/p/ 是辅音。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  },
  {
    id: 'ph1-3', title: '清辅音和浊辅音',
    definition: '发音时声带不振动的叫清辅音，振动的叫浊辅音。许多辅音清浊成对，口型相同、只有声带一个差别。',
    essentials: [
      '把手放在喉咙上发 /s/，几乎感觉不到振动；发 /z/ 能感到嗡嗡振动——这就是清浊之别。',
      '十对清浊搭档：/p b/ /t d/ /k g/ /f v/ /s z/ /ʃ ʒ/ /θ ð/ /tʃ dʒ/ /tr dr/ /ts dz/。',
      '清辅音送气强，浊辅音声带先振动；发音部位一样，只是「开不开马达」。',
      '/m/ /n/ /ŋ/ /l/ /r/ /h/ /w/ /j/ 没有清浊对，单独记。',
    ],
    facts: [{ label: '清（不振）', value: '/p/ /t/ /k/ /f/ /s/ /ʃ/ /θ/ /tʃ/ /tr/ /ts/' }, { label: '浊（振动）', value: '/b/ /d/ /g/ /v/ /z/ /ʒ/ /ð/ /dʒ/ /dr/ /dz/' }],
    example: { question: '摸着喉咙对比 pig 的 /p/ 和 big 的 /b/，有什么不同？', steps: ['两个音都是双唇先闭后开。', '/p/ 声带不振动，/b/ 声带振动，喉咙发麻。'], answer: '口型相同，只差声带振动——一对清浊搭档。' },
    misconception: { wrong: '以为清浊是声音大小。', right: '清浊看的是声带振不振动，不是音量；手摸喉咙一测就知道。' },
    quiz: { question: '发 /z/ 时声带振动吗？', options: ['振动（浊辅音）', '不振动（清辅音）', '有时振有时不振'], answer: 0, explanation: '/z/ 是浊辅音，和清辅音 /s/ 只差声带振动。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  },
  {
    id: 'ph2-1', title: '长元音 /iː/',
    definition: '/iː/ 是「长衣音」：嘴角向两边咧开像微笑，舌位高，读音长而紧张，像拼音的「衣」拖长。',
    essentials: [
      '常见字母组合：ee（see, tree）、ea（sea, tea）、e（he, we）、ie（field）。',
      '发音时嘴角左右拉紧，舌尖抵下齿，声音拉长一拍。',
      '常见词：see, sleep, three, sheep, green, teacher。',
      '它是长元音，一拍拖满；和短元音 /ɪ/ 对比练习效果最好。',
    ],
    facts: [{ label: '口型', value: '咧嘴微笑，舌尖抵下齿' }, { label: '例词', value: 'see /siː/, tree /triː/, sheep /ʃiːp/, green /griːn/' }],
    formula: '长元音一拍拖满，嘴角咧开不放松',
    example: { question: 'see /siː/ 和 sea 拼写不同，读音呢？', steps: ['see 的 ee 读 /iː/。', 'sea 的 ea 也读 /iː/——两个词同音。'], answer: '同音：都读 /siː/。字母不同、音标相同很常见。' },
    misconception: { wrong: '把 sheep 读成短促的「谢普」。', right: '/iː/ 要读长：sheep /ʃiːp/，拖满一拍，别混成 ship /ʃɪp/。' },
    quiz: { question: 'tree、meet、ship 里，哪一个的元音不是长音 /iː/？', options: ['tree', 'meet', 'ship'], answer: 2, explanation: 'tree、meet 的 ee 读长音 /iː/；ship 的 i 读短音 /ɪ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph2-2', title: '长元音 /ɜː/ 与 /ə/',
    definition: '/ɜː/ 是长「鹅」音：嘴半开半圆，舌身放平。/ə/ 是它的短弱版本，只在弱读音节出现，是英语里最常用的音。',
    essentials: [
      '/ɜː/ 常见组合：ir（bird, girl）、ur（nurse, turn）、er（her, term）。',
      '/ə/ 叫中央弱元音：about, teacher, banana 里不加重的音节都读它。',
      '/ɜː/ 长而清楚，/ə/ 短而含糊——一个在重读音节，一个在弱读音节。',
      '英式发音这两个音都不卷舌；美式会卷舌（bird 儿化）。',
    ],
    comparison: { headers: ['音标', '出现位置', '例词'], rows: [['/ɜː/', '重读音节', 'bird /bɜːd/, girl /gɜːl/, nurse /nɜːs/'], ['/ə/', '弱读音节', 'about /əbaʊt/, teacher /tiːtʃə/, banana /bənɑːnə/']] },
    formula: '重读读 /ɜː/ 拖长，弱读读 /ə/ 含糊带过',
    example: { question: 'teacher /tiːtʃə/ 里有两个 er 拼写吗？', steps: ['词尾 -er 在这里弱读。', '重音在前：tea 读 /tiː/，-cher 读 /tʃə/。'], answer: '词尾只出现一次 -er，读 /ə/；重读音节里的 ee 才读 /iː/。' },
    misconception: { wrong: '把 about 读成「阿 bout」字字清楚。', right: '弱读音节读 /ə/，轻快含糊：/əbaʊt/，这才是地道的节奏。' },
    quiz: { question: 'girl 中的 ir 读哪个音？', options: ['/ɜː/', '/ə/', '/iː/'], answer: 0, explanation: 'girl 是单音节重读词，ir 读长元音 /ɜː/：/gɜːl/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph2-3', title: '长元音 /ɑː/',
    definition: '/ɑː/ 是「长阿音」：嘴巴张大、舌头放平放低，像医生压舌头的阿——，拖长一拍。',
    essentials: [
      '常见字母组合：ar（car, star, park）、a 在 f/th 前（father, bath 英式）。',
      '嘴巴开到最大，舌位最低，声音洪亮拖长。',
      '常见词：car, star, park, farm, father。',
      '和短元音 /ʌ/ 对比：car 的 /ɑː/ 大开口，cup 的 /ʌ/ 半开短促。',
    ],
    facts: [{ label: '口型', value: '大开口，舌位最低' }, { label: '例词', value: 'car /kɑː/, star /stɑː/, park /pɑːk/, father /fɑːðə/' }],
    formula: '张大嘴巴不圆唇，长长地「阿——」',
    example: { question: 'far 和 for 开头字母都是 f，读音差别大吗？', steps: ['far 读 /fɑː/，大开口长阿。', 'for 读 /fɔː/，圆唇长奥。'], answer: '差别大：口型从咧开到圆唇，两个完全不同的音。' },
    misconception: { wrong: '把 park 读成「帕克」圆唇。', right: '/ɑː/ 不圆唇：park /pɑːk/，嘴巴横向大开。' },
    quiz: { question: 'car、star、warm 里，哪一个的 ar 不读 /ɑː/？', options: ['car', 'star', 'warm'], answer: 2, explanation: 'car、star 里 ar 读 /ɑː/；warm 里 ar 读 /ɔː/（受前面的 w 影响）。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph2-4', title: '长元音 /ɔː/',
    definition: '/ɔː/ 是「长奥音」：双唇收圆向前突，舌后部抬高，像突然看到惊喜时拖长的「奥——」。',
    essentials: [
      '常见字母组合：or（horse, sport）、al（ball, tall）、aw（saw, draw）、oor（door）。',
      '双唇圆而突出，比汉语的「奥」更圆更长。',
      '常见词：ball, horse, door, four, autumn。',
      '和 /ɒ/ 对比：ball 的 /ɔː/ 长而圆，hot 的 /ɒ/ 短而不那么圆。',
    ],
    facts: [{ label: '口型', value: '双唇收圆前突' }, { label: '例词', value: 'ball /bɔːl/, horse /hɔːs/, door /dɔː/, four /fɔː/' }],
    formula: '圆唇长奥，一拍拖满',
    example: { question: 'short 和 shirt 只差一个字母，读音差在哪？', steps: ['short 读 /ʃɔːt/，圆唇长奥。', 'shirt 读 /ʃɜːt/，半开长鹅。'], answer: '/ɔː/ 对 /ɜː/：一个圆唇、一个不圆唇，别读混。' },
    misconception: { wrong: 'ball 读成「抱」加 l。', right: '/ɔː/ 是长音一拍：ball /bɔːl/，先圆唇拖长再收 /l/。' },
    quiz: { question: 'ball、hot、door 里，哪两个都含有 /ɔː/？', options: ['ball 和 hot', 'ball 和 door', 'hot 和 door'], answer: 1, explanation: 'ball 的 al 和 door 的 oor 都读 /ɔː/；hot 的 o 读短音 /ɒ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph2-5', title: '长元音 /uː/',
    definition: '/uː/ 是「长乌音」：双唇收圆收小、向前突出，舌后部抬高，像拼音「乌」拖长。',
    essentials: [
      '常见字母组合：oo（moon, food）、u（blue, June）、o（do, who）、ou（you）。',
      '双唇收得很圆很小，像吹蜡烛前的口型。',
      '常见词：blue, food, moon, school, zoo。',
      '和短元音 /ʊ/ 对比：food 长而紧，book 短而松。',
    ],
    facts: [{ label: '口型', value: '双唇收圆前突，口型最小' }, { label: '例词', value: 'blue /bluː/, food /fuːd/, moon /muːn/, school /skuːl/' }],
    formula: '圆唇最小孔，长长地「乌——」',
    example: { question: 'too 和 two 拼写不同，读音呢？', steps: ['too 的 oo 读 /uː/。', 'two 的 o 也读 /uː/（w 不发音）。'], answer: '同音：都读 /tuː/。' },
    misconception: { wrong: '把 food 读成「福的」短促。', right: '/uː/ 拖满一拍：food /fuːd/，别混成 foot /fʊt/。' },
    quiz: { question: 'moon、food、book 里，哪一个的 oo 不读长音 /uː/？', options: ['moon', 'food', 'book'], answer: 2, explanation: 'moon、food 的 oo 读长音 /uː/；book 的 oo 读短音 /ʊ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-1', title: '短元音 /ɪ/',
    definition: '/ɪ/ 是「短衣音」：和 /iː/ 口型相近但嘴张得稍大、肌肉放松，短促一拍就收。',
    essentials: [
      '常见字母：i 在闭音节（big, fish, sit）、y 在弱读音节（city, happy）。',
      '嘴微开，不刻意咧嘴，放松短促。',
      '常见词：big, fish, sit, pig, city, family。',
      '对比 /iː/：ship /ʃɪp/ 短松，sheep /ʃiːp/ 长紧——长短不同，词就不同。',
    ],
    facts: [{ label: '口型', value: '微开放松，短促' }, { label: '例词', value: 'big /bɪg/, fish /fɪʃ/, sit /sɪt/, happy /hæpɪ/' }],
    formula: '短促放松一拍收，不拖不紧',
    example: { question: 'hit 和 heat 只差一个字母，读音差在哪？', steps: ['hit 读 /hɪt/，短促放松。', 'heat 读 /hiːt/，长而紧张。'], answer: '/ɪ/ 对 /iː/：长短之差造成两个不同的词。' },
    misconception: { wrong: '长短不分，sheep 和 ship 读得一样。', right: '说 sheep 时拖长咧紧，说 ship 时短促放松——意思完全不同。' },
    quiz: { question: 'big、fish、like 里，哪一个的 i 读双元音 /aɪ/？', options: ['big', 'fish', 'like'], answer: 2, explanation: 'big、fish 的 i 读短音 /ɪ/；like 是开音节，i 读双元音 /aɪ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-2', title: '短元音 /e/',
    definition: '/e/ 是「短诶音」：嘴半开，舌尖抵下齿，像拼音「诶」的短促版，但没有那么宽。',
    essentials: [
      '常见字母：e 在闭音节（bed, pen, ten）、ea（head, bread）。',
      '嘴半开，比 /æ/ 小、比 /ɪ/ 大。',
      '常见词：bed, pen, red, ten, egg, best。',
      '和 /æ/ 对比：bed 嘴半开，bad 嘴咧大——bed 不会变成 bad。',
    ],
    facts: [{ label: '口型', value: '半开，舌尖抵下齿' }, { label: '例词', value: 'bed /bed/, pen /pen/, egg /eg/, head /hed/' }],
    formula: '半开短促，干脆利落',
    example: { question: 'pen 和 pan 一字母之差，读音差在哪？', steps: ['pen 读 /pen/，嘴半开。', 'pan 读 /pæn/，嘴咧大。'], answer: '/e/ 对 /æ/：嘴张开度不同，两词意思不同（钢笔对平底锅）。' },
    misconception: { wrong: '/e/ 和 /æ/ 随便读。', right: '中国学生常把 bad 读成 bed——记得 /æ/ 要把嘴咧大。' },
    quiz: { question: 'bed、red、these 里，哪一个的 e 不读 /e/？', options: ['bed', 'red', 'these'], answer: 2, explanation: 'bed、red 的 e 读短音 /e/；these 的 e 读长音 /iː/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-3', title: '短元音 /æ/',
    definition: '/æ/ 是「咧嘴短阿」：嘴张得比 /e/ 大、向两边咧，像被牙医压住舌头的短促「阿」。',
    essentials: [
      '常见字母：a 在闭音节（cat, hat, map, apple）。',
      '嘴咧大，下巴下沉，短促有力。',
      '常见词：cat, hat, map, apple, family, back。',
      '和 /e/ 对比：man /mæn/ 嘴大，men /men/ 嘴小——一音之差、单复之别。',
    ],
    facts: [{ label: '口型', value: '大咧嘴，下巴下沉' }, { label: '例词', value: 'cat /kæt/, hat /hæt/, apple /æpl/, back /bæk/' }],
    formula: '咧大嘴，短促「阿诶」',
    example: { question: 'bad 和 bed 读音怎么区分？', steps: ['bad 读 /bæd/，嘴咧大。', 'bed 读 /bed/，嘴半开。'], answer: '/æ/ 对 /e/：开口度是唯一差别，也是意思的分界线。' },
    misconception: { wrong: '把 cat 读成「科特」偏 /e/。', right: '/æ/ 嘴要咧大：cat /kæt/，比汉语拼音的 a 更靠前更扁。' },
    quiz: { question: 'cat、cake、apple 里，哪两个的 a 都读 /æ/？', options: ['cat 和 cake', 'cat 和 apple', 'cake 和 apple'], answer: 1, explanation: 'cat、apple 的 a 读 /æ/；cake 的 a 读双元音 /eɪ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-4', title: '短元音 /ʌ/',
    definition: '/ʌ/ 是「短阿音」：嘴半开，舌头放松居中，短促含糊，像被轻轻碰了一下发出的「阿」。',
    essentials: [
      '常见字母：u 在闭音节（bus, sun, cup）、o（mother, come, love）。',
      '嘴半开不圆唇，肌肉最放松。',
      '常见词：bus, sun, cup, run, mother, love。',
      '和 /ɑː/ 对比：cup 短促含糊，car 大开洪亮。',
    ],
    facts: [{ label: '口型', value: '半开放松，不圆唇' }, { label: '例词', value: 'bus /bʌs/, sun /sʌn/, mother /mʌðə/, love /lʌv/' }],
    formula: '半开短促，放松含糊',
    example: { question: 'sun 和 son 拼写不同，读音呢？', steps: ['sun 的 u 读 /ʌ/。', 'son 的 o 也读 /ʌ/。'], answer: '同音：都读 /sʌn/——太阳和儿子在口语里听不出区别。' },
    misconception: { wrong: '把 come 读成「抠姆」。', right: 'come 的 o 读 /ʌ/：/kʌm/，不圆唇、短促。' },
    quiz: { question: 'bus、put、come 里，哪两个的元音都读 /ʌ/？', options: ['bus 和 put', 'bus 和 come', 'put 和 come'], answer: 1, explanation: 'bus 的 u 和 come 的 o 都读 /ʌ/；put 的 u 读短音 /ʊ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-5', title: '短元音 /ɒ/',
    definition: '/ɒ/ 是「短奥音」：双唇微圆但不突出，短促，介于「奥」和「欧」之间。',
    essentials: [
      '常见字母：o 在闭音节（dog, box, hot, stop）。',
      '双唇微圆，比 /ɔː/ 松、短。',
      '常见词：dog, box, hot, stop, shop, clock。',
      '和 /ɔː/ 对比：hot 短促微圆，ball 圆唇拖长——很多课本词就差在这里。',
    ],
    facts: [{ label: '口型', value: '微圆，短促' }, { label: '例词', value: 'dog /dɒg/, box /bɒks/, hot /hɒt/, shop /ʃɒp/' }],
    formula: '微圆短促，一带而过',
    example: { question: 'not 和 note 一字母之差，读音差在哪？', steps: ['not 读 /nɒt/，短音。', 'note 读 /nəʊt/，双元音。'], answer: '/ɒ/ 对 /əʊ/：闭音节和开音节（加哑音 e）把短音变成了双元音。' },
    misconception: { wrong: '把 hot 读成长音「号特」。', right: '/ɒ/ 短促：hot /hɒt/，一拍就收。' },
    quiz: { question: 'dog、box、no 里，哪一个的 o 不读 /ɒ/？', options: ['dog', 'box', 'no'], answer: 2, explanation: 'dog、box 的 o 读短音 /ɒ/；no 开音节读双元音 /əʊ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph3-6', title: '短元音 /ʊ/',
    definition: '/ʊ/ 是「短乌音」：双唇微圆放松，短促，比 /uː/ 开口大、肌肉松。',
    essentials: [
      '常见字母组合：oo（book, good, look）、u（put, full, sugar）。',
      '双唇放松微圆，短促一带而过。',
      '常见词：book, good, look, put, full, would。',
      '和 /uː/ 对比：book 短松，food 长紧——oo 的两种读音要靠单词记。',
    ],
    facts: [{ label: '口型', value: '放松微圆，短促' }, { label: '例词', value: 'book /bʊk/, good /gʊd/, look /lʊk/, put /pʊt/' }],
    formula: '放松微圆，短促带过',
    example: { question: 'good 和 food 都有 oo，读音一样吗？', steps: ['good 读 /gʊd/，短音。', 'food 读 /fuːd/，长音。'], answer: '不一样：/ʊ/ 对 /uː/——oo 是个「花心」组合，常见词要单独记。' },
    misconception: { wrong: '把 book 读成「布克」长音。', right: '/ʊ/ 短促放松：book /bʊk/，一拍就收。' },
    quiz: { question: 'look、good、spoon 里，哪一个的 oo 读长音 /uː/？', options: ['look', 'good', 'spoon'], answer: 2, explanation: 'look、good 的 oo 读短音 /ʊ/；spoon 的 oo 读长音 /uː/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph4-1', title: '双元音 /eɪ/ 与 /aɪ/',
    definition: '双元音要滑动：/eɪ/ 从「诶」滑向「衣」，/aɪ/ 从「阿」滑向「衣」，前长后短，像滑梯一滑到底。',
    essentials: [
      '/eɪ/ 常见拼写：a_e（name, cake）、ai（rain, paint）、ay（day, play）。',
      '/aɪ/ 常见拼写：i_e（like, kite）、igh（light, night）、y（my, fly）。',
      '滑向的「衣」要轻要短，重心在前一个音上。',
      '常见词：name, cake, day；like, five, my, night。',
    ],
    comparison: { headers: ['音标', '滑动路径', '例词'], rows: [['/eɪ/', '诶 → 衣', 'name /neɪm/, day /deɪ/'], ['/aɪ/', '阿 → 衣', 'like /laɪk/, night /naɪt/']] },
    formula: '前音重、后音轻，一拍滑到底',
    example: { question: 'cake 和 back 都有 a，读音差在哪？', steps: ['cake 是开音节（a_e），a 读 /eɪ/。', 'back 是闭音节，a 读 /æ/。'], answer: '/eɪ/ 对 /æ/：结尾的哑音 e 让元音「升级」。' },
    misconception: { wrong: '把 like 读成「利克」没有滑动。', right: '/aɪ/ 要滑起来：like /laɪk/，从大嘴阿滑到小衣。' },
    quiz: { question: 'name、day、hat 里，哪两个的 a 都读 /eɪ/？', options: ['name 和 day', 'name 和 hat', 'day 和 hat'], answer: 0, explanation: 'name 的 a_e 和 day 的 ay 都读 /eɪ/；hat 的 a 读 /æ/。' },
    sources: [{ label: 'British Council：发音练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'ph4-2', title: '双元音 /ɔɪ/ 与 /aʊ/',
    definition: '/ɔɪ/ 从「奥」滑向「衣」（男孩的oi）；/aʊ/ 从「阿」滑向「乌」（惊叹的 ow）。',
    essentials: [
      '/ɔɪ/ 常见拼写：oi（coin, oil）、oy（boy, toy, enjoy）。',
      '/aʊ/ 常见拼写：ou（house, mouth）、ow（cow, down, flower）。',
      '两个音都滑得明显，发音时口型从圆到扁或从开到圆。',
      '常见词：boy, toy, coin；cow, house, down。',
    ],
    comparison: { headers: ['音标', '滑动路径', '例词'], rows: [['/ɔɪ/', '奥 → 衣', 'boy /bɔɪ/, coin /kɔɪn/'], ['/aʊ/', '阿 → 乌', 'cow /kaʊ/, house /haʊs/']] },
    formula: '滑要明显，一拍完成',
    example: { question: 'how 和 hot 开头都是 h 加 o，读音差在哪？', steps: ['how 的 ow 读 /aʊ/，滑动。', 'hot 的 o 读 /ɒ/，短促。'], answer: '/aʊ/ 对 /ɒ/：how 一拍滑两个音，hot 只有一个短音。' },
    misconception: { wrong: '把 house 读成「好斯」。', right: '/aʊ/ 要滑动：house /haʊs/，从大阿滑到圆乌。' },
    quiz: { question: 'boy、book、know 里，哪一个含双元音 /ɔɪ/？', options: ['boy', 'book', 'know'], answer: 0, explanation: 'boy 的 oy 读 /ɔɪ/；book 的 oo 读短音 /ʊ/；know 的 ow 读 /əʊ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph4-3', title: '双元音 /əʊ/ 与 /ɪə/',
    definition: '/əʊ/ 从「鹅」滑向「乌」（O 的读音）；/ɪə/ 从「衣」滑向「厄」（ear 的音）。',
    essentials: [
      '/əʊ/ 常见拼写：o_e（nose, home）、oa（boat, coat）、ow（know, window）。',
      '/ɪə/ 常见拼写：ear（ear, hear）、eer（deer, cheer）。',
      '/əʊ/ 是英式读法；美式读作 /oʊ/，意思一样。',
      '常见词：nose, boat, snow；ear, deer, near, year。',
    ],
    comparison: { headers: ['音标', '滑动路径', '例词'], rows: [['/əʊ/', '鹅 → 乌', 'nose /nəʊz/, boat /bəʊt/'], ['/ɪə/', '衣 → 厄', 'ear /ɪə/, deer /dɪə/']] },
    formula: '中间路最稳：鹅到乌，衣到厄',
    example: { question: 'no 和 now 只差一个字母，读音差在哪？', steps: ['no 读 /nəʊ/。', 'now 读 /naʊ/。'], answer: '/əʊ/ 对 /aʊ/：起点不同，no 从鹅起滑，now 从阿起滑。' },
    misconception: { wrong: '把 boat 读成「伯特」不滑动。', right: '/əʊ/ 要滑：boat /bəʊt/，从鹅滑到乌。' },
    quiz: { question: 'nose、boat、dog 里，哪一个的 o 不读 /əʊ/？', options: ['nose', 'boat', 'dog'], answer: 2, explanation: 'nose、boat 都读双元音 /əʊ/；dog 读短音 /ɒ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph4-4', title: '双元音 /eə/ 与 /ʊə/',
    definition: '/eə/ 从「诶」滑向「厄」（air 的音）；/ʊə/ 从「乌」滑向「厄」（oor 的音）。两个都以弱化的 /ə/ 收尾。',
    essentials: [
      '/eə/ 常见拼写：air（hair, chair）、are（care, share）、ear（bear, pear）。',
      '/ʊə/ 常见拼写：oor（tour）、ure（sure, pure）。',
      '/eə/ 很常见；/ʊə/ 出现较少，很多词英式读 /ʊə/、美式读 /ʊr/。',
      '常见词：chair, hair, bear, care；tour, sure。',
    ],
    comparison: { headers: ['音标', '滑动路径', '例词'], rows: [['/eə/', '诶 → 厄', 'chair /tʃeə/, bear /beə/'], ['/ʊə/', '乌 → 厄', 'tour /tʊə/, sure /ʃʊə/']] },
    formula: '滑向含糊的厄，轻轻收尾',
    example: { question: 'bear 和 beer 一字母之差，读音差在哪？', steps: ['bear 读 /beə/，eare 组合。', 'beer 读 /bɪə/，eer 组合。'], answer: '/eə/ 对 /ɪə/：起点一个在诶、一个在衣。' },
    misconception: { wrong: '把 chair 读成「柴尔」生硬两截。', right: '/eə/ 是滑动的双元音：chair /tʃeə/，一拍滑完。' },
    quiz: { question: 'hair、hear、four 里，哪一个含双元音 /eə/？', options: ['hair', 'hear', 'four'], answer: 0, explanation: 'hair 的 air 读 /eə/；hear 的 ear 读 /ɪə/；four 读 /ɔː/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  }
];
