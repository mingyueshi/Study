/* 英语语法正文：第一至第四章（词法基础），15个知识点。 */
'use strict';

window.GRAMMAR_LESSONS_WORDS = [
  {
    id: 'gr1-1', title: '什么是语法',
    definition: '语法是把单词组成正确句子的规则。就像搭积木有拼法，说话写句子也要按规则搭配，别人才能听懂。',
    essentials: [
      '英语的每个单词都有自己的岗位，最主要的岗位是名词、动词和形容词。',
      '英语句子开头要大写，句末要加句号（.）、问号（?）或感叹号（!）。',
      '单词的排列顺序很重要：I like dogs. 是对的，Dogs like I. 就不对了。',
      '学语法不是背术语，而是学会把单词放对位置，把句子说对、写对。',
    ],
    facts: [{ label: '句号', value: '英文句号是实心点（.），不是小圆圈。' }, { label: '大小写', value: '每句第一个字母大写；「我」永远写成大写 I。' }],
    example: { question: 'Dogs like I. 这句话哪里不对？', steps: ['like 是动词，动词后面的代词要用宾格。', 'I 是主格，只能放在动词前面当主语。'], answer: '要说 Dogs like me.——动词后面的「我」用 me。' },
    misconception: { wrong: '以为会说单词就够了，语法不重要。', right: '单词是砖头，语法是拼法；没有拼法，砖头堆不成房子。' },
    quiz: { question: '下面哪一句是正确的英语句子？', options: ['like dogs I.', 'I like dogs.', 'Dogs like I.'], answer: 1, explanation: '英语的基本顺序是主语在前、动词在后、宾语跟在动词后面：I like dogs.' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr1-2', title: '词性家族',
    definition: '词性就是单词在句子里的岗位。认识四大词性——名词、动词、形容词、副词，就能看懂句子是怎么搭起来的。',
    essentials: [
      '名词是人、事物或地点的名字：dog, teacher, Beijing, milk。',
      '动词表示动作或状态：run, eat, is, have。',
      '形容词描述人或事物的样子：big, red, happy。副词描述动作怎么做：quickly, very, well。',
      '同一个词可以有不同词性：作名词是水，water the flowers 里是浇水（动词）。',
    ],
    comparison: { headers: ['词性', '岗位', '例子'], rows: [['名词', '人或物的名字', 'dog, milk, Beijing'], ['动词', '动作或状态', 'run, eat, is'], ['形容词', '描述名词', 'big, red, happy'], ['副词', '描述动作', 'quickly, very, well']] },
    example: { question: 'The big dog runs quickly. 里哪些词是形容词和副词？', steps: ['big 放在名词 dog 前面，描述狗的样子，是形容词。', 'quickly 说明跑得怎么样，修饰动词 runs，是副词。'], answer: '形容词是 big，副词是 quickly。' },
    misconception: { wrong: '以为形容词和副词差不多。', right: '形容词描述名词（a big dog），副词多描述动作（run quickly）。' },
    quiz: { question: 'quickly 是什么词性？', options: ['形容词', '副词', '名词'], answer: 1, explanation: 'quickly 说明动作做得怎么样，修饰动词，是副词；形容词 quick 才用来描述名词。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr1-3', title: '句子的骨架',
    definition: '一个完整的英语句子至少要有「谁」和「怎么样或做什么」两部分：主语加动词。缺了骨架，单词排得再多也不是句子。',
    essentials: [
      '主语说明「谁」或「什么」，通常由名词或代词担任：I, Tom, the dog。',
      '谓语动词说明主语做什么或是什么：run, is, like。',
      'Birds fly. 只有两个单词，也是完整的句子；Runs fast. 不是句子，因为没有主语。',
      '陈述句的常见顺序是：主语 + 动词 + 其他成分。',
    ],
    formula: '主语 + 动词（+ 其他成分）',
    example: { question: 'She is my teacher. 谁是主语、谁是动词？', steps: ['先找「谁」——She。', '再找动词——is（是）；my teacher 说明她是什么。'], answer: 'She 是主语，is 是动词。' },
    misconception: { wrong: '以为单词多才算句子。', right: '主语和动词齐全就是完整的句子：Birds fly. 只有两个词。' },
    quiz: { question: '下面哪个是完整的句子？', options: ['Under the tree.', 'Birds fly.', 'Very fast.'], answer: 1, explanation: 'Birds fly. 有主语 Birds 和动词 fly；另外两组没有主语加动词的完整骨架。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr1-4', title: '四种句子语气',
    definition: '按用途分，句子有四种：陈述句讲事情，疑问句提问题，祈使句下指令，感叹句抒发感情。',
    essentials: [
      '陈述句说明一个事实或想法：I like English.',
      '疑问句用来提问，句末用问号：Do you like English?',
      '祈使句表示请求或命令，通常省略主语 you，动词开头：Open the door, please.',
      '感叹句表达强烈感情，句末用感叹号：What a nice day!',
    ],
    comparison: { headers: ['句型', '用途', '例子'], rows: [['陈述句', '讲事情', 'I like English.'], ['疑问句', '提问题', 'Do you like English?'], ['祈使句', '请求或命令', 'Open the door, please.'], ['感叹句', '抒发感情', 'What a nice day!']] },
    example: { question: 'Open the window, please. 是哪种句子的语气？', steps: ['句子以动词原形 Open 开头，省略了主语 you。', '句末有 please 表示客气。'], answer: '这是祈使句，礼貌地请求对方开窗。' },
    misconception: { wrong: '以为祈使句没主语就是错的。', right: '祈使句的习惯就是省略主语 you，直接用动词开头。' },
    quiz: { question: 'Sit down, please. 是哪一种句子？', options: ['疑问句', '祈使句', '感叹句'], answer: 1, explanation: '动词原形开头、表示请求或指令，是祈使句；please 让语气更客气。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr2-1', title: '可数与不可数',
    definition: '名词分两种：能一个一个数的叫可数名词（a dog, two dogs）；不能分开数的叫不可数名词（water, milk, rice）。',
    essentials: [
      '可数名词有单数和复数两种形式：an apple → two apples。',
      '不可数名词没有复数形式，也不能加 a/an：不能说 a water。',
      '问数量时，可数用 How many…?，不可数用 How much…?',
      '有些词可数不可数要看意思：hair 指全部头发时不可数，指一根头发时可以说 a hair。',
    ],
    comparison: { headers: ['类型', '特点', '例子'], rows: [['可数名词', '能数，有单复数', 'an egg, three eggs'], ['不可数名词', '不能数，无复数', 'water, rice, milk']] },
    example: { question: '想说「一杯水」，能说 a water 吗？', steps: ['water 不可数，不能直接加 a。', '要借容器来数：a glass of water（一杯水）、two cups of tea（两杯茶）。'], answer: '说 a glass of water。' },
    misconception: { wrong: '以为 bread、paper 可以说 a bread。', right: 'bread, paper 通常不可数，说 a piece of bread（一片面包）。' },
    quiz: { question: '下面哪个是不可数名词？', options: ['book', 'milk', 'egg'], answer: 1, explanation: 'milk 是液体，不能一个一个数；book 和 egg 都能数（two books, three eggs）。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr2-2', title: '复数的规则变化',
    definition: '大多数可数名词直接加 -s 变复数；以 s, x, ch, sh 结尾的加 -es；辅音字母加 y 结尾的，把 y 变 i 再加 -es。',
    essentials: [
      '一般情况加 -s：book → books, dog → dogs。',
      '以 s, x, ch, sh 结尾的加 -es：bus → buses, box → boxes, watch → watches。',
      '辅音字母加 y 结尾：把 y 变 i 加 -es：baby → babies, city → cities；元音字母加 y 直接加 s：boy → boys。',
      '部分以 f/fe 结尾的把 f/fe 变 v 加 -es：leaf → leaves, knife → knives。',
    ],
    comparison: { headers: ['规则', '变化', '例子'], rows: [['一般情况', '加 -s', 'book → books'], ['s/x/ch/sh 结尾', '加 -es', 'box → boxes'], ['辅音字母 + y', 'y 变 i 加 -es', 'baby → babies'], ['f/fe 结尾', '变 v 加 -es', 'knife → knives']] },
    example: { question: 'city 的复数怎么写？', steps: ['city 以辅音字母 t 加 y 结尾。', '把 y 变 i 再加 -es，得 cities。'], answer: 'cities。对照：boy 以元音加 y 结尾，直接加 s 变 boys。' },
    misconception: { wrong: '见到 y 结尾就只加 s。', right: '分清 y 前面是辅音还是元音：baby → babies，boy → boys。' },
    quiz: { question: 'watch 的复数是哪个？', options: ['watchs', 'watches', 'watchies'], answer: 1, explanation: 'watch 以 ch 结尾，要加 -es：watches。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr2-3', title: '不规则复数',
    definition: '有些名词变复数不按加 -s 的规则来，要整体换模样，这些要单独记住。',
    essentials: [
      '变中间元音：man → men, woman → women, foot → feet, tooth → teeth。',
      '词尾变化：child → children, mouse → mice。',
      '单复数同形：sheep → sheep, fish → fish, deer → deer。',
      '拿不准时查词典，词典会标注不规则形式。',
    ],
    comparison: { headers: ['单数', '复数', '类型'], rows: [['man', 'men', '变元音'], ['child', 'children', '词尾变化'], ['sheep', 'sheep', '单复数同形'], ['foot', 'feet', '变元音']] },
    example: { question: 'There are three ___ (child) in the park. 填什么？', steps: ['child 的复数是不规则的 children，不是 childs。', '句中有 three，说明要用复数。'], answer: 'children。' },
    misconception: { wrong: '以为所有名词加 s 就是复数。', right: 'man、child、sheep 这类要单独记：men, children, sheep。' },
    quiz: { question: 'sheep 的复数形式是？', options: ['sheeps', 'sheep', 'sheepes'], answer: 1, explanation: 'sheep 单复数同形：one sheep, ten sheep，不加 s。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr2-4', title: '名词所有格',
    definition: "表示「某人的东西」，在人名或人称后面加 's：Tom's bag（汤姆的书包）。这就是名词所有格。",
    essentials: [
      "单数名词加 's：the dog's tail（狗的尾巴）。",
      "以 s 结尾的复数名词只加 '：the students' books（同学们的书）。",
      "不以 s 结尾的复数名词仍加 's：children's games（孩子们的游戏）。",
      "'s 表示「……的」，回答 Whose…?（谁的）这类问题。",
    ],
    facts: [{ label: '单数', value: "Tom → Tom's" }, { label: '复数以 s 结尾', value: "students → students'" }, { label: '复数不以 s 结尾', value: "children → children's" }],
    example: { question: '「我妈妈的手机」怎么说？', steps: ["「……的」用所有格：mother 加 's。", "再接名词 phone。"], answer: "my mother's phone" },
    misconception: { wrong: '以为所有格加在物品上。', right: "所有格加在「主人」身上：the dog's tail，不是 the tail's dog。" },
    quiz: { question: '「孩子们的老师」怎么说？', options: ['the childrens teacher', "the children's teacher", 'the children teacher'], answer: 1, explanation: "children 是不以 s 结尾的复数，要加 's：the children's teacher。" },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr3-1', title: 'a 和 an',
    definition: 'a 和 an 都表示「一个」，用在单数可数名词前。元音音素开头的词用 an，辅音音素开头的词用 a。',
    essentials: [
      '看读音不看字母：an apple, an egg, an hour（h 不发音）；a book, a dog, a university（u 读 /j/）。',
      'a/an 只用于单数可数名词：a cat 可以，two cats 不能用 a。',
      '第一次提到的单数事物用 a/an：I see a bird.',
      'an 用在元音音素前；a 用在辅音音素前。',
    ],
    facts: [{ label: 'an 的例子', value: 'an apple, an orange, an hour' }, { label: 'a 的例子', value: 'a book, a cat, a university' }],
    example: { question: '___ useful book 填 a 还是 an？', steps: ['useful 虽以元音字母 u 开头，但读音以辅音音素 /j/ 开头。', '看读音不看字母。'], answer: 'a useful book' },
    misconception: { wrong: '以为元音字母开头就一定用 an。', right: '要看读音：an hour（h 不发音），但 a university（u 读 /j/）。' },
    quiz: { question: '___ honest boy 填什么？', options: ['a', 'an', 'the'], answer: 1, explanation: 'honest 的 h 不发音，读音以元音音素开头，用 an。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr3-2', title: 'the 的用法',
    definition: 'the 表示「这个、那个」，特指说话双方都知道的人或事物，或第二次提到的事物。',
    essentials: [
      '第二次提到用 the：I see a bird. The bird is blue.',
      '双方都知道的用 the：Close the window, please.（就是房间里那扇窗）',
      '世界上独一无二的事物用 the：the sun, the moon, the earth。',
      '乐器前用 the：play the piano；球类前不用：play football。',
    ],
    facts: [{ label: '特指', value: 'the bird on the tree（树上那只鸟）' }, { label: '独一无二', value: 'the sun, the moon' }],
    example: { question: 'I have a cat. ___ cat is white. 第二空填什么？', steps: ['第一句先提到 a cat。', '第二句特指「这只猫」。'], answer: 'The' },
    misconception: { wrong: '以为 the 和 a 随便换着用。', right: 'a/an 表泛指「某一个」，the 表特指「就是那个」。' },
    quiz: { question: '___ sun is bright today. 填什么？', options: ['A', 'An', 'The'], answer: 2, explanation: '太阳是世界上独一无二的事物，要用 The。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr3-3', title: '什么时候不用冠词',
    definition: '有些场合不需要任何冠词（零冠词）：球类运动、三餐、节日、人名地名等。',
    essentials: [
      '球类运动前不加：play basketball, play football。',
      '三餐前不加：have breakfast / lunch / dinner。',
      "节日、月份、星期前不加：on Children's Day, in May, on Monday。",
      '人名、地名前不加：Lily lives in Beijing.（江河等有特例：the Changjiang River）',
    ],
    facts: [{ label: '球类', value: 'play football（不加 the）' }, { label: '三餐', value: 'after dinner' }, { label: '节日月份', value: "on New Year's Day, in June" }],
    example: { question: 'We play ___ football after ___ dinner. 两空填什么？', steps: ['球类运动前不用冠词。', '三餐前也不用冠词。'], answer: '都不填（零冠词）：play football, after dinner' },
    misconception: { wrong: '以为每个名词前都要有冠词。', right: '球类、三餐、节日、人名地名前不加冠词。' },
    quiz: { question: '下面哪句完全正确？', options: ['I play the football.', 'I have the lunch at school.', 'I play basketball after school.'], answer: 2, explanation: '球类前不加 the，三餐前不加 the；第三句没有任何冠词，正确。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr4-1', title: '人称代词：主格与宾格',
    definition: '人称代词用来指人或物。作主语用主格（I, you, he, she, it, we, they），作宾语用宾格（me, you, him, her, it, us, them）。',
    essentials: [
      '主格放在动词前面做主语：I like music. She is kind.',
      '宾格放在动词或介词后面：The dog follows me. Look at her.',
      'you 的主格宾格同形；it 的主格宾格也同形。',
      '介词后面一定用宾格：with him, for us, between you and me。',
    ],
    comparison: { headers: ['人称', '主格', '宾格'], rows: [['我', 'I', 'me'], ['你、你们', 'you', 'you'], ['他', 'he', 'him'], ['她', 'she', 'her'], ['它', 'it', 'it'], ['我们', 'we', 'us'], ['他、她、它们', 'they', 'them']] },
    example: { question: 'The teacher helps ___ (I/me) with maths. 填哪个？', steps: ['helps 是动词。', '动词后面的代词用宾格。'], answer: 'me：The teacher helps me.' },
    misconception: { wrong: '以为动词后面也用主格。', right: '动词和介词后面用宾格：help me, with him, for us。' },
    quiz: { question: 'Please pass ___ the book.（把书递给我）填什么？', options: ['I', 'me', 'my'], answer: 1, explanation: 'pass 是动词，「我」是动作的接受者，用宾格 me。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr4-2', title: '形容词性物主代词',
    definition: '表示「某人的」，要放在名词前面：my book, your pen, his dog, her cat, our school, their house。',
    essentials: [
      '常用的一组：my（我的）, your, his, her, its, our, their。',
      '形容词性物主代词后面必须跟名词，不能单独用：说 my book 可以，单独说要用 mine。',
      'his 和 its 的两种形式同形。',
      "its（它的）没有撇号；it's 是 it is 的缩写，这一对最容易混。",
    ],
    comparison: { headers: ['主格', '物主代词', '例句'], rows: [['I', 'my', 'my bag'], ['you', 'your', 'your pen'], ['he', 'his', 'his dog'], ['she', 'her', 'her cat'], ['we', 'our', 'our school'], ['they', 'their', 'their house']] },
    example: { question: 'This is ___ (she) bike. 填什么？', steps: ['修饰名词 bike，要用物主代词。', 'she 是主格，不能修饰名词。'], answer: 'her：This is her bike.' },
    misconception: { wrong: "把 it's 当成「它的」。", right: '「它的」是 its，没有撇号；带撇号的是缩写，等于 it is。' },
    quiz: { question: '___ school is near my home.（他们的学校）填什么？', options: ['They', 'Them', 'Their'], answer: 2, explanation: '修饰名词 school 要用形容词性物主代词 Their；They 是主格，Them 是宾格。' },
    sources: [{ label: '剑桥词典', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'gr4-3', title: '指示代词',
    definition: 'this（这个）、that（那个）、these（这些）、those（那些）用来指着说话：近处单数用 this，远处单数用 that；近处复数用 these，远处复数用 those。',
    essentials: [
      'this/these 指近处的，that/those 指远处的。',
      'this 和 that 配单数名词：this apple, that tree。',
      'these 和 those 配复数名词：these apples, those trees。',
      '回答 What is this/that? 时用 It is…，不用重复 This is…。',
    ],
    comparison: { headers: ['距离', '单数', '复数'], rows: [['近处', 'this（这个）', 'these（这些）'], ['远处', 'that（那个）', 'those（那些）']] },
    example: { question: '___ are my books.（这些）填什么？', steps: ['books 是复数、在近处。', 'this 配单数，that/those 指远处。'], answer: 'These' },
    misconception: { wrong: '以为 this 也能接复数。', right: 'this/that 只配单数；复数要用 these/those。' },
    quiz: { question: '___ birds over there are singing.（那边那些）填什么？', options: ['These', 'Those', 'This'], answer: 1, explanation: 'over there 说明在远处，birds 是复数，用 Those。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  },
  {
    id: 'gr4-4', title: '疑问词家族',
    definition: '疑问词用来开头提问：what 问事物，who 问人，where 问地点，when 问时间，how 问方式。',
    essentials: [
      'what 问事物或动作：What is this? What do you like?',
      'who 问人：Who is your best friend?',
      'where 问地点：Where do you live? when 问时间：When do you get up?',
      'how 问方式或状况：How do you go to school? How are you?',
    ],
    comparison: { headers: ['疑问词', '问什么', '例句'], rows: [['what', '事物', 'What is this?'], ['who', '人', 'Who is he?'], ['where', '地点', 'Where is my bag?'], ['when', '时间', 'When is your birthday?'], ['how', '方式、状况', 'How do you go to school?']] },
    example: { question: '___ is my schoolbag? — On the desk. 填什么？', steps: ['回答是地点（在书桌上）。', '问的是地点，用 Where 开头。'], answer: 'Where' },
    misconception: { wrong: 'what 和 who 混用。', right: '问人用 Who，问事物用 What：Who is she? What is it?' },
    quiz: { question: '___ do you come to school? — By bus. 填什么？', options: ['What', 'Where', 'How'], answer: 2, explanation: '回答 By bus 是交通方式，用 How 提问。' },
    sources: [{ label: 'British Council：语法练习', url: 'https://learnenglishkids.britishcouncil.org/grammar-practice' }]
  }
];
