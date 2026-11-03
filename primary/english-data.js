/* ============================================================
   乐学堂 · 教材同步英语
   外研版《英语（新标准）》三年级起点（2022 年新课标教材）
   四年级上册（2025 秋）+ 四年级下册（2026 春）

   w(英文, 音标, 中文, 示意图, 分段, 可选记忆提示)
   分段用 | 隔开；留空则整词认读。词卡相关词自动取同单元相邻词。
   ============================================================ */
'use strict';

function w(en, ipa, zh, emoji, segments, memo) {
  return { en, ipa, zh, emoji: emoji || '', segments: segments || '', memo: memo || '' };
}

const ENGLISH_UNITS = [
  {
    id: '4a-u1', book: '四年级上册', name: 'Unit 1  I love sports', zh: '我爱运动', emoji: '⚽', color: '#4d96ff',
    words: [
      w('sport', '/spɔːt/', 'n. 运动', '⚽', 'sp|ort'),
      w('jump', '/dʒʌmp/', 'v. 跳', '🦘', 'j|ump'),
      w('high', '/haɪ/', 'adv. 高高地', '⬆️', 'h|igh'),
      w('far', '/fɑː/', 'adv. 远', '🏃', 'f|ar'),
      w('ping-pong', '/ˈpɪŋ pɒŋ/', 'n. 乒乓球运动', '🏓', 'ping|pong'),
      w('volleyball', '/ˈvɒlibɔːl/', 'n. 排球（运动）', '🏐', 'vo|lley|ball'),
      w('first', '/fɜːst/', 'adv. 最初；首先', '1️⃣', 'f|ir|st'),
      w('at first', '/æt fɜːst/', '起初', '🌱', 'at|first'),
      w('hope', '/həʊp/', 'v. & n. 希望', '🌟', 'h|ope'),
      w('lose', '/luːz/', 'v. 失去；（比赛）输', '😔', 'l|ose'),
      w('because', '/bɪˈkɒz/', 'conj. 因为', '💭', 'be|cause'),
      w('because of', '/bɪˈkɒz əv/', '因为；由于', '👉', 'because|of'),
      w('cancer', '/ˈkænsə/', 'n. 癌（症）', '🎗️', 'can|cer'),
      w('across', '/əˈkrɒs/', 'prep. 横跨；从一边到另一边', '🌉', 'a|cross'),
      w('money', '/ˈmʌni/', 'n. 钱', '🪙', 'mo|ney'),
      w('hard', '/hɑːd/', 'adj. 困难的；adv. 努力地', '💪', 'h|ar|d'),
      w('kind', '/kaɪnd/', 'adj. 友善的', '🤝', 'k|ind'),
      w('keep', '/kiːp/', 'v. 持续；保持', '🔁', 'k|eep'),
      w('month', '/mʌnθ/', 'n. 月', '📅', 'm|on|th'),
      w('ill', '/ɪl/', 'adj. 生病的', '🤒', 'ill'),
      w('year', '/jɪə/', 'n. 年；年度', '🗓️', 'y|ear'),
      w('remember', '/rɪˈmembə/', 'v. 纪念；记住', '🧠', 're|mem|ber'),
      w('fail', '/feɪl/', 'v. 失败', '🌧️', 'f|ail'),
      w('give', '/ɡɪv/', 'v. 给予', '🎁', 'g|ive'),
      w('give up', '/ɡɪv ʌp/', '放弃', '🏳️', 'give|up'),
      w('never', '/ˈnevə/', 'adv. 决不；永不', '🚫', 'ne|ver'),
      w('try', '/traɪ/', 'v. 努力；尝试', '🎯', 'tr|y'),
      w('player', '/ˈpleɪə/', 'n. 运动员；选手', '🏅', 'play|er', 'play（玩、参加运动）加 -er，表示参加运动的人。'),
      w('ability', '/əˈbɪləti/', 'n. 能力', '💡', 'a|bi|li|ty'),
    ],
  },
  {
    id: '4a-u2', book: '四年级上册', name: 'Unit 2  Helping at home', zh: '在家帮忙', emoji: '🏠', color: '#9b5de5',
    words: [
      w('phew', '/fjuː/', 'interj. 啊；唷；唉', '😮‍💨', 'ph|ew'),
      w('wash', '/wɒʃ/', 'v. 洗', '🧼', 'w|ash'),
      w('dish', '/dɪʃ/', 'n. 盘子；碟子', '🍽️', 'd|ish'),
      w('feed', '/fiːd/', 'v. 喂养；给……食物', '🐕', 'f|eed'),
      w('sweep', '/swiːp/', 'v. 扫；打扫', '🧹', 'sw|eep'),
      w('floor', '/flɔː/', 'n. 地板；地面', '🪵', 'fl|oor'),
      w('rubbish', '/ˈrʌbɪʃ/', 'n. 垃圾', '🗑️', 'rub|bish'),
      w('chore', '/tʃɔː/', 'n. 家庭杂务', '📋', 'ch|ore'),
      w('to-do list', '/tuː duː lɪst/', 'n. 待办清单', '✅', 'to|do|list'),
      w('may', '/meɪ/', 'modal v. 可以（表示允许）', '🙋', 'm|ay'),
      w('outside', '/ˌaʊtˈsaɪd/', 'adv. & prep. 在室外', '🌳', 'out|side'),
      w('tidy', '/ˈtaɪdi/', 'v. 整理；adj. 整洁的', '🧺', 'ti|dy'),
      w('easy', '/ˈiːzi/', 'adj. 容易的', '😊', 'ea|sy'),
      w('clean', '/kliːn/', 'adj. 清洁的；v. 打扫', '✨', 'cl|ean'),
      w('woof', '/wʊf/', 'interj. 汪汪（狗吠声）', '🐶', 'w|oo|f'),
      w('job', '/dʒɒb/', 'n. 任务；事情；工作', '🧰', 'j|ob'),
      w('good job', '/ɡʊd dʒɒb/', '干得好；真不错', '👍', 'good|job'),
      w('dirty', '/ˈdɜːti/', 'adj. 脏的', '🟤', 'd|ir|ty'),
      w('desk', '/desk/', 'n. 书桌；写字台', '🪑', 'd|e|sk'),
      w('wall', '/wɔːl/', 'n. 墙', '🧱', 'w|all'),
      w('again', '/əˈɡen/', 'adv. 再一次', '🔁', 'a|gain'),
      w('also', '/ˈɔːlsəʊ/', 'adv. 除此之外；还', '➕', 'al|so'),
      w('problem', '/ˈprɒbləm/', 'n. 问题', '❓', 'pro|blem'),
      w('finish', '/ˈfɪnɪʃ/', 'v. 完成；做完', '🏁', 'fi|nish'),
      w('sunshine', '/ˈsʌnʃaɪn/', 'n. 阳光；幸福', '☀️', 'sun|shine', 'sun（太阳）+ shine（照耀），合起来就是阳光。'),
      w('sometimes', '/ˈsʌmtaɪmz/', 'adv. 有时', '🕰️', 'some|times'),
      w('feel', '/fiːl/', 'v. 感受到；觉得', '💗', 'f|ee|l'),
      w('tired', '/ˈtaɪəd/', 'adj. 困倦的；疲惫的', '🥱', 't|i|red'),
      w('helpful', '/ˈhelpfəl/', 'adj. 有用的；有帮助的', '🤲', 'help|ful', 'help（帮助）+ -ful（充满……的），就是乐于助人的。'),
      w('warm', '/wɔːm/', 'adj. 温暖的；v. （使）变暖', '🔥', 'w|ar|m'),
      w('warm up', '/wɔːm ʌp/', '（使）变暖；热身', '🏋️', 'warm|up'),
      w('water', '/ˈwɔːtə/', 'n. 水；v. 给……浇水', '💧', 'wa|ter'),
      w('yard', '/jɑːd/', 'n. 庭院', '🏡', 'y|ar|d'),
      w('helper', '/ˈhelpə/', 'n. 帮手；助手', '🙌', 'help|er'),
      w('pick', '/pɪk/', 'v. 采；摘', '🍎', 'p|i|ck'),
      w('pig', '/pɪɡ/', 'n. 猪', '🐷', 'p|i|g'),
      w('cow', '/kaʊ/', 'n. 母牛；奶牛', '🐄', 'c|ow'),
      w('collect', '/kəˈlekt/', 'v. 收集；采集', '🧺', 'co|llect'),
      w('cut', '/kʌt/', 'v. 修剪；切；割', '✂️', 'c|u|t'),
      w('grass', '/ɡrɑːs/', 'n. 草；青草', '🌱', 'gr|ass'),
    ],
  },
  {
    id: '4a-u3', book: '四年级上册', name: 'Unit 3  What\'s the weather like?', zh: '天气怎么样', emoji: '🌦️', color: '#00a8a8',
    words: [
      w('weather', '/ˈweðə/', 'n. 天气', '🌦️', 'wea|ther'),
      w('sunny', '/ˈsʌni/', 'adj. 阳光充足的', '☀️', 'sun|ny'),
      w('cloud', '/klaʊd/', 'n. 云', '☁️', 'cl|ou|d'),
      w('by', '/baɪ/', 'prep. 经过；乘坐', '🚶', 'b|y'),
      w('cloudy', '/ˈklaʊdi/', 'adj. 多云的；阴天的', '⛅', 'cloud|y'),
      w('wind', '/wɪnd/', 'n. 风', '🍃', 'w|in|d'),
      w('blow', '/bləʊ/', 'v. 吹；刮', '🌬️', 'bl|ow'),
      w('windy', '/ˈwɪndi/', 'adj. 风大的；多风的', '🌬️', 'wind|y'),
      w('rain', '/reɪn/', 'n. 雨；v. 下雨', '🌧️', 'r|ain'),
      w('rainy', '/ˈreɪni/', 'adj. 多雨的', '☔', 'rain|y'),
      w('snow', '/snəʊ/', 'n. 雪；v. 下雪', '❄️', 'sn|ow'),
      w('any', '/ˈeni/', 'det. 任何一个；一些', '🔍', 'a|ny'),
      w('cold', '/kəʊld/', 'adj. 冷的；寒冷的', '🥶', 'c|ol|d'),
      w('or', '/ɔː/', 'conj. 或者', '↔️', 'or'),
      w('enjoy', '/ɪnˈdʒɔɪ/', 'v. 享受……的乐趣', '😄', 'en|joy'),
      w('diary', '/ˈdaɪəri/', 'n. 日记', '📔', 'di|a|ry'),
      w('special', '/ˈspeʃl/', 'adj. 特殊的；特别的', '⭐', 'spe|cial'),
      w('teacher', '/ˈtiːtʃə/', 'n. 老师', '👩‍🏫', 'teach|er'),
      w('taste', '/teɪst/', 'v. 有……的味道；n. 味道', '👅', 't|a|ste'),
      w('ice cream', '/aɪs kriːm/', 'n. 冰激凌；雪糕', '🍦', 'ice|cream'),
      w('real', '/rɪəl/', 'adj. 真的；真正的', '💯', 'r|eal'),
      w('later', '/ˈleɪtə/', 'adv. 之后；后来', '⏰', 'la|ter'),
      w('surprise', '/səˈpraɪz/', 'n. 意想不到的事；v. 使惊讶', '🎉', 'sur|prise'),
      w('coat', '/kəʊt/', 'n. 外套', '🧥', 'c|oa|t'),
      w('turn', '/tɜːn/', 'v. 转身；转动', '🔄', 't|ur|n'),
      w('turn on', '/tɜːn ɒn/', '打开（电器等）', '💡', 'turn|on'),
      w('TV', '/ˌtiː ˈviː/', 'n. 电视', '📺', 'T|V'),
      w('report', '/rɪˈpɔːt/', 'n. & v. 报道', '📰', 're|port'),
    ],
  },
  {
    id: '4a-u4', book: '四年级上册', name: 'Unit 4  Wonderful seasons', zh: '美好的四季', emoji: '🍂', color: '#e58a32',
    words: [
      w('season', '/ˈsiːzn/', 'n. 季节', '🍃', 'sea|son'),
      w('spring', '/sprɪŋ/', 'n. 春天；春季', '🌸', 'spr|ing'),
      w('summer', '/ˈsʌmə/', 'n. 夏天；夏季', '☀️', 'sum|mer'),
      w('autumn', '/ˈɔːtəm/', 'n. 秋天；秋季', '🍂', 'au|tumn', 'autumn 末尾的 n 不发音，注意不要多读一个音。'),
      w('winter', '/ˈwɪntə/', 'n. 冬天；冬季', '⛄', 'win|ter'),
      w('favourite', '/ˈfeɪvərɪt/', 'adj. 最喜欢的', '💖', 'fa|vou|rite'),
      w('birthday', '/ˈbɜːθdeɪ/', 'n. 生日', '🎂', 'birth|day', 'birth（出生）+ day（日子），出生的日子就是生日。'),
      w('fly', '/flaɪ/', 'v. 放飞；飞', '🕊️', 'fl|y'),
      w('fly kites', '/flaɪ kaɪts/', '放风筝', '🪁', 'fly|kites'),
      w('snowstorm', '/ˈsnəʊstɔːm/', 'n. 雪暴；暴风雪', '🌨️', 'snow|storm', 'snow（雪）+ storm（暴风雨），合起来是暴风雪。'),
      w('beach', '/biːtʃ/', 'n. 海滩', '🏖️', 'b|each'),
      w('sea', '/siː/', 'n. 海；海洋', '🌊', 's|ea'),
      w('equator', '/ɪˈkweɪtə/', 'n. 赤道', '🌍', 'e|qua|tor'),
      w('round', '/raʊnd/', 'adv. 到处；prep. 围绕', '🔄', 'r|oun|d'),
      w('quite', '/kwaɪt/', 'adv. 非常；十分', '👏', 'qu|ite'),
      w('join', '/dʒɔɪn/', 'v. 参与；加入', '🤝', 'j|oi|n'),
    ],
  },
  {
    id: '4a-u5', book: '四年级上册', name: 'Unit 5  Let\'s go!', zh: '我们出发吧', emoji: '🚌', color: '#ef6a67',
    words: [
      w('bus', '/bʌs/', 'n. 公交车；公共汽车', '🚌', 'b|u|s'),
      w('car', '/kɑː/', 'n. 汽车', '🚗', 'c|ar'),
      w('train', '/treɪn/', 'n. 火车；列车', '🚆', 'tr|ain'),
      w('city', '/ˈsɪti/', 'n. 城市', '🏙️', 'ci|ty'),
      w('town', '/taʊn/', 'n. 镇；城镇', '🏘️', 't|ow|n'),
      w('plane', '/pleɪn/', 'n. 飞机', '✈️', 'pl|ane'),
      w('sky', '/skaɪ/', 'n. 天；天空', '🌤️', 'sk|y'),
      w('ship', '/ʃɪp/', 'n. 大船', '🚢', 'sh|i|p'),
      w('place', '/pleɪs/', 'n. 地方；地点', '📍', 'pl|ace'),
      w('near', '/nɪə/', 'adj. & prep. （距离）近的', '📌', 'n|ear'),
      w('travel', '/ˈtrævl/', 'v. & n. 旅行', '🧳', 'tra|vel'),
      w('way', '/weɪ/', 'n. 方式；方法；路', '🛣️', 'w|ay'),
      w('picnic', '/ˈpɪknɪk/', 'n. 野餐', '🧺', 'pic|nic'),
      w('minute', '/ˈmɪnɪt/', 'n. 分钟', '⏱️', 'mi|nute'),
      w('wear', '/weə/', 'v. 穿；戴', '👕', 'w|ear'),
      w('live', '/lɪv/', 'v. 住；居住', '🏠', 'l|i|ve'),
      w('away', '/əˈweɪ/', 'adv. 离开；相距', '↗️', 'a|way'),
      w('truck', '/trʌk/', 'n. 货车；卡车', '🚚', 'tr|u|ck'),
      w('bamboo', '/ˌbæmˈbuː/', 'n. 竹；竹子', '🎋', 'bam|boo'),
      w('airport', '/ˈeəpɔːt/', 'n. 机场', '🛫', 'air|port', 'air（航空）+ port（港），飞机起降的港就是机场。'),
      w('bike', '/baɪk/', 'n. 自行车', '🚲', 'b|i|ke'),
      w('ring', '/rɪŋ/', 'v. （钟、铃）鸣响', '🔔', 'r|i|ng'),
      w('beep', '/biːp/', 'v. & n. （汽车喇叭）鸣响', '📣', 'b|ee|p'),
      w('subway', '/ˈsʌbweɪ/', 'n. 地铁', '🚇', 'sub|way'),
      w('whoosh', '/wʊʃ/', 'v. & n. （呼呼地）飞快移动', '💨', 'wh|oo|sh'),
      w('tram', '/træm/', 'n. 有轨电车', '🚊', 'tr|a|m'),
      w('chug', '/tʃʌɡ/', 'v. （汽车、火车等）突突地缓慢前进', '🚂', 'ch|u|g'),
    ],
  },
  {
    id: '4a-u6', book: '四年级上册', name: 'Unit 6  Find your way', zh: '找到你的路', emoji: '🗺️', color: '#5271c4',
    words: [
      w('wheel', '/wiːl/', 'n. 车轮', '🛞', 'wh|ee|l'),
      w('left', '/left/', 'adv. & n. 向左；左边', '⬅️', 'l|e|ft'),
      w('straight', '/streɪt/', 'adv. 笔直地', '⬆️', 'str|ai|ght', 'straight 中的 igh 读 /aɪ/，整词不要逐字母拼读。'),
      w('library', '/ˈlaɪbrəri/', 'n. 图书室；图书馆', '📚', 'li|bra|ry'),
      w('centre', '/ˈsentə/', 'n. 中心', '🎯', 'cen|tre'),
      w('cinema', '/ˈsɪnəmə/', 'n. 电影院', '🎬', 'ci|ne|ma'),
      w('hospital', '/ˈhɒspɪtl/', 'n. 医院', '🏥', 'ho|spi|tal'),
      w('supermarket', '/ˈsuːpəmɑːkɪt/', 'n. 超市', '🛒', 'su|per|mar|ket', 'super（超级）+ market（市场），合起来就是超市。'),
      w('museum', '/mjuˈziːəm/', 'n. 博物馆；博物院', '🏛️', 'mu|se|um'),
      w('tomorrow', '/təˈmɒrəʊ/', 'adv. & n. 明天', '🌅', 'to|mo|rrow'),
      w('woman', '/ˈwʊmən/', 'n. 女性；女人', '👩', 'wo|man', 'woman 单数读 /ˈwʊmən/；复数 women 的读音不同。'),
      w('excuse', '/ɪkˈskjuːz/', 'v. 原谅', '🙏', 'ex|cuse'),
      w('excuse me', '/ɪkˈskjuːz miː/', '劳驾；打扰一下；对不起', '🙋', 'excuse|me'),
      w('wish', '/wɪʃ/', 'v. & n. 希望；愿望', '🌠', 'w|i|sh'),
      w('true', '/truː/', 'adj. 真的；真实的', '✅', 'tr|ue'),
      w('step', '/step/', 'n. 步；步骤', '👣', 'st|e|p'),
      w('own', '/əʊn/', 'adj. 自己的', '🔑', 'ow|n'),
      w('cross', '/krɒs/', 'v. 横穿', '🚸', 'cr|o|ss'),
      w('careful', '/ˈkeəfəl/', 'adj. 谨慎的；小心的', '⚠️', 'care|ful'),
      w('be careful', '/biː ˈkeəfəl/', '当心；小心', '🚧', 'be|careful'),
      w('underground', '/ˈʌndəɡraʊnd/', 'adv. 在地（面）下；n. 地铁', '🚇', 'under|ground', 'under（在下面）+ ground（地面），就是在地底下。'),
    ],
  },
  {
    id: '4b-u1', book: '四年级下册', name: 'Unit 1  People at work', zh: '工作中的人们', emoji: '👩‍⚕️', color: '#4d96ff',
    words: [
      w('doctor', '/ˈdɒktə/', 'n. 医生；大夫', '🧑‍⚕️', 'doc|tor'),
      w('fireman', '/ˈfaɪəmən/', 'n. 消防队员', '🧑‍🚒', 'fire|man', 'fire（火）+ man（人），指救火的人。'),
      w('farmer', '/ˈfɑːmə/', 'n. 农民；农场主', '🧑‍🌾', 'farm|er'),
      w('cook', '/kʊk/', 'n. 厨师；v. 烹饪', '🧑‍🍳', 'c|oo|k'),
      w('police', '/pəˈliːs/', 'n. 警察', '👮', 'po|lice'),
      w('police officer', '/pəˈliːs ˈɒfɪsə/', 'n. 警察；警官', '👮', 'police|officer'),
      w('station', '/ˈsteɪʃn/', 'n. 所；站；台；局', '🚉', 'sta|tion'),
      w('police station', '/pəˈliːs ˈsteɪʃn/', 'n. 警察（分）局；派出所', '🏢', 'police|station'),
      w('often', '/ˈɒfn/', 'adv. 经常；时常；多次', '🔁', 'of|ten'),
      w('field', '/fiːld/', 'n. 田地；田野', '🌾', 'f|ie|ld'),
      w('painter', '/ˈpeɪntə/', 'n. 画家', '🧑‍🎨', 'paint|er'),
      w('use', '/juːz/', 'v. 用；使用', '🖌️', 'u|se'),
      w('brush', '/brʌʃ/', 'n. 刷子；毛刷；画笔', '🖌️', 'br|u|sh'),
      w('scientist', '/ˈsaɪəntɪst/', 'n. 科学家', '🧑‍🔬', 'sci|en|tist'),
      w('writer', '/ˈraɪtə/', 'n. 作家；作者', '✍️', 'writ|er', 'write（写）去 e 加 -er，表示写作的人；w 不发音。'),
      w('worker', '/ˈwɜːkə/', 'n. 工人', '👷', 'work|er'),
      w('aunt', '/ɑːnt/', 'n. 姑母；姨母', '👩', 'a|un|t'),
      w('night', '/naɪt/', 'n. 夜晚；夜间', '🌙', 'n|ight'),
      w('owl', '/aʊl/', 'n. 猫头鹰', '🦉', 'ow|l'),
      w('night owl', '/naɪt aʊl/', '夜猫子；喜欢熬夜的人', '🦉', 'night|owl'),
      w('driver', '/ˈdraɪvə/', 'n. 司机；驾驶员', '🧑‍✈️', 'driv|er'),
      w('taxi', '/ˈtæksi/', 'n. 出租车；计程车', '🚕', 'tax|i'),
      w('safe', '/seɪf/', 'adj. 安全的；没有危险的', '🛡️', 's|a|fe'),
      w('nurse', '/nɜːs/', 'n. 护士', '👩‍⚕️', 'n|ur|se'),
      w('light', '/laɪt/', 'v. 照亮；n. 灯；光', '💡', 'l|ight'),
      w('uncle', '/ˈʌŋkl/', 'n. 叔叔；伯伯', '👨', 'un|cle'),
      w('bake', '/beɪk/', 'v. 烤；烘；焙', '🍰', 'b|a|ke'),
      w('bee', '/biː/', 'n. 蜜蜂', '🐝', 'b|ee'),
      w('same', '/seɪm/', 'adj. 相同的；一模一样的', '🟰', 's|a|me'),
      w('sound', '/saʊnd/', 'n. 声；声音', '🔊', 's|oun|d'),
      w('postman', '/ˈpəʊstmən/', 'n. 邮递员', '📮', 'post|man', 'post（邮件）+ man（人），指投递邮件的人。'),
      w('life', '/laɪf/', 'n. 生活；一生', '🌱', 'l|i|fe'),
      w('mountain', '/ˈmaʊntən/', 'n. 高山', '⛰️', 'moun|tain'),
    ],
  },
  {
    id: '4b-u2', book: '四年级下册', name: 'Unit 2  How do you feel today?', zh: '你今天感觉怎么样', emoji: '😊', color: '#9b5de5',
    words: [
      w('laugh', '/lɑːf/', 'v. 发出笑声；（大）笑', '😂', 'l|augh', 'laugh 中 augh 读 /ɑːf/，是特殊拼读，要整体记住。'),
      w('sad', '/sæd/', 'adj. 伤心的；难过的', '😢', 's|a|d'),
      w('cry', '/kraɪ/', 'v. 哭；哭泣', '😭', 'cr|y'),
      w('angry', '/ˈæŋɡri/', 'adj. 发怒的；生气的', '😠', 'ang|ry'),
      w('frown', '/fraʊn/', 'v. 皱眉', '☹️', 'fr|ow|n'),
      w('scared', '/skeəd/', 'adj. 害怕的；恐惧的；紧张的', '😨', 'sc|a|red'),
      w('shake', '/ʃeɪk/', 'v. 发抖；颤抖；摇动', '🫨', 'sh|a|ke'),
      w('excited', '/ɪkˈsaɪtɪd/', 'adj. 兴奋的；激动的', '🤩', 'ex|ci|ted'),
      w('opera', '/ˈɒpərə/', 'n. 歌剧；歌剧艺术', '🎭', 'o|pe|ra'),
      w('next', '/nekst/', 'adj. 紧接着的；下次的', '⏭️', 'n|e|x|t'),
      w('cough', '/kɒf/', 'v. & n. 咳嗽；咳', '😷', 'c|ough', 'cough 中 ough 读 /ɒf/，不能按字母逐个读。'),
      w('better', '/ˈbetə/', 'adj. （健康状况）好转的', '💪', 'be|tter'),
      w('practise', '/ˈpræktɪs/', 'v. 练习；实践；实习', '📝', 'prac|tise'),
      w('gift', '/ɡɪft/', 'n. 礼物', '🎁', 'g|i|ft'),
      w('surprised', '/səˈpraɪzd/', 'adj. 吃惊的；惊奇的', '😲', 'sur|prised'),
      w('model', '/ˈmɒdl/', 'n. （尤指可拼装的）模型', '🚢', 'mo|del'),
      w('bang', '/bæŋ/', 'interj. & n. 砰；啪', '💥', 'b|a|ng'),
      w('shout', '/ʃaʊt/', 'v. 大声说；喊叫；呼喊', '📢', 'sh|ou|t'),
      w('should', '/ʃʊd/', 'modal v. 应当；应该', '💭', 'sh|oul|d', 'should 中 l 不发音，读 /ʃʊd/。'),
      w('break', '/breɪk/', 'v. 使破裂；使破碎；使断裂', '💔', 'br|ea|k'),
      w('feeling', '/ˈfiːlɪŋ/', 'n. 感觉；感触', '💗', 'feel|ing'),
      w('huge', '/hjuːdʒ/', 'adj. 巨大的', '🐘', 'h|u|ge'),
      w('worried', '/ˈwʌrid/', 'adj. 担心的；焦虑的', '😟', 'wor|ried'),
      w('street', '/striːt/', 'n. 大街；街道', '🛣️', 'str|ee|t'),
      w('hit', '/hɪt/', 'v. 撞击；碰撞', '💢', 'h|i|t'),
    ],
  },
  {
    id: '4b-u3', book: '四年级下册', name: 'Unit 3  Everyone\'s got talent!', zh: '人人都有天赋', emoji: '🌟', color: '#e58a32',
    words: [
      w('talent', '/ˈtælənt/', 'n. 天资；天赋；才能', '🌟', 'ta|lent'),
      w('act', '/ækt/', 'v. 演出；扮演', '🎭', 'a|ct'),
      w('magic', '/ˈmædʒɪk/', 'n. 魔术；戏法', '🪄', 'ma|gic'),
      w('shine', '/ʃaɪn/', 'v. 表现突出；发光', '✨', 'sh|i|ne'),
      w('puzzle', '/ˈpʌzl/', 'n. 拼图游戏；谜', '🧩', 'puz|zle'),
      w('dancer', '/ˈdɑːnsə/', 'n. 舞蹈演员', '💃', 'danc|er'),
      w('win', '/wɪn/', 'v. 获胜；赢', '🏆', 'w|i|n'),
      w('just', '/dʒʌst/', 'adv. 就；只是', '👉', 'j|u|st'),
      w('duck', '/dʌk/', 'n. 鸭', '🦆', 'd|u|ck'),
      w('boy', '/bɔɪ/', 'n. 男孩；儿子', '👦', 'b|oy'),
      w('anything', '/ˈeniθɪŋ/', 'pron. 任何事情；无论何事', '💭', 'any|thing', 'any（任何）+ thing（事情），合起来是任何事情。'),
      w('cock-a-doodle-doo', '/ˌkɒk ə duːdl ˈduː/', 'interj. （公鸡啼叫的）喔喔声', '🐓', 'cock|a|doodle|doo'),
      w('enough', '/ɪˈnʌf/', 'det. & adv. 足够（的）', '✅', 'e|nough', 'enough 中 ough 读 /ʌf/，是常见特殊拼读。'),
      w('slowly', '/ˈsləʊli/', 'adv. 缓慢地；慢慢地', '🐢', 'slow|ly'),
    ],
  },
  {
    id: '4b-u4', book: '四年级下册', name: 'Unit 4  Plant life', zh: '植物的一生', emoji: '🌻', color: '#2fbf71',
    words: [
      w('seed', '/siːd/', 'n. 种子；籽', '🌰', 's|ee|d'),
      w('earth', '/ɜːθ/', 'n. 泥土；土壤；地球', '🌍', 'ear|th'),
      w('root', '/ruːt/', 'n. 根', '🌳', 'r|oo|t'),
      w('stem', '/stem/', 'n. （植物的）茎；梗；柄', '🌿', 'st|e|m'),
      w('thin', '/θɪn/', 'adj. 细的；瘦的', '🌱', 'th|i|n'),
      w('leaf', '/liːf/', 'n. 叶；叶子', '🍃', 'l|ea|f', 'leaf 的复数是 leaves，f 要变成 v 再加 -es。'),
      w('dig', '/dɪɡ/', 'v. 挖；掘', '⛏️', 'd|i|g'),
      w('sunflower', '/ˈsʌnflaʊə/', 'n. 向日葵', '🌻', 'sun|flower', 'sun（太阳）+ flower（花），向着太阳的花就是向日葵。'),
      w('wheat', '/wiːt/', 'n. 小麦', '🌾', 'wh|ea|t'),
      w('cotton', '/ˈkɒtn/', 'n. 棉花；棉株', '☁️', 'co|tton'),
      w('plant', '/plɑːnt/', 'v. 种植；n. 植物', '🪴', 'pl|a|nt'),
      w('dream', '/driːm/', 'n. 梦想；愿望；v. 做梦', '💭', 'dr|ea|m'),
      w('sleep', '/sliːp/', 'v. 睡；睡觉', '😴', 'sl|ee|p'),
      w('mouse', '/maʊs/', 'n. 老鼠', '🐁', 'm|ou|se'),
      w('grain', '/ɡreɪn/', 'n. 谷粒', '🌾', 'gr|ai|n'),
      w('miss', '/mɪs/', 'v. 想念；思念；错过', '💛', 'm|i|ss'),
      w('will', '/wɪl/', 'modal v. 将；会；要', '🔮', 'w|i|ll'),
      w('everything', '/ˈevriθɪŋ/', 'pron. 每件事物；所有事物', '🌈', 'every|thing', 'every（每个）+ thing（事物），合起来是所有事物。'),
      w('cabbage', '/ˈkæbɪdʒ/', 'n. 卷心菜；洋白菜；甘蓝', '🥬', 'cab|bage'),
      w('true', '/truː/', 'adj. 真的；真实的', '✅', 'tr|ue'),
      w('come true', '/kʌm truː/', '实现', '🌠', 'come|true'),
      w('paper', '/ˈpeɪpə/', 'n. 纸', '📄', 'pa|per'),
    ],
  },
  {
    id: '4b-u5', book: '四年级下册', name: 'Unit 5  School activities', zh: '学校活动', emoji: '🎨', color: '#00a8a8',
    words: [
      w('event', '/ɪˈvent/', 'n. 活动；事件', '📅', 'e|vent'),
      w('drama', '/ˈdrɑːmə/', 'n. 戏剧', '🎭', 'dra|ma'),
      w('trip', '/trɪp/', 'n. 旅游；旅行；出行', '🎒', 'tr|i|p'),
      w('fair', '/feə/', 'n. 集市；义卖会；户外游艺会', '🎪', 'f|air'),
      w('festival', '/ˈfestɪvl/', 'n. 节；节庆；汇演', '🎊', 'fes|ti|val'),
      w('horn', '/hɔːn/', 'n. 角', '🐂', 'h|or|n'),
      w('dot', '/dɒt/', 'n. 点；小圆点', '🔘', 'd|o|t'),
      w('raindrop', '/ˈreɪndrɒp/', 'n. 雨点；雨滴', '💧', 'rain|drop', 'rain（雨）+ drop（水滴），合起来是雨滴。'),
      w('more', '/mɔː/', 'det. & adv. 更多的', '➕', 'm|ore'),
      w('write', '/raɪt/', 'v. 书写；写字', '✍️', 'wr|i|te', 'write 开头 w 不发音；同音词 right 是“右边；正确的”。'),
      w('those', '/ðəʊz/', 'pron. 那些（that 的复数）', '👉', 'th|o|se'),
      w('forest', '/ˈfɒrɪst/', 'n. 森林；林区', '🌲', 'fo|rest'),
      w('nature', '/ˈneɪtʃə/', 'n. 大自然', '🏞️', 'na|ture'),
      w('hunt', '/hʌnt/', 'v. & n. 搜寻；寻找', '🔎', 'h|u|nt'),
      w('keeper', '/ˈkiːpə/', 'n. 看守人；保管人', '🧑‍🌾', 'keep|er'),
      w('lovely', '/ˈlʌvli/', 'adj. 美好的；可爱的；令人愉快的', '🐦', 'love|ly'),
      w('student', '/ˈstjuːdnt/', 'n. 学生', '🧑‍🎓', 'stu|dent'),
      w('fall', '/fɔːl/', 'v. 落下；降落；跌落', '🍂', 'f|a|ll'),
      w('off', '/ɒf/', 'adv. & prep. 不在（某物）上面；离开', '↘️', 'o|ff'),
      w('fall off', '/fɔːl ɒf/', '（从某物上）掉下；脱落', '🍃', 'fall|off'),
      w('hour', '/ˈaʊə/', 'n. 小时', '🕐', 'h|our', 'hour 开头 h 不发音，读音和 our 相同。'),
      w('culture', '/ˈkʌltʃə/', 'n. 文化', '🏮', 'cul|ture'),
      w('note', '/nəʊt/', 'n. 笔记；记录', '📓', 'n|o|te'),
      w('vote', '/vəʊt/', 'n. 选票；v. 投票', '🗳️', 'v|o|te'),
      w('special', '/ˈspeʃl/', 'adj. 特殊的；特别的', '⭐', 'spe|cial'),
      w('design', '/dɪˈzaɪn/', 'v. & n. 设计', '📐', 'de|sign'),
      w('hometown', '/ˈhəʊmtaʊn/', 'n. 家乡；故乡', '🏡', 'home|town', 'home（家）+ town（城镇），合起来是家乡。'),
    ],
  },
  {
    id: '4b-u6', book: '四年级下册', name: 'Unit 6  Cool clothes', zh: '酷炫服装', emoji: '👕', color: '#ef6a67',
    words: [
      w('T-shirt', '/ˈtiː ʃɜːt/', 'n. T 恤（衫）', '👕', 'T|shirt'),
      w('skirt', '/skɜːt/', 'n. 半身裙；裙子', '👗', 'sk|ir|t'),
      w('shorts', '/ʃɔːts/', 'n. 短裤', '🩳', 'sh|or|ts'),
      w('shirt', '/ʃɜːt/', 'n. 衬衫', '👔', 'sh|ir|t'),
      w('trousers', '/ˈtraʊzəz/', 'n. 裤子', '👖', 'trou|sers'),
      w('scarf', '/skɑːf/', 'n. 围巾', '🧣', 'sc|ar|f'),
      w('sweater', '/ˈswetə/', 'n. 毛线衣；羊毛衫；针织衫', '🧶', 'sw|ea|ter'),
      w('dress', '/dres/', 'n. 连衣裙', '👗', 'dr|e|ss'),
      w('party', '/ˈpɑːti/', 'n. 聚会；宴会', '🥳', 'par|ty'),
      w('end', '/end/', 'n. 最后部分；末尾', '🔚', 'e|nd'),
      w('dressmaker', '/ˈdresmeɪkə/', 'n. 裁缝', '🪡', 'dress|mak|er', 'dress（服装）+ maker（制作者），做服装的人就是裁缝。'),
      w('Christmas', '/ˈkrɪsməs/', 'n. 圣诞节', '🎄', 'Christ|mas', 'Christmas 中 t 不发音，注意不要读成 Christ-mas。'),
      w('the same', '/ðə seɪm/', '同样；相同', '🟰', 'the|same'),
      w('wrong', '/rɒŋ/', 'adj. 不正确的；错误的', '❌', 'wr|o|ng', 'wrong 开头 w 不发音。'),
      w('clever', '/ˈklevə/', 'adj. 聪明的', '💡', 'cle|ver'),
      w('Mr', '/ˈmɪstə/', 'n. 先生', '👨', 'M|r'),
      w('present', '/ˈpreznt/', 'n. 礼物', '🎁', 'pre|sent'),
      w('whole', '/həʊl/', 'adj. 整个的；全部的', '⭕', 'wh|o|le', 'whole 中 w 不发音，和 hole 同音。'),
      w('whale', '/weɪl/', 'n. 鲸', '🐋', 'wh|a|le'),
      w('uniform', '/ˈjuːnɪfɔːm/', 'n. 制服', '🧑‍✈️', 'u|ni|form'),
      w('robe', '/rəʊb/', 'n. 长袍', '🥻', 'r|o|be'),
      w('coat', '/kəʊt/', 'n. 外套；大衣', '🧥', 'c|oa|t'),
      w('jacket', '/ˈdʒækɪt/', 'n. 夹克；短上衣', '🧥', 'jack|et'),
      w('hat', '/hæt/', 'n. 帽子', '👒', 'h|a|t'),
    ],
  },
];

/* ============================================================
   关联词：相反 / 相近 / 同类 / 同根 / 组词
   ------------------------------------------------------------
   opp    相反：意思相对或相反   high ↔ low
   near   相近：意思接近、可以互相联想   gift ↔ present
   group  同类：属于同一主题     bus / train / plane
   family 同根：词根相同、加前后缀构成   rain → rainy
   phrase 组词：本册里由该词组成的短语   give → give up
   课内词直接写英文字符串；课外拓展词用 out('单词', '中文') 写上释义。
   ============================================================ */
const RELATION_META = {
  opp: { tag: '反', name: '相反', color: '#d2544f' },
  near: { tag: '近', name: '相近', color: '#3d7ddb' },
  family: { tag: '根', name: '同根', color: '#8b5cf6' },
  phrase: { tag: '组', name: '组词', color: '#d9822b' },
  group: { tag: '类', name: '同类', color: '#2f9e5f' },
};
const RELATION_ORDER = ['opp', 'near', 'family', 'phrase', 'group'];
const RELATION_CAP = { opp: 2, near: 2, family: 2, phrase: 2, group: 3 };
const RELATION_TOTAL = 5;
const RELATION_MIN = 3;

const OUT_ZH = {};
function out(en, zh) { OUT_ZH[en] = zh; return { en, zh }; }

/* ---------- 相反：意思相对或相反 ---------- */
const ENGLISH_OPP = {
  'high': [out('low', '低的')],
  'far': ['near', 'away'],
  'away': ['near'],
  'first': [out('last', '最后的')],
  'next': [out('last', '上一个的')],
  'lose': ['win'],
  'fail': [out('succeed', '成功')],
  'hard': ['easy'],
  'keep': ['give up'],
  'try': ['give up'],
  'ill': ['better'],
  'better': [out('worse', '更糟的')],
  'remember': [out('forget', '忘记')],
  'never': [out('always', '总是')],
  'often': ['never'],
  'clean': ['dirty'],
  'tidy': ['dirty', out('messy', '乱糟糟的')],
  'outside': [out('inside', '在里面')],
  'finish': [out('start', '开始')],
  'end': [out('start', '开始')],
  'warm': ['cold'],
  'cold': [out('hot', '热的')],
  'sunny': ['rainy'],
  'cloudy': ['sunny'],
  'rainy': ['sunny'],
  'turn on': [out('turn off', '关掉')],
  'special': [out('usual', '平常的')],
  'fly': ['fall'],
  'left': [out('right', '右边')],
  'tomorrow': [out('yesterday', '昨天')],
  'later': [out('earlier', '更早')],
  'true': ['wrong', out('false', '假的')],
  'wrong': ['true', out('correct', '正确的')],
  'real': [out('fake', '假的')],
  'night': [out('day', '白天')],
  'safe': [out('dangerous', '危险的')],
  'same': [out('different', '不同的')],
  'the same': [out('different', '不同的')],
  'light': [out('dark', '黑暗的')],
  'join': [out('leave', '离开')],
  'give': [out('take', '拿走')],
  'laugh': ['cry'],
  'sad': ['excited', out('happy', '快乐的')],
  'angry': [out('calm', '平静的')],
  'frown': [out('smile', '微笑')],
  'scared': [out('brave', '勇敢的')],
  'shout': [out('whisper', '小声说')],
  'break': [out('fix', '修理')],
  'huge': [out('small', '小的')],
  'slowly': [out('fast', '快地')],
  'sleep': [out('wake', '醒来')],
  'thin': [out('fat', '胖的')],
  'more': [out('less', '更少的')],
  'off': [out('on', '在上面；开着')],
  'write': [out('read', '读')],
  'those': [out('these', '这些')],
  'clever': [out('silly', '傻的')],
  'whole': [out('part', '部分')],
  'Mr': [out('Mrs', '夫人；太太')],
  'student': ['teacher'],
  'aunt': ['uncle'],
  'woman': [out('man', '男人')],
  'boy': [out('girl', '女孩')],
  'enjoy': [out('hate', '讨厌')],
  'worried': [out('relaxed', '放松的')],
};

/* ---------- 相近：意思接近、可以互相联想 ---------- */
const ENGLISH_NEAR = {
  'hope': ['wish'],
  'wish': ['dream'],
  'gift': ['present'],
  'huge': [out('big', '大的')],
  'easy': [out('simple', '简单的')],
  'hard': [out('difficult', '困难的')],
  'clean': ['tidy'],
  'job': ['chore'],
  'finish': ['end'],
  'warm': [out('hot', '热的')],
  'enjoy': [out('like', '喜欢')],
  'coat': ['jacket'],
  'shirt': ['T-shirt'],
  'true': ['real'],
  'city': ['town'],
  'trip': ['travel'],
  'way': ['street'],
  'scared': ['worried'],
  'fail': ['lose'],
  'ability': [out('skill', '技能')],
  'cook': ['bake'],
  'pick': ['collect'],
  'sea': ['beach'],
  'often': ['sometimes'],
  'anything': ['everything'],
  'hit': ['break'],
  'kind': ['helpful'],
  'tired': ['sleep'],
  'across': ['cross'],
  'practise': ['try'],
  'centre': [out('middle', '中间')],
  'round': [out('around', '围绕')],
  'should': [out('must', '必须')],
  'may': [out('can', '可以；能')],
  'just': [out('only', '仅仅')],
  'quite': [out('very', '非常')],
  'also': [out('too', '也')],
  'hunt': [out('look for', '寻找')],
  'own': [out('self', '自己')],
  'light': [out('lamp', '灯'), 'sunshine'],
  'those': [out('that', '那个')],
  'clever': [out('smart', '聪明的')],
  'wear': [out('put on', '穿上')],
  'come true': ['dream'],
  'money': [out('coin', '硬币')],
  'TV': [out('television', '电视')],
  'miss': [out('love', '爱；想念')],
};

/* ---------- 同根：课内没有词根词时，补上常见的词根 ---------- */
const ENGLISH_FAMILY_EXTRA = {
  'sunny': [out('sun', '太阳')],
  'sunshine': [out('sun', '太阳')],
  'sunflower': [out('sun', '太阳')],
  'teacher': [out('teach', '教')],
  'player': [out('play', '玩；参加运动')],
  'worker': [out('work', '工作')],
  'driver': [out('drive', '驾驶')],
  'dancer': [out('dance', '跳舞')],
  'painter': [out('paint', '绘画')],
  'farmer': [out('farm', '农场')],
  'scientist': [out('science', '科学')],
  'fireman': [out('fire', '火')],
  'postman': [out('post', '邮件')],
  'lovely': [out('love', '爱；喜欢')],
  'careful': [out('care', '关心；留意')],
  'helper': [out('help', '帮助'), 'helpful'],
  'helpful': [out('help', '帮助'), 'helper'],
  'slowly': [out('slow', '慢的')],
  'surprised': ['surprise'],
  'worried': [out('worry', '担心')],
  'airport': [out('air', '航空；空气')],
  'underground': [out('ground', '地面')],
  'ice cream': [out('ice', '冰')],
  'everything': [out('every', '每个')],
  'sometimes': [out('some', '一些')],
  'birthday': [out('birth', '出生')],
  'life': ['live'],
  'write': ['writer'],
  'writer': ['write'],
  'hometown': ['town'],
};

/* ---------- 同类：同一主题下的词 ---------- */
const ENGLISH_GROUPS = {
  '运动与比赛': ['sport', 'jump', 'high', 'far', 'ping-pong', 'volleyball', 'player', 'win', 'lose', 'try', 'ability', 'keep', 'first', 'warm up', 'join'],
  '家务劳动': ['wash', 'dish', 'feed', 'sweep', 'floor', 'rubbish', 'chore', 'to-do list', 'tidy', 'clean', 'dirty', 'desk', 'wall', 'water', 'yard', 'helper', 'pick', 'cut', 'grass', 'collect', 'job', 'finish'],
  '天气': ['weather', 'sunny', 'cloud', 'cloudy', 'wind', 'blow', 'windy', 'rain', 'rainy', 'snow', 'cold', 'snowstorm', 'raindrop', 'report', 'sunshine'],
  '季节': ['season', 'spring', 'summer', 'autumn', 'winter', 'favourite', 'beach', 'sea', 'equator', 'fly kites'],
  '交通工具': ['bus', 'car', 'train', 'plane', 'ship', 'bike', 'truck', 'subway', 'tram', 'airport', 'taxi', 'travel', 'underground', 'by', 'wheel'],
  '公共场所': ['library', 'centre', 'cinema', 'hospital', 'supermarket', 'museum', 'station', 'police station', 'airport', 'place', 'city', 'town', 'hometown'],
  '方向与路线': ['left', 'straight', 'cross', 'underground', 'way', 'street', 'near', 'away', 'round', 'step', 'excuse me', 'excuse', 'outside', 'turn'],
  '职业': ['doctor', 'fireman', 'farmer', 'cook', 'police', 'police officer', 'painter', 'scientist', 'writer', 'worker', 'driver', 'nurse', 'postman', 'teacher', 'player', 'dancer', 'keeper', 'helper', 'dressmaker', 'student'],
  '家人与称呼': ['aunt', 'uncle', 'woman', 'boy', 'Mr'],
  '情绪感受': ['laugh', 'sad', 'cry', 'angry', 'frown', 'scared', 'shake', 'excited', 'surprised', 'worried', 'feeling', 'tired', 'feel', 'miss', 'enjoy'],
  '身体健康': ['ill', 'better', 'cough', 'hospital', 'doctor', 'nurse', 'sleep', 'cancer'],
  '植物': ['seed', 'earth', 'root', 'stem', 'leaf', 'dig', 'sunflower', 'wheat', 'cotton', 'plant', 'grain', 'bamboo', 'grass', 'thin'],
  '衣物': ['T-shirt', 'skirt', 'shorts', 'shirt', 'trousers', 'scarf', 'sweater', 'dress', 'coat', 'jacket', 'hat', 'robe', 'uniform', 'wear'],
  '时间': ['month', 'year', 'minute', 'hour', 'tomorrow', 'night', 'later', 'again', 'sometimes', 'often', 'never', 'next', 'end', 'first', 'birthday'],
  '动物': ['pig', 'cow', 'duck', 'mouse', 'bee', 'owl', 'whale', 'night owl', 'horn'],
  '校园活动': ['event', 'drama', 'trip', 'fair', 'festival', 'student', 'note', 'vote', 'design', 'culture', 'hunt', 'picnic'],
  '才艺': ['talent', 'act', 'magic', 'shine', 'puzzle', 'dancer', 'win', 'just', 'opera'],
  '声音与拟声': ['sound', 'ring', 'beep', 'whoosh', 'chug', 'bang', 'woof', 'cock-a-doodle-doo', 'phew', 'shout'],
  '自然风景': ['forest', 'nature', 'mountain', 'sea', 'sky', 'earth', 'grass', 'bamboo', 'field', 'beach', 'water'],
  '频率与程度': ['often', 'sometimes', 'never', 'again', 'quite', 'just', 'more', 'also', 'enough', 'slowly'],
  '食物': ['ice cream', 'cabbage', 'bake', 'cook', 'taste', 'water'],
  '学习记录': ['paper', 'note', 'diary', 'report', 'to-do list', 'design', 'write', 'practise', 'student', 'remember', 'problem'],
  '礼物与节日': ['gift', 'present', 'birthday', 'Christmas', 'party', 'festival', 'surprise', 'special'],
  '情态词与连词': ['may', 'should', 'will', 'because', 'because of', 'or', 'any'],
  '画画与手工': ['painter', 'brush', 'design', 'model', 'puzzle', 'magic', 'paper', 'use'],
  '形状与大小': ['dot', 'round', 'straight', 'cross', 'centre', 'thin', 'huge'],
  '人物特点': ['clever', 'kind', 'helpful', 'tired', 'warm', 'lovely'],
  '安全出行': ['safe', 'careful', 'be careful', 'cross', 'underground', 'left', 'light'],
  '指示与不定代词': ['those', 'any', 'anything', 'everything', 'the same', 'own'],
  '作息与睡眠': ['sleep', 'dream', 'night', 'tired'],
  '心愿': ['hope', 'wish', 'dream', 'come true', 'true'],
};

/* ============================================================
   常见短语与句式：每条 { en, zh }，点一下朗读英文，中文释义同步显示。
   优先收录本册教材中出现、或与该词强相关的常用搭配与短句。
   ============================================================ */
const ENGLISH_PHRASES = {
  /* ---------------- 4A Unit 1 I love sports ---------------- */
  'sport': [
    { en: 'play sports', zh: '做运动' },
    { en: 'I love sports.', zh: '我热爱运动。' },
  ],
  'jump': [
    { en: 'jump high', zh: '跳得高' },
    { en: 'Let\'s jump together.', zh: '我们一起跳吧。' },
  ],
  'high': [
    { en: 'jump high', zh: '跳得高' },
    { en: 'How high can you jump?', zh: '你能跳多高？' },
  ],
  'far': [
    { en: 'jump far', zh: '跳得远' },
    { en: 'He can jump far.', zh: '他能跳得很远。' },
  ],
  'ping-pong': [
    { en: 'play ping-pong', zh: '打乒乓球' },
    { en: 'I like playing ping-pong.', zh: '我喜欢打乒乓球。' },
  ],
  'volleyball': [
    { en: 'play volleyball', zh: '打排球' },
    { en: 'We play volleyball after school.', zh: '我们放学后打排球。' },
  ],
  'first': [
    { en: 'at first', zh: '起初；首先' },
    { en: 'First, let\'s warm up.', zh: '首先，我们来热身。' },
  ],
  'at first': [
    { en: 'At first I was scared.', zh: '起初我很害怕。' },
    { en: 'At first, he didn\'t like it.', zh: '一开始他不喜欢。' },
  ],
  'hope': [
    { en: 'I hope you win.', zh: '我希望你赢。' },
    { en: 'Hope to see you again.', zh: '希望能再见到你。' },
  ],
  'lose': [
    { en: 'lose the game', zh: '输掉比赛' },
    { en: 'Don\'t lose hope.', zh: '不要失去希望。' },
  ],
  'because': [
    { en: 'I like it because it\'s fun.', zh: '我喜欢它因为它很有趣。' },
    { en: 'because of the rain', zh: '因为下雨' },
  ],
  'because of': [
    { en: 'because of the rain', zh: '因为下雨' },
    { en: 'We stayed home because of the rain.', zh: '因为下雨我们待在家里。' },
  ],
  'cancer': [
    { en: 'fight cancer', zh: '与癌症作斗争' },
    { en: 'He is ill with cancer.', zh: '他患了癌症。' },
  ],
  'across': [
    { en: 'run across the field', zh: '跑过田野' },
    { en: 'walk across the street', zh: '穿过街道' },
  ],
  'money': [
    { en: 'save money', zh: '存钱' },
    { en: 'I have no money.', zh: '我没有钱。' },
  ],
  'hard': [
    { en: 'work hard', zh: '努力学习/工作' },
    { en: 'It\'s hard to learn English.', zh: '学英语很难。' },
  ],
  'kind': [
    { en: 'be kind to others', zh: '对别人友善' },
    { en: 'She is a kind girl.', zh: '她是个友善的女孩。' },
  ],
  'keep': [
    { en: 'keep going', zh: '继续前进' },
    { en: 'keep warm', zh: '保暖' },
  ],
  'month': [
    { en: 'last month', zh: '上个月' },
    { en: 'this month', zh: '这个月' },
  ],
  'ill': [
    { en: 'feel ill', zh: '觉得不舒服' },
    { en: 'be ill in bed', zh: '卧病在床' },
  ],
  'year': [
    { en: 'this year', zh: '今年' },
    { en: 'one year ago', zh: '一年前' },
  ],
  'remember': [
    { en: 'remember me', zh: '记得我' },
    { en: 'I remember your name.', zh: '我记得你的名字。' },
  ],
  'fail': [
    { en: 'fail the test', zh: '考试不及格' },
    { en: 'Never fail to try.', zh: '永远不要放弃尝试。' },
  ],
  'give': [
    { en: 'give up', zh: '放弃' },
    { en: 'give me a hand', zh: '帮我一把' },
  ],
  'give up': [
    { en: 'Don\'t give up.', zh: '不要放弃。' },
    { en: 'He gave up smoking.', zh: '他戒了烟。' },
  ],
  'never': [
    { en: 'never give up', zh: '永不放弃' },
    { en: 'I never tell lies.', zh: '我从不说谎。' },
  ],
  'try': [
    { en: 'try again', zh: '再试一次' },
    { en: 'try your best', zh: '尽你最大的努力' },
  ],
  'player': [
    { en: 'a good player', zh: '一名优秀的运动员' },
    { en: 'football player', zh: '足球运动员' },
  ],
  'ability': [
    { en: 'have the ability to', zh: '有能力做……' },
    { en: 'ability to learn', zh: '学习能力' },
  ],

  /* ---------------- 4A Unit 2 Helping at home ---------------- */
  'phew': [
    { en: 'Phew! It\'s hot.', zh: '唷！好热啊。' },
    { en: 'Phew, I\'m tired.', zh: '唉，我累了。' },
  ],
  'wash': [
    { en: 'wash the dishes', zh: '洗碗' },
    { en: 'wash your hands', zh: '洗手' },
  ],
  'dish': [
    { en: 'wash the dishes', zh: '洗碗' },
    { en: 'a dish of rice', zh: '一盘米饭' },
  ],
  'feed': [
    { en: 'feed the dog', zh: '喂狗' },
    { en: 'feed the baby', zh: '喂婴儿' },
  ],
  'sweep': [
    { en: 'sweep the floor', zh: '扫地' },
    { en: 'sweep away the rubbish', zh: '扫走垃圾' },
  ],
  'floor': [
    { en: 'on the floor', zh: '在地板上' },
    { en: 'sweep the floor', zh: '扫地' },
  ],
  'rubbish': [
    { en: 'take out the rubbish', zh: '倒垃圾' },
    { en: 'a bag of rubbish', zh: '一袋垃圾' },
  ],
  'chore': [
    { en: 'do chores', zh: '做家务' },
    { en: 'household chores', zh: '家务杂事' },
  ],
  'to-do list': [
    { en: 'make a to-do list', zh: '列一张待办清单' },
    { en: 'check the to-do list', zh: '查看待办清单' },
  ],
  'may': [
    { en: 'May I come in?', zh: '我可以进来吗？' },
    { en: 'You may go now.', zh: '你现在可以走了。' },
  ],
  'outside': [
    { en: 'play outside', zh: '在外面玩' },
    { en: 'go outside', zh: '出去' },
  ],
  'tidy': [
    { en: 'tidy the room', zh: '整理房间' },
    { en: 'keep it tidy', zh: '保持整洁' },
  ],
  'easy': [
    { en: 'It\'s easy.', zh: '这很容易。' },
    { en: 'easy to use', zh: '容易使用' },
  ],
  'clean': [
    { en: 'clean the room', zh: '打扫房间' },
    { en: 'keep clean', zh: '保持清洁' },
  ],
  'woof': [
    { en: 'Woof! Woof!', zh: '汪！汪！' },
    { en: 'The dog says woof.', zh: '狗汪汪叫。' },
  ],
  'job': [
    { en: 'good job', zh: '干得好' },
    { en: 'do a good job', zh: '做得好' },
  ],
  'good job': [
    { en: 'Good job!', zh: '干得好！' },
    { en: 'You did a good job.', zh: '你做得很好。' },
  ],
  'dirty': [
    { en: 'dirty hands', zh: '脏手' },
    { en: 'The floor is dirty.', zh: '地板脏了。' },
  ],
  'desk': [
    { en: 'clean the desk', zh: '擦书桌' },
    { en: 'on the desk', zh: '在书桌上' },
  ],
  'wall': [
    { en: 'on the wall', zh: '在墙上' },
    { en: 'paint the wall', zh: '刷墙' },
  ],
  'again': [
    { en: 'try again', zh: '再试一次' },
    { en: 'See you again.', zh: '再见。' },
  ],
  'also': [
    { en: 'I also like it.', zh: '我也喜欢它。' },
    { en: 'He is also tall.', zh: '他也很高。' },
  ],
  'problem': [
    { en: 'No problem.', zh: '没问题。' },
    { en: 'solve a problem', zh: '解决问题' },
  ],
  'finish': [
    { en: 'finish the homework', zh: '完成作业' },
    { en: 'I finished my work.', zh: '我完成了工作。' },
  ],
  'sunshine': [
    { en: 'in the sunshine', zh: '在阳光下' },
    { en: 'enjoy the sunshine', zh: '享受阳光' },
  ],
  'sometimes': [
    { en: 'Sometimes I read books.', zh: '有时我看书。' },
    { en: 'sometimes go shopping', zh: '有时去购物' },
  ],
  'feel': [
    { en: 'feel happy', zh: '感到开心' },
    { en: 'How do you feel?', zh: '你感觉怎么样？' },
  ],
  'tired': [
    { en: 'feel tired', zh: '感到疲倦' },
    { en: 'I\'m tired.', zh: '我累了。' },
  ],
  'helpful': [
    { en: 'a helpful boy', zh: '一个乐于助人的男孩' },
    { en: 'be helpful at home', zh: '在家里帮忙' },
  ],
  'warm': [
    { en: 'warm up', zh: '热身；变暖' },
    { en: 'It\'s warm today.', zh: '今天很暖和。' },
  ],
  'warm up': [
    { en: 'warm up before running', zh: '跑步前热身' },
    { en: 'The room warms up.', zh: '房间变暖和了。' },
  ],
  'water': [
    { en: 'water the flowers', zh: '浇花' },
    { en: 'drink water', zh: '喝水' },
  ],
  'yard': [
    { en: 'in the yard', zh: '在院子里' },
    { en: 'clean the yard', zh: '打扫院子' },
  ],
  'helper': [
    { en: 'a good helper', zh: '好帮手' },
    { en: 'Mom\'s little helper', zh: '妈妈的小帮手' },
  ],
  'pick': [
    { en: 'pick apples', zh: '摘苹果' },
    { en: 'pick up the pen', zh: '捡起钢笔' },
  ],
  'pig': [
    { en: 'a little pig', zh: '一只小猪' },
    { en: 'The pig is fat.', zh: '这头猪很胖。' },
  ],
  'cow': [
    { en: 'a black cow', zh: '一头黑牛' },
    { en: 'The cow gives milk.', zh: '奶牛产奶。' },
  ],
  'collect': [
    { en: 'collect stamps', zh: '集邮' },
    { en: 'collect rubbish', zh: '收垃圾' },
  ],
  'cut': [
    { en: 'cut the grass', zh: '割草' },
    { en: 'cut with scissors', zh: '用剪刀剪' },
  ],
  'grass': [
    { en: 'cut the grass', zh: '割草' },
    { en: 'green grass', zh: '青草' },
  ],

  /* ---------------- 4A Unit 3 Weather ---------------- */
  'weather': [
    { en: 'What\'s the weather like?', zh: '天气怎么样？' },
    { en: 'nice weather', zh: '好天气' },
  ],
  'sunny': [
    { en: 'a sunny day', zh: '晴朗的一天' },
    { en: 'It\'s sunny today.', zh: '今天阳光明媚。' },
  ],
  'cloud': [
    { en: 'a white cloud', zh: '一朵白云' },
    { en: 'in the clouds', zh: '在云层里' },
  ],
  'by': [
    { en: 'by bus', zh: '乘公交车' },
    { en: 'by the window', zh: '在窗边' },
  ],
  'cloudy': [
    { en: 'a cloudy sky', zh: '多云的天空' },
    { en: 'It\'s cloudy today.', zh: '今天多云。' },
  ],
  'wind': [
    { en: 'strong wind', zh: '大风' },
    { en: 'The wind blows.', zh: '风吹着。' },
  ],
  'blow': [
    { en: 'blow in the wind', zh: '在风中吹' },
    { en: 'The wind blows hard.', zh: '风刮得很大。' },
  ],
  'windy': [
    { en: 'a windy day', zh: '刮风的一天' },
    { en: 'It\'s windy outside.', zh: '外面风很大。' },
  ],
  'rain': [
    { en: 'heavy rain', zh: '大雨' },
    { en: 'It is raining.', zh: '正在下雨。' },
  ],
  'rainy': [
    { en: 'a rainy day', zh: '雨天' },
    { en: 'It\'s rainy today.', zh: '今天下雨。' },
  ],
  'snow': [
    { en: 'play in the snow', zh: '在雪地里玩' },
    { en: 'It is snowing.', zh: '正在下雪。' },
  ],
  'any': [
    { en: 'any questions', zh: '任何问题' },
    { en: 'Do you have any water?', zh: '你有水吗？' },
  ],
  'cold': [
    { en: 'feel cold', zh: '觉得冷' },
    { en: 'It\'s very cold.', zh: '天气很冷。' },
  ],
  'or': [
    { en: 'tea or coffee', zh: '茶还是咖啡' },
    { en: 'yes or no', zh: '是或否' },
  ],
  'enjoy': [
    { en: 'enjoy the sunshine', zh: '享受阳光' },
    { en: 'I enjoy reading.', zh: '我喜欢阅读。' },
  ],
  'diary': [
    { en: 'write a diary', zh: '写日记' },
    { en: 'keep a diary', zh: '坚持写日记' },
  ],
  'special': [
    { en: 'a special day', zh: '特别的一天' },
    { en: 'something special', zh: '特别的东西' },
  ],
  'teacher': [
    { en: 'my English teacher', zh: '我的英语老师' },
    { en: 'a kind teacher', zh: '一位友善的老师' },
  ],
  'taste': [
    { en: 'taste good', zh: '尝起来不错' },
    { en: 'Have a taste.', zh: '尝一尝。' },
  ],
  'ice cream': [
    { en: 'eat ice cream', zh: '吃冰激凌' },
    { en: 'an ice cream', zh: '一个冰激凌' },
  ],
  'real': [
    { en: 'a real story', zh: '真实的故事' },
    { en: 'Is it real?', zh: '这是真的吗？' },
  ],
  'later': [
    { en: 'see you later', zh: '回头见' },
    { en: 'later on', zh: '稍后' },
  ],
  'surprise': [
    { en: 'a big surprise', zh: '一个大惊喜' },
    { en: 'What a surprise!', zh: '真令人惊讶！' },
  ],
  'coat': [
    { en: 'put on a coat', zh: '穿上外套' },
    { en: 'a warm coat', zh: '一件暖和的外套' },
  ],
  'turn': [
    { en: 'turn on the TV', zh: '打开电视' },
    { en: 'turn around', zh: '转身' },
  ],
  'turn on': [
    { en: 'turn on the light', zh: '开灯' },
    { en: 'turn on the TV', zh: '打开电视' },
  ],
  'TV': [
    { en: 'watch TV', zh: '看电视' },
    { en: 'turn on the TV', zh: '打开电视' },
  ],
  'report': [
    { en: 'weather report', zh: '天气预报' },
    { en: 'a news report', zh: '新闻报道' },
  ],

  /* ---------------- 4A Unit 4 Seasons ---------------- */
  'season': [
    { en: 'four seasons', zh: '四季' },
    { en: 'favourite season', zh: '最喜欢的季节' },
  ],
  'spring': [
    { en: 'in spring', zh: '在春天' },
    { en: 'Spring is warm.', zh: '春天很暖和。' },
  ],
  'summer': [
    { en: 'in summer', zh: '在夏天' },
    { en: 'Summer is hot.', zh: '夏天很热。' },
  ],
  'autumn': [
    { en: 'in autumn', zh: '在秋天' },
    { en: 'Autumn is cool.', zh: '秋天很凉爽。' },
  ],
  'winter': [
    { en: 'in winter', zh: '在冬天' },
    { en: 'Winter is cold.', zh: '冬天很冷。' },
  ],
  'favourite': [
    { en: 'my favourite season', zh: '我最喜欢的季节' },
    { en: 'What\'s your favourite colour?', zh: '你最喜欢的颜色是什么？' },
  ],
  'birthday': [
    { en: 'happy birthday', zh: '生日快乐' },
    { en: 'birthday party', zh: '生日聚会' },
  ],
  'fly': [
    { en: 'fly kites', zh: '放风筝' },
    { en: 'The bird can fly.', zh: '鸟会飞。' },
  ],
  'fly kites': [
    { en: 'fly kites in spring', zh: '在春天放风筝' },
    { en: 'Let\'s fly kites.', zh: '我们去放风筝吧。' },
  ],
  'snowstorm': [
    { en: 'a heavy snowstorm', zh: '一场暴风雪' },
    { en: 'The snowstorm is coming.', zh: '暴风雪要来了。' },
  ],
  'beach': [
    { en: 'go to the beach', zh: '去海滩' },
    { en: 'on the beach', zh: '在海滩上' },
  ],
  'sea': [
    { en: 'by the sea', zh: '在海边' },
    { en: 'swim in the sea', zh: '在海里游泳' },
  ],
  'equator': [
    { en: 'near the equator', zh: '靠近赤道' },
    { en: 'hot near the equator', zh: '赤道附近很热' },
  ],
  'round': [
    { en: 'go round the tree', zh: '绕着树走' },
    { en: 'all year round', zh: '一年到头' },
  ],
  'quite': [
    { en: 'quite good', zh: '相当好' },
    { en: 'quite hot', zh: '相当热' },
  ],
  'join': [
    { en: 'join the club', zh: '加入俱乐部' },
    { en: 'join us', zh: '加入我们' },
  ],

  /* ---------------- 4A Unit 5 Let's go ---------------- */
  'bus': [
    { en: 'by bus', zh: '乘公交车' },
    { en: 'take a bus', zh: '坐公交车' },
  ],
  'car': [
    { en: 'by car', zh: '开车' },
    { en: 'a red car', zh: '一辆红色的车' },
  ],
  'train': [
    { en: 'by train', zh: '乘火车' },
    { en: 'take the train', zh: '坐火车' },
  ],
  'city': [
    { en: 'a big city', zh: '一座大城市' },
    { en: 'in the city', zh: '在城市里' },
  ],
  'town': [
    { en: 'a small town', zh: '一座小镇' },
    { en: 'in town', zh: '在镇上' },
  ],
  'plane': [
    { en: 'by plane', zh: '乘飞机' },
    { en: 'take a plane', zh: '坐飞机' },
  ],
  'sky': [
    { en: 'in the sky', zh: '在天空中' },
    { en: 'blue sky', zh: '蓝天' },
  ],
  'ship': [
    { en: 'by ship', zh: '乘船' },
    { en: 'a big ship', zh: '一艘大船' },
  ],
  'place': [
    { en: 'a good place', zh: '一个好地方' },
    { en: 'travel to a place', zh: '去某地旅行' },
  ],
  'near': [
    { en: 'near the school', zh: '在学校附近' },
    { en: 'near here', zh: '在这附近' },
  ],
  'travel': [
    { en: 'travel by train', zh: '乘火车旅行' },
    { en: 'I love to travel.', zh: '我喜欢旅行。' },
  ],
  'way': [
    { en: 'on the way', zh: '在路上' },
    { en: 'the way to school', zh: '去学校的路' },
  ],
  'picnic': [
    { en: 'have a picnic', zh: '去野餐' },
    { en: 'go for a picnic', zh: '去野餐' },
  ],
  'minute': [
    { en: 'wait a minute', zh: '等一会儿' },
    { en: 'in a minute', zh: '马上' },
  ],
  'wear': [
    { en: 'wear a coat', zh: '穿外套' },
    { en: 'wear a hat', zh: '戴帽子' },
  ],
  'live': [
    { en: 'live in China', zh: '住在中国' },
    { en: 'Where do you live?', zh: '你住在哪里？' },
  ],
  'away': [
    { en: 'go away', zh: '走开' },
    { en: 'far away', zh: '遥远' },
  ],
  'truck': [
    { en: 'a big truck', zh: '一辆大卡车' },
    { en: 'by truck', zh: '用卡车' },
  ],
  'bamboo': [
    { en: 'green bamboo', zh: '绿竹' },
    { en: 'a bamboo forest', zh: '竹林' },
  ],
  'airport': [
    { en: 'at the airport', zh: '在机场' },
    { en: 'go to the airport', zh: '去机场' },
  ],
  'bike': [
    { en: 'by bike', zh: '骑自行车' },
    { en: 'ride a bike', zh: '骑自行车' },
  ],
  'ring': [
    { en: 'the bell rings', zh: '铃响了' },
    { en: 'ring the bell', zh: '按铃' },
  ],
  'beep': [
    { en: 'the car beeps', zh: '汽车鸣笛' },
    { en: 'Beep! Beep!', zh: '嘀！嘀！' },
  ],
  'subway': [
    { en: 'by subway', zh: '乘地铁' },
    { en: 'take the subway', zh: '坐地铁' },
  ],
  'whoosh': [
    { en: 'Whoosh! The train goes by.', zh: '呼！火车呼啸而过。' },
  ],
  'tram': [
    { en: 'by tram', zh: '乘有轨电车' },
    { en: 'take a tram', zh: '坐有轨电车' },
  ],
  'chug': [
    { en: 'The train chugs along.', zh: '火车突突地前进。' },
  ],

  /* ---------------- 4A Unit 6 Find your way ---------------- */
  'wheel': [
    { en: 'a car wheel', zh: '车轮' },
    { en: 'the wheel of a bike', zh: '自行车的轮子' },
  ],
  'left': [
    { en: 'turn left', zh: '向左转' },
    { en: 'on the left', zh: '在左边' },
  ],
  'straight': [
    { en: 'go straight', zh: '直走' },
    { en: 'walk straight on', zh: '一直往前走' },
  ],
  'library': [
    { en: 'go to the library', zh: '去图书馆' },
    { en: 'in the library', zh: '在图书馆里' },
  ],
  'centre': [
    { en: 'city centre', zh: '市中心' },
    { en: 'in the centre', zh: '在中心' },
  ],
  'cinema': [
    { en: 'go to the cinema', zh: '去看电影' },
    { en: 'at the cinema', zh: '在电影院' },
  ],
  'hospital': [
    { en: 'go to the hospital', zh: '去医院' },
    { en: 'in the hospital', zh: '在医院里' },
  ],
  'supermarket': [
    { en: 'go to the supermarket', zh: '去超市' },
    { en: 'at the supermarket', zh: '在超市' },
  ],
  'museum': [
    { en: 'visit the museum', zh: '参观博物馆' },
    { en: 'in the museum', zh: '在博物馆里' },
  ],
  'tomorrow': [
    { en: 'see you tomorrow', zh: '明天见' },
    { en: 'Tomorrow is Sunday.', zh: '明天是星期天。' },
  ],
  'woman': [
    { en: 'a kind woman', zh: '一位善良的女士' },
    { en: 'the woman in red', zh: '穿红衣服的女士' },
  ],
  'excuse': [
    { en: 'excuse me', zh: '劳驾；对不起' },
    { en: 'Excuse me, where is...?', zh: '打扰一下，……在哪里？' },
  ],
  'excuse me': [
    { en: 'Excuse me, can you help me?', zh: '打扰一下，你能帮我吗？' },
    { en: 'Excuse me, I\'m sorry.', zh: '对不起，不好意思。' },
  ],
  'wish': [
    { en: 'make a wish', zh: '许个愿' },
    { en: 'I wish you happiness.', zh: '祝你幸福。' },
  ],
  'true': [
    { en: 'come true', zh: '实现' },
    { en: 'Is it true?', zh: '这是真的吗？' },
  ],
  'step': [
    { en: 'the first step', zh: '第一步' },
    { en: 'step by step', zh: '一步一步地' },
  ],
  'own': [
    { en: 'my own room', zh: '我自己的房间' },
    { en: 'on your own', zh: '独自' },
  ],
  'cross': [
    { en: 'cross the street', zh: '过马路' },
    { en: 'cross the road', zh: '过马路' },
  ],
  'careful': [
    { en: 'be careful', zh: '当心' },
    { en: 'Be careful!', zh: '小心！' },
  ],
  'be careful': [
    { en: 'Be careful on the road.', zh: '路上小心。' },
    { en: 'Be careful with fire.', zh: '小心火。' },
  ],
  'underground': [
    { en: 'by underground', zh: '乘地铁' },
    { en: 'take the underground', zh: '坐地铁' },
  ],

  /* ---------------- 4B Unit 1 People at work ---------------- */
  'doctor': [
    { en: 'see a doctor', zh: '看医生' },
    { en: 'a kind doctor', zh: '一位友善的医生' },
  ],
  'fireman': [
    { en: 'a brave fireman', zh: '一名勇敢的消防员' },
    { en: 'The fireman puts out fires.', zh: '消防员灭火。' },
  ],
  'farmer': [
    { en: 'a busy farmer', zh: '一位忙碌的农民' },
    { en: 'The farmer grows rice.', zh: '农民种稻子。' },
  ],
  'cook': [
    { en: 'cook dinner', zh: '做晚饭' },
    { en: 'a great cook', zh: '一位很棒的厨师' },
  ],
  'police': [
    { en: 'call the police', zh: '报警' },
    { en: 'the police station', zh: '警察局' },
  ],
  'police officer': [
    { en: 'a police officer', zh: '一名警察' },
    { en: 'The police officer helps us.', zh: '警察帮助我们。' },
  ],
  'station': [
    { en: 'police station', zh: '警察局' },
    { en: 'train station', zh: '火车站' },
  ],
  'police station': [
    { en: 'go to the police station', zh: '去警察局' },
    { en: 'near the police station', zh: '在警察局附近' },
  ],
  'often': [
    { en: 'I often read books.', zh: '我经常看书。' },
    { en: 'How often do you...?', zh: '你多久……一次？' },
  ],
  'field': [
    { en: 'in the field', zh: '在田野里' },
    { en: 'a green field', zh: '一片绿色的田野' },
  ],
  'painter': [
    { en: 'a famous painter', zh: '一位著名的画家' },
    { en: 'The painter paints well.', zh: '这位画家画得很好。' },
  ],
  'use': [
    { en: 'use a pen', zh: '使用钢笔' },
    { en: 'Can I use your phone?', zh: '我能用一下你的电话吗？' },
  ],
  'brush': [
    { en: 'a paint brush', zh: '画笔' },
    { en: 'brush your teeth', zh: '刷牙' },
  ],
  'scientist': [
    { en: 'a great scientist', zh: '一位伟大的科学家' },
    { en: 'The scientist studies stars.', zh: '科学家研究星星。' },
  ],
  'writer': [
    { en: 'a famous writer', zh: '一位著名的作家' },
    { en: 'The writer writes books.', zh: '作家写书。' },
  ],
  'worker': [
    { en: 'a factory worker', zh: '一名工厂工人' },
    { en: 'The worker works hard.', zh: '工人工作努力。' },
  ],
  'aunt': [
    { en: 'my aunt', zh: '我的姑姑/阿姨' },
    { en: 'Aunt Mary', zh: '玛丽阿姨' },
  ],
  'night': [
    { en: 'at night', zh: '在夜里' },
    { en: 'good night', zh: '晚安' },
  ],
  'owl': [
    { en: 'a wise owl', zh: '一只聪明的猫头鹰' },
    { en: 'The owl flies at night.', zh: '猫头鹰在夜间飞行。' },
  ],
  'night owl': [
    { en: 'He is a night owl.', zh: '他是个夜猫子。' },
    { en: 'become a night owl', zh: '变成夜猫子' },
  ],
  'driver': [
    { en: 'a bus driver', zh: '一名公交车司机' },
    { en: 'a careful driver', zh: '一位谨慎的司机' },
  ],
  'taxi': [
    { en: 'by taxi', zh: '乘出租车' },
    { en: 'take a taxi', zh: '坐出租车' },
  ],
  'safe': [
    { en: 'keep safe', zh: '保证安全' },
    { en: 'Is it safe?', zh: '安全吗？' },
  ],
  'nurse': [
    { en: 'a kind nurse', zh: '一位友善的护士' },
    { en: 'The nurse helps the doctor.', zh: '护士协助医生。' },
  ],
  'light': [
    { en: 'turn on the light', zh: '开灯' },
    { en: 'a bright light', zh: '明亮的光' },
  ],
  'uncle': [
    { en: 'my uncle', zh: '我的叔叔/伯伯' },
    { en: 'Uncle Tom', zh: '汤姆叔叔' },
  ],
  'bake': [
    { en: 'bake a cake', zh: '烤蛋糕' },
    { en: 'bake bread', zh: '烤面包' },
  ],
  'bee': [
    { en: 'a busy bee', zh: '一只忙碌的蜜蜂' },
    { en: 'The bee makes honey.', zh: '蜜蜂酿蜜。' },
  ],
  'same': [
    { en: 'the same as', zh: '与……相同' },
    { en: 'We are the same age.', zh: '我们同岁。' },
  ],
  'sound': [
    { en: 'a loud sound', zh: '很大的声音' },
    { en: 'That sounds good.', zh: '听起来不错。' },
  ],
  'postman': [
    { en: 'a postman', zh: '一名邮递员' },
    { en: 'The postman brings letters.', zh: '邮递员送信。' },
  ],
  'life': [
    { en: 'daily life', zh: '日常生活' },
    { en: 'enjoy life', zh: '享受生活' },
  ],
  'mountain': [
    { en: 'a high mountain', zh: '一座高山' },
    { en: 'climb a mountain', zh: '爬山' },
  ],

  /* ---------------- 4B Unit 2 How do you feel ---------------- */
  'laugh': [
    { en: 'laugh loudly', zh: '大声笑' },
    { en: 'The children laugh.', zh: '孩子们在笑。' },
  ],
  'sad': [
    { en: 'feel sad', zh: '感到难过' },
    { en: 'Why are you sad?', zh: '你为什么难过？' },
  ],
  'cry': [
    { en: 'cry for help', zh: '呼救' },
    { en: 'Don\'t cry.', zh: '别哭。' },
  ],
  'angry': [
    { en: 'feel angry', zh: '感到生气' },
    { en: 'He is angry.', zh: '他很生气。' },
  ],
  'frown': [
    { en: 'frown at me', zh: '对我皱眉' },
    { en: 'Don\'t frown.', zh: '别皱眉。' },
  ],
  'scared': [
    { en: 'feel scared', zh: '感到害怕' },
    { en: 'I\'m scared of dogs.', zh: '我怕狗。' },
  ],
  'shake': [
    { en: 'shake hands', zh: '握手' },
    { en: 'shake with fear', zh: '吓得发抖' },
  ],
  'excited': [
    { en: 'feel excited', zh: '感到兴奋' },
    { en: 'I\'m excited about the trip.', zh: '我对这次旅行感到兴奋。' },
  ],
  'opera': [
    { en: 'go to the opera', zh: '去看歌剧' },
    { en: 'a Beijing opera', zh: '京剧' },
  ],
  'next': [
    { en: 'next time', zh: '下次' },
    { en: 'next week', zh: '下周' },
  ],
  'cough': [
    { en: 'have a cough', zh: '咳嗽' },
    { en: 'He coughed all night.', zh: '他咳了一整夜。' },
  ],
  'better': [
    { en: 'feel better', zh: '感觉好些了' },
    { en: 'Get better soon.', zh: '早日康复。' },
  ],
  'practise': [
    { en: 'practise English', zh: '练习英语' },
    { en: 'practise every day', zh: '每天练习' },
  ],
  'gift': [
    { en: 'a birthday gift', zh: '一份生日礼物' },
    { en: 'give a gift', zh: '送礼物' },
  ],
  'surprised': [
    { en: 'feel surprised', zh: '感到惊讶' },
    { en: 'I\'m surprised to see you.', zh: '见到你我很惊讶。' },
  ],
  'model': [
    { en: 'a model ship', zh: '一艘模型船' },
    { en: 'make a model', zh: '做模型' },
  ],
  'bang': [
    { en: 'Bang! The door closes.', zh: '砰！门关上了。' },
    { en: 'a loud bang', zh: '砰的一声巨响' },
  ],
  'shout': [
    { en: 'shout for help', zh: '大声呼救' },
    { en: 'Don\'t shout.', zh: '别大喊大叫。' },
  ],
  'should': [
    { en: 'You should rest.', zh: '你应该休息。' },
    { en: 'We should help others.', zh: '我们应该帮助别人。' },
  ],
  'break': [
    { en: 'break a cup', zh: '打碎杯子' },
    { en: 'have a break', zh: '休息一下' },
  ],
  'feeling': [
    { en: 'a good feeling', zh: '一种好感觉' },
    { en: 'How is your feeling?', zh: '你感觉怎么样？' },
  ],
  'huge': [
    { en: 'a huge elephant', zh: '一头巨大的象' },
    { en: 'a huge house', zh: '一座大房子' },
  ],
  'worried': [
    { en: 'feel worried', zh: '感到担心' },
    { en: 'Don\'t be worried.', zh: '别担心。' },
  ],
  'street': [
    { en: 'in the street', zh: '在街上' },
    { en: 'cross the street', zh: '过马路' },
  ],
  'hit': [
    { en: 'hit the ball', zh: '击球' },
    { en: 'hit the wall', zh: '撞到墙' },
  ],

  /* ---------------- 4B Unit 3 Everyone's got talent ---------------- */
  'talent': [
    { en: 'have a talent', zh: '有天赋' },
    { en: 'a talent show', zh: '才艺表演' },
  ],
  'act': [
    { en: 'act in a play', zh: '在剧中表演' },
    { en: 'act well', zh: '演得好' },
  ],
  'magic': [
    { en: 'magic tricks', zh: '魔术' },
    { en: 'do magic', zh: '变魔术' },
  ],
  'shine': [
    { en: 'the sun shines', zh: '阳光照耀' },
    { en: 'shine bright', zh: '闪闪发光' },
  ],
  'puzzle': [
    { en: 'do a puzzle', zh: '做拼图' },
    { en: 'a jigsaw puzzle', zh: '拼图游戏' },
  ],
  'dancer': [
    { en: 'a good dancer', zh: '一位优秀的舞者' },
    { en: 'The dancer dances well.', zh: '这位舞者跳得很好。' },
  ],
  'win': [
    { en: 'win the game', zh: '赢得比赛' },
    { en: 'We win!', zh: '我们赢了！' },
  ],
  'just': [
    { en: 'just a minute', zh: '稍等一下' },
    { en: 'just now', zh: '刚才' },
  ],
  'duck': [
    { en: 'a little duck', zh: '一只小鸭子' },
    { en: 'The duck swims.', zh: '鸭子在游泳。' },
  ],
  'boy': [
    { en: 'a clever boy', zh: '一个聪明的男孩' },
    { en: 'a little boy', zh: '一个小男孩' },
  ],
  'anything': [
    { en: 'anything else', zh: '还有别的吗' },
    { en: 'Do you need anything?', zh: '你需要什么吗？' },
  ],
  'cock-a-doodle-doo': [
    { en: 'Cock-a-doodle-doo!', zh: '喔喔喔！（公鸡叫）' },
  ],
  'enough': [
    { en: 'enough water', zh: '足够的水' },
    { en: 'I have enough time.', zh: '我有足够的时间。' },
  ],
  'slowly': [
    { en: 'walk slowly', zh: '慢慢地走' },
    { en: 'Please speak slowly.', zh: '请说慢一点。' },
  ],

  /* ---------------- 4B Unit 4 Plant life ---------------- */
  'seed': [
    { en: 'plant a seed', zh: '种下一颗种子' },
    { en: 'a sunflower seed', zh: '一颗向日葵种子' },
  ],
  'earth': [
    { en: 'plant in the earth', zh: '种在泥土里' },
    { en: 'the Earth', zh: '地球' },
  ],
  'root': [
    { en: 'tree roots', zh: '树根' },
    { en: 'the root of a plant', zh: '植物的根' },
  ],
  'stem': [
    { en: 'a plant stem', zh: '植物的茎' },
    { en: 'a long stem', zh: '长长的茎' },
  ],
  'thin': [
    { en: 'a thin stem', zh: '细细的茎' },
    { en: 'a thin boy', zh: '瘦瘦的男孩' },
  ],
  'leaf': [
    { en: 'green leaves', zh: '绿叶' },
    { en: 'a leaf falls', zh: '一片叶子落下' },
  ],
  'dig': [
    { en: 'dig a hole', zh: '挖一个坑' },
    { en: 'dig in the earth', zh: '在泥土里挖' },
  ],
  'sunflower': [
    { en: 'a tall sunflower', zh: '一棵高高的向日葵' },
    { en: 'sunflowers face the sun', zh: '向日葵朝向太阳' },
  ],
  'wheat': [
    { en: 'a field of wheat', zh: '一片麦田' },
    { en: 'wheat bread', zh: '全麦面包' },
  ],
  'cotton': [
    { en: 'cotton clothes', zh: '棉质衣服' },
    { en: 'white cotton', zh: '白色的棉花' },
  ],
  'plant': [
    { en: 'plant trees', zh: '种树' },
    { en: 'a green plant', zh: '一株绿色的植物' },
  ],
  'dream': [
    { en: 'have a dream', zh: '有一个梦想' },
    { en: 'dream come true', zh: '梦想成真' },
  ],
  'sleep': [
    { en: 'go to sleep', zh: '入睡' },
    { en: 'sleep well', zh: '睡得好' },
  ],
  'mouse': [
    { en: 'a little mouse', zh: '一只小老鼠' },
    { en: 'The mouse runs fast.', zh: '老鼠跑得很快。' },
  ],
  'grain': [
    { en: 'a grain of rice', zh: '一粒米' },
    { en: 'wheat grain', zh: '麦粒' },
  ],
  'miss': [
    { en: 'miss my family', zh: '想念家人' },
    { en: 'I miss you.', zh: '我想你。' },
  ],
  'will': [
    { en: 'I will go.', zh: '我会去的。' },
    { en: 'Will you come?', zh: '你会来吗？' },
  ],
  'everything': [
    { en: 'everything is fine', zh: '一切都好' },
    { en: 'Thank you for everything.', zh: '谢谢你所做的一切。' },
  ],
  'cabbage': [
    { en: 'a green cabbage', zh: '一颗卷心菜' },
    { en: 'eat cabbage', zh: '吃卷心菜' },
  ],
  'come true': [
    { en: 'My dream comes true.', zh: '我的梦想实现了。' },
    { en: 'wish come true', zh: '愿望成真' },
  ],
  'paper': [
    { en: 'a piece of paper', zh: '一张纸' },
    { en: 'write on paper', zh: '在纸上写字' },
  ],

  /* ---------------- 4B Unit 5 School activities ---------------- */
  'event': [
    { en: 'a school event', zh: '一项学校活动' },
    { en: 'a sports event', zh: '一场体育赛事' },
  ],
  'drama': [
    { en: 'a drama club', zh: '戏剧社' },
    { en: 'act in a drama', zh: '在剧中表演' },
  ],
  'trip': [
    { en: 'a school trip', zh: '学校旅行' },
    { en: 'go on a trip', zh: '去旅行' },
  ],
  'fair': [
    { en: 'a book fair', zh: '书展' },
    { en: 'go to the fair', zh: '去集市' },
  ],
  'festival': [
    { en: 'a music festival', zh: '音乐节' },
    { en: 'Spring Festival', zh: '春节' },
  ],
  'horn': [
    { en: 'a cow\'s horn', zh: '牛角' },
    { en: 'blow the horn', zh: '吹号角' },
  ],
  'dot': [
    { en: 'a red dot', zh: '一个红点' },
    { en: 'join the dots', zh: '把点连起来' },
  ],
  'raindrop': [
    { en: 'a little raindrop', zh: '一滴小雨滴' },
    { en: 'raindrops fall', zh: '雨滴落下' },
  ],
  'more': [
    { en: 'more water', zh: '更多的水' },
    { en: 'one more time', zh: '再来一次' },
  ],
  'write': [
    { en: 'write a letter', zh: '写信' },
    { en: 'write your name', zh: '写下你的名字' },
  ],
  'those': [
    { en: 'those books', zh: '那些书' },
    { en: 'What are those?', zh: '那些是什么？' },
  ],
  'forest': [
    { en: 'a big forest', zh: '一片大森林' },
    { en: 'in the forest', zh: '在森林里' },
  ],
  'nature': [
    { en: 'enjoy nature', zh: '享受大自然' },
    { en: 'nature park', zh: '自然公园' },
  ],
  'hunt': [
    { en: 'hunt for food', zh: '寻找食物' },
    { en: 'hunt for treasure', zh: '寻宝' },
  ],
  'keeper': [
    { en: 'a zoo keeper', zh: '动物园饲养员' },
    { en: 'a shop keeper', zh: '店主' },
  ],
  'lovely': [
    { en: 'a lovely day', zh: '美好的一天' },
    { en: 'a lovely girl', zh: '可爱的女孩' },
  ],
  'student': [
    { en: 'a good student', zh: '一名好学生' },
    { en: 'a new student', zh: '一名新学生' },
  ],
  'fall': [
    { en: 'fall down', zh: '摔倒' },
    { en: 'leaves fall', zh: '树叶落下' },
  ],
  'off': [
    { en: 'take off the coat', zh: '脱下外套' },
    { en: 'turn off the light', zh: '关灯' },
  ],
  'fall off': [
    { en: 'fall off the bike', zh: '从自行车上摔下来' },
    { en: 'The leaves fall off.', zh: '树叶脱落了。' },
  ],
  'hour': [
    { en: 'half an hour', zh: '半小时' },
    { en: 'an hour ago', zh: '一小时前' },
  ],
  'culture': [
    { en: 'Chinese culture', zh: '中国文化' },
    { en: 'learn about culture', zh: '了解文化' },
  ],
  'note': [
    { en: 'take notes', zh: '做笔记' },
    { en: 'write a note', zh: '写一张便条' },
  ],
  'vote': [
    { en: 'vote for me', zh: '投我一票' },
    { en: 'cast a vote', zh: '投票' },
  ],
  'design': [
    { en: 'design a poster', zh: '设计海报' },
    { en: 'a new design', zh: '一个新设计' },
  ],
  'hometown': [
    { en: 'my hometown', zh: '我的家乡' },
    { en: 'go back to hometown', zh: '回到家乡' },
  ],

  /* ---------------- 4B Unit 6 Cool clothes ---------------- */
  'T-shirt': [
    { en: 'a white T-shirt', zh: '一件白色T恤' },
    { en: 'wear a T-shirt', zh: '穿T恤' },
  ],
  'skirt': [
    { en: 'a red skirt', zh: '一条红裙子' },
    { en: 'wear a skirt', zh: '穿裙子' },
  ],
  'shorts': [
    { en: 'a pair of shorts', zh: '一条短裤' },
    { en: 'wear shorts', zh: '穿短裤' },
  ],
  'shirt': [
    { en: 'a blue shirt', zh: '一件蓝色衬衫' },
    { en: 'wear a shirt', zh: '穿衬衫' },
  ],
  'trousers': [
    { en: 'a pair of trousers', zh: '一条裤子' },
    { en: 'wear trousers', zh: '穿裤子' },
  ],
  'scarf': [
    { en: 'a warm scarf', zh: '一条暖和的围巾' },
    { en: 'wear a scarf', zh: '戴围巾' },
  ],
  'sweater': [
    { en: 'a wool sweater', zh: '一件羊毛衫' },
    { en: 'wear a sweater', zh: '穿毛衣' },
  ],
  'dress': [
    { en: 'a nice dress', zh: '一条漂亮的连衣裙' },
    { en: 'wear a dress', zh: '穿连衣裙' },
  ],
  'party': [
    { en: 'a birthday party', zh: '生日聚会' },
    { en: 'go to a party', zh: '去参加聚会' },
  ],
  'end': [
    { en: 'at the end of', zh: '在……的末尾' },
    { en: 'in the end', zh: '最后' },
  ],
  'dressmaker': [
    { en: 'a dressmaker', zh: '一位裁缝' },
    { en: 'The dressmaker makes dresses.', zh: '裁缝做衣服。' },
  ],
  'Christmas': [
    { en: 'Merry Christmas!', zh: '圣诞快乐！' },
    { en: 'Christmas Day', zh: '圣诞节' },
  ],
  'the same': [
    { en: 'look the same', zh: '看起来一样' },
    { en: 'We are the same.', zh: '我们一样。' },
  ],
  'wrong': [
    { en: 'a wrong answer', zh: '错误的答案' },
    { en: 'What\'s wrong?', zh: '怎么了？' },
  ],
  'clever': [
    { en: 'a clever boy', zh: '一个聪明的男孩' },
    { en: 'How clever!', zh: '真聪明！' },
  ],
  'Mr': [
    { en: 'Mr Brown', zh: '布朗先生' },
    { en: 'Mr and Mrs', zh: '先生和夫人' },
  ],
  'present': [
    { en: 'a birthday present', zh: '一份生日礼物' },
    { en: 'give a present', zh: '送礼物' },
  ],
  'whole': [
    { en: 'the whole day', zh: '一整天' },
    { en: 'the whole class', zh: '全班' },
  ],
  'whale': [
    { en: 'a big whale', zh: '一头大鲸鱼' },
    { en: 'whales live in the sea', zh: '鲸鱼生活在海里' },
  ],
  'uniform': [
    { en: 'school uniform', zh: '校服' },
    { en: 'wear a uniform', zh: '穿制服' },
  ],
  'robe': [
    { en: 'a long robe', zh: '一件长袍' },
    { en: 'wear a robe', zh: '穿长袍' },
  ],
  'jacket': [
    { en: 'a warm jacket', zh: '一件暖和的夹克' },
    { en: 'wear a jacket', zh: '穿夹克' },
  ],
  'hat': [
    { en: 'a funny hat', zh: '一顶有趣的帽子' },
    { en: 'wear a hat', zh: '戴帽子' },
  ],
};

/* ---------- 关联词表的组装 ---------- */
/* 同根自动识别：课内词 + 常见后缀（rain → rainy / help → helper）。 */
const FAMILY_SUFFIXES = ['y', 'ny', 'ey', 'er', 'ers', 'ed', 'ing', 'ful', 'ly', 'man', 'men', 'day', 'thing',
  'times', 'shine', 'flower', 'port', 'ground', 'way', 'storm', 'drop', 'town', 'maker', 'ball', 'light'];

/* 第一步：补齐单词的拆分、记忆提示、单元归属和唯一标识。 */
ENGLISH_UNITS.forEach(unit => {
  unit.words.forEach(word => {
    const bits = word.segments ? word.segments.split('|').filter(Boolean) : [word.en];
    word.parts = bits.map((text, i) => ({
      t: text,
      d: bits.length === 1 ? '整体认读' : '第 ' + (i + 1) + '段',
    }));
    if (!word.memo) {
      word.memo = bits.length > 1
        ? '按 ' + bits.join(' · ') + ' 分段跟读，再连起来读一读。'
        : '先听整词，再跟读两遍，把发音和中文意思连起来。';
    }
    word.unitId = unit.id;
    word.key = unit.id + ':' + word.en;
    delete word.segments;
  });
});

const EN_ALL_WORDS = ENGLISH_UNITS.reduce((list, unit) => list.concat(unit.words), []);
const EN_INDEX = new Map();
EN_ALL_WORDS.forEach(word => {
  const bucket = EN_INDEX.get(word.en) || [];
  bucket.push(word);
  EN_INDEX.set(word.en, bucket);
});

const EN_SEEDS = [];
function seedLink(a, b, type) {
  if (!a || !b || a === b) return;
  EN_SEEDS.push({ a: a, b: b, type: type });
}
function addPairMap(map, type) {
  Object.keys(map).forEach(a => {
    map[a].forEach(item => {
      const b = typeof item === 'string' ? item : item.en;
      seedLink(a, b, type);
      seedLink(b, a, type);
    });
  });
}
addPairMap(ENGLISH_OPP, 'opp');
addPairMap(ENGLISH_NEAR, 'near');
addPairMap(ENGLISH_FAMILY_EXTRA, 'family');

/* 同根：词根 + 常见后缀 */
EN_ALL_WORDS.forEach(root => {
  EN_ALL_WORDS.forEach(derived => {
    if (root.en === derived.en || root.en.length < 3) return;
    if (derived.en.indexOf(root.en) !== 0) return;
    if (FAMILY_SUFFIXES.indexOf(derived.en.slice(root.en.length)) < 0) return;
    seedLink(root.en, derived.en, 'family');
    seedLink(derived.en, root.en, 'family');
  });
});

/* 组词：本册里由该词组成的短语或合成词 */
EN_ALL_WORDS.forEach(phrase => {
  if (phrase.en.indexOf(' ') < 0) return;
  phrase.en.split(/\s+/).forEach(token => {
    if (!EN_INDEX.has(token)) return;
    seedLink(token, phrase.en, 'phrase');
    seedLink(phrase.en, token, 'phrase');
  });
});

/* 同类：同一主题内互相认识 */
Object.keys(ENGLISH_GROUPS).forEach(name => {
  const list = ENGLISH_GROUPS[name];
  list.forEach(a => list.forEach(b => { if (a !== b) seedLink(a, b, 'group'); }));
});

/* 汇总：同一个词对只保留优先级最高的关系（反 > 近 > 根 > 组 > 类）。 */
const EN_LINKS = new Map();
EN_SEEDS.forEach(item => {
  let bucket = EN_LINKS.get(item.a);
  if (!bucket) { bucket = new Map(); EN_LINKS.set(item.a, bucket); }
  const old = bucket.get(item.b);
  if (old === undefined || RELATION_ORDER.indexOf(item.type) < RELATION_ORDER.indexOf(old)) {
    bucket.set(item.b, item.type);
  }
});

const POS_RE = /^(?:modal v|interj|n|v|adj|adv|prep|conj|det|pron)\.(?:\s*&\s*(?:modal v|interj|n|v|adj|adv|prep|conj|det|pron)\.)?\s*/i;
function plainZh(zh) {
  return String(zh || '')
    .replace(POS_RE, '')
    .replace(/；(?:modal v|interj|n|v|adj|adv|prep|conj|det|pron)\.\s*/g, '；')
    .replace(/，(?:modal v|interj|n|v|adj|adv|prep|conj|det|pron)\.\s*/g, '，');
}
function resolveLink(source, en) {
  const bucket = EN_INDEX.get(en);
  if (bucket && bucket.length) {
    const same = bucket.filter(word => word.unitId === source.unitId);
    const target = same.length ? same[0] : bucket[0];
    return { en: target.en, zh: plainZh(target.zh), inBook: true, key: target.key };
  }
  return { en: en, zh: OUT_ZH[en] || '拓展词', inBook: false, key: '' };
}

/* 第二步：给每个词挂上关联词，不够 3 条时用同单元的词补齐。 */
ENGLISH_UNITS.forEach(unit => {
  unit.words.forEach((word, index) => {
    const bucket = EN_LINKS.get(word.en) || new Map();
    const buckets = {};
    bucket.forEach((type, en) => {
      if (en === word.en) return;
      (buckets[type] = buckets[type] || []).push(en);
    });
    /* 同类词较多时，先排本单元的词，再排其他单元的词。 */
    if (buckets.group) {
      buckets.group.sort((a, b) => {
        const inA = (EN_INDEX.get(a) || []).some(item => item.unitId === word.unitId) ? 0 : 1;
        const inB = (EN_INDEX.get(b) || []).some(item => item.unitId === word.unitId) ? 0 : 1;
        return inA - inB;
      });
    }
    const links = [];
    RELATION_ORDER.forEach(type => {
      const cap = RELATION_CAP[type] || 2;
      (buckets[type] || []).slice(0, cap).forEach(en => {
        if (links.length >= RELATION_TOTAL) return;
        links.push(Object.assign({ type: type }, resolveLink(word, en)));
      });
    });
    if (links.length < RELATION_MIN) {
      const seen = links.map(link => link.en).concat([word.en]);
      for (let offset = 1; links.length < RELATION_MIN && offset < unit.words.length; offset++) {
        const en = unit.words[(index + offset) % unit.words.length].en;
        if (seen.indexOf(en) >= 0) continue;
        seen.push(en);
        links.push(Object.assign({ type: 'group' }, resolveLink(word, en)));
      }
    }
    word.links = links;
    word.phrases = ENGLISH_PHRASES[word.en] || [];
  });
});

const ENGLISH_BOOKS = [...new Set(ENGLISH_UNITS.map(unit => unit.book))];
const ENGLISH_WORDS = ENGLISH_UNITS.flatMap(unit => unit.words.map(word => ({
  en: word.en,
  zh: plainZh(word.zh),
  unitId: unit.id,
  unitName: unit.name,
  book: unit.book,
})));

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ENGLISH_UNITS, ENGLISH_BOOKS, ENGLISH_WORDS, RELATION_META, RELATION_ORDER };
}
