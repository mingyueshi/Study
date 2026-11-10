/* ============================================================
   乐学堂 · 汉字演变馆 —— 数据源
   10 个字族、100 个常用字的四段字形演变（甲骨文→金文→小篆→楷书）
   与字理小故事。古字形图片来自汉字叔叔字源网（hanziyuan.net），
   由 scripts/fetch_hanzi_glyphs.py 抓取为本地 SVG，可得性清单见
   hanzi-evo-availability.json；站上没有的字形以诚实标注代替。
   ============================================================ */
'use strict';

const HANZI_EVO = {
  textbook: '汉字演变馆 · 100 个常用字的成长史',
  edition: '甲骨文 · 金文 · 小篆 · 楷书',
  units: [
    {
      id: 'hf1', no: '第一族', name: '天文气象', emoji: '☀️', color: '#c2571f',
      intro: '抬头能看到的日、月、星星和刮风下雨，是古人最早画下的字。',
      goals: ['看懂日月风云的古文字都是照着实物画的', '发现同一个字在不同时代笔画越来越整齐'],
      points: [
        {
          id: 'hf1-1', char: '日', pinyin: 'rì', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he001-ri4-ob.svg', note: '圆圆的太阳，中间加一点' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he001-ri4-bronze.svg', note: '还是太阳，一点更清楚' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he001-ri4-seal.svg', note: '笔画变得弯而匀' },
          ],
          story: '太阳是圆的，古人就画一个圆圈，中间点一点，表示这是发光的太阳。为什么不画光线？因为要和别的圆圈形的东西区分开。写快了圆圈变成了方块，就是今天的「日」。',
          words: ['日子', '生日', '阳光'],
        },
        {
          id: 'hf1-2', char: '月', pinyin: 'yuè', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he002-yue4-ob.svg', note: '一弯缺了口的月牙' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he002-yue4-bronze.svg', note: '月牙形状差不多' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he002-yue4-seal.svg', note: '笔画拉直变瘦长' },
          ],
          story: '满月和太阳都圆滚滚的，画出来分不清，古人就画缺一块的月牙来当「月」。月牙中间常加一道或两点，那是月亮里的影子。两笔弯弯的月牙，后来变成了方方的「月」。',
          words: ['月亮', '月光', '正月'],
        },
        {
          id: 'hf1-3', char: '星', pinyin: 'xīng', strokes: 9, type: '形声',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he003-xing1-ob.svg', note: '几个小方块代表满天星星' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he003-xing1-bronze.svg', note: '加上「生」提示读音' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he003-xing1-seal.svg', note: '上面写成「日」' },
          ],
          story: '古人先用几个小方块表示星星，这个字念「晶」。后来觉得不够用，就加上「生」字提醒读音，写成「曐」，再后来上面的星星简化成一个「日」，就是「星」。',
          words: ['星星', '星期', '星空'],
          poly: true,
        },
        {
          id: 'hf1-4', char: '云', pinyin: 'yún', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he004-yun2-ob.svg', note: '古字写作「雲」，云朵卷卷的' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he004-yun2-seal.svg', note: '下面是云，上面加了雨' },
          ],
          story: '「云」画的是天上一团卷卷的云朵。为了说明这是天上的云，后来在上面加了「雨」字头，写成「雲」。简化字把雨字头又去掉了——云朵的字形转了一大圈，又回来了。',
          words: ['白云', '云朵', '乌云'],
        },
        {
          id: 'hf1-5', char: '雨', pinyin: 'yǔ', strokes: 8, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he005-yu3-ob.svg', note: '天上一横，往下掉水点' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he005-yu3-bronze.svg', note: '水点排得更整齐' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he005-yu3-seal.svg', note: '变成骨架一样的「雨」' },
          ],
          story: '上面一横是天，下面的点点就是落下来的雨滴。有的甲骨文里雨点多达十几个，看起来真像一场大雨。写成汉字后，雨点只剩下四点，整齐地待在框里。',
          words: ['下雨', '雨水', '雨衣'],
          poly: true,
        },
        {
          id: 'hf1-6', char: '雪', pinyin: 'xuě', strokes: 11, type: '形声',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he006-xue3-ob.svg', note: '上面下雨，下面是扫帚' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he006-xue3-seal.svg', note: '写成雨字头加「彗」' },
          ],
          story: '雪也是天上落下来的，所以有雨字头。下面那部分是「彗」，表示扫帚——雪停了要拿扫帚来扫雪，就用它提示读音。如今的「雪」还留着这把小扫帚的痕迹。',
          words: ['下雪', '雪花', '雪人'],
        },
        {
          id: 'hf1-7', char: '雷', pinyin: 'léi', strokes: 13, type: '形声',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he007-lei2-ob.svg', note: '中间像闪电，两边是车轮声' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he007-lei2-bronze.svg', note: '加上田块的形状' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he007-lei2-seal.svg', note: '雨字头下加三个田' },
          ],
          story: '打雷时先看到闪电，再听到轰隆隆像车轮滚过的声音。古人画过闪电，也画过许多圆圈表示连串的响声，后来统一成雨字头加「田」，「田」在这里只帮忙表示声音。',
          words: ['打雷', '雷声', '地雷'],
        },
        {
          id: 'hf1-8', char: '电', pinyin: 'diàn', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he008-dian4-ob.svg', note: '借「申」字，像一道闪电' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he008-dian4-bronze.svg', note: '加上雨字头写作「電」' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he008-dian4-seal.svg', note: '闪电的尾巴弯弯的' },
          ],
          story: '闪电太快了，古人干脆画一道从天劈下来的光，这就是「申」字。为了让它专指天上的电，又加上雨字头写成「電」。简化字把弯弯的尾巴拉直——「电」反而更像当初那道闪电。',
          words: ['闪电', '电话', '电视'],
        },
        {
          id: 'hf1-9', char: '风', pinyin: 'fēng', strokes: 4, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he009-feng1-ob.svg', note: '借大鸟「凤」来表示风' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he009-feng1-seal.svg', note: '写成凡声加虫的「風」' },
          ],
          story: '风看不见画不出，古人发现大风刮起来像一只巨大的鸟飞过，就借用大鸟「凤」的字形来表示风。后来造了「風」字，里面有只小虫——古人相信风里带着虫子，会传播疾病。简化字只剩几笔，风的感觉得靠想象。',
          words: ['大风', '风车', '风筝'],
        },
        {
          id: 'hf1-10', char: '天', pinyin: 'tiān', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he010-tian1-ob.svg', note: '一个「大」，头顶上是方框' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he010-tian1-bronze.svg', note: '头变成一横' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he010-tian1-seal.svg', note: '定型为「一大」' },
          ],
          story: '「大」是一个张开手脚的人。人的头顶再往上是什么？古人就在人形的头上画一个方框表示天空。后来方框简化成一小横——「天」就是人头顶上的那片空间。',
          words: ['天空', '今天', '白天'],
        },
      ],
    },
    {
      id: 'hf2', no: '第二族', name: '大地山川', emoji: '⛰️', color: '#2f7d5c',
      intro: '山、水、田、火……脚下的大地，也变成了一笔一笔的字。',
      goals: ['从字形里看出山河的样子', '知道水和山的字能组成很多新字'],
      points: [
        {
          id: 'hf2-1', char: '山', pinyin: 'shān', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he011-shan1-ob.svg', note: '三座山峰连在一起' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he011-shan1-bronze.svg', note: '峰体变实心' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he011-shan1-seal.svg', note: '三竖变得细长' },
          ],
          story: '三座尖尖的山峰排成一排，就是「山」。中间一竖最高，两边稍矮，今天写「山」时先写中间一竖，还保留着主峰的样子。',
          words: ['高山', '山坡', '山水'],
        },
        {
          id: 'hf2-2', char: '川', pinyin: 'chuān', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he012-chuan1-ob.svg', note: '两岸夹着流动的水' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he012-chuan1-bronze.svg', note: '水线连贯' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he012-chuan1-seal.svg', note: '三条弯曲的水线' },
          ],
          story: '两边是河岸，中间是奔流的水，「川」就是穿过大地的大河。「川流不息」说的就是河水源源不断地流。',
          words: ['山川', '川流不息', '河川'],
        },
        {
          id: 'hf2-3', char: '水', pinyin: 'shuǐ', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he013-shui3-ob.svg', note: '一条主流，旁边溅着水花' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he013-shui3-bronze.svg', note: '水花连成波纹' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he013-shui3-seal.svg', note: '水花变成笔画' },
          ],
          story: '中间一条弯弯的是主流，旁边的小点是溅起的水花。后来水花变成四笔，「水」字再也看不出浪花了。它做偏旁时写成三点水，江、河、湖、海里都有它。',
          words: ['河水', '喝水', '水果'],
          poly: true,
        },
        {
          id: 'hf2-4', char: '火', pinyin: 'huǒ', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he014-huo3-ob.svg', note: '火苗向上蹿的样子' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he014-huo3-seal.svg', note: '火苗变成曲线' },
          ],
          story: '一簇火苗中间高、两边低，蹿着往上烧，古人就照着火苗的样子画下「火」。它做偏旁时写成四点火，灯、烧、烤这些和火有关的字里都有它。',
          words: ['大火', '火车', '灯火'],
          poly: true,
        },
        {
          id: 'hf2-5', char: '土', pinyin: 'tǔ', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he015-tu3-ob.svg', note: '地面上堆起一个土块' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he015-tu3-bronze.svg', note: '土块变粗变圆' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he015-tu3-seal.svg', note: '下面一横表示地面' },
          ],
          story: '下面一横是地面，上面鼓起来的是地上的土堆。庄稼从土里长出来，房子盖在土上，「土」是古人最熟悉的东西之一。',
          words: ['土地', '泥土', '国土'],
        },
        {
          id: 'hf2-6', char: '石', pinyin: 'shí', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he016-shi2-ob.svg', note: '山崖下画一块石头' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he016-shi2-bronze.svg', note: '石块形状更方正' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he016-shi2-seal.svg', note: '崖边和石块定型' },
          ],
          story: '上面是山崖，崖下画个方方的东西，就是石头。石器时代，人们的刀、斧、箭头都是石头做的，石头伴随着汉字的童年。',
          words: ['石头', '石桥', '石子'],
          poly: true,
        },
        {
          id: 'hf2-7', char: '田', pinyin: 'tián', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he017-tian2-ob.svg', note: '方块里画着田埂' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he017-tian2-bronze.svg', note: '田埂更整齐' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he017-tian2-seal.svg', note: '就是今天的「田」' },
          ],
          story: '一块方方的田地，里面横平竖直的是田埂，把大田分成小格，方便浇水和走路。三千多年前的「田」和今天几乎一模一样。',
          words: ['田地', '水田', '田野'],
        },
        {
          id: 'hf2-8', char: '井', pinyin: 'jǐng', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he018-jing3-ob.svg', note: '井栏交叉的形状' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he018-jing3-bronze.svg', note: '中间加一点表示井水' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he018-jing3-seal.svg', note: '保留方框和一点' },
          ],
          story: '古人围着水口用木头搭起交叉的井栏，「井」就照着它画。金文还在中间点了一点，提醒你：这里面有水！「背井离乡」里的井，就是家乡的水井。',
          words: ['水井', '井水', '市井'],
        },
        {
          id: 'hf2-9', char: '谷', pinyin: 'gǔ', strokes: 7, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he019-gu3-bronze.svg', note: '水从两山之间流出' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he019-gu3-seal.svg', note: '上八字下口加水形' },
          ],
          story: '上面的「八」像两座山分开，下面的「口」是谷口，泉水正从山谷里流出来。山谷和稻谷都用这个字——山谷能存水，长庄稼，是古人种稻的好地方。',
          words: ['山谷', '稻谷', '谷子'],
          poly: true,
        },
        {
          id: 'hf2-10', char: '泉', pinyin: 'quán', strokes: 9, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he020-quan2-ob.svg', note: '水从岩缝里涌出来' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he020-quan2-seal.svg', note: '写成白加水' },
          ],
          story: '上面是山岩间的洞穴，下面是涌出来的水流——清清的泉水从石缝里冒出来。「白水」的写法记住了泉水清亮的样子。',
          words: ['泉水', '清泉', '温泉'],
        },
      ],
    },
    {
      id: 'hf3', no: '第三族', name: '飞禽走兽', emoji: '🐎', color: '#8a5a2b',
      intro: '马牛羊、虎兔鱼鸟，古人把身边的动物画成了一幅幅小图。',
      goals: ['对照字形认出每种动物的特征', '发现动物的字常做偏旁'],
      points: [
        {
          id: 'hf3-1', char: '马', pinyin: 'mǎ', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he021-ma3-ob.svg', note: '长脸、鬃毛和四条腿' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he021-ma3-bronze.svg', note: '鬃毛更醒目' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he021-ma3-seal.svg', note: '线条圆转' },
          ],
          story: '大大的眼睛、长长的脸、脖子上的鬃毛、四条奔跑的腿，古人把马最有特点的地方都画上了。繁体「馬」还留着四点腿，简化后三笔带过，马儿跑得更快了。',
          words: ['小马', '马上', '马车'],
          poly: true,
        },
        {
          id: 'hf3-2', char: '牛', pinyin: 'niú', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he022-niu2-ob.svg', note: '正面看牛头，两只犄角' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he022-niu2-bronze.svg', note: '犄角弯弯向上' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he022-niu2-seal.svg', note: '角耳分明' },
          ],
          story: '从正面看牛头：一对大犄角向上翘，中间是牛脸，下面两只耳朵。几笔就抓住了牛最威风的地方。犁地、拉车，牛是古人最好的帮手。',
          words: ['水牛', '牛奶', '牛皮'],
        },
        {
          id: 'hf3-3', char: '羊', pinyin: 'yáng', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he023-yang2-ob.svg', note: '两只弯角向下卷' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he023-yang2-bronze.svg', note: '角形更华丽' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he023-yang2-seal.svg', note: '写成三横一竖' },
          ],
          story: '和牛一样画的是头：一对向下卷的弯角是羊的标志。羊性情温顺，古人觉得看见羊是吉祥的事，「美」「善」这些好字里都有羊。',
          words: ['山羊', '羊毛', '小羊'],
        },
        {
          id: 'hf3-4', char: '犬', pinyin: 'quǎn', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he024-quan3-ob.svg', note: '侧面的狗，翘着尾巴' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he024-quan3-bronze.svg', note: '身形瘦长' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he024-quan3-seal.svg', note: '线条拉直' },
          ],
          story: '从侧面画一条狗：昂着头，竖着耳朵，尾巴向上翘。它做偏旁时写成反犬旁，狗、猫、猪、猴这些动物的字里都有它。',
          words: ['猎犬', '看门犬', '犬吠'],
        },
        {
          id: 'hf3-5', char: '豕', pinyin: 'shǐ', strokes: 7, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he025-shi3-ob.svg', note: '圆肚子短尾巴的猪' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he025-shi3-bronze.svg', note: '肚子更圆' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he025-shi3-seal.svg', note: '笔画规整' },
          ],
          story: '「豕」就是猪。圆滚滚的肚子、小小的短尾巴，一看就是家养的肥猪。屋顶下面养头猪就是「家」——对古人来说，有猪才像有个家。',
          words: ['狼奔豕突', '封豕'],
        },
        {
          id: 'hf3-6', char: '鹿', pinyin: 'lù', strokes: 11, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he026-lu4-ob.svg', note: '枝杈一样的角最抢眼' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he026-lu4-bronze.svg', note: '角更舒展' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he026-lu4-seal.svg', note: '还留着角的形状' },
          ],
          story: '画鹿先画角——那对像树枝一样分叉的角，是鹿最神气的部分。繁体「鹿」里还能找到这副角。小鹿跑起来轻快，所以「丽」字里也有鹿。',
          words: ['小鹿', '梅花鹿', '鹿角'],
        },
        {
          id: 'hf3-7', char: '虎', pinyin: 'hǔ', strokes: 8, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he027-hu3-ob.svg', note: '张开大口露出斑纹' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he027-hu3-bronze.svg', note: '斑纹变成线条' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he027-hu3-seal.svg', note: '头尾仍可辨认' },
          ],
          story: '张大的嘴、身上的条纹、弯弯的尾巴，一只猛虎迎面走来。古人最怕也最佩服老虎，「虎」字里藏着那声威风的大吼。',
          words: ['老虎', '虎口', '壁虎'],
          poly: true,
        },
        {
          id: 'hf3-8', char: '兔', pinyin: 'tù', strokes: 8, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he028-tu4-ob.svg', note: '长耳朵、短尾巴' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he028-tu4-seal.svg', note: '耳朵竖成一笔' },
          ],
          story: '长长的耳朵、胖胖的身子、短短的小尾巴，古人画了一只蹲坐的兔子。后来写字的人把耳朵和身子写散了，就成了今天的「兔」，最后一点是那截小尾巴。',
          words: ['白兔', '兔子', '兔毛'],
        },
        {
          id: 'hf3-9', char: '蛇', pinyin: 'shé', strokes: 11, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he029-she2-bronze.svg', note: '古字写作「它」，像蛇昂头' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he029-she2-seal.svg', note: '加上虫字旁' },
          ],
          story: '「蛇」最早写作「它」：尖尖的头，弯弯的长身子。古人草丛里走，见面先问一句「无它乎」——身上没挂着蛇吧？后来「它」借去指别的东西，才加上虫字旁专指蛇。',
          words: ['毒蛇', '蛇皮', '画蛇添足'],
          poly: true,
        },
        {
          id: 'hf3-10', char: '鱼', pinyin: 'yú', strokes: 8, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he030-yu2-ob.svg', note: '头、鳞、鳍、尾样样都有' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he030-yu2-bronze.svg', note: '鳞片变紧凑' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he030-yu2-seal.svg', note: '尾巴变成四点' },
          ],
          story: '尖尖的头，一片一片的鳞，摆动的尾巴——古人画的鱼连鱼鳍都没漏掉。繁体「魚」下面的四点就是尾巴，简化后只剩一条横线，鱼儿也游进了新字形。',
          words: ['小鱼', '钓鱼', '金鱼'],
        },
        {
          id: 'hf3-11', char: '鸟', pinyin: 'niǎo', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he031-niao3-ob.svg', note: '站着的鸟，喙和爪都有' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he031-niao3-bronze.svg', note: '羽毛更丰满' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he031-niao3-seal.svg', note: '头尾拉长' },
          ],
          story: '一只站着的小鸟：尖嘴、圆头、翅膀和爪子都画得清清楚楚。繁体「鳥」最后一点是鸟的爪子，简化的「鸟」里藏着一粒沙——那是小鸟吃的小石子。',
          words: ['小鸟', '飞鸟', '鸟窝'],
          poly: true,
        },
        {
          id: 'hf3-12', char: '龙', pinyin: 'lóng', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he032-long2-ob.svg', note: '大口弯身，头顶有角' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he032-long2-bronze.svg', note: '身体盘曲' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he032-long2-seal.svg', note: '写成长长的弯条' },
          ],
          story: '张开的大嘴、头顶的角、扭动的长身——古人想象的神龙就这么画。龙能腾云降雨，是中华民族的象征，字形弯弯曲曲，正像龙在云里游。',
          words: ['龙', '龙舟', '恐龙'],
        },
      ],
    },
    {
      id: 'hf4', no: '第四族', name: '草木禾稼', emoji: '🌾', color: '#4c8a1f',
      intro: '树、庄稼和瓜果，喂饱了古人，也长出了一个个字。',
      goals: ['认出禾和木的样子', '知道庄稼对古人多重要'],
      points: [
        {
          id: 'hf4-1', char: '木', pinyin: 'mù', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he033-mu4-ob.svg', note: '上枝下根，中间树干' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he033-mu4-bronze.svg', note: '枝根舒展' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he033-mu4-seal.svg', note: '枝根变成笔画' },
          ],
          story: '中间一竖是树干，上面分叉是枝，下面分叉是根，一棵树画全了。带木字旁的字大多和树有关：树、林、桥、桌。',
          words: ['树木', '木头', '果木'],
        },
        {
          id: 'hf4-2', char: '林', pinyin: 'lín', strokes: 8, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he034-lin2-ob.svg', note: '两棵树并排站' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he034-lin2-bronze.svg', note: '树形方整' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he034-lin2-seal.svg', note: '两个「木」并立' },
          ],
          story: '一棵树是「木」，两棵树站在一起就是「林」。树多了成林，林子多了成「森」——三个木叠起来，树就更密更多了。',
          words: ['树林', '竹林', '林子'],
        },
        {
          id: 'hf4-3', char: '森', pinyin: 'sēn', strokes: 12, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he035-sen1-ob.svg', note: '三个木挤在一起' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he035-sen1-seal.svg', note: '森立的样子' },
          ],
          story: '三个「木」摞在一起，树木密密层层，这就是「森」。森林里树挨着树，阳光都要挤着才能照进来，所以「森」也用来形容很多很多。',
          words: ['森林', '阴森', '森严'],
        },
        {
          id: 'hf4-4', char: '禾', pinyin: 'hé', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he036-he2-ob.svg', note: '谷穗垂下来' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he036-he2-bronze.svg', note: '穗子更沉' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he036-he2-seal.svg', note: '穗变一撇' },
          ],
          story: '上面沉甸甸下垂的是谷穗，中间是叶，下面是根——这是成熟的小米庄稼。秋收时穗子越沉越弯，「禾」里藏着丰收的样子。',
          words: ['禾苗', '锄禾', '禾场'],
        },
        {
          id: 'hf4-5', char: '米', pinyin: 'mǐ', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he037-mi3-ob.svg', note: '一串串谷粒' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he037-mi3-seal.svg', note: '六点围着十字' },
          ],
          story: '一把脱好壳的谷粒，中间一横一竖是架子，周围六点是一粒粒米。米是每天都要吃的粮食，「柴米油盐」里排第二位。',
          words: ['大米', '米饭', '玉米'],
          poly: true,
        },
        {
          id: 'hf4-6', char: '瓜', pinyin: 'guā', strokes: 5, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he038-gua1-bronze.svg', note: '藤上挂着一个瓜' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he038-gua1-seal.svg', note: '藤蔓清晰' },
          ],
          story: '中间那团圆的是瓜果，两边弯弯的是藤蔓——一个瓜挂在藤上，风一吹还晃晃悠悠。看看「瓜」字，中间是不是正挂着一个小瓜？',
          words: ['西瓜', '瓜果', '南瓜'],
          poly: true,
        },
        {
          id: 'hf4-7', char: '果', pinyin: 'guǒ', strokes: 8, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he039-guo3-bronze.svg', note: '树上结满果实' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he039-guo3-seal.svg', note: '果实变成田形' },
          ],
          story: '树上结的圆球就是果子，金文里一颗树上挂了好几颗。小篆把果子写成「田」，所以今天的「果」看着像树上长了块田——其实是几颗果子。',
          words: ['水果', '果实', '果树林'],
        },
        {
          id: 'hf4-8', char: '竹', pinyin: 'zhú', strokes: 6, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he040-zhu2-bronze.svg', note: '两枝竹叶向下垂' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he040-zhu2-seal.svg', note: '叶形变成笔画' },
          ],
          story: '两根竹枝，各有几片尖尖的竹叶向下垂——「竹」画的是叶子，不是竿子。竹子做毛笔杆、编竹篮，古人写字也离不开它，「笔」的下面就是竹。',
          words: ['竹子', '竹笋', '竹林'],
        },
        {
          id: 'hf4-9', char: '草', pinyin: 'cǎo', strokes: 9, type: '形声',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he041-cao3-bronze.svg', note: '古字写作「屮」，小芽破土' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he041-cao3-seal.svg', note: '草芽弯弯的' },
          ],
          story: '草的古字是「屮」——一棵刚从土里钻出来的小芽。两棵小芽并排是「艸」，再加「早」提示读音，就是「草」。今天草字头「艹」，还是那两棵小芽。',
          words: ['小草', '草地', '草原'],
        },
        {
          id: 'hf4-10', char: '桑', pinyin: 'sāng', strokes: 10, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he042-sang1-ob.svg', note: '枝头满是叶子' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he042-sang1-seal.svg', note: '叶子叠成三个「又」' },
          ],
          story: '一棵枝叶茂密的桑树，叶子层层叠叠。桑叶喂蚕，蚕吐丝做衣服，三千多年前种桑养蚕就是大产业，「桑」连着古人的衣裳。',
          words: ['桑树', '桑叶', '采桑'],
        },
      ],
    },
    {
      id: 'hf5', no: '第五族', name: '身体密码', emoji: '🖐️', color: '#b0486e',
      intro: '人、头、眼、手……古人照着自己画字，最熟悉不过。',
      goals: ['发现人形字的各种姿势', '知道自己身上的字怎么来的'],
      points: [
        {
          id: 'hf5-1', char: '人', pinyin: 'rén', strokes: 2, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he043-ren2-ob.svg', note: '侧身站立，弯腰伸手' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he043-ren2-bronze.svg', note: '身形更挺' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he043-ren2-seal.svg', note: '弯腰的样子还在' },
          ],
          story: '「人」画的是侧站着的人：弯着腰，手臂向前伸，正在干活的样子。两撇一捺，简单两笔，却把人做事的样子记了几千年。',
          words: ['大人', '人们', '人生'],
          poly: true,
        },
        {
          id: 'hf5-2', char: '大', pinyin: 'dà', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he044-da4-ob.svg', note: '正面的人张开手脚' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he044-da4-bronze.svg', note: '手脚舒展' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he044-da4-seal.svg', note: '线条圆转' },
          ],
          story: '一个正面站着的人，张开双臂叉开腿，显得又高又壮——这就是「大」。人和天地比是小的，可张开手脚的样子，古人觉得很了不起。',
          words: ['大小', '长大', '大树'],
          poly: true,
        },
        {
          id: 'hf5-3', char: '女', pinyin: 'nǚ', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he045-nv3-ob.svg', note: '交着手跪坐的人' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he045-nv3-bronze.svg', note: '身形圆润' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he045-nv3-seal.svg', note: '线条柔美' },
          ],
          story: '古人席地而坐，跪坐时双手交叠放在身前，姿态安稳——这是甲骨文里的「女」。弯弯的线条像位安静端庄的女子，也像她舞动的样子。',
          words: ['女孩', '子女', '女生'],
          poly: true,
        },
        {
          id: 'hf5-4', char: '子', pinyin: 'zǐ', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he046-zi3-ob.svg', note: '大头娃娃挥着手' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he046-zi3-bronze.svg', note: '头发更清楚' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he046-zi3-seal.svg', note: '定型为「子」' },
          ],
          story: '小孩子的脑袋占身体的一大半，古人画「子」就突出这颗圆脑袋，还挥舞着两只小手。襁褓里的婴儿，就这样被记在字里。',
          words: ['孩子', '子女', '王子'],
          poly: true,
        },
        {
          id: 'hf5-5', char: '目', pinyin: 'mù', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he047-mu4-ob.svg', note: '一只眼睛，中间是瞳孔' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he047-mu4-bronze.svg', note: '竖起来看' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he047-mu4-seal.svg', note: '眼睛变方' },
          ],
          story: '画的是一只横着的眼睛，中间那个圆是眼珠。为了和别的字排得整齐，眼睛被竖了起来——横目变竖目，就是「目」。「目」就是眼睛，所以看、望都带目。',
          words: ['目光', '耳目', '条目'],
          poly: true,
        },
        {
          id: 'hf5-6', char: '口', pinyin: 'kǒu', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he048-kou3-ob.svg', note: '张开的一张嘴' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he048-kou3-bronze.svg', note: '轮廓方正' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he048-kou3-seal.svg', note: '定型为方口' },
          ],
          story: '一张张开的嘴，方方正正就是「口」。人说话、吃饭都靠它，所以问、吃、叫这些和嘴有关的字都带口字旁。',
          words: ['开口', '人口', '口水'],
          poly: true,
        },
        {
          id: 'hf5-7', char: '耳', pinyin: 'ěr', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he049-er3-ob.svg', note: '一只耳朵的轮廓' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he049-er3-bronze.svg', note: '耳廓分明' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he049-er3-seal.svg', note: '写成今天的形状' },
          ],
          story: '外耳廓弯弯的轮廓，就是「耳」。甲骨文的耳朵连耳垂都画出来了。听、闻、聊这些字里都有它。',
          words: ['耳朵', '木耳', '耳环'],
        },
        {
          id: 'hf5-8', char: '手', pinyin: 'shǒu', strokes: 4, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he050-shou3-bronze.svg', note: '五个手指头张开' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he050-shou3-seal.svg', note: '手指变成线条' },
          ],
          story: '五根手指张开，连手掌带手腕一起画——这就是「手」。它做偏旁时变成提手旁，打、拍、抱这些用手的字里都有它。',
          words: ['小手', '手机', '握手'],
          poly: true,
        },
        {
          id: 'hf5-9', char: '足', pinyin: 'zú', strokes: 7, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he051-zu2-ob.svg', note: '连腿带脚画下来' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he051-zu2-bronze.svg', note: '膝盖弯曲' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he051-zu2-seal.svg', note: '上口下止' },
          ],
          story: '从膝盖到脚尖，整条腿画出来就是「足」。下面的「止」其实是脚掌的形状——「止」本来也是一只脚，所以走路、跑步都带着它。',
          words: ['足球', '立足', '远足'],
        },
        {
          id: 'hf5-10', char: '心', pinyin: 'xīn', strokes: 4, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he052-xin1-bronze.svg', note: '心脏的样子' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he052-xin1-seal.svg', note: '还有心房心耳' },
          ],
          story: '古人发现胸口这颗心一直跳动，认为思考和感情都是从这里来的。所以想、念、悲、欢这些字都有心。看看「心」的三个点，像不像心房的形状？',
          words: ['开心', '心愿', '心情'],
          poly: true,
        },
      ],
    },
    {
      id: 'hf6', no: '第六族', name: '一举一动', emoji: '🏃', color: '#33619e',
      intro: '走、立、休、见……把动作画进字里，字就动起来了。',
      goals: ['从字形看出人物在做什么', '学会几个会意字'],
      points: [
        {
          id: 'hf6-1', char: '见', pinyin: 'jiàn', strokes: 4, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he053-jian4-ob.svg', note: '人上顶着一只大眼睛' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he053-jian4-bronze.svg', note: '眼睛更突出' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he053-jian4-seal.svg', note: '目在下人在上' },
          ],
          story: '人上面画一只睁大的眼睛——看东西看得清清楚楚，就是「见」。眼睛长在人身上，所以「看」要先有「见」。现在的「见」，眼睛藏在了撇和竖弯钩里。',
          words: ['看见', '见面', '意见'],
          poly: true,
        },
        {
          id: 'hf6-2', char: '走', pinyin: 'zǒu', strokes: 7, type: '会意',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he054-zou3-bronze.svg', note: '甩着胳膊在奔跑' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he054-zou3-seal.svg', note: '下部变成「止」' },
          ],
          story: '古代的「走」其实是跑！上面是甩动双臂、迈开大步的人，下面一只脚掌蹬地——跑得衣服都飘起来了。古文里「走马观花」就是骑着马跑着看花。',
          words: ['走路', '行走', '奔走'],
        },
        {
          id: 'hf6-3', char: '步', pinyin: 'bù', strokes: 7, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he055-bu4-ob.svg', note: '两只脚一前一后' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he055-bu4-bronze.svg', note: '脚印更清晰' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he055-bu4-seal.svg', note: '两个止字上下叠' },
          ],
          story: '上面一只脚掌，下面一只反过来的脚掌，一前一后就是「步」。古人量长短也用脚步，「步」还是长度单位。注意下面不是「少」，那只脚没有那一点。',
          words: ['脚步', '散步', '进步'],
        },
        {
          id: 'hf6-4', char: '行', pinyin: 'xíng', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he056-xing2-ob.svg', note: '一个十字路口' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he056-xing2-bronze.svg', note: '四条道路分明' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he056-xing2-seal.svg', note: '路口变成彳亍' },
          ],
          story: '「行」画的是一个十字路口：四个方向都能走。走在路上就是「行」，所以「行动」「行李」都和路有关。它做偏旁时分成「彳」和「亍」，一边一半。',
          words: ['行走', '行动', '银行'],
          poly: true,
        },
        {
          id: 'hf6-5', char: '立', pinyin: 'lì', strokes: 5, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he057-li4-ob.svg', note: '人站大地上' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he057-li4-bronze.svg', note: '脚下加实心地面' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he057-li4-seal.svg', note: '定型为「立」' },
          ],
          story: '一个「大」（张开手脚的人），脚下加一横表示地面——人稳稳地站住了，就是「立」。太阳站起来叫「旦」，人站起来叫「立」，「立正」就是站直。',
          words: ['站立', '立正', '起立'],
        },
        {
          id: 'hf6-6', char: '休', pinyin: 'xiū', strokes: 6, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he058-xiu1-ob.svg', note: '人靠在大树边' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he058-xiu1-bronze.svg', note: '人树相依' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he058-xiu1-seal.svg', note: '人木结构定型' },
          ],
          story: '干活累了，人走到大树旁，靠着树干歇一歇——「人」加「木」就是「休」。田边的大树是古人的凉亭，「休息」就是这么来的。',
          words: ['休息', '午休', '休假'],
        },
        {
          id: 'hf6-7', char: '从', pinyin: 'cóng', strokes: 4, type: '会意',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he059-cong2-bronze.svg', note: '一人在前，一人在后' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he059-cong2-seal.svg', note: '两人一顺' },
          ],
          story: '两个人，一个跟着一个走，就是「从」。跟从、服从都从这里来。再加一个人变成「众」，人就更多了。',
          words: ['跟从', '从前', '服从'],
        },
        {
          id: 'hf6-8', char: '得', pinyin: 'dé', strokes: 11, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he060-de2-ob.svg', note: '路上伸手捡到贝壳' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he060-de2-bronze.svg', note: '加上「贝」更清楚' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he060-de2-seal.svg', note: '贝换成寸' },
          ],
          story: '走在路上，一只手捡到了贝壳——上古的贝壳就是钱！捡到宝贝就是「得」。后来「贝」变成「寸」，提醒得来的东西要拿得有分寸。',
          words: ['得到', '得意', '取得'],
          poly: true,
        },
        {
          id: 'hf6-9', char: '及', pinyin: 'jí', strokes: 3, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he061-ji2-ob.svg', note: '一只手抓住了前面的人' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he061-ji2-bronze.svg', note: '手爪更明显' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he061-ji2-seal.svg', note: '写成乃+又' },
          ],
          story: '前面一个人跑，后面一只手一把抓住了他——追上了、够到了，就是「及」。「来不及」「望尘莫及」说的就是追没追上。够到了就叫「及格」「及时」。',
          words: ['及时', '及格', '来得及'],
        },
        {
          id: 'hf6-10', char: '涉', pinyin: 'shè', strokes: 10, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he062-she4-ob.svg', note: '两只脚趟过河水' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he062-she4-bronze.svg', note: '水在脚间流' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he062-she4-seal.svg', note: '三点水加步' },
          ],
          story: '两边是水，中间两只脚——古人没有桥，就卷起裤腿从河里趟过去，这叫「涉」。爬山涉水、跋山涉水，都是用脚步量出来的路。',
          words: ['跋山涉水', '涉水', '干涉'],
        },
      ],
    },
    {
      id: 'hf7', no: '第七族', name: '身边器物', emoji: '🛶', color: '#7a6aa0',
      intro: '门、车、船、鼎……器物是古人生活的家当，件件都成了字。',
      goals: ['认出器物的样子', '发现器物字后来多当偏旁'],
      points: [
        {
          id: 'hf7-1', char: '门', pinyin: 'mén', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he063-men2-ob.svg', note: '两扇门板对开' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he063-men2-bronze.svg', note: '门轴清楚' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he063-men2-seal.svg', note: '双扇定型' },
          ],
          story: '古人家的大门是两扇对开的，甲骨文就把两扇门板都画了。单扇的门叫「户」，两扇合起来才是「门」。现在简化的「门」就像一扇门板立在框里。',
          words: ['大门', '开门', '门口'],
          poly: true,
        },
        {
          id: 'hf7-2', char: '户', pinyin: 'hù', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he064-hu4-ob.svg', note: '一扇单门' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he064-hu4-seal.svg', note: '一扇门板' },
          ],
          story: '一扇小门就是「户」。古时候大家族大门用双扇，小户人家的门只有一扇，「户」就成了人家的意思——一家一户、千家万户。',
          words: ['窗户', '千家万户', '户口'],
          poly: true,
        },
        {
          id: 'hf7-3', char: '车', pinyin: 'chē', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he065-che1-ob.svg', note: '车轮、车轴、车厢都有' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he065-che1-bronze.svg', note: '车轮转动感强' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he065-che1-seal.svg', note: '只留一个轮子' },
          ],
          story: '画的是一辆完整的马车：两只轮子、车轴、车厢和拉车的辕。小篆只画一个轮子，简化字连轮子都变成了几笔，但「车」还是跑得飞快。',
          words: ['汽车', '马车', '车站'],
          poly: true,
        },
        {
          id: 'hf7-4', char: '舟', pinyin: 'zhōu', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he066-zhou1-ob.svg', note: '一只小船两头翘' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he066-zhou1-bronze.svg', note: '船舱可见' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he066-zhou1-seal.svg', note: '船形拉长' },
          ],
          story: '独木舟两头翘起，中间的横线是船舱和船帮——「舟」就是船。刻舟求剑、同舟共济，故事里划的都是这条小舟。',
          words: ['小舟', '龙舟', '同舟共济'],
        },
        {
          id: 'hf7-5', char: '网', pinyin: 'wǎng', strokes: 6, type: '象形',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he067-wang3-bronze.svg', note: '交叉的网眼' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he067-wang3-seal.svg', note: '加了两根竿子' },
          ],
          story: '交叉的绳结织成一张网，古人用它捕鱼捉鸟。甲骨文里网眼画得清清楚楚，后来的「网」加了两个「乂」，四点的简化字里还留着网眼的格子——连互联网也叫「网」。',
          words: ['渔网', '上网', '网球场'],
        },
        {
          id: 'hf7-6', char: '弓', pinyin: 'gōng', strokes: 3, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he068-gong1-ob.svg', note: '弯弯的弓背上有时有弦' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he068-gong1-bronze.svg', note: '弓身厚实' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he068-gong1-seal.svg', note: '弓形定型' },
          ],
          story: '一张拉弯的弓，有的还画上了弦。射箭是古人打猎和打仗的本事，弯弓射大雕，说的就是它。',
          words: ['弓箭', '弹弓', '弓背'],
        },
        {
          id: 'hf7-7', char: '矢', pinyin: 'shǐ', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he069-shi3-ob.svg', note: '箭头、箭杆、羽毛俱全' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he069-shi3-bronze.svg', note: '箭羽分明' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he069-shi3-seal.svg', note: '字形立正了' },
          ],
          story: '一支完整的箭：上面的尖头，中间的杆，下面的羽毛。箭要射得直，所以古人用「矢志」表示立志不改。「有的放矢」就是朝着靶子放箭。',
          words: ['飞矢', '有的放矢', '矢志不渝'],
        },
        {
          id: 'hf7-8', char: '戈', pinyin: 'gē', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he070-ge1-ob.svg', note: '长柄横刃的兵器' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he070-ge1-bronze.svg', note: '刃部厚重' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he070-ge1-seal.svg', note: '柄弯刃利' },
          ],
          story: '「戈」是古代最有名的兵器：一根长柄，横着装一把弯刃，战车上的士兵挥起来专勾敌人的脖子。打仗古称「干戈」，「大动干戈」就是真打起来了。',
          words: ['干戈', '金戈铁马', '倒戈'],
        },
        {
          id: 'hf7-9', char: '鼎', pinyin: 'dǐng', strokes: 12, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he071-ding3-ob.svg', note: '三足两耳的大锅' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he071-ding3-bronze.svg', note: '纹饰华丽' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he071-ding3-seal.svg', note: '目足分明' },
          ],
          story: '三条腿、两只耳、圆圆的肚子——「鼎」本是煮肉的大铜锅。后来它成了权力和国家的象征，「问鼎」「一言九鼎」都有它。真正的青铜大鼎，现在还摆在博物馆里。',
          words: ['铜鼎', '问鼎', '一言九鼎'],
        },
        {
          id: 'hf7-10', char: '册', pinyin: 'cè', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he072-ce4-ob.svg', note: '竹简用绳串起来' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he072-ce4-bronze.svg', note: '简片整齐' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he072-ce4-seal.svg', note: '简绳分明' },
          ],
          story: '纸发明之前，古人把字写在一片片竹简上，再用绳子串起来——「册」画的就是一串竹简。所以书到现在还论「册」：一册书、画册、名册。',
          words: ['画册', '名册', '史册'],
        },
        {
          id: 'hf7-11', char: '衣', pinyin: 'yī', strokes: 6, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he073-yi1-ob.svg', note: '上衣的领口和袖子' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he073-yi1-bronze.svg', note: '衣襟分明' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he073-yi1-seal.svg', note: '领口在上' },
          ],
          story: '上面是衣领，两边是袖子，下面是衣襟——古人画了一件上衣。「衣」做偏旁时写成衣字旁，衬衫、裙子的字里都有它。',
          words: ['衣服', '穿衣', '大衣'],
          poly: true,
        },
      ],
    },
    {
      id: 'hf8', no: '第八族', name: '数字从哪来', emoji: '🔢', color: '#a03a5b',
      intro: '一到十是怎么写出来的？数字的故事最意想不到。',
      goals: ['记住几个数字的古字形', '理解数字是记号不是图画'],
      points: [
        {
          id: 'hf8-1', char: '一', pinyin: 'yī', strokes: 1, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he074-yi1-ob.svg', note: '一道横' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he074-yi1-bronze.svg', note: '还是一道横' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he074-yi1-seal.svg', note: '一横略弯' },
          ],
          story: '一个数字记号，一道横就是「一」。三千多年没变过，是汉字里最稳定的老前辈。',
          words: ['一个', '第一', '一起'],
          poly: true,
        },
        {
          id: 'hf8-2', char: '二', pinyin: 'èr', strokes: 2, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he075-er4-ob.svg', note: '上下两横' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he075-er4-bronze.svg', note: '两横等长' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he075-er4-seal.svg', note: '下横略弯' },
          ],
          story: '两道横就是「二」，简单直接。写的时候上面短一点，下面长一点，站得才稳。',
          words: ['二个', '第二', '独一无二'],
        },
        {
          id: 'hf8-3', char: '三', pinyin: 'sān', strokes: 3, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he076-san1-ob.svg', note: '三道横' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he076-san1-bronze.svg', note: '三横齐整' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he076-san1-seal.svg', note: '末横带弧' },
          ],
          story: '三道横就是「三」。古人认为「三」表示多：三思、三人行，都用了三的「多」意思。',
          words: ['三个', '第三', '三心二意'],
        },
        {
          id: 'hf8-4', char: '四', pinyin: 'sì', strokes: 5, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he077-si4-ob.svg', note: '四道横排起来' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he077-si4-bronze.svg', note: '改成方框加八' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he077-si4-seal.svg', note: '囗中一个八' },
          ],
          story: '最早的「四」就是四道横，和一二三一样老实。后来借了一个表示鼻孔出气的字来当四——方框里一个「八」，四道横才退休。',
          words: ['四个', '第四', '四季'],
        },
        {
          id: 'hf8-5', char: '五', pinyin: 'wǔ', strokes: 4, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he078-wu3-ob.svg', note: '上下两横夹个交叉' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he078-wu3-bronze.svg', note: '交叉变弯曲' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he078-wu3-seal.svg', note: '写齐整了' },
          ],
          story: '上下两横，中间一个交叉——有人说像收绳打结，有人说像五行交汇。总之「五」是个记号，五横画不过来，古人想了个巧妙的写法。',
          words: ['五个', '第五', '五彩'],
        },
        {
          id: 'hf8-6', char: '六', pinyin: 'liù', strokes: 4, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he079-liu4-ob.svg', note: '像两根柱子搭的棚屋' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he079-liu4-bronze.svg', note: '屋形规整' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he079-liu4-seal.svg', note: '点横分家' },
          ],
          story: '「六」本来画的是一间尖顶小棚屋，后来被借去当数字，棚屋的意思就交给「庐」了。一个字被借走当数词，这在数字里很常见。',
          words: ['六个', '第六', '六神无主'],
          poly: true,
        },
        {
          id: 'hf8-7', char: '七', pinyin: 'qī', strokes: 2, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he080-qi1-ob.svg', note: '一横一竖弯像把刀' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he080-qi1-bronze.svg', note: '竖弯明显' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he080-qi1-seal.svg', note: '横竖相接' },
          ],
          story: '「七」原来像一把切断东西的刀，是「切」的本字，被借去当数字后，人们另造了带刀字旁的「切」。写字时要小心，别把「七」和「十」写混了——古代它们长得像，竖弯的那笔是关键。',
          words: ['七个', '第七', '七彩'],
        },
        {
          id: 'hf8-8', char: '八', pinyin: 'bā', strokes: 2, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he081-ba1-ob.svg', note: '两笔相背分开' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he081-ba1-bronze.svg', note: '背势更明显' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he081-ba1-seal.svg', note: '定型两撇点' },
          ],
          story: '两笔往外背，像把东西分开——「八」的本义是「分」。所以「分」字底下有个「八」，「扒开」的扒也有它。两笔分开，被借去当数字了。',
          words: ['八个', '第八', '八方'],
          poly: true,
        },
        {
          id: 'hf8-9', char: '九', pinyin: 'jiǔ', strokes: 2, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he082-jiu3-ob.svg', note: '像弯着的手臂' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he082-jiu3-bronze.svg', note: '肘弯更突出' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he082-jiu3-seal.svg', note: '一笔弯到底' },
          ],
          story: '「九」像一只弯起来的胳膊肘，本义是「肘」，被借去当数字。九是单个数字里最大的，古人特别看重它：九天、九重门、九九归一。',
          words: ['九个', '第九', '九牛一毛'],
        },
        {
          id: 'hf8-10', char: '十', pinyin: 'shí', strokes: 2, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he083-shi2-ob.svg', note: '一道竖，像打结的绳' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he083-shi2-bronze.svg', note: '中间加粗成点' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he083-shi2-seal.svg', note: '点变横' },
          ],
          story: '古人结绳记事，「十」像绳子中间打的一个大结；也有人说是一竖记满了一捆。后来加粗成点，再变成一横——一横一竖，就是十。',
          words: ['十个', '第十', '十全十美'],
        },
        {
          id: 'hf8-11', char: '万', pinyin: 'wàn', strokes: 3, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he084-wan4-ob.svg', note: '借「萬」，像一只蝎子' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he084-wan4-bronze.svg', note: '大钳子还在' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he084-wan4-seal.svg', note: '草字头加蝎身' },
          ],
          story: '猜猜看——「万」最早是一只蝎子！大钳子、带毒钩的尾巴都画全了。蝎子成群出没，多得数不清，古人就让它表示大数：万水千山、百万。简化字三笔写完，蝎子藏起来了。',
          words: ['一万', '万物', '千万'],
          poly: true,
        },
      ],
    },
    {
      id: 'hf9', no: '第九族', name: '四方与上下', emoji: '🧭', color: '#5d7d2a',
      intro: '上下东西南北，方向看不见摸不着，古人怎么用字表示？',
      goals: ['记住方向字的来历', '理解假借的意思'],
      points: [
        {
          id: 'hf9-1', char: '上', pinyin: 'shàng', strokes: 3, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he085-shang4-ob.svg', note: '长横上点个短记号' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he085-shang4-bronze.svg', note: '点变短横' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he085-shang4-seal.svg', note: '竖提加横' },
          ],
          story: '一条长横是地面，上面点一个短记号——在上面，就是「上」。这个短记号不是画东西，只是指个位置，这种造字法叫「指事」。',
          words: ['上面', '上学', '向上'],
          poly: true,
        },
        {
          id: 'hf9-2', char: '下', pinyin: 'xià', strokes: 3, type: '指事',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he086-xia4-ob.svg', note: '长横下点个短记号' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he086-xia4-bronze.svg', note: '记号变短横' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he086-xia4-seal.svg', note: '横下竖点' },
          ],
          story: '和「上」正好相反：长横之上加记号是上，长横之下加记号就是「下」。一对最简单的字，方向感全在长横的两边。',
          words: ['下面', '下雨', '上下'],
          poly: true,
        },
        {
          id: 'hf9-3', char: '中', pinyin: 'zhōng', strokes: 4, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he087-zhong1-ob.svg', note: '旗杆穿过圆圈立在中央' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he087-zhong1-bronze.svg', note: '旗穗飘动' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he087-zhong1-seal.svg', note: '口加一竖' },
          ],
          story: '一根旗杆穿过圆圈，立在营地正中央——集合时大家朝着旗帜走过来，这面旗子永远在「中」。所以中国、中心，都是最正中间的意思。',
          words: ['中间', '中心', '中国'],
          poly: true,
        },
        {
          id: 'hf9-4', char: '东', pinyin: 'dōng', strokes: 5, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he088-dong1-ob.svg', note: '一个两头扎紧的行囊' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he088-dong1-bronze.svg', note: '包袱鼓起来' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he088-dong1-seal.svg', note: '写进日和木' },
          ],
          story: '「东」原本是一个两头扎紧的大行囊，出门用的袋子。它被借去表示太阳升起的方向，本义就交给「橐」这些字了。人们还给它编了个好记的说法：太阳升到树中间，就是东。',
          words: ['东方', '东西', '东风'],
        },
        {
          id: 'hf9-5', char: '西', pinyin: 'xī', strokes: 6, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he089-xi1-ob.svg', note: '一个编织的小鸟巢' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he089-xi1-bronze.svg', note: '巢形完整' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he089-xi1-seal.svg', note: '巢里添一笔' },
          ],
          story: '太阳落山时，鸟儿飞回窝里——「西」画的就是一个鸟巢，本义是鸟栖息的地方，被借去表示日落的方向。傍晚往西看，鸟儿正归巢。',
          words: ['西方', '西风', '西边'],
          poly: true,
        },
        {
          id: 'hf9-6', char: '南', pinyin: 'nán', strokes: 9, type: '假借',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he090-nan2-ob.svg', note: '像挂起来的钟鼓乐器' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he090-nan2-bronze.svg', note: '吊绳可见' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he090-nan2-seal.svg', note: '外面加了十' },
          ],
          story: '「南」画的是一种挂起来的打击乐器，敲起来嘭嘭响。它被借去表示方向后，乐器另找名字去了。朝南的屋子阳光最好，所以古人建房都选「坐北朝南」。',
          words: ['南方', '南北', '指南针'],
          poly: true,
        },
        {
          id: 'hf9-7', char: '北', pinyin: 'běi', strokes: 5, type: '象形',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he091-bei3-ob.svg', note: '两个人背靠背' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he091-bei3-bronze.svg', note: '背身更明显' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he091-bei3-seal.svg', note: '两人相背' },
          ],
          story: '两个人背对背站着，就是「北」——它本来是「背」的本字。太阳朝南照，北面背着光，最冷最暗的方向就叫「北」。打败仗转身逃跑叫「败北」，也是这个背。',
          words: ['北方', '北风', '败北'],
        },
      ],
    },
    {
      id: 'hf10', no: '第十族', name: '家里的时光', emoji: '🏠', color: '#c07a2f',
      intro: '屋子里的家、窗前的月亮、田里的收成，日子过成了字。',
      goals: ['认识几个会意字', '发现很多意思来自生活'],
      points: [
        {
          id: 'hf10-1', char: '家', pinyin: 'jiā', strokes: 10, type: '会意',
          forms: [
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he092-jia1-bronze.svg', note: '屋顶下养着头猪' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he092-jia1-seal.svg', note: '宀下有豕' },
          ],
          story: '宝盖头是屋顶，里面养的却是一头猪「豕」！上古人家在屋里养猪，有猪有屋才算安顿下来。「家」告诉你：家不只是房子，还得过日子。',
          words: ['家人', '回家', '大家'],
          poly: true,
        },
        {
          id: 'hf10-2', char: '安', pinyin: 'ān', strokes: 6, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he093-an1-ob.svg', note: '屋里坐着一位女子' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he093-an1-bronze.svg', note: '人形安稳' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he093-an1-seal.svg', note: '宀下有女' },
          ],
          story: '屋顶下坐着一位安安静静的女子，屋里就安定——古人造「安」字时，觉得家中有人守着，心就稳了。平安、安心，都是这个意思。',
          words: ['安心', '平安', '安静'],
        },
        {
          id: 'hf10-3', char: '明', pinyin: 'míng', strokes: 8, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he094-ming2-ob.svg', note: '月亮照进圆窗' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he094-ming2-bronze.svg', note: '日月同辉' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he094-ming2-seal.svg', note: '定型为日月' },
          ],
          story: '甲骨文的「明」是月光照进窗户的格子——夜里屋里透进月光，多亮堂！后来写成日加月，太阳月亮一起照，当然是「明」。聪明、明亮都由它来。',
          words: ['明天', '明亮', '聪明'],
          poly: true,
        },
        {
          id: 'hf10-4', char: '旦', pinyin: 'dàn', strokes: 5, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he095-dan4-ob.svg', note: '太阳跳出地面' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he095-dan4-bronze.svg', note: '地面变成实块' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he095-dan4-seal.svg', note: '日下一横' },
          ],
          story: '太阳刚从地平线上冒头，就是「旦」——天亮了。下面那一横不是数字一，是大地。元旦的旦，就是新年的第一天早晨。',
          words: ['元旦', '通宵达旦', '旦夕'],
        },
        {
          id: 'hf10-5', char: '莫', pinyin: 'mò', strokes: 10, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he096-mo4-ob.svg', note: '太阳落进草丛里' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he096-mo4-bronze.svg', note: '草更茂密' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he096-mo4-seal.svg', note: '日在四草中' },
          ],
          story: '太阳沉到草丛里去了，天快黑了——这就是「莫」，它是「暮」的本字。后来「莫」被借去表示「不要、没有谁」，人们另造了带日的「暮」来写傍晚。别看错了，「莫」里的日被草包在中间。',
          words: ['莫名其妙', '莫非', '莫说'],
          poly: true,
        },
        {
          id: 'hf10-6', char: '春', pinyin: 'chūn', strokes: 9, type: '形声',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he097-chun1-ob.svg', note: '草木从土里拱出来' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he097-chun1-bronze.svg', note: '加了日字' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he097-chun1-seal.svg', note: '萅字成形' },
          ],
          story: '春天一到，藏在土里的草木芽一起拱出来、伸展开——甲骨文的「春」画的就是这个。后来加上太阳，写成草字头加屯加日，慢慢简化成今天的「春」。',
          words: ['春天', '春节', '新春'],
        },
        {
          id: 'hf10-7', char: '秋', pinyin: 'qiū', strokes: 9, type: '形声',
          forms: [
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he098-qiu1-seal.svg', note: '禾谷与火的组合' },
          ],
          story: '禾谷熟了，人们烧掉田里的秸秆准备来年播种，有禾有火的时节就是「秋」。有人说甲骨文的秋画的是一只秋天叫个不停的蟋蟀——秋风一起，蟋蟀就搬进了屋子。',
          words: ['秋天', '秋风', '秋千'],
        },
        {
          id: 'hf10-8', char: '年', pinyin: 'nián', strokes: 6, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he099-nian2-ob.svg', note: '一个人背着沉甸甸的禾' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he099-nian2-bronze.svg', note: '谷穗压弯了背' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he099-nian2-seal.svg', note: '禾下千声' },
          ],
          story: '一个人弓着背，把一大捆成熟的谷子扛回家——丰收了！谷物一年熟一次，「年」就从收获变成了时间的单位。过年庆祝的，本来就是丰收。',
          words: ['过年', '新年', '年龄'],
        },
        {
          id: 'hf10-9', char: '学', pinyin: 'xué', strokes: 8, type: '会意',
          forms: [
            { stage: 'ob', label: '甲骨文', img: 'images/glyphs/he100-xue2-ob.svg', note: '双手摆弄算筹' },
            { stage: 'bronze', label: '金文', img: 'images/glyphs/he100-xue2-bronze.svg', note: '加上了屋顶和小孩' },
            { stage: 'seal', label: '小篆', img: 'images/glyphs/he100-xue2-seal.svg', note: '學字成形' },
          ],
          story: '两只小手摆弄着算筹，这就是最早的学习。后来加上屋顶和小孩——孩子坐在屋子里学算术，「学」就定型了。简化的「学」，上面还留着那双手。',
          words: ['学习', '学生', '学校'],
        },
      ],
    },
  ],
  /* 馆前必读：先知道什么是甲骨文，再进馆。 */
  hall: {
    lead: '每一个汉字都活着：从刻在龟甲上的笔画，长成今天课本里的模样。',
    discovery: {
      title: '一片「龙骨」上的大发现',
      text: '一百多年前，学者王懿荣生病抓药，在一味叫「龙骨」的药材上发现了一点一划的刻痕——那不是乱划，是字！这些刻着字的龟甲兽骨，来自三千多年前的商朝。人们后来在河南安阳挖出了成千上万片，甲骨文从此重见天日，汉字的童年也被找到了。',
    },
    stages: [
      { id: 'ob', name: '甲骨文', when: '商朝 · 约 3000 多年前', emoji: '🐢', text: '刻在龟甲和兽骨上，用来占卜记事。笔画细硬，字形像简笔画，同一个字常有几十种写法。' },
      { id: 'bronze', name: '金文', when: '商周 · 约 3000 年前', emoji: '🫖', text: '铸在青铜钟鼎上，也叫钟鼎文。笔画浑厚，比甲骨文更整齐，记载着祭祀和战功。' },
      { id: 'seal', name: '小篆', when: '秦朝 · 约 2200 多年前', emoji: '📜', text: '秦始皇统一六国后，把各国不同的写法整理成统一的字体，字形修长匀称，是汉字第一次「书同文」。' },
      { id: 'kai', name: '楷书', when: '汉魏以后 · 沿用至今', emoji: '🖌️', text: '横平竖直，一笔一画，好认好写。我们从一年级学的字，就是楷书。' },
    ],
    credit: '古字形图片来自汉字叔叔字源网（hanziyuan.net），由 Richard Sears 数十年搜集整理。',
  },
  /* 六书速查：古人造字的六种办法。 */
  sixbooks: [
    { name: '象形', emoji: '🖼️', text: '照着东西的样子画字。', examples: ['日', '山', '马'] },
    { name: '指事', emoji: '👆', text: '在图画或记号上点一笔，指出看不见的意思。', examples: ['上', '下', '十'] },
    { name: '会意', emoji: '🧩', text: '把几个部件拼在一起，合出一个新意思。', examples: ['明', '休', '家'] },
    { name: '形声', emoji: '🎵', text: '一半表示意思，一半提示读音，汉字的大多数都是这种。', examples: ['星', '雪', '雷'] },
    { name: '假借', emoji: '🎭', text: '一个现成的字读音正好相同，就借来表示新词。', examples: ['万', '东', '西'] },
    { name: '转注', emoji: '🔁', text: '意思相近的字互相解释，是文字学家的专门话题，馆里的字先不细讲。', examples: [] },
  ],
};

if (typeof module !== 'undefined' && module.exports) module.exports = HANZI_EVO;
if (typeof window !== 'undefined') window.HANZI_EVO = HANZI_EVO;
