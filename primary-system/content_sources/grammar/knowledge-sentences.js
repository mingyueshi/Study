/* 英语语法正文：第五至第八章（动词、时态与句型），16个知识点。 */
'use strict';

window.GRAMMAR_LESSONS_SENTENCES = [
  {
    id: 'gr5-1', title: 'am is are 怎么选',
    definition: 'be 动词有三个现在式：I 用 am，you 和复数用 are，he/she/it 等第三人称单数用 is。',
    essentials: [
      'I am…；You are…；He/She/It is…；We/You/They are…。',
      '单个人或物（第三人称单数）用 is：Tom is tall. The cat is small.',
      '两个人以上用 are：They are my friends. The dogs are cute.',
      'be 动词的意思是「是」，也表示状态，句子缺「是」时常用它补位。',
    ],
    comparison: { headers: ['主语', 'be 动词', '例句'], rows: [['I', 'am', 'I am nine.'], ['he/she/it', 'is', 'She is kind.'], ['you/we/they', 'are', 'They are friends.']] },
    formula: 'I + am；He/She/It + is；You/We/They + are',
    example: { question: 'Tom and I ___ good friends. 填 is 还是 are？', steps: ['Tom and I 是两个人，相当于 we。', '复数主语用 are。'], answer: 'are：Tom and I are good friends.' },
    misconception: { wrong: '以为 He 和 They 都用 is。', right: '看主语的人数：单数第三人称用 is，复数用 are。' },
    quiz: { question: 'The apples ___ red. 填什么？', options: ['is', 'am', 'are'], answer: 2, explanation: 'apples 是复数，be 动词用 are。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr5-2', title: 'was 和 were',
    definition: 'be 动词的过去式只有两个：am/is 的过去式是 was，are 的过去式是 were。讲过去的事就用它们。',
    essentials: [
      'I/He/She/It 用 was：I was late yesterday. It was sunny.',
      'You/We/They 用 were：They were at home last night.',
      'was/were 表示过去的状态；过去发生的事常用 yesterday, last week, two days ago 提示。',
      '过去做的动作要用动词过去式（见第六章），was/were 负责的是「是」和状态。',
    ],
    comparison: { headers: ['主语', '现在', '过去'], rows: [['I', 'am', 'was'], ['he/she/it', 'is', 'was'], ['you/we/they', 'are', 'were']] },
    example: { question: 'They ___ at the zoo last Sunday. 填什么？', steps: ['They 是复数主语。', 'last Sunday 提示过去。'], answer: 'were：They were at the zoo last Sunday.' },
    misconception: { wrong: '以为过去式只有一个 was。', right: 'was 配 I 和单数主语，were 配 you 和复数主语。' },
    quiz: { question: 'I ___ at school yesterday. 填什么？', options: ['am', 'was', 'were'], answer: 1, explanation: 'I 配 was；yesterday 提示要用过去式。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr5-3', title: 'there be 句型',
    definition: '表达「某地有某物」用 there be：There is a book on the desk.（书桌上有一本书）',
    essentials: [
      '单数名词或不可数名词用 There is，复数名词用 There are。',
      '就近原则：be 动词和紧挨着它的名词保持一致。There is a pen and two books.',
      '否定在 be 后加 not：There is not any milk.（缩写形式见下一课）',
      '不要和 have/has 混用：have 表示「某人拥有」，there be 表示「某地存在」。',
    ],
    formula: 'There is + 单数名词或不可数名词；There are + 复数名词',
    example: { question: 'There ___ some water in the bottle. 填什么？', steps: ['water 是不可数名词。', 'there be 句型里不可数名词配 is。'], answer: 'is：There is some water in the bottle.' },
    misconception: { wrong: '以为句子里有复数就一律用 are。', right: 'there be 用就近原则：离 be 最近的名词决定用 is 还是 are。' },
    quiz: { question: 'There ___ a tree and some flowers in the garden. 填什么？', options: ['is', 'are', 'am'], answer: 0, explanation: '就近原则：a tree 是单数，用 is。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr5-4', title: 'be 动词的缩写与否定',
    definition: "be 动词可以和前面的词缩写：I am 变 I'm，is not 变 isn't。否定句就是在 be 后面加 not。",
    essentials: [
      "常见缩写：I'm, you're, he's, she's, it's, we're, they're。",
      "否定：is not 缩写为 isn't，are not 缩写为 aren't；am not 不缩写成 amn't。",
      "缩写里的撇号代表省略的字母：she's = she is。",
      "its（它的）和 it's（它是）不同：撇号是关键。",
    ],
    comparison: { headers: ['完整形式', '缩写', '中文'], rows: [['I am', "I'm", '我是'], ['is not', "isn't", '不是'], ['are not', "aren't", '不是'], ['it is', "it's", '它是']] },
    example: { question: 'She is not a doctor. 怎么缩写？', steps: ["is not 缩写成 isn't。", '把 not 并进去，意思不变。'], answer: "She isn't a doctor." },
    misconception: { wrong: "把 it's 写成 its 表示「它是」。", right: "it's 等于 it is；its 表示「它的」，没有撇号。" },
    quiz: { question: "They aren't in the classroom. 意思是？", options: ['他们在教室里。', '他们不在教室里。', '他们在教室吗？'], answer: 1, explanation: "aren't 等于 are not，是否定：他们不在教室里。" },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr6-1', title: '一般现在时与三单',
    definition: '一般现在时讲习惯、经常做的事和客观事实。主语是第三人称单数（he/she/it 或单个人）时，动词要加 -s 或 -es，简称三单。',
    essentials: [
      'I/You/We/They 用动词原形：They play football after school.',
      'He/She/It 或单个人：动词加 -s/-es：He plays football. She watches TV.',
      '三单变化和名词复数规则一样：go 变 goes, watch 变 watches, study 变 studies, have 变 has。',
      '常配时间词：always, usually, often, every day。',
    ],
    comparison: { headers: ['主语', '动词形式', '例句'], rows: [['I/You/We/They', '原形', 'They play tennis.'], ['He/She/It', '三单形式', 'He plays tennis.']] },
    formula: '主语（三单）+ 动词-s/-es + 其他',
    example: { question: 'Lily ___ (go) to school by bus every day. 填什么？', steps: ['Lily 是第三人称单数，every day 提示一般现在时。', 'go 以 o 结尾，加 -es。'], answer: 'goes：Lily goes to school by bus every day.' },
    misconception: { wrong: '以为 I like 和 He like 一样。', right: '主语是三单时动词要变形：He likes fish.' },
    quiz: { question: 'My father ___ TV in the evening. 填什么？', options: ['watch', 'watches', 'watching'], answer: 1, explanation: 'My father 是第三人称单数，watch 以 ch 结尾加 -es：watches。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr6-2', title: '现在进行时',
    definition: '表示「正在做某事」用现在进行时：be + 动词-ing。Look! Listen! 常是它的信号词。',
    essentials: [
      '结构：am/is/are + 动词-ing：I am reading. She is singing. They are playing.',
      '直接加 -ing：read 变 reading；去 e 加 -ing：make 变 making。',
      '重读闭音节双写末尾字母再加 -ing：run 变 running, swim 变 swimming, sit 变 sitting。',
      '常配提示词：now, look, listen。',
    ],
    comparison: { headers: ['变化规则', '例子'], rows: [['直接加 -ing', 'read → reading'], ['去 e 加 -ing', 'make → making'], ['双写末尾字母', 'run → running']] },
    formula: '主语 + am/is/are + 动词-ing（+ 其他）',
    example: { question: 'Look! The boy ___ (run) on the playground. 填什么？', steps: ['Look 提示动作正在进行。', 'The boy 是单数用 is；run 双写 n 加 -ing。'], answer: 'is running：Look! The boy is running on the playground.' },
    misconception: { wrong: '漏掉 be 动词，直接说 The boy running。', right: '现在进行时必须 be 和 -ing 一起用：is running。' },
    quiz: { question: 'Listen! She ___ (sing). 填什么？', options: ['is singing', 'sings', 'sing'], answer: 0, explanation: 'Listen 提示动作正在进行；She 配 is，sing 加 -ing。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr6-3', title: '一般过去时',
    definition: '讲过去发生的事用一般过去时：规则动词加 -ed，不规则动词要单独记，be 动词变 was/were。',
    essentials: [
      '规则动词加 -ed：play 变 played, watch 变 watched, live 变 lived。',
      '常见不规则：go 变 went, eat 变 ate, see 变 saw, do 变 did, have 变 had。',
      '否定和疑问用 did 帮忙，动词还原成原形：I did not go. Did you go?',
      '常配时间词：yesterday, last night, two days ago。',
    ],
    comparison: { headers: ['类型', '变化', '例子'], rows: [['规则动词', '加 -ed', 'play → played'], ['不规则动词', '单独记', 'go → went'], ['be 动词', '变 was/were', 'is → was']] },
    formula: '主语 + 动词过去式（+ 其他）',
    example: { question: 'We ___ (see) a film last night. 填什么？', steps: ['last night 提示过去。', 'see 是不规则动词，过去式是 saw。'], answer: 'saw：We saw a film last night.' },
    misconception: { wrong: 'Did you went…——用了 did 又用过去式。', right: 'did 后面的动词用原形：Did you go?' },
    quiz: { question: 'I ___ my homework yesterday evening. 填什么？', options: ['do', 'did', 'does'], answer: 1, explanation: 'yesterday evening 提示过去；do 的过去式是 did。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr6-4', title: '将来时间 going to 和 will',
    definition: '谈打算和将要发生的事，常用 be going to（计划打算）或 will（将要），后面都接动词原形。',
    essentials: [
      'be going to + 动词原形：I am going to visit my grandma tomorrow.',
      'will + 动词原形：It will rain tomorrow. I will help you.',
      'be going to 里的 be 要和主语一致：I am, he is, they are going to…',
      '常配时间词：tomorrow, next week, soon。',
    ],
    comparison: { headers: ['表达', '结构', '例句'], rows: [['打算', 'be going to + 原形', 'I am going to swim.'], ['将要', 'will + 原形', 'It will be sunny.']] },
    formula: '主语 + be going to / will + 动词原形',
    example: { question: 'She ___ (be) ten years old next month. 填什么？', steps: ['next month 提示将来。', 'will 后面接动词原形 be。'], answer: 'will be：She will be ten years old next month.' },
    misconception: { wrong: 'will 后面用过去式或三单。', right: 'will 和 be going to 后面都用动词原形：will go, going to play。' },
    quiz: { question: 'We ___ going to have a picnic. 填什么？', options: ['is', 'are', 'am'], answer: 1, explanation: 'We 配 are：be going to 里的 be 要和主语一致。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr7-1', title: '形容词怎么用',
    definition: '形容词描述人或事物的样子（大小、颜色、心情）。它放在名词前面，或放在 be 动词后面。',
    essentials: [
      '名词前：a red apple, a tall boy, an old house。',
      'be 动词后：The apple is red. The boy is tall.',
      '多个形容词排列有习惯顺序：先说大小再说颜色：a big red ball。',
      '形容词不变形：a red apple 和 two red apples 里 red 都不加 s。',
    ],
    example: { question: 'The sky is ___ (blue/red) today. 选哪个？', steps: ['天空是蓝色的。', '形容词放在 be 动词后面。'], answer: 'blue：The sky is blue today.' },
    misconception: { wrong: '以为形容词要和名词一样变复数。', right: '形容词永远不变形：two big dogs 里 big 不加 s。' },
    quiz: { question: '下面哪个语序正确？', options: ['a red big ball', 'a big red ball', 'a ball big red'], answer: 1, explanation: '多个形容词先说大小再说颜色：a big red ball。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr7-2', title: '比较级',
    definition: '两个人或事物比较，用比较级 + than。规则变化是加 -er 或 more。',
    essentials: [
      '单音节词一般加 -er：tall 变 taller, old 变 older, fast 变 faster。',
      '以 e 结尾只加 -r：nice 变 nicer；重读闭音节双写末尾字母：big 变 bigger, hot 变 hotter。',
      '辅音字母加 y 结尾：变 y 为 i 加 -er：happy 变 happier, easy 变 easier。',
      '多音节词在前面加 more：beautiful 变 more beautiful。',
    ],
    comparison: { headers: ['变化规则', '例子'], rows: [['一般加 -er', 'tall → taller'], ['以 e 结尾加 -r', 'nice → nicer'], ['双写末尾字母', 'big → bigger'], ['多音节加 more', 'beautiful → more beautiful']] },
    formula: 'A + be 动词 + 比较级 + than + B',
    example: { question: 'Tom is ___ (tall) than Jerry. 填什么？', steps: ['两个人比较用比较级。', 'tall 单音节直接加 -er，句中已有 than。'], answer: 'taller：Tom is taller than Jerry.' },
    misconception: { wrong: '比较级和 than 只用一个。', right: '比较级和 than 搭档出现：taller than。' },
    quiz: { question: 'An elephant is ___ than a horse. 填什么？', options: ['heavy', 'heavier', 'heaviest'], answer: 1, explanation: '两者比较用比较级：heavy 变 y 为 i 加 -er 得 heavier。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr7-3', title: '最高级',
    definition: '三者或以上比较、说「最……」时用最高级：the + 形容词最高级。规则变化是加 -est 或 most。',
    essentials: [
      '一般加 -est：tall 变 the tallest；以 e 结尾加 -st：nice 变 the nicest。',
      '双写型：big 变 the biggest, hot 变 the hottest。',
      '多音节词加 the most：the most beautiful。',
      '最高级前面通常要加 the：He is the tallest in our class.',
    ],
    comparison: { headers: ['变化规则', '例子'], rows: [['一般加 -est', 'tall → the tallest'], ['以 e 结尾加 -st', 'nice → the nicest'], ['双写末尾字母', 'big → the biggest'], ['多音节加 the most', 'the most beautiful']] },
    formula: 'the + 形容词最高级（+ 比较范围 in/of…）',
    example: { question: 'Spring is ___ (good) season for picnics. 填什么？', steps: ['多个季节相比用最高级。', 'good 是不规则变化：good → better → best，最高级前加 the。'], answer: 'the best：Spring is the best season for picnics.' },
    misconception: { wrong: '最高级前面不加 the。', right: '最高级前一般加 the：the tallest, the best。' },
    quiz: { question: 'The Changjiang River is ___ river in China.（最长）填什么？', options: ['longer', 'the longest', 'long'], answer: 1, explanation: '全中国的河流相比，三者以上用最高级：the longest。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr7-4', title: '常见不规则变化',
    definition: 'good、bad、many 等常用词的比较级最高级不规则，要单独记住。',
    essentials: [
      'good/well → better → best（好 → 更好 → 最好）。',
      'bad/badly → worse → worst（坏 → 更坏 → 最坏）。',
      'many/much → more → most（多 → 更多 → 最多）；little → less → least。',
      'far → farther → farthest（远 → 更远 → 最远）。',
    ],
    comparison: { headers: ['原级', '比较级', '最高级'], rows: [['good/well', 'better', 'best'], ['bad/badly', 'worse', 'worst'], ['many/much', 'more', 'most'], ['little', 'less', 'least']] },
    example: { question: 'My cake is ___ (good) than yours. 填什么？', steps: ['than 提示比较级。', 'good 的比较级是 better，不是 gooder。'], answer: 'better：My cake is better than yours.' },
    misconception: { wrong: '按规则给 good 加 -er。', right: 'good → better → best，是最常用的不规则变化。' },
    quiz: { question: 'Her marks are ___ than mine.（更差）填什么？', options: ['worse', 'worst', 'bader'], answer: 0, explanation: 'bad 的比较级是 worse（更差）；worst 是最高级，两者比较用比较级。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr8-1', title: '肯定句变否定句',
    definition: '句子里有 be 动词，就在它后面加 not；只有实义动词时，请助动词 do/does/did 帮忙加 not，动词还原成原形。',
    essentials: [
      '有 be 动词：She is happy. 变 She is not happy.',
      "一般现在时主语三单用 doesn't + 动词原形：He likes fish. 变 He doesn't like fish.",
      "主语非三单用 don't：They play chess. 变 They don't play chess.",
      "过去时用 didn't + 动词原形：I went home. 变 I didn't go home.",
    ],
    comparison: { headers: ['句子类型', '加什么', '例子'], rows: [['有 be 动词', 'be + not', 'It is not mine.'], ['一般现在时非三单', "don't + 原形", "They don't play chess."], ['一般现在时三单', "doesn't + 原形", "He doesn't like fish."], ['一般过去时', "didn't + 原形", "I didn't go home."]] },
    formula: "主语 + don't/doesn't/didn't + 动词原形",
    example: { question: 'She watches TV every day. 变否定句。', steps: ['watches 是三单形式。', "变否定句用 doesn't，watches 还原成 watch。"], answer: "She doesn't watch TV every day." },
    misconception: { wrong: "He doesn't likes fish.——doesn't 后面还留着三单。", right: "doesn't 后面动词用原形：He doesn't like fish." },
    quiz: { question: 'Tom did his homework last night. 变否定句：Tom ___ his homework last night.', options: ["didn't did", "didn't do", "doesn't do"], answer: 1, explanation: "过去时否定用 didn't，动词 did 还原成原形 do。" },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr8-2', title: '一般疑问句',
    definition: '能用 Yes/No 回答的问题叫一般疑问句。有 be 动词就把 be 提前；只有实义动词就把 Do/Does/Did 提到句首，动词用原形。',
    essentials: [
      '有 be 动词：Is he your brother? Are they at home?',
      "一般现在时：Do you like cats? 三单用 Does：Does she swim well?（swim 用原形）",
      '过去时用 Did：Did you finish it?',
      '回答要呼应问句：Yes, I do. No, she does not. Yes, they are.',
    ],
    formula: 'Be/Do/Does/Did + 主语 + 动词原形（+ 其他）?',
    example: { question: 'She likes music. 变一般疑问句。', steps: ['likes 是三单形式。', '把 Does 放句首，likes 还原成 like，句末用问号。'], answer: 'Does she like music?' },
    misconception: { wrong: 'Does she likes…——Does 和三单重复了。', right: 'Does 已经承担了三单标记，动词用原形：Does she like…?' },
    quiz: { question: '___ they play football every day? 填什么？', options: ['Does', 'Do', 'Are'], answer: 1, explanation: 'they 是复数、一般现在时，助动词用 Do，play 保持原形。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr8-3', title: '特殊疑问句',
    definition: '用疑问词开头的问句叫特殊疑问句，不能用 Yes/No 回答，要给出具体信息。',
    essentials: [
      '结构：疑问词 + 一般疑问句语序：Where do you live? What does she want?',
      '问主语时用陈述语序：Who sings best?（谁唱得最好）',
      '常用疑问词：what, who, where, when, why, how, whose。',
      '回答要针对疑问词：问 where 答地点，问 when 答时间。',
    ],
    formula: '疑问词 + 一般疑问句（+ 其他）?',
    example: { question: 'They go to school by bike. 就 by bike（方式）提问。', steps: ['by bike 是交通方式，用 How 提问。', '后面按一般疑问句语序：do they go…'], answer: 'How do they go to school?' },
    misconception: { wrong: '特殊疑问句也用 Yes/No 回答。', right: '特殊疑问句要给出具体信息：问地点答地点，问时间答时间。' },
    quiz: { question: '___ does the library open? — At eight. 填什么？', options: ['Where', 'When', 'Who'], answer: 1, explanation: '回答 At eight 是时间，用 When 提问。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr8-4', title: '祈使句和感叹句',
    definition: '祈使句用动词原形开头，表示请求、命令或建议；感叹句用 What 或 How 开头，表达强烈感情，句末用感叹号。',
    essentials: [
      "祈使句省略主语 you：Stand up. Please be quiet. 否定用 Don't：Don't run in the hallways.",
      'What + a/an + 形容词 + 名词：What a lovely day! What beautiful flowers!（复数不加 a）',
      'How + 形容词或副词：How clever you are! How fast he runs!',
      '两种感叹句常可以互换：What a lovely day! 意思接近 How lovely the day is!',
    ],
    comparison: { headers: ['句型', '结构', '例句'], rows: [['祈使句', '动词原形开头', 'Please sit down.'], ['否定祈使句', "Don't + 原形", "Don't be late."], ['What 感叹句', 'What + a/an + 形容词 + 名词', 'What a nice gift!'], ['How 感叹句', 'How + 形容词', 'How nice it is!']] },
    example: { question: '把 How cold the water is! 换成 What 开头的感叹句。', steps: ['water 是不可数名词，What 后面不加 a。', '结构：What + 形容词 + 名词 + 主谓。'], answer: 'What cold water it is!' },
    misconception: { wrong: "Don't 后面接三单或过去式。", right: "Don't 后面用动词原形：Don't run. Don't be late." },
    quiz: { question: '下面哪句是感叹句？', options: ['What a big apple!', 'Sit down, please.', 'Is it big?'], answer: 0, explanation: 'What + a + 形容词 + 名词构成感叹句；B 是祈使句，C 是疑问句。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  }
];
