/* 英语音标正文：第五至第八章（辅音），15个知识点，覆盖 28 个辅音。 */
'use strict';

window.PHONETICS_LESSONS_CONSONANTS = [
  {
    id: 'ph5-1', title: '爆破音 /p/ 与 /b/',
    definition: '/p/ 和 /b/ 都是双唇爆破音：双唇先闭紧、憋住气流，再突然弹开。/p/ 声带不振动（清），/b/ 声带振动（浊）。',
    essentials: [
      '/p/ 常见拼写：p（pen, pig, map）。',
      '/b/ 常见拼写：b（big, book, cab）。',
      '摸着喉咙对比：发 /p/ 喉咙安静，发 /b/ 喉咙嗡嗡振动。',
      '词尾的 /p/ 不要额外加「呃」音：map 读 /mæp/ 收干净，不读「Mapu」。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/p/', '清（不振）', 'pen /pen/, pig /pɪg/, map /mæp/'], ['/b/', '浊（振动）', 'big /bɪg/, book /bʊk/, cab /kæb/']] },
    formula: '双唇憋气再弹开：清 /p/ 不振，浊 /b/ 振动',
    example: { question: 'pig 和 big 只差一个字母，怎么读才能分清？', steps: ['两个音口型完全相同。', 'pig 的 /p/ 声带不振、送气强；big 的 /b/ 一出声就振动。'], answer: '摸喉咙练：/p/ 安静、/b/ 发麻，一词之差就在这里。' },
    misconception: { wrong: '把 map 读成「Mapu」多出一个音。', right: '英语词尾爆破音干净收住：map /mæp/，不添 /ə/。' },
    quiz: { question: 'pen、big、bag 里，哪两个的开头辅音都是浊音 /b/？', options: ['pen 和 big', 'big 和 bag', 'pen 和 bag'], answer: 1, explanation: 'big、bag 都以浊辅音 /b/ 开头；pen 以清辅音 /p/ 开头。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  },
  {
    id: 'ph5-2', title: '爆破音 /t/ 与 /d/',
    definition: '/t/ 和 /d/ 用舌尖抵住上齿龈憋气再弹开。/t/ 清、/d/ 浊，差别仍然只在声带。',
    essentials: [
      '/t/ 常见拼写：t（ten, two, cat）。',
      '/d/ 常见拼写：d（dog, door, bed）。',
      '舌尖抵上齿龈（上牙床),弹开时气流冲出。',
      '词尾同样收干净：cat /kæt/、bed /bed/，不加「呃」音。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/t/', '清（不振）', 'ten /ten/, two /tuː/, cat /kæt/'], ['/d/', '浊（振动）', 'dog /dɒg/, door /dɔː/, bed /bed/']] },
    formula: '舌尖抵上齿龈：清 /t/ 不振，浊 /d/ 振动',
    example: { question: 'town 和 down 起首音有什么区别？', steps: ['两个音舌位相同。', 'town 的 /t/ 清、送气；down 的 /d/ 浊、声带先振。'], answer: '清浊之别：/t/ 安静 /d/ 发麻，其余一样。' },
    misconception: { wrong: '把 cat 读成「卡特」加重尾音。', right: 'cat /kæt/ 的 /t/ 轻收，不要读成中文的「特」。' },
    quiz: { question: 'ten、dog、two 里，哪两个以清辅音 /t/ 开头？', options: ['ten 和 dog', 'ten 和 two', 'dog 和 two'], answer: 1, explanation: 'ten、two 都以清辅音 /t/ 开头；dog 以浊辅音 /d/ 开头。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph5-3', title: '爆破音 /k/ 与 /g/',
    definition: '/k/ 和 /g/ 由舌后部顶住软腭憋气再弹开。/k/ 清、/g/ 浊。',
    essentials: [
      '/k/ 常见拼写：k（key, book）、c 在 a/o/u 前（cat, come, cup）。',
      '/g/ 常见拼写：g（girl, go, big）。',
      '舌根顶住后部，突然放开，像轻轻咳一下的位置。',
      'c 的读音要看后面的字母：cat 读 /k/，city 读 /s/。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/k/', '清（不振）', 'key /kiː/, cat /kæt/, book /bʊk/'], ['/g/', '浊（振动）', 'girl /gɜːl/, go /gəʊ/, big /bɪg/']] },
    formula: '舌根顶住再弹开：清 /k/ 不振，浊 /g/ 振动',
    example: { question: 'cap 和 gap 起首音都是 g 的形状吗？', steps: ['两个音都是舌后爆破。', 'cap 的 c 读清音 /k/，gap 的 g 读浊音 /g/。'], answer: '不是：cap 清 /k/，gap 浊 /g/，声带振动与否是唯一区别。' },
    misconception: { wrong: '以为 c 一定读 /k/。', right: 'c 在 e/i/y 前常读 /s/（city, cell），在 a/o/u 前读 /k/（cat, cup）。' },
    quiz: { question: 'key、girl、cat 里，哪两个以清辅音 /k/ 开头？', options: ['key 和 girl', 'key 和 cat', 'girl 和 cat'], answer: 1, explanation: 'key 的 k 和 cat 的 c 都读清辅音 /k/；girl 是浊辅音 /g/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph6-1', title: '摩擦音 /f/ 与 /v/',
    definition: '/f/ 和 /v/ 是唇齿摩擦音：上齿轻咬下唇，气流从缝隙挤出。/f/ 清、/v/ 浊。',
    essentials: [
      '/f/ 常见拼写：f（fish, five）、ph（phone, photo）。',
      '/v/ 常见拼写：v（very, five, seven）。',
      '上齿搭在下唇上，气流摩擦而出，像轻轻吹气。',
      '/v/ 是中国学生的难点：要振动声带，别读成 /w/。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/f/', '清（不振）', 'fish /fɪʃ/, five /faɪv/, phone /fəʊn/'], ['/v/', '浊（振动）', 'very /verɪ/, van /væn/, seven /sevn/']] },
    formula: '上齿咬下唇：清 /f/ 吹气，浊 /v/ 加马达',
    example: { question: 'five 里同时有 /f/ 和 /v/ 吗？', steps: ['开头 f 读 /f/。', '结尾 ve 读 /v/。'], answer: '是：/faɪv/ 一个词里清浊两个唇齿音，正好对比练习。' },
    misconception: { wrong: '把 very 读成「wery」。', right: '/v/ 要上齿咬下唇并振动：very /verɪ/，不是圆唇的 /w/。' },
    quiz: { question: 'fish、very、phone 里，哪两个含清辅音 /f/？', options: ['fish 和 very', 'fish 和 phone', 'very 和 phone'], answer: 1, explanation: 'fish 的 f 和 phone 的 ph 都读清辅音 /f/；very 是浊辅音 /v/。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  },
  {
    id: 'ph6-2', title: '摩擦音 /s/ 与 /z/',
    definition: '/s/ 和 /z/ 是舌齿摩擦音：舌尖接近上齿龈，气流从窄缝挤出，像漏气的咝咝声。/s/ 清、/z/ 浊。',
    essentials: [
      '/s/ 常见拼写：s（sun, six）、c 在 e/i 前（city, circle）。',
      '/z/ 常见拼写：z（zoo, zero）、s 有时读 /z/（nose, rose, dogs）。',
      '摸喉咙对比：/s/ 安静，/z/ 振动。',
      '名词复数 -s 的读音跟着前面的音走：清音后读 /s/（cats），浊音后读 /z/（dogs）。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/s/', '清（不振）', 'sun /sʌn/, six /sɪks/, city /sɪtɪ/'], ['/z/', '浊（振动）', 'zoo /zuː/, nose /nəʊz/, dogs /dɒgz/']] },
    formula: '窄缝挤气：清 /s/ 咝咝，浊 /z/ 嗡嗡',
    example: { question: 'cats 和 dogs 的词尾 s 读音一样吗？', steps: ['cats 词尾前的 t 是清辅音。', 'dogs 词尾前的 g 是浊辅音，s 跟着读 /z/。'], answer: '不一样：cats /kæts/ 读 /s/，dogs /dɒgz/ 读 /z/——清随清、浊随浊。' },
    misconception: { wrong: '所有 s 都读「丝」。', right: 's 有时读 /z/：nose、rose、is 这些词里都是 /z/。' },
    quiz: { question: 'zoo、sun、nose 里，哪两个含浊辅音 /z/？', options: ['zoo 和 sun', 'zoo 和 nose', 'sun 和 nose'], answer: 1, explanation: 'zoo 的 z 和 nose 词尾的 s 都读浊辅音 /z/；sun 是清辅音 /s/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph6-3', title: '摩擦音 /ʃ/ 与 /ʒ/',
    definition: '/ʃ/ 和 /ʒ/ 是双唇略圆的摩擦音，比 /s/ 更靠后、更圆润。/ʃ/ 清（sh 的音），/ʒ/ 浊且少见。',
    essentials: [
      '/ʃ/ 常见拼写：sh（she, fish）、ti（nation）、ci（special）。',
      '/ʒ/ 出现在少数词：usually, television, measure。',
      '发音时双唇略向前突，舌面抬向硬腭。',
      '口诀：/ʃ/ 像「嘘」的安静版，/ʒ/ 给它加上声带。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/ʃ/', '清（不振）', 'she /ʃiː/, fish /fɪʃ/, ship /ʃɪp/'], ['/ʒ/', '浊（振动）', 'usually /juːʒʊəlɪ/, television /telɪvɪʒn/']] },
    formula: '圆唇嘘气：清 /ʃ/ 安静，浊 /ʒ/ 振动',
    example: { question: 'ship 和 sheep 起首都是 /ʃ/ 吗？', steps: ['两个词都以 /ʃ/ 开头。', '区别在元音：/ʃɪp/ 短音，/ʃiːp/ 长音。'], answer: '是：起首都是清辅音 /ʃ/，长短元音才是分界。' },
    misconception: { wrong: '把 she 读成「西」。', right: '/ʃ/ 双唇略圆、比 /s/ 靠后：she /ʃiː/，不是「西」。' },
    quiz: { question: 'she、fish、usually 里，哪一个含浊辅音 /ʒ/？', options: ['she', 'fish', 'usually'], answer: 2, explanation: 'usually 里的 s 读浊辅音 /ʒ/；she、fish 里是清辅音 /ʃ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph6-4', title: '摩擦音 /θ/ 与 /ð/',
    definition: '/θ/ 和 /ð/ 要把舌尖轻轻放在上下齿之间，气流从缝里挤出。/θ/ 清（think 的 th），/ð/ 浊（this 的 th）。',
    essentials: [
      '/θ/ 常见拼写：th（three, thank, teeth, month）。',
      '/ð/ 常见拼写：th 在冠词、代词里（this, that, the, mother, they）。',
      '舌尖伸出到上下齿之间也没关系，气流摩擦而出。',
      '这是中国学生最常读错的音：不能读成 /s/ 或 /z/。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/θ/', '清（不振）', 'three /θriː/, thank /θæŋk/, teeth /tiːθ/'], ['/ð/', '浊（振动）', 'this /ðɪs/, mother /mʌðə/, they /ðeɪ/']] },
    formula: '舌尖咬在齿间：清 /θ/ 吹气，浊 /ð/ 振动',
    example: { question: 'thank 和 sank 只差一个字母，读音差在哪？', steps: ['thank 的 th 读 /θ/，舌尖要伸出来。', 'sank 的 n 前 s 读 /s/，舌尖不伸。'], answer: '/θ/ 对 /s/：一个咬舌、一个不咬，混了意思就变。' },
    misconception: { wrong: '把 three 读成「斯瑞」。', right: '/θ/ 舌尖要伸出齿间：three /θriː/，敢伸舌头才读得对。' },
    quiz: { question: 'three、this、mother 里，哪一个以清辅音 /θ/ 开头？', options: ['three', 'this', 'mother'], answer: 0, explanation: 'three 以清辅音 /θ/ 开头；this 和 mother 里的 th 读浊辅音 /ð/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph6-5', title: '摩擦音 /h/ 与 /r/',
    definition: '/h/ 是轻呼气：像往玻璃上哈气，口型随后面的元音变。/r/ 舌尖卷起但不碰任何地方，气流滑过。',
    essentials: [
      '/h/ 常见拼写：h（hat, hand, house, behind）。',
      '/r/ 常见拼写：r（red, rabbit）、rr（carrot）。',
      '/r/ 的要点：舌尖朝上腭卷起、不接触，圆唇——redo 读「瑞」不是「勒」。',
      '/h/ 很轻，只在有元音时才听得见。',
    ],
    comparison: { headers: ['音标', '要领', '例词'], rows: [['/h/', '轻轻哈气', 'hat /hæt/, hand /hænd/, house /haʊs/'], ['/r/', '卷舌不碰、圆唇', 'red /red/, rabbit /ræbɪt/, read /riːd/']] },
    formula: '/h/ 哈气随元音，/r/ 卷舌不碰上腭',
    example: { question: 'right 和 light 起首音怎么区分？', steps: ['right 的 r 舌尖卷起不碰。', 'light 的 l 舌尖要抵上齿龈。'], answer: '/r/ 不碰、/l/ 要抵——卷不卷舌尖是分界。' },
    misconception: { wrong: '把 red 读成「勒德」。', right: '/r/ 舌尖悬空卷起：red /red/，不要碰到上腭读成 /l/。' },
    quiz: { question: 'hat、red、hand 里，哪两个以轻呼气 /h/ 开头？', options: ['hat 和 red', 'hat 和 hand', 'red 和 hand'], answer: 1, explanation: 'hat、hand 以 /h/ 开头；red 以卷舌音 /r/ 开头。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph7-1', title: '破擦音 /tʃ/ 与 /dʒ/',
    definition: '破擦音 = 爆破 + 摩擦连成一体。/tʃ/ 清（ch 的音），/dʒ/ 浊（j 的音）：先憋气再摩擦放出。',
    essentials: [
      '/tʃ/ 常见拼写：ch（chair, lunch）、tch（watch, match）。',
      '/dʒ/ 常见拼写：j（jam, jump）、g 在 e/i 前（giraffe, orange）。',
      '发音像 /t/ 加 /ʃ/ 的快速合并，一口气完成。',
      '/dʒ/ 要振动声带；句尾不要加「呃」音：orange 收在 /dʒ/。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/tʃ/', '清（不振）', 'chair /tʃeə/, lunch /lʌntʃ/, watch /wɒtʃ/'], ['/dʒ/', '浊（振动）', 'jam /dʒæm/, jump /dʒʌmp/, orange /ɒrɪndʒ/']] },
    formula: '憋气加摩擦一步到位：清 /tʃ/ 不振，浊 /dʒ/ 振动',
    example: { question: 'china 小写时和 China 读音一样吗？', steps: ['china 小写是瓷器，大写 China 是中国。', '读音同为 /tʃɪnə/。'], answer: '同音：都读 /tʃɪnə/，起首是清辅音 /tʃ/。' },
    misconception: { wrong: '把 chair 读成「差尔」直接用中文拼音凑。', right: '/tʃ/ 是憋气后摩擦：chair /tʃeə/，别用「差」代替。' },
    quiz: { question: 'chair、jam、watch 里，哪两个含清辅音 /tʃ/？', options: ['chair 和 jam', 'chair 和 watch', 'jam 和 watch'], answer: 1, explanation: 'chair 的 ch 和 watch 的 tch 都读清辅音 /tʃ/；jam 是浊辅音 /dʒ/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph7-2', title: '破擦音 /tr/ 与 /dr/',
    definition: '/tr/ 和 /dr/ 是 t/d 加 r 的连读：舌尖从 /t/ /d/ 的位置直接滑向 /r/，像 Chinese「出」「朱」的轻版。',
    essentials: [
      '/tr/ 常见拼写：tr（tree, train, trip, country）。',
      '/dr/ 常见拼写：dr（dream, dress, driver, hundred）。',
      '圆唇起滑，气流冲出时带 r 的卷舌色彩。',
      '清浊对应：/tr/ 不振，/dr/ 振动。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/tr/', '清（不振）', 'tree /triː/, train /treɪn/, trip /trɪp/'], ['/dr/', '浊（振动）', 'dream /driːm/, dress /dres/, driver /draɪvə/']] },
    formula: 't/d 直接滑向 r：清 /tr/ 不振，浊 /dr/ 振动',
    example: { question: 'tree 和 three 起首音一样吗？', steps: ['tree 的 tr 读 /tr/。', 'three 的 th 读咬舌的 /θ/。'], answer: '不一样：/tr/ 舌尖抵上齿龈，/θ/ 舌尖伸出齿间——很多同学混这两个。' },
    misconception: { wrong: '把 tree 读成「斯瑞」。', right: 'tree /triː/ 的 /tr/ 靠舌尖弹发，别用咬舌音代替。' },
    quiz: { question: 'tree、dream、train 里，哪两个含清辅音 /tr/？', options: ['tree 和 dream', 'tree 和 train', 'dream 和 train'], answer: 1, explanation: 'tree、train 都以清辅音 /tr/ 开头；dream 以浊辅音 /dr/ 开头。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  },
  {
    id: 'ph7-3', title: '破擦音 /ts/ 与 /dz/',
    definition: '/ts/ 和 /dz/ 多在名词复数词尾：cats、birds 的尾巴。舌尖从 /t/ /d/ 直接滑向 /s/ /z/。',
    essentials: [
      '/ts/ 在清辅音后的复数：cats, hats, students, maps。',
      '/dz/ 在浊辅音后的复数：birds, hands, beds, birds。',
      '读音要点：不要拆成两个音，一口气滑出「茨」「兹」。',
      '这正是一般现在时三单 -s 和复数 -s 的读音规则。',
    ],
    comparison: { headers: ['音标', '清浊', '例词'], rows: [['/ts/', '清（不振）', 'cats /kæts/, hats /hæts/, students /stjuːdnts/'], ['/dz/', '浊（振动）', 'birds /bɜːdz/, hands /hændz/, beds /bedz/']] },
    formula: '清后 /ts/，浊后 /dz/：复数尾巴跟着前面的音走',
    example: { question: 'books 和 bags 词尾 s 读音为什么不同？', steps: ['books 词尾前的 k 是清辅音。', 'bags 词尾前的 g 是浊辅音。'], answer: 'books /bʊks/ 读 /s/，bags /bægz/ 读 /z/——清随清、浊随浊。' },
    misconception: { wrong: '把 students 读成「student丝」拖长。', right: 'students /stjuːdnts/ 词尾 /ts/ 短促滑出，一拍完成。' },
    quiz: { question: 'cats、birds、maps 里，哪一个词尾读 /dz/？', options: ['cats', 'birds', 'maps'], answer: 1, explanation: 'birds 词尾前的 d 是浊辅音，s 读 /dz/；cats、maps 是清辅音后读 /ts/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph7-4', title: '鼻音 /m/ /n/ /ŋ/',
    definition: '鼻音让气流从鼻子出去：/m/ 双唇闭合，/n/ 舌尖抵上齿龈，/ŋ/ 舌后部抵软腭——三个位置从前往后。',
    essentials: [
      '/m/ 常见拼写：m（moon, name）——双唇闭紧，哼出声。',
      '/n/ 常见拼写：n（nine, nose, sun）——舌尖抵上齿龈。',
      '/ŋ/ 常见拼写：ng（sing, long）、n 在 k/g 前（thank, English）。',
      '三个都是浊音，声带一直振动；/ŋ/ 是中国学生难点：sing 别读成「辛」。',
    ],
    comparison: { headers: ['音标', '堵的位置', '例词'], rows: [['/m/', '双唇', 'moon /muːn/, name /neɪm/'], ['/n/', '舌尖抵上齿龈', 'nine /naɪn/, nose /nəʊz/'], ['/ŋ/', '舌后部抵软腭', 'sing /sɪŋ/, thank /θæŋk/, English /ɪŋglɪʃ/']] },
    formula: '气流走鼻子：m 闭唇、n 抵齿龈、ŋ 顶软腭',
    example: { question: 'sing 和 sin 只差一个字母，读音差在哪？', steps: ['sing 词尾是 /ŋ/，舌根堵气。', 'sin 词尾是 /n/，舌尖堵气。'], answer: '/ŋ/ 对 /n/：唱歌的 sing 一定要用鼻根音，别读成 sin（罪）。' },
    misconception: { wrong: '把 thank 的 n 读成普通 /n/。', right: 'thank 里的 n 在 k 前读 /ŋ/：/θæŋk/，鼻音在喉咙后面。' },
    quiz: { question: 'moon、sing、nine 里，哪一个词尾是 /ŋ/？', options: ['moon', 'sing', 'nine'], answer: 1, explanation: 'sing 词尾的 ng 读 /ŋ/；moon、nine 词尾是 /n/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph8-1', title: '半元音 /w/ 与 /j/',
    definition: '/w/ 和 /j/ 发音短促、立刻滑向后面的元音，性质介于辅音和元音之间，所以叫半元音。',
    essentials: [
      '/w/ 常见拼写：w（we, water, window）、wh（what, white）——双唇收圆再打开。',
      '/j/ 常见拼写：y 在元音前（yes, you, year）——舌面抬向硬腭。',
      'u 长音常带 /j/：use /juːz/, usually /juːʒʊəlɪ/。',
      '它们永远和元音一起出现，不能单独成音节。',
    ],
    comparison: { headers: ['音标', '口型', '例词'], rows: [['/w/', '双唇收圆再滑开', 'we /wiː/, water /wɔːtə/, what /wɒt/'], ['/j/', '舌面抬高滑向元音', 'yes /jes/, you /juː/, year /jɪə/']] },
    formula: '/w/ 圆唇起滑，/j/ 舌面起滑，立刻接元音',
    example: { question: 'use 开头实际是几个音？', steps: ['u 在这里读 /juː/。', '也就是 /j/ 加 /uː/ 两个成分。'], answer: 'use /juːz/ 以半元音 /j/ 开头——这也是 a university 用 a 的原因。' },
    misconception: { wrong: '把 what 的 wh 读成 /v/。', right: 'what 的 wh 读圆唇的 /w/：/wɒt/，和 very 的 /v/ 完全不同。' },
    quiz: { question: 'we、yes、water 里，哪两个以半元音 /w/ 开头？', options: ['we 和 yes', 'we 和 water', 'yes 和 water'], answer: 1, explanation: 'we、water 以圆唇的 /w/ 开头；yes 以 /j/ 开头。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph8-2', title: '旁流音 /l/ 的两种读音',
    definition: '/l/ 气流从舌头两边通过。它在元音前读得清脆（light），在元音后读得含糊低沉（ball）——一个音、两种味道。',
    essentials: [
      '清晰 /l/：舌尖抵上齿龈，像拼音「勒」：light, look, like。',
      '含糊 /l/：词尾或辅音前，舌后部也抬高：ball, milk, apple。',
      '两种读法舌尖位置相同，区别在舌后部有没有同时抬高。',
      '中国学生常把词尾 /l/ 丢掉或加「呃」：ball 别读成「抱哦」。',
    ],
    comparison: { headers: ['位置', '读法', '例词'], rows: [['元音前', '清晰 /l/', 'light /laɪt/, look /lʊk/'], ['元音后', '含糊 /l/', 'ball /bɔːl/, milk /mɪlk/, apple /æpl/']] },
    formula: '舌尖抵上齿龈：前面清脆，后面含糊',
    example: { question: 'like 和 ball 里的 l 读法一样吗？', steps: ['like 的 l 在元音前，清晰。', 'ball 的 l 在元音后，含糊低沉。'], answer: '同一个音标 /l/、两种味道：前面清脆，后面含糊。' },
    misconception: { wrong: '词尾 l 读成「哦」直接丢掉。', right: 'ball /bɔːl/ 的舌尖还要抵上去，含糊地收 /l/。' },
    quiz: { question: 'light、ball、apple 里，哪一个的 l 是清晰 /l/（元音前）？', options: ['light', 'ball', 'apple'], answer: 0, explanation: 'light 的 l 在元音前，读得清脆；ball、apple 词尾的 l 读含糊 /l/。' },
    sources: [{ label: '剑桥词典（带音标）', url: 'https://dictionary.cambridge.org/' }]
  },
  {
    id: 'ph8-3', title: '拼读方法',
    definition: '学会音标就要用起来：见到生词，先查音标，再按音节拆开、重音读清楚，一个词就能自己读对。',
    essentials: [
      '第一步：查词典找音标，比如 delicious /dɪlɪʃəs/。',
      '第二步：按元音分音节：di-li-cious 三段，每段一个核心元音。',
      '第三步：找重音符号（音标前的 ˈ ），重音节读得响亮清楚。',
      '第四步：连起来顺读几遍，再对照词典发音核对。',
    ],
    facts: [{ label: '重音符号', value: "音标里的 ˈ 表示后面的音节重读：delicious 重音在第二段" }, { label: '音节', value: '有几个元音音素，就有几个音节' }],
    formula: '查音标 → 分音节 → 找重音 → 连着读',
    example: { question: '用四步法读 banana /bənɑːnə/。', steps: ['三个音节：ba-na-na。', '重音在第二段：ba-NA-na。', '中间的 a 读 /ɑː/，首尾读 /ə/。'], answer: '/bənɑːnə/，重音在中间，首尾轻快。' },
    misconception: { wrong: '拿到生词就按字母硬拼。', right: '字母组合的读音千变万化，音标才是发音的权威依据。' },
    quiz: { question: '见到生词，最可靠的读音来源是什么？', options: ['问同学怎么读', '查词典看音标', '按字母硬拼'], answer: 1, explanation: '音标是发音的权威标注，查词典看音标最可靠。' },
    sources: [{ label: 'BBC Learning English：发音', url: 'https://www.bbc.co.uk/learningenglish/english/features/pronunciation' }]
  }
];
