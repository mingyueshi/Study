/* 文明巡礼资料。年代为选读范围；复用素材以事件编号指向 media-data.js，避免重复维护。 */
window.HISTORY_CIVILIZATIONS = {
  "themes": [
    {
      "id": "architecture",
      "label": "建筑",
      "question": "建筑服务什么用途，怎样形成空间？",
      "icon": "🏛️"
    },
    {
      "id": "writing",
      "label": "文字",
      "question": "怎样把语言和信息保存下来？",
      "icon": "✍️"
    },
    {
      "id": "governance",
      "label": "制度",
      "question": "谁能作决定，社会怎样运转？",
      "icon": "⚖️"
    },
    {
      "id": "achievements",
      "label": "成就",
      "question": "知识怎样产生、传播和改变生活？",
      "icon": "🔎"
    }
  ],
  "sources": {
    "egypt-site": {
      "title": "孟菲斯与金字塔群",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/86/"
    },
    "egypt-education": {
      "title": "古埃及艺术：教师资源",
      "publisher": "大都会艺术博物馆",
      "url": "https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Ancient_Egypt_A_Resource_for_Educators.pdf"
    },
    "egypt-writing": {
      "title": "古埃及：法老的象征与文字",
      "publisher": "大英博物馆",
      "url": "https://www.britishmuseum.org/sites/default/files/2025-05/Ancient-Egypt-Symbols-Visit-Resource-Ages-7-11.pdf"
    },
    "egypt-papyrus": {
      "title": "Papyrus in Ancient Egypt",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/papyrus-in-ancient-egypt"
    },
    "meso-writing": {
      "title": "The Origins of Writing",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/the-origins-of-writing"
    },
    "meso-site": {
      "title": "伊拉克南部湿地与美索不达米亚古城",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/1481/"
    },
    "meso-law": {
      "title": "The Code of Hammurabi",
      "publisher": "卢浮宫",
      "url": "https://www.louvre.fr/en/the-code-of-hammurabi"
    },
    "meso-math": {
      "title": "Babylonian Mathematics",
      "publisher": "圣安德鲁斯大学MacTutor",
      "url": "https://mathshistory.st-andrews.ac.uk/HistTopics/Babylonian_mathematics/"
    },
    "greece-art": {
      "title": "Greek Art in the Archaic Period",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/greek-art-in-the-archaic-period"
    },
    "greece-education": {
      "title": "希腊艺术：从史前到古典时期",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/greek.pdf"
    },
    "greece-site": {
      "title": "雅典卫城",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/404/"
    },
    "greece-exchange": {
      "title": "古希腊殖民、贸易与艺术交流",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/ancient-greek-colonization-and-trade-and-their-influence-on-greek-art"
    },
    "rome-education": {
      "title": "Roman Art: A Resource for Educators",
      "publisher": "大都会艺术博物馆",
      "url": "https://resources.metmuseum.org/resources/metpublications/pdf/Roman_Art_A_Resource_for_Educators.pdf"
    },
    "rome-writing": {
      "title": "Roman Inscriptions",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/roman-inscriptions"
    },
    "rome-theater": {
      "title": "Theater and Amphitheater in the Roman World",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/theater-and-amphitheater-in-the-roman-world"
    },
    "rome-republic": {
      "title": "The Roman Republic",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/the-roman-republic"
    },
    "maya-world": {
      "title": "The Maya World",
      "publisher": "史密森尼美洲印第安人国家博物馆",
      "url": "https://maya.nmai.si.edu/the-maya/maya-world"
    },
    "maya-calendar": {
      "title": "Calendar",
      "publisher": "史密森尼美洲印第安人国家博物馆",
      "url": "https://maya.nmai.si.edu/calendar"
    },
    "maya-today": {
      "title": "The Maya",
      "publisher": "史密森尼美洲印第安人国家博物馆",
      "url": "https://maya.nmai.si.edu/maya"
    },
    "maya-site": {
      "title": "蒂卡尔国家公园",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/64/"
    },
    "persia-site": {
      "title": "波斯波利斯",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/114/"
    },
    "persia-empire": {
      "title": "The Achaemenid Persian Empire (550–330 B.C.)",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/the-achaemenid-persian-empire-550-330-b-c"
    },
    "persia-archive": {
      "title": "波斯波利斯档案与文化遗产保护",
      "publisher": "美国国家人文基金会",
      "url": "https://www.neh.gov/divisions/preservation/featured-project/preserving-the-cultural-heritage-the-ancient-near-east-and-t"
    },
    "arab-art": {
      "title": "The Nature of Islamic Art",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/the-nature-of-islamic-art"
    },
    "arab-site": {
      "title": "科尔多瓦历史中心",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/313/"
    },
    "arab-courts": {
      "title": "Iraq (Mesopotamia), 500–1000 A.D.",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/ja/toah/ht/06/wam.html"
    },
    "arab-calligraphy": {
      "title": "Calligraphy in Islamic art",
      "publisher": "维多利亚与阿尔伯特博物馆",
      "url": "https://www.vam.ac.uk/articles/calligraphy-in-islamic-art"
    },
    "arab-maths": {
      "title": "Arabic Mathematics",
      "publisher": "圣安德鲁斯大学MacTutor",
      "url": "https://mathshistory.st-andrews.ac.uk/HistTopics/Arabic_mathematics/"
    },
    "arab-khwarizmi": {
      "title": "Al-Khwarizmi",
      "publisher": "圣安德鲁斯大学MacTutor",
      "url": "https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/"
    },
    "arab-spain": {
      "title": "西班牙倭马亚时期的艺术",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/essays/the-art-of-the-umayyad-period-in-spain-711-1031"
    },
    "india-city": {
      "title": "摩亨佐-达罗考古遗址",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/138/"
    },
    "india-site": {
      "title": "桑吉佛教古迹",
      "publisher": "UNESCO世界遗产中心",
      "url": "https://whc.unesco.org/en/list/524/"
    },
    "india-stupa": {
      "title": "Buddhist Monuments at Sanchi",
      "publisher": "印度考古调查局",
      "url": "https://asi.nic.in/pages/WorldHeritageBuddhistMonumentsatSanchi"
    },
    "india-edicts": {
      "title": "印度铭文学与阿育王诏令",
      "publisher": "印度考古调查局",
      "url": "https://asi.nic.in/pages/Epigraphy-Branch/hq"
    },
    "india-script": {
      "title": "印度河符号与尚未解决的释读问题",
      "publisher": "大英博物馆",
      "url": "https://www.britishmuseum.org/sites/default/files/2020-11/British_Museum_Magazine_Autumn2020_reducedsize.pdf"
    },
    "met-egypt": {
      "title": "僧侣体纸草书信",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    },
    "meso": {
      "title": "早期物资账目泥板",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/327385"
    },
    "greek-decree": {
      "title": "阿提卡法令铭文残片",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/252475"
    },
    "roman-bilingual": {
      "title": "拉丁文与希腊文双语石碑",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/241947"
    },
    "maya-vessel": {
      "title": "水鸟与玛雅文字陶器",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/761272"
    },
    "persian-relief": {
      "title": "波斯波利斯宫殿浮雕残片",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/323178"
    },
    "persian-bowl": {
      "title": "阿契美尼德金碗",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/324289"
    },
    "arab-capital": {
      "title": "科尔多瓦相关柱头",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/448410"
    },
    "arab-quran": {
      "title": "库法体《古兰经》书页",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/448369"
    },
    "indus-seal": {
      "title": "带牛形象的印度河印章",
      "publisher": "大都会艺术博物馆",
      "url": "https://www.metmuseum.org/art/collection/search/38287"
    },
    "india-photo": {
      "title": "The Great Stupa at Sanchi, 1861–1862",
      "publisher": "维多利亚与阿尔伯特博物馆",
      "url": "https://collections.vam.ac.uk/item/O175835/the-great-stupa-at-sanchi-photograph-waterhouse-james-john/"
    }
  },
  "civilizations": [
    {
      "id": "egypt",
      "name": "古埃及",
      "subtitle": "沿尼罗河读懂石头、文字与王权",
      "region": "非洲东北部 · 尼罗河流域",
      "period": "约前 3100—前 30 年",
      "start": -3100,
      "end": -30,
      "anchorYear": -2560,
      "era": "dawn",
      "color": "#a66b26",
      "scope": "以法老时代为主，选读古王国金字塔、新王国与晚期文字材料；各时期制度和艺术都有变化。",
      "summary": "尼罗河把农田、城市与运输联系起来。金字塔、文书和王室图像，让我们看见农业社会如何组织大型工程与行政。",
      "question": "一座金字塔背后，需要哪些看不见的工作？",
      "caution": "古埃及不是几千年不变的同一种生活；金字塔也不是所有时期法老陵墓的统一样式。",
      "tags": [
        "尼罗河",
        "金字塔",
        "法老",
        "象形文字",
        "纸草"
      ],
      "eventIds": [
        "tw2",
        "tw4",
        "tw8"
      ],
      "sources": [
        "egypt-site",
        "egypt-education",
        "egypt-writing",
        "egypt-papyrus"
      ],
      "images": [
        {
          "mediaEvent": "tw4",
          "theme": "architecture"
        },
        {
          "width": 600,
          "height": 338,
          "src": "assets/civilizations/met-egypt.jpg",
          "theme": "writing",
          "title": "僧侣体纸草书信",
          "alt": "纸草上可以看见横向排列的手写墨迹",
          "caption": "新王国时期纸草书信，约前 1473—前 1458 年。这里是僧侣体手写形式，不是把石刻象形字逐个搬上纸草。",
          "prompt": "对比石刻与手写，怎样的笔画更方便快速记录？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/544847"
        }
      ],
      "milestones": [
        {
          "year": -3100,
          "label": "约前 3100 年",
          "text": "上、下埃及的统一成为法老国家形成的重要节点。"
        },
        {
          "year": -2560,
          "label": "约前 26 世纪",
          "text": "吉萨大型金字塔展示古王国的工程与组织能力。"
        },
        {
          "year": -1330,
          "label": "约前 14 世纪",
          "text": "图坦卡蒙墓葬为认识新王国的王室艺术提供材料。"
        },
        {
          "year": -30,
          "label": "前 30 年",
          "text": "埃及纳入罗马统治，文化和日常生活仍继续变化。"
        }
      ],
      "sections": [
        {
          "id": "egypt-architecture",
          "theme": "architecture",
          "title": "金字塔是一组工程，不只是一座尖顶",
          "lead": "从建筑用途、材料与组织三个角度观察。",
          "points": [
            "吉萨金字塔属于王室丧葬建筑群，周围还有神庙、道路与其他墓葬。",
            "切石、运输、测量、食物供给和人员协调，都与建筑能否完成有关。"
          ],
          "example": "胡夫金字塔与周围的墓葬建筑群",
          "explanation": "巨大的体量是可见成果，工程背后的劳动与资源安排则要借助遗址和文书研究。",
          "prompt": "只看金字塔外形，能知道工人怎样得到食物吗？",
          "answer": "不能。外形可以说明构造的一部分；人员和供给问题需要住址、食物遗存与文字等其他证据。",
          "boundary": "不要把大型工程的所有劳动者简单说成同一种身份，也不能仅凭遗址判断每个人的经历。",
          "sources": [
            "egypt-site",
            "egypt-education"
          ]
        },
        {
          "id": "egypt-writing",
          "theme": "writing",
          "title": "象形文字并非「一幅图就是一个词」",
          "lead": "先分清语言、书写系统与书写材料。",
          "points": [
            "象形文字中有表音符号，也有表意和帮助限定意义的符号。",
            "正式铭刻与手写文书的样式不同；纸草上的僧侣体更适合快速书写。"
          ],
          "example": "石刻铭文与纸草书信",
          "explanation": "同一种语言可以采用不同书写形式；纸草是材料，象形文字或僧侣体才是书写形式。",
          "prompt": "看到像鸟的符号，能直接断定整句话在讲鸟吗？",
          "answer": "不能。符号可能表示声音，也可能帮助说明词的意义，必须结合上下文。",
          "boundary": "识字能力并非人人具备，保存下来的文书也不能代表所有人的声音。",
          "sources": [
            "egypt-writing",
            "egypt-papyrus",
            "met-egypt"
          ]
        },
        {
          "id": "egypt-governance",
          "theme": "governance",
          "title": "法老与官员怎样管理资源",
          "lead": "王权、宗教、土地与文书相互联系。",
          "points": [
            "法老是国家权力与宗教秩序的重要象征，行政事务仍需要官员和书吏承担。",
            "粮食、劳役和土地等事务需要记录，记录帮助资源在不同机构之间分配。"
          ],
          "example": "从收获记录看书吏的作用",
          "explanation": "知道谁交了多少、什么地方还缺粮，才能安排供给。文字也与权力和税收相连。",
          "prompt": "负责人只知道总粮食很多，为什么还不够？",
          "answer": "还需要知道粮食在哪里、由谁保管、何时交付和哪些人要领取。",
          "boundary": "法老时代很长，中央与地方的实际权力随时期变化，不能用一张等级图概括全部。",
          "sources": [
            "egypt-education"
          ]
        },
        {
          "id": "egypt-achievements",
          "theme": "achievements",
          "title": "把测量、历法与书写用于生活",
          "lead": "知识往往从具体任务中积累。",
          "points": [
            "测量和计算服务田地、建筑与物资分配，不能只用宏伟建筑评价知识。",
            "纸草书写与图像记录留下宗教、行政和日常生活线索，也帮助后人研究。"
          ],
          "example": "一份文书为什么也是文明成就",
          "explanation": "能让信息超越当场记忆、被保存和核查，本身就是社会协作的重要能力。",
          "prompt": "一件黄金面具与一封书信，分别能让我们知道什么？",
          "answer": "面具有材料、工艺和葬俗线索；书信更可能留下具体人的请求与事务。两者互相补充。",
          "boundary": "避免把所有现代数学、医学或历法都直接追溯为单一文明的一次发明。",
          "sources": [
            "egypt-education",
            "egypt-papyrus"
          ]
        }
      ]
    },
    {
      "id": "mesopotamia",
      "name": "两河流域",
      "subtitle": "从泥板账本到城市与法律",
      "region": "西亚 · 底格里斯河与幼发拉底河流域",
      "period": "约前 3500—前 539 年（选读）",
      "start": -3500,
      "end": -539,
      "anchorYear": -1750,
      "era": "bronze",
      "color": "#a75438",
      "scope": "跨苏美尔城邦、古巴比伦等不同国家与时期，重点观察城市、楔形文字和汉谟拉比石碑。",
      "summary": "泥土不只用来造房子，也能用来记录物资、语言与规则。许多城市和王朝先后出现，共同构成两河流域的历史。",
      "question": "如果给全城分粮，为什么会需要一块泥板？",
      "caution": "「两河流域」是历史地理范围，不是一个始终统一的国家；楔形文字也曾用来书写不同语言。",
      "tags": [
        "苏美尔",
        "乌鲁克",
        "巴比伦",
        "楔形文字",
        "泥板",
        "法典",
        "六十进位"
      ],
      "eventIds": [
        "tw1",
        "tw6"
      ],
      "sources": [
        "meso-writing",
        "meso-site",
        "meso-law",
        "meso-math"
      ],
      "images": [
        {
          "mediaEvent": "tw6",
          "theme": "governance"
        },
        {
          "width": 468,
          "height": 624,
          "src": "assets/civilizations/meso.jpg",
          "theme": "writing",
          "title": "早期物资账目泥板",
          "alt": "浅色泥板表面被分成小格，格中有压印符号",
          "caption": "约前 3100—前 2900 年的早期行政泥板，记录麦芽与大麦等物资，展示记账与早期书写的联系。",
          "prompt": "先找分格，再找重复出现的记号；分类和计数怎样一起使用？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/327385"
        }
      ],
      "milestones": [
        {
          "year": -3500,
          "label": "约前 4 千纪后期",
          "text": "乌鲁克等城市发展，记录与资源管理的需求扩大。"
        },
        {
          "year": -3200,
          "label": "约前 3200 年前后",
          "text": "早期泥板出现数量与符号记录，书写此后继续发展。"
        },
        {
          "year": -1750,
          "label": "约前 1750 年",
          "text": "汉谟拉比石碑留下大量关于社会纠纷与裁决的文字。"
        },
        {
          "year": -539,
          "label": "前 539 年",
          "text": "波斯占领巴比伦；当地语言、文书和学术传统并未随政权立即消失。"
        }
      ],
      "sections": [
        {
          "id": "mesopotamia-architecture",
          "theme": "architecture",
          "title": "从土砖城市到高台神庙",
          "lead": "材料和地理条件影响建筑选择。",
          "points": [
            "当地常用泥土制砖，城市中有住区、公共建筑与宗教空间。",
            "乌尔、乌鲁克等城址保留了分布和层累，能帮助研究城市如何扩展。"
          ],
          "example": "两河古城与高台神庙",
          "explanation": "高台神庙把宗教建筑抬高，不能因轮廓像金字塔就说它与埃及金字塔用途相同。",
          "prompt": "两座建筑都向上收窄，就能判断功能一样吗？",
          "answer": "不能。要看入口、内部空间、周围建筑、遗物与文字，分清神庙与陵墓等用途。",
          "boundary": "今天见到的遗址可能经过保护和修复，需要核对哪些部分保存自古代。",
          "sources": [
            "meso-site"
          ]
        },
        {
          "id": "mesopotamia-writing",
          "theme": "writing",
          "title": "楔形文字：用压痕记录语言",
          "lead": "从记账进入更广泛的书写。",
          "points": [
            "书写者用芦苇等笔具在湿泥上留下楔状压痕，泥板干燥后保存记录。",
            "文字逐步结合词义和声音，后来用于经济、文学、宗教与学术等多类文书。"
          ],
          "example": "记录麦芽与大麦的行政泥板",
          "explanation": "账本让物资和数量可以被复查；成熟书写系统能表达远比物品清单复杂的内容。",
          "prompt": "只有物品小图画，记录人名和动作会遇到什么困难？",
          "answer": "图画较容易提示物品，却难直接表示所有人名、声音和关系，因此需要更复杂的符号使用规则。",
          "boundary": "早期书写起源仍有研究讨论，不把某一块泥板说成全部文字的唯一开端。",
          "sources": [
            "meso-writing",
            "meso"
          ]
        },
        {
          "id": "mesopotamia-governance",
          "theme": "governance",
          "title": "把裁决刻成文字，等于现代法典吗",
          "lead": "规则的形式与适用社会都要比较。",
          "points": [
            "汉谟拉比石碑涉及财产、家庭、劳动与交易等纠纷，常用条件式表述。",
            "国王也借石碑上的文字和形象展示维护秩序与司法权威。"
          ],
          "example": "汉谟拉比石碑",
          "explanation": "它是研究古代司法的重要材料，但并非现代意义上统一、完整的法律体系。",
          "prompt": "读到「如果……那么……」时，还要核对什么？",
          "answer": "要核对适用的人、情形、社会身份和后果，再判断规则在当时意味着什么。",
          "boundary": "成文不等于人人平等，也不能只凭石碑推定所有案件都按文字完全执行。",
          "sources": [
            "meso-law"
          ]
        },
        {
          "id": "mesopotamia-achievements",
          "theme": "achievements",
          "title": "计算与记录让合作规模扩大",
          "lead": "从分粮、土地和天象中看知识积累。",
          "points": [
            "两河文书把数量、物资与责任联系起来，为研究复杂社会留下连续材料。",
            "巴比伦数学发展了六十进位的计算传统，能处理多类数量问题。"
          ],
          "example": "为什么进位规则值得研究",
          "explanation": "十个一合成十是一种规则，六十个单位合成更高一位则是另一种；比较规则可以理解记数方法。",
          "prompt": "同样写两个数字，怎样知道它们各表示多少？",
          "answer": "必须知道符号、进位方法和所在位置的含义，不能只把古代符号换成现代数字就算读懂。",
          "boundary": "六十进位传统影响深远，但不要把现代计时与角度单位的全部历史简化为一次发明。",
          "sources": [
            "meso-writing",
            "meso-math"
          ]
        }
      ]
    },
    {
      "id": "greece",
      "name": "古希腊",
      "subtitle": "城邦、字母与公共讨论",
      "region": "地中海 · 爱琴海及周边希腊语世界",
      "period": "约前 8 世纪—前 1 世纪（选读）",
      "start": -800,
      "end": -31,
      "anchorYear": -450,
      "era": "axial",
      "color": "#397993",
      "scope": "以古风、古典与希腊化时期为主，雅典只是一座城邦，不能代表全部希腊社会。",
      "summary": "海上交流把许多城邦连接起来。语言、节庆与艺术提供共同联系，制度和利益却并不一致。",
      "question": "拥有相近语言和神话的城市，为什么会采用不同的制度？",
      "caution": "古希腊不是始终统一的国家；古代雅典的公民参与也不等于今天的普遍政治权利。",
      "tags": [
        "城邦",
        "雅典",
        "斯巴达",
        "字母",
        "柱式",
        "民主",
        "戏剧",
        "奥林匹亚"
      ],
      "eventIds": [
        "tw9",
        "tw13",
        "tw43"
      ],
      "sources": [
        "greece-art",
        "greece-education",
        "greece-site",
        "greece-exchange"
      ],
      "images": [
        {
          "mediaEvent": "tw9",
          "theme": "architecture"
        },
        {
          "width": 600,
          "height": 492,
          "src": "assets/civilizations/greek-decree.jpg",
          "theme": "writing",
          "title": "阿提卡法令铭文残片",
          "alt": "一块不规则大理石残片上保留数行希腊字母",
          "caption": "约前 4—前 3 世纪的阿提卡法令残片。断裂边缘提醒我们：现存文字不是完整法令。",
          "prompt": "找出石材的断边，想想缺文为什么会影响解释。",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/252475"
        }
      ],
      "milestones": [
        {
          "year": -800,
          "label": "约前 8 世纪",
          "text": "城邦、字母和跨地区交流发展。"
        },
        {
          "year": -508,
          "label": "约前 508—前 507 年",
          "text": "雅典的政治改革推动公民参与制度形成。"
        },
        {
          "year": -450,
          "label": "前 5 世纪中叶",
          "text": "雅典卫城建筑群的建设成为古典艺术的重要线索。"
        },
        {
          "year": -323,
          "label": "前 323 年以后",
          "text": "亚历山大去世后，希腊化诸王国延续并扩展文化交流。"
        }
      ],
      "sections": [
        {
          "id": "greece-architecture",
          "theme": "architecture",
          "title": "柱廊怎样围出公共与宗教空间",
          "lead": "从支撑方式、比例和用途看建筑。",
          "points": [
            "神庙常以柱列和横梁组织空间，不同柱式有不同的比例与细部。",
            "圣所、运动场和剧场各有用途，不能把所有柱廊都叫神庙。"
          ],
          "example": "雅典卫城与奥林匹亚训练场",
          "explanation": "柱子是结构，也是空间秩序的一部分；同样的柱廊能服务不同活动。",
          "prompt": "只凭石柱能判断这里曾经做什么吗？",
          "answer": "还要看整体平面、座席、祭坛、器物与文字等线索。",
          "boundary": "今天常见的石材本色不表示古代所有建筑和雕像都没有颜色。",
          "sources": [
            "greece-site",
            "greece-art",
            "greece-education"
          ]
        },
        {
          "id": "greece-writing",
          "theme": "writing",
          "title": "字母把语言声音拆开记录",
          "lead": "观察文字如何在交流中改变。",
          "points": [
            "希腊字母吸收并改造腓尼基书写传统，成为记录希腊语的重要工具。",
            "铭刻、诗歌与文书用途不同，字母样式也曾因地区而异。"
          ],
          "example": "阿提卡法令铭文残片",
          "explanation": "石头上的字母可以记录公共决定，而不仅是装饰。",
          "prompt": "同一种字母能用于不同语言吗？",
          "answer": "可以。书写符号和语言不是同一个概念，借用时还可能增加或改变符号。",
          "boundary": "用一块残片无法读出整项法令，缺文和复原必须说明。",
          "sources": [
            "greece-exchange",
            "greece-art",
            "greek-decree"
          ]
        },
        {
          "id": "greece-governance",
          "theme": "governance",
          "title": "谁算公民，谁能参加决策",
          "lead": "把制度名称与参与条件一起读。",
          "points": [
            "雅典的成年男性公民可参加公民大会等政治活动，妇女、奴隶和外来居民受到排除。",
            "不同城邦有各自的权力安排；斯巴达与雅典不能套用同一制度图。"
          ],
          "example": "雅典的公民大会",
          "explanation": "讨论程序是一方面，有资格参加的人群范围也是判断制度的关键。",
          "prompt": "说「人人都能投票」，少检查了哪一步？",
          "answer": "要先问当时谁被算作公民、谁被排除，以及哪些事项由谁决定。",
          "boundary": "雅典民主随时期变化，不能把它等同于现代国家制度或所有希腊人的共同制度。",
          "sources": [
            "greece-education"
          ]
        },
        {
          "id": "greece-achievements",
          "theme": "achievements",
          "title": "辩论、艺术与交流互相推动",
          "lead": "从共同问题观察知识和表达。",
          "points": [
            "戏剧、哲学讨论、运动节庆和雕塑，形成多种公共表达与竞争场合。",
            "希腊文化持续吸收埃及、西亚等地的知识与技艺，希腊化时期交流进一步扩大。"
          ],
          "example": "在一座城市里讨论「什么是好的生活」",
          "explanation": "追问理由、比较不同回答，与艺术表现和公共生活相互联系。",
          "prompt": "不同意见为什么可能帮助人们思考？",
          "answer": "前提是给出理由、核对证据，并允许观点接受质疑，而不只是声音更大。",
          "boundary": "不把后来的全部科学或民主都归于单一文明，交流与继承同样重要。",
          "sources": [
            "greece-art",
            "greece-education",
            "greece-exchange"
          ]
        }
      ]
    },
    {
      "id": "rome",
      "name": "古罗马",
      "subtitle": "从共和国到帝国：法律与城市网络",
      "region": "地中海 · 从意大利扩展到跨区域帝国",
      "period": "前 509 年—476 年；延伸至 6 世纪",
      "start": -509,
      "end": 534,
      "anchorYear": 80,
      "era": "empire",
      "color": "#9d4b45",
      "scope": "区分王政传统、共和国与帝国，主要观察共和国和帝国时期，并延伸到东罗马法典整理。",
      "summary": "道路、水道、铭文与法律把城市和人群连接起来。扩张带来交流与资源，也伴随战争、奴役和身份差异。",
      "question": "一座大城市怎样让人、水和信息到达需要的地方？",
      "caution": "476 年是西罗马政治史的重要节点，东部帝国和许多罗马传统仍延续；不是整个罗马文明在一年中消失。",
      "tags": [
        "共和国",
        "元老院",
        "皇帝",
        "拉丁文",
        "拱券",
        "水道",
        "罗马法",
        "公民"
      ],
      "eventIds": [
        "tw45",
        "tw16",
        "tw17",
        "tw18",
        "tw20",
        "tw49"
      ],
      "sources": [
        "rome-education",
        "rome-writing",
        "rome-theater",
        "rome-republic"
      ],
      "images": [
        {
          "mediaEvent": "tw18",
          "theme": "architecture"
        },
        {
          "width": 600,
          "height": 450,
          "src": "assets/civilizations/roman-bilingual.jpg",
          "theme": "writing",
          "title": "拉丁文与希腊文双语石碑",
          "alt": "同一块石碑上分布着上下两组不同的字母文字",
          "caption": "1 世纪的塞浦路斯罗马时期墓志，上方是拉丁文，下方是希腊文。两组文字遵循各自语言的表达习惯。",
          "prompt": "先找上下两组文字，不用认全字母，也能观察分行与字形的差别。",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/241947"
        }
      ],
      "milestones": [
        {
          "year": -509,
          "label": "传统纪年：前 509 年",
          "text": "罗马共和国的开端常以这一年份表示。"
        },
        {
          "year": -27,
          "label": "前 27 年",
          "text": "奥古斯都时期成为理解帝国统治形成的重要节点。"
        },
        {
          "year": 80,
          "label": "80 年",
          "text": "斗兽场落成启用，展现大型公共建筑的组织能力。"
        },
        {
          "year": 476,
          "label": "476 年",
          "text": "西罗马皇帝被废，东部帝国继续存在。"
        },
        {
          "year": 534,
          "label": "534 年前后",
          "text": "查士丁尼时期整理罗马法传统。"
        }
      ],
      "sections": [
        {
          "id": "rome-architecture",
          "theme": "architecture",
          "title": "拱券、穹顶与公共建筑",
          "lead": "看工程怎样与人群活动相配合。",
          "points": [
            "拱券和混凝土等技术有助于形成大跨度空间、通道与多层建筑。",
            "斗兽场的入口、楼梯与座席把大量观众分配到不同区域。"
          ],
          "example": "从斗兽场外墙寻找拱门",
          "explanation": "建筑既要承受重量，也安排人的进入、观看与离开。",
          "prompt": "如果所有观众只用一个狭小入口，会发生什么？",
          "answer": "通行会受阻；多个通道和分区能改变人流，但座席安排也可能显示社会等级。",
          "boundary": "古罗马不是凭空发明所有建筑形式，它吸收并改变了希腊、伊特鲁里亚等传统。",
          "sources": [
            "rome-education",
            "rome-theater"
          ]
        },
        {
          "id": "rome-writing",
          "theme": "writing",
          "title": "罗马帝国内，不只有拉丁文",
          "lead": "文字材料留下日常社会的细节。",
          "points": [
            "拉丁文广泛用于西部；希腊文在帝国东部同样重要。",
            "公共铭刻、墓志、涂写与书信的作者和用途不同，提供不同社会线索。"
          ],
          "example": "同一块石碑上的拉丁文与希腊文",
          "explanation": "双语文字说明交流与身份可能交叠，不能用一国一语言的模式理解整个帝国。",
          "prompt": "墓碑为什么也是历史材料？",
          "answer": "它可能留下姓名、年龄、职业、家庭和社会身份，但仍需核对表述习惯和保存情况。",
          "boundary": "识字与材料保存并不平均，未留下铭文的人也属于历史的一部分。",
          "sources": [
            "rome-writing",
            "roman-bilingual"
          ]
        },
        {
          "id": "rome-governance",
          "theme": "governance",
          "title": "共和国与帝国怎样分配权力",
          "lead": "不要只记制度的名字。",
          "points": [
            "共和国中，执政官、元老院和公民大会承担不同角色，实际权力受财富与身份影响。",
            "帝国时期皇帝掌握核心军政权力，一些共和机构的名称和形式仍被保留。"
          ],
          "example": "同样有元老院，权力就完全一样吗",
          "explanation": "机构名称可以延续，实际决定权和军队控制却会变化。",
          "prompt": "比较两个时期，应该核对哪些具体权力？",
          "answer": "核对谁任命官员、掌握军队、提出或批准规则，以及谁能参与决策。",
          "boundary": "共和国也不等于人人享有同等权利；奴隶制度和社会等级必须一并说明。",
          "sources": [
            "rome-education",
            "rome-republic"
          ]
        },
        {
          "id": "rome-achievements",
          "theme": "achievements",
          "title": "水道与法律都是连接社会的网络",
          "lead": "把技术成就放回使用条件。",
          "points": [
            "引水工程通常利用地势差，把水送往城市的水池、喷泉与浴场等地方。",
            "罗马法律长期发展，东罗马时期的整理又为后世留下重要文本。"
          ],
          "example": "公共供水需要持续维护",
          "explanation": "修成水道只是开始，还需要清理、维修、分配和管理。",
          "prompt": "有一条水道，能推断所有人都在家中用上水吗？",
          "answer": "不能。供水终点、公共取水点、私人接入与社会差异都需要具体研究。",
          "boundary": "法典影响深远不代表当时规则完全符合今天的权利观念，也不代表处处执行一致。",
          "sources": [
            "rome-education"
          ]
        }
      ]
    },
    {
      "id": "maya",
      "name": "玛雅",
      "subtitle": "城市、文字与多种历法",
      "region": "美洲 · 今墨西哥南部和中美洲部分地区",
      "period": "约 250—900 年（古典期重点）",
      "start": 250,
      "end": 900,
      "anchorYear": 650,
      "era": "golden",
      "color": "#36805c",
      "scope": "以古典期城邦与蒂卡尔为入口，同时介绍文字、历法和延续至今的玛雅文化。",
      "summary": "雨林与高地之间分布着许多玛雅城市。建筑、陶器文字和天象记录，留下艺术、政治与知识的线索。",
      "question": "同一件重要事情，为什么可以用几套历法来记录？",
      "caution": "一些古典期城市衰落，不等于玛雅人消失。今天仍有玛雅人使用自己的语言，延续并发展文化。",
      "tags": [
        "蒂卡尔",
        "城邦",
        "玛雅文字",
        "历法",
        "二十进位",
        "雨林",
        "中美洲"
      ],
      "eventIds": [
        "tw22"
      ],
      "sources": [
        "maya-world",
        "maya-calendar",
        "maya-today",
        "maya-site"
      ],
      "images": [
        {
          "mediaEvent": "tw22",
          "theme": "architecture"
        },
        {
          "width": 4000,
          "height": 3315,
          "src": "assets/civilizations/maya-vessel.jpg",
          "theme": "writing",
          "title": "玛雅陶杯背面的斜向铭文",
          "alt": "陶杯背面沿斜线排列着一串玛雅文字，周围可见细密纹饰",
          "caption": "约 600—900 年的玛雅陶杯背面。正面另有水鸟形象；这张照片展示斜向排列的铭文，图像和文字需结合不同角度观察。",
          "prompt": "找出斜向排列的字块。为什么研究器物不能只看一个角度？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/761272"
        }
      ],
      "milestones": [
        {
          "year": 250,
          "label": "约 250 年起",
          "text": "古典期诸城邦发展，不同城市形成各自的政治关系。"
        },
        {
          "year": 600,
          "label": "约 6—8 世纪",
          "text": "石刻与彩绘陶器留下统治者、仪式和文字记录。"
        },
        {
          "year": 800,
          "label": "约 8—9 世纪",
          "text": "许多南部低地城市发生人口与政治变化，原因需要分地区研究。"
        },
        {
          "year": 900,
          "label": "约 900 年前后",
          "text": "古典期的结束不代表玛雅社会整体结束，其他地区仍在发展。"
        }
      ],
      "sections": [
        {
          "id": "maya-architecture",
          "theme": "architecture",
          "title": "阶梯、高台与广场怎样组合",
          "lead": "从城市空间判断活动场合。",
          "points": [
            "蒂卡尔的神庙、宫殿和广场形成重要的仪式与政治空间。",
            "高大的阶梯形建筑是城市的一部分，周边还有居住和生产活动。"
          ],
          "example": "从蒂卡尔广场望向高台建筑",
          "explanation": "登高、通行和观看的路径，帮助我们理解空间怎样组织人群。",
          "prompt": "为什么不能只研究城市里最高的建筑？",
          "answer": "普通住宅、水和食物的供给，同样关系到城市怎样生活。",
          "boundary": "与埃及建筑轮廓相似，不表示用途相同，也不能只凭相似形状证明跨洋联系。",
          "sources": [
            "maya-site",
            "maya-world"
          ]
        },
        {
          "id": "maya-writing",
          "theme": "writing",
          "title": "玛雅文字能记录语言，不只是画图",
          "lead": "字块把图像与声音联系起来。",
          "points": [
            "玛雅文字把表词符号与音节符号结合起来，用于记录名字、事件等内容。",
            "石碑、陶器与手抄本等载体有不同用途，文字常与人物和日期共同出现。"
          ],
          "example": "一只陶杯的正面与背面",
          "explanation": "这件陶杯正面雕有水鸟，背面的斜向铭文说明饮品与使用者。图像和文字需要转动器物、结合不同角度观察。",
          "prompt": "看到一幅神话图像，就能读懂旁边所有字吗？",
          "answer": "不能。图像、语言与文字的规则需要分别研究，释读仍会保留不确定之处。",
          "boundary": "部分符号或具体文本尚有争论；并非所有像字的装饰都是真实可读文字。",
          "sources": [
            "maya-calendar",
            "maya-vessel"
          ]
        },
        {
          "id": "maya-governance",
          "theme": "governance",
          "title": "许多城邦，交错的政治关系",
          "lead": "同属一种文化不等于同属一个国家。",
          "points": [
            "古典期存在蒂卡尔、帕伦克、科潘等多个独立城邦。",
            "城市之间的政治关系会变化，统治者也借建筑、仪式和记录展示权力。"
          ],
          "example": "比较几座玛雅城市",
          "explanation": "要研究一座城与另一座城的联系，不能先假定有一个统一的玛雅帝国。",
          "prompt": "使用相近文字，为什么仍可能彼此争夺？",
          "answer": "共同文化不消除资源、联盟和权力竞争；政治关系要靠具体材料核查。",
          "boundary": "王室石刻有展示统治合法性的目的，不能把它当成没有立场的全社会记录。",
          "sources": [
            "maya-world",
            "maya-site"
          ]
        },
        {
          "id": "maya-achievements",
          "theme": "achievements",
          "title": "260 天、365 天与长期纪日",
          "lead": "历法服务不同的社会与宗教需要。",
          "points": [
            "玛雅使用多种历法：包括 260 天的神圣历和 365 天的太阳历等。",
            "数学与天象观察相互配合，帮助排列周期、记录日期和安排活动。"
          ],
          "example": "两套周期怎样同时运转",
          "explanation": "不同周期可以像转动的齿轮组合，在更长时间后再次出现相同配对。",
          "prompt": "一种历法结束一轮，意味着世界会结束吗？",
          "answer": "不意味着。历法周期是纪日规则，周期转换不能当成灾难发生的证据。",
          "boundary": "古代历法与今天各地玛雅社群的实践要结合具体地区理解，不宜全部混称。",
          "sources": [
            "maya-calendar",
            "maya-today"
          ]
        }
      ]
    },
    {
      "id": "persia",
      "name": "波斯",
      "subtitle": "多语言帝国怎样联系远方",
      "region": "西亚 · 以伊朗高原为中心的阿契美尼德帝国",
      "period": "约前 550—前 330 年",
      "start": -550,
      "end": -330,
      "anchorYear": -518,
      "era": "axial",
      "color": "#7c5c9d",
      "scope": "本次聚焦阿契美尼德时期，不用这两个年份概括全部波斯或伊朗历史。",
      "summary": "宫殿浮雕呈现王权形象，泥板档案则留下资源与人员的实际记录。两类材料合读，才能认识一个跨地区帝国。",
      "question": "管理不同语言、不同习惯的地区，只靠一道命令够吗？",
      "caution": "帝国的自我展示与实际治理需要分开。艺术中的和谐场景，不足以证明各地没有战争或冲突。",
      "tags": [
        "阿契美尼德",
        "居鲁士",
        "大流士",
        "波斯波利斯",
        "行省",
        "档案",
        "多语言"
      ],
      "eventIds": [
        "tw10",
        "tw13"
      ],
      "sources": [
        "persia-site",
        "persia-empire",
        "persia-archive"
      ],
      "images": [
        {
          "width": 459,
          "height": 624,
          "src": "assets/civilizations/persian-relief.jpg",
          "theme": "architecture",
          "title": "波斯波利斯宫殿浮雕残片",
          "alt": "石刻上两名人物依次沿阶梯前行，手中带着容器",
          "caption": "约前 358—前 338 年，原属波斯波利斯宫殿阶梯装饰。人物带着食物或饮料，现为脱离建筑的馆藏残片。",
          "prompt": "阶梯方向与人物姿态怎样让画面形成前行的队伍？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/323178"
        },
        {
          "width": 4000,
          "height": 2685,
          "src": "assets/civilizations/persian-bowl.jpg",
          "theme": "achievements",
          "title": "阿契美尼德金碗",
          "alt": "金色碗身表面有重复排列的凹槽装饰",
          "caption": "约前 6—前 5 世纪的金碗。它提示贵重器物的工艺与使用场合，并不代表所有人的日常生活。",
          "prompt": "装饰怎样围绕碗的中心重复？材料与纹样分别提供什么信息？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/324289"
        }
      ],
      "milestones": [
        {
          "year": -550,
          "label": "前 550 年前后",
          "text": "居鲁士击败米底，波斯帝国开始迅速扩张。"
        },
        {
          "year": -539,
          "label": "前 539 年",
          "text": "波斯军队占领巴比伦。"
        },
        {
          "year": -518,
          "label": "前 518 年",
          "text": "大流士一世开始建设波斯波利斯。"
        },
        {
          "year": -330,
          "label": "前 330 年前后",
          "text": "亚历山大的征服结束阿契美尼德统治，波斯文化继续演变。"
        }
      ],
      "sections": [
        {
          "id": "persia-architecture",
          "theme": "architecture",
          "title": "柱厅与浮雕共同表达王权",
          "lead": "建筑结构和图像叙事可以一起读。",
          "points": [
            "波斯波利斯在高大的台地上组织宫殿、柱厅、阶梯与附属空间。",
            "阶梯浮雕反复表现侍从和来自不同地区的人群，构成精心安排的王室形象。"
          ],
          "example": "宫殿阶梯上的人物浮雕",
          "explanation": "先看人物如何前行，再看它原来位于建筑的什么位置。",
          "prompt": "队伍排得整齐，能证明所有人都自愿服从吗？",
          "answer": "不能。浮雕表达一种政治形象，实际关系还要与战争、行政和其他记录比较。",
          "boundary": "博物馆中的浮雕残片已离开原建筑，完整位置和原貌要依据考古资料核查。",
          "sources": [
            "persia-site",
            "persia-empire",
            "persian-relief"
          ]
        },
        {
          "id": "persia-writing",
          "theme": "writing",
          "title": "一座帝国可以同时使用多种文字",
          "lead": "统治者铭文与日常档案并非同一类材料。",
          "points": [
            "古波斯语、埃兰语、巴比伦语等在不同材料中出现，阿拉米语也承担行政沟通。",
            "波斯波利斯档案以大量泥板记录人员、物资和分配等事务。"
          ],
          "example": "读一座宫殿背后的泥板档案",
          "explanation": "纪念性铭文展示政治主张；行政记录更接近具体事务，两者不能互相代替。",
          "prompt": "只有君王赞颂自己的铭文，会漏掉什么？",
          "answer": "可能漏掉日常供应、人员流动和地方执行，其他档案能补充这些方面。",
          "boundary": "不同语言、不同文字与不同用途需要分清；不能把所有楔形文字都叫古波斯文。",
          "sources": [
            "persia-archive",
            "persia-empire"
          ]
        },
        {
          "id": "persia-governance",
          "theme": "governance",
          "title": "行省、道路与地方管理",
          "lead": "治理广阔地区需要中间环节。",
          "points": [
            "帝国设置行省总督等管理体系，并建设、利用道路进行联系。",
            "中央权力与各地既有社会安排并存，管理方式不能简化为全国完全相同。"
          ],
          "example": "从王室命令到地方执行",
          "explanation": "命令要传递，物资要核算，地方问题也需要信息返回。",
          "prompt": "如果消息来得很慢，管理会遇到哪些困难？",
          "answer": "可能无法及时知道灾害、供给或冲突，因此交通和记录都是治理条件。",
          "boundary": "帝国治理也有征服和权力差异，不能只用「包容」一个词概括。",
          "sources": [
            "persia-empire",
            "persia-archive"
          ]
        },
        {
          "id": "persia-achievements",
          "theme": "achievements",
          "title": "跨地区合作留下综合性的艺术",
          "lead": "把工艺、交通与管理放在同一幅图里。",
          "points": [
            "宫殿艺术吸收了帝国不同地区的技艺和表现方法，并重新组织为王室风格。",
            "道路与文书系统让人员、资源和信息在大范围内流动。"
          ],
          "example": "一只金碗与一块石刻",
          "explanation": "材料、纹样和使用场合不同，都可以帮助观察精英生活与工艺组织。",
          "prompt": "看到一种外来纹样，应只问「谁先发明」吗？",
          "answer": "还可以问它怎样传播、谁参与制作，以及到新环境后如何改变。",
          "boundary": "贵重器物偏向精英生活，不能代替对普通人生活的研究。",
          "sources": [
            "persia-empire",
            "persia-archive",
            "persian-bowl"
          ]
        }
      ]
    },
    {
      "id": "arab-islamic",
      "name": "阿拉伯—伊斯兰世界",
      "subtitle": "多族群、多语言的城市与知识交流",
      "region": "跨区域 · 西亚、北非至伊比利亚半岛等地",
      "period": "7—13 世纪（重点选读）",
      "start": 622,
      "end": 1258,
      "anchorYear": 830,
      "era": "golden",
      "color": "#2c7d79",
      "scope": "从早期哈里发时期到阿拔斯等不同政权，兼看科尔多瓦；并不把整个地区视为一个始终统一的国家。",
      "summary": "阿拉伯语成为跨地区交流的重要语言。不同族群、宗教与语言背景的人参与翻译、计算、医学、工艺和城市建设。",
      "question": "一本书从一种语言进入另一种语言，会带来哪些新工作？",
      "caution": "「阿拉伯—伊斯兰世界」在这里是历史文化范围，不等于所有参与者都是阿拉伯人，也不等于只有宗教内容。",
      "tags": [
        "阿拉伯语",
        "哈里发",
        "巴格达",
        "科尔多瓦",
        "书法",
        "代数",
        "翻译",
        "伊斯兰艺术"
      ],
      "eventIds": [
        "tw23",
        "tw25"
      ],
      "sources": [
        "arab-art",
        "arab-site",
        "arab-courts",
        "arab-calligraphy",
        "arab-maths",
        "arab-khwarizmi",
        "arab-spain"
      ],
      "images": [
        {
          "width": 526,
          "height": 624,
          "src": "assets/civilizations/arab-capital.jpg",
          "theme": "architecture",
          "title": "科尔多瓦相关柱头",
          "alt": "石柱顶部雕有层叠的叶片纹样",
          "caption": "10 世纪柱头，馆方认为可能出自西班牙科尔多瓦。它是建筑部件，不是完整建筑的现状照片。",
          "prompt": "比较叶片的重复方式；柱头在结构与装饰中分别起什么作用？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/448410"
        },
        {
          "width": 599,
          "height": 430,
          "src": "assets/civilizations/arab-quran.jpg",
          "theme": "writing",
          "title": "库法体《古兰经》书页",
          "alt": "浅色书页上有横向延长的深色字母和点记",
          "caption": "约 9 世纪末—10 世纪初的手稿书页，可能制作于叙利亚。字母、行距与点记需要结合当时的书写习惯观察。",
          "prompt": "找横向延长的笔画与彩色点记；它们都只是装饰吗？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/448369"
        }
      ],
      "milestones": [
        {
          "year": 622,
          "label": "622 年",
          "text": "穆罕默德迁徙麦地那的年份后来成为伊斯兰历纪元的重要依据。"
        },
        {
          "year": 750,
          "label": "750 年",
          "text": "阿拔斯王朝兴起，政治与文化中心逐渐转向伊拉克。"
        },
        {
          "year": 762,
          "label": "762 年",
          "text": "巴格达建立，成为重要的政治和知识交流城市。"
        },
        {
          "year": 830,
          "label": "约 9 世纪",
          "text": "翻译、数学与天文学等知识活动在多个城市和学者网络中展开。"
        },
        {
          "year": 1258,
          "label": "1258 年",
          "text": "蒙古军队攻占巴格达；其他地区的社会与知识活动仍继续。"
        }
      ],
      "sections": [
        {
          "id": "arab-islamic-architecture",
          "theme": "architecture",
          "title": "清真寺、柱厅与不断改建的城市",
          "lead": "从空间与建造历史认识建筑。",
          "points": [
            "清真寺是重要的宗教与公共空间，各地的平面、材料和装饰并不相同。",
            "科尔多瓦的大清真寺以柱列和双层拱组织空间，后来又改作教堂并继续改建。"
          ],
          "example": "科尔多瓦的柱头与双层拱",
          "explanation": "一件柱头可以提示建筑结构和装饰，却不能代替完整建筑的观察。",
          "prompt": "一座建筑经历改建后，应该给它贴一个年代标签吗？",
          "answer": "可以标出最初阶段，但还应说明扩建、用途改变和后来的修复，避免把今天的样子全部归于一次建造。",
          "boundary": "清真寺并非都长同一个样子；图像装饰的使用也因场合和地区而异。",
          "sources": [
            "arab-site",
            "arab-spain",
            "arab-art",
            "arab-capital"
          ]
        },
        {
          "id": "arab-islamic-writing",
          "theme": "writing",
          "title": "阿拉伯文字既记录语言，也成为艺术",
          "lead": "文字、语言、宗教与材料分别观察。",
          "points": [
            "阿拉伯语通常从右向左书写，书法在手抄本、器物和建筑装饰中广泛出现。",
            "阿拉伯字母也被调整用于波斯语等语言，不能把所有阿拉伯字母书写的内容都叫阿拉伯语。"
          ],
          "example": "库法体《古兰经》书页",
          "explanation": "观察文字的横向延展、行距和点记，再区分阅读功能与装饰安排。",
          "prompt": "一段漂亮书法一定是宗教经文吗？",
          "answer": "不一定。书法也用于诗文、祝语、名字和其他世俗内容，必须核查文本。",
          "boundary": "不同书体、时期的点记和元音标记会变化，不能把一页手稿当成全部阿拉伯文字的标准。",
          "sources": [
            "arab-calligraphy",
            "arab-art",
            "arab-quran"
          ]
        },
        {
          "id": "arab-islamic-governance",
          "theme": "governance",
          "title": "哈里发与多个政治中心",
          "lead": "把共同信仰和实际政权分开看。",
          "points": [
            "倭马亚、阿拔斯等时期的中心和权力安排不同，地方政治力量也持续变化。",
            "科尔多瓦的倭马亚政权与巴格达阿拔斯政权曾并存，文化联系不等于政治统一。"
          ],
          "example": "同一时期的巴格达与科尔多瓦",
          "explanation": "比较城市与政权，才能避免把几百年、几大片地区都称作一个不变的帝国。",
          "prompt": "有共同的宗教和文字，是否一定由同一位统治者管理？",
          "answer": "不是。共同文化可以跨越政治边界，政权之间也可能竞争。",
          "boundary": "哈里发、官员、宗教学者与地方社会的关系随时期而变，不能用单一权力图概括。",
          "sources": [
            "arab-courts",
            "arab-spain"
          ]
        },
        {
          "id": "arab-islamic-achievements",
          "theme": "achievements",
          "title": "翻译不是抄一遍，计算也在发展",
          "lead": "知识交流同时包含吸收、检验与创造。",
          "points": [
            "学者在希腊、波斯和印度等知识传统之间翻译、整理并继续研究。",
            "花剌子米等人的著作推动代数方法和印度来源的位值记数系统传播。"
          ],
          "example": "一条计算规则怎样跨语言传播",
          "explanation": "需要解释术语、核对算例、教会读者使用，还可能发展出新的问题和方法。",
          "prompt": "叫「阿拉伯数字」，就能断定它完全在阿拉伯地区独立发明吗？",
          "answer": "不能。要追踪印度的记数传统、阿拉伯文著作和后来的翻译传播。名称并不能代替历史。",
          "boundary": "这些成果由跨地区、多族群的学者和实践者共同积累，不归功于单一民族或一座建筑。",
          "sources": [
            "arab-maths",
            "arab-khwarizmi"
          ]
        }
      ]
    },
    {
      "id": "india",
      "name": "古印度",
      "subtitle": "从印度河城市到佛塔与诏令",
      "region": "南亚 · 包含今巴基斯坦、印度等地",
      "period": "约前 2600 年—公元 1 世纪（跨时期选读）",
      "start": -2600,
      "end": 100,
      "anchorYear": -250,
      "era": "axial",
      "color": "#ad6c2f",
      "scope": "把印度河城市与后来孔雀王朝、桑吉佛塔分开编排，不把相隔千年的材料混成同一个社会。",
      "summary": "城市排水、印章、王室诏令和佛教建筑，提示南亚不同阶段的组织与表达。丰富遗存也伴随着尚未解答的问题。",
      "question": "看见整齐的街道，能推断谁在管理这座城吗？",
      "caution": "「古印度」不是现代印度共和国的古代边界。印度河文明的文字尚无公认释读，不能拿后来的文献直接填补它的历史。",
      "tags": [
        "印度河",
        "摩亨佐-达罗",
        "印章",
        "阿育王",
        "孔雀王朝",
        "婆罗米",
        "桑吉",
        "佛塔"
      ],
      "eventIds": [
        "tw3",
        "tw11"
      ],
      "sources": [
        "india-city",
        "india-site",
        "india-stupa",
        "india-edicts",
        "india-script"
      ],
      "images": [
        {
          "width": 1280,
          "height": 1010,
          "src": "assets/civilizations/sanchi.jpg",
          "theme": "architecture",
          "title": "桑吉大塔的早期照片",
          "alt": "早期照片中，圆顶佛塔上有植被，前方可见雕刻塔门和栏杆",
          "caption": "James John Waterhouse 于 1861—1862 年拍摄的桑吉大塔。它记录的是后期系统修复之前的状态，并非古代建成时的原貌。",
          "prompt": "找出塔门、圆顶与植被；这张照片能帮助研究哪些变化？",
          "credit": "James John Waterhouse 摄 · V&A 藏",
          "license": "馆藏图像，使用说明见来源",
          "source": "https://collections.vam.ac.uk/item/O175835/the-great-stupa-at-sanchi-photograph-waterhouse-james-john/"
        },
        {
          "src": "assets/civilizations/indus-seal.jpg",
          "width": 576,
          "height": 625,
          "theme": "writing",
          "title": "带牛形象的印度河印章",
          "alt": "方形印章上有一头侧身的牛和一排短小符号",
          "caption": "馆方断代为前 3000—前 1500 年的印度河文明印章。上方符号尚不能给出获得公认的完整语言释读。",
          "prompt": "把牛的形象与上方符号分开描述：哪些能直接看见，哪些解释还需要证据？",
          "credit": "大都会艺术博物馆藏 · 开放图像",
          "license": "CC0",
          "source": "https://www.metmuseum.org/art/collection/search/38287"
        }
      ],
      "milestones": [
        {
          "year": -2600,
          "label": "约前 2600 年起",
          "text": "印度河流域城市发展，摩亨佐-达罗是重要代表。"
        },
        {
          "year": -1900,
          "label": "约前 1900 年前后",
          "text": "许多印度河城市发生转型，不能简单说所有人突然消失。"
        },
        {
          "year": -250,
          "label": "前 3 世纪",
          "text": "孔雀王朝阿育王的石刻诏令为认识统治主张提供材料。"
        },
        {
          "year": -100,
          "label": "约前 1 世纪",
          "text": "桑吉大塔的雕刻塔门等建筑在持续增建中形成。"
        }
      ],
      "sections": [
        {
          "id": "india-architecture",
          "theme": "architecture",
          "title": "街道与佛塔属于不同历史阶段",
          "lead": "先确定年代，再比较空间用途。",
          "points": [
            "摩亨佐-达罗的街区规划、水井和排水设施，是研究早期城市生活的重要线索。",
            "桑吉佛塔及塔门、栏杆和绕行空间，则体现后来佛教建筑与仪式的发展。"
          ],
          "example": "把城市排水与桑吉佛塔分别放回年代",
          "explanation": "城市日常设施与宗教建筑可以并列观察，但两者并非同一时期、同一类需求。",
          "prompt": "一张整齐的平面图能证明城市没有社会差异吗？",
          "answer": "不能。还要研究住宅、器物、活动分布和其他证据，规划相似不等于所有人生活相同。",
          "boundary": "桑吉建筑经过多阶段扩建和现代保护，现貌不能全部归于阿育王一次建造。",
          "sources": [
            "india-city",
            "india-site",
            "india-stupa"
          ]
        },
        {
          "id": "india-writing",
          "theme": "writing",
          "title": "未释读的印章与可研究的诏令",
          "lead": "「有符号」和「已经读懂」是不同事情。",
          "points": [
            "印度河印章常有动物形象和短串符号，符号系统尚未获得公认释读。",
            "阿育王时代的诏令使用婆罗米等文字及不同语言，属于更晚的历史材料。"
          ],
          "example": "带牛形象的印度河印章",
          "explanation": "先描述能直接看见的动物与符号，再区分用途推测和语言释读。",
          "prompt": "如果有人说已读出一块印章，怎样核查？",
          "answer": "要看方法是否能解释更多材料、是否可重复验证，并了解学界是否形成共识。",
          "boundary": "不要把印度河符号直接标成梵文，也不要把它与后来婆罗米文字简单画成已经证实的直系谱系。",
          "sources": [
            "india-script",
            "india-edicts",
            "indus-seal"
          ]
        },
        {
          "id": "india-governance",
          "theme": "governance",
          "title": "遗址与诏令提供不同的政治证据",
          "lead": "对不知道的部分保留空白。",
          "points": [
            "印度河城市的具体统治结构仍需研究，不能仅凭整齐街道就认定某种政体。",
            "阿育王诏令表达王室的治理和伦理主张，可与其他材料一起研究孔雀王朝。"
          ],
          "example": "国王希望怎样被公众理解",
          "explanation": "公开诏令是政治沟通材料，既说明统治者的主张，也带有自我呈现的目的。",
          "prompt": "一道要求善待他人的命令，能证明所有地方都执行了吗？",
          "answer": "不能。命令内容与实际执行是两个问题，需要地方材料和其他证据。",
          "boundary": "不把诏令中的理想直接当作全民日常生活，也不把南亚复杂社会压成一套永远不变的制度。",
          "sources": [
            "india-edicts",
            "india-script"
          ]
        },
        {
          "id": "india-achievements",
          "theme": "achievements",
          "title": "城市技术与叙事艺术都值得研究",
          "lead": "既看工程，也看知识怎样被看见。",
          "points": [
            "排水、建筑和标准化器物帮助我们认识印度河城市中的协调与技术实践。",
            "桑吉塔门把植物、动物、人物与故事组织为雕刻，建筑也成为传播宗教叙事的媒介。"
          ],
          "example": "没有长篇文字，图像怎样讲故事",
          "explanation": "通过连续场景、重复人物和象征组织叙事，观看者也需要相关文化知识。",
          "prompt": "同一幅浮雕，所有观众会理解得完全一样吗？",
          "answer": "未必。理解依赖语言、故事和观看习惯，需要结合材料解释，而不只凭现代直觉。",
          "boundary": "技术和艺术都在跨地区交流中变化，不能把一站内容当作南亚全部成就的清单。",
          "sources": [
            "india-city",
            "india-site",
            "india-stupa"
          ]
        }
      ]
    }
  ]
};
