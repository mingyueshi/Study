/* AI 基础篇：概念资料经核对，示例、自检与练习由本站编写。 */
'use strict';
const AI_COURSE = {
  "version": 1,
  "checkedAt": "2026-11-02",
  "title": "AI 学习 · 基础篇",
  "sources": {
    "ml": {
      "title": "Google · What is Machine Learning?",
      "url": "https://developers.google.com/machine-learning/intro-to-ml/what-is-ml"
    },
    "nn": {
      "title": "Google · Neural networks",
      "url": "https://developers.google.com/machine-learning/crash-course/neural-networks"
    },
    "glossary": {
      "title": "Google · Machine Learning Glossary",
      "url": "https://developers.google.com/machine-learning/glossary"
    },
    "datasets": {
      "title": "Google · Dividing datasets",
      "url": "https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets"
    },
    "overfit": {
      "title": "Google · Overfitting",
      "url": "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting"
    },
    "llm": {
      "title": "Google · Large language models and Transformers",
      "url": "https://developers.google.com/machine-learning/crash-course/llm/transformers"
    },
    "tokens": {
      "title": "Hugging Face · Tokenizers",
      "url": "https://huggingface.co/learn/llm-course/chapter2/4"
    },
    "cloud": {
      "title": "Google Cloud · Generative AI glossary",
      "url": "https://docs.cloud.google.com/docs/generative-ai/glossary"
    },
    "prompt": {
      "title": "Anthropic · Prompt engineering overview",
      "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"
    },
    "structured": {
      "title": "Anthropic · Structured outputs",
      "url": "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"
    },
    "eval": {
      "title": "Anthropic · Define success criteria and evaluations",
      "url": "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"
    },
    "embeddings": {
      "title": "Google · Embeddings",
      "url": "https://developers.google.com/machine-learning/crash-course/embeddings"
    },
    "rag": {
      "title": "AWS · Retrieval-Augmented Generation",
      "url": "https://aws.amazon.com/what-is/retrieval-augmented-generation/"
    },
    "finetune": {
      "title": "Hugging Face · Fine-tuning",
      "url": "https://huggingface.co/docs/transformers/training"
    },
    "agents": {
      "title": "Anthropic · Building effective agents",
      "url": "https://www.anthropic.com/research/building-effective-agents"
    },
    "human-review": {
      "title": "LangChain · Human-in-the-loop",
      "url": "https://docs.langchain.com/oss/python/langchain/human-in-the-loop"
    },
    "tools": {
      "title": "Google Cloud · Function calling",
      "url": "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tools/function-calling"
    },
    "hallucinations": {
      "title": "Anthropic · Reduce hallucinations",
      "url": "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations"
    }
  },
  "stages": [
    {
      "id": "orientation",
      "title": "认识 AI 的边界",
      "goal": "先分清几个经常混用的词，再看它们怎样对应实际任务。",
      "outcome": "能区分 AI、机器学习、深度学习与生成式 AI。",
      "practice": {
        "task": "给三个日常功能分类",
        "steps": [
          "挑选验证码规则、垃圾邮件识别、文章摘要这三个功能。",
          "分别说明它的输入、输出，以及是否需要从数据中学习。",
          "判断哪个任务在生成新内容；信息不足时写下还需要知道什么。"
        ],
        "deliverable": "一张「功能—输入—输出—可能采用的方法」对照表。",
        "criteria": [
          "不把所有自动化都叫机器学习。",
          "能解释分类判断的依据，而不只写缩写。"
        ]
      },
      "lessons": [
        {
          "id": "ai",
          "title": "人工智能",
          "english": "Artificial Intelligence",
          "summary": "AI 是一个广泛领域，研究如何让计算机完成感知、预测、规划、生成等通常需要智能的任务。",
          "detail": [
            "它描述的是能力与研究目标，不对应某一个产品或单一算法。实现方法可以是规则、搜索、统计学习，也可以把多种方法组合起来。",
            "先问系统要完成什么任务，再讨论采用什么方法。这比直接从某个热门模型或工具开始，更容易理解一个 AI 应用。"
          ],
          "example": "例如，客服系统可能用固定规则处理营业时间，用分类模型分配工单，再用生成模型起草回复。一个系统可以同时包含多种方法。",
          "trap": "自动执行重复操作不一定需要 AI；使用 AI 的系统也不一定会生成文本。",
          "quiz": {
            "question": "哪种说法更准确？",
            "options": [
              "AI 可以包含多种实现方法",
              "AI 只指聊天机器人",
              "所有自动化脚本都是机器学习"
            ],
            "answer": 0,
            "explanation": "AI 是广泛的任务与方法集合。判断系统时，应说明任务和实现机制。"
          },
          "sources": [
            "glossary"
          ],
          "flow": [
            "任务",
            "选择方法",
            "执行与反馈"
          ]
        },
        {
          "id": "machine-learning",
          "title": "机器学习",
          "english": "Machine Learning",
          "summary": "机器学习从数据中学习规律，用学习到的模型处理新的输入。",
          "detail": [
            "传统规则由人明确编写；机器学习则根据样本和学习目标调整模型。它可以预测数值、判断类别，也可以学习生成内容。",
            "数据质量、任务目标和评估方式都会影响结果。使用机器学习并不意味着可以省略对业务规则与异常情况的分析。"
          ],
          "example": "要给工单分组，可以手写关键词规则，也可以用历史工单及人工分类结果训练一个分类模型。两者解决相近的任务，但形成判断规则的方式不同。",
          "trap": "会调用现成模型，与自己训练模型，是不同层次的工作。",
          "quiz": {
            "question": "哪一项最体现机器学习？",
            "options": [
              "按固定日期发送提醒",
              "从已标注工单中学习分类规律",
              "把文件按名称排序"
            ],
            "answer": 1,
            "explanation": "关键在于通过样本学习规律，而不是仅执行人事先写定的操作。"
          },
          "sources": [
            "ml"
          ],
          "flow": []
        },
        {
          "id": "deep-learning",
          "title": "深度学习",
          "english": "Deep Learning",
          "summary": "深度学习是机器学习的一类方法，通常使用多层神经网络学习数据表示。",
          "detail": [
            "可以把网络看成多层数值变换：前面的输出成为后面的输入，最后得到预测或生成所需的表示。",
            "层数、数据、训练方法与计算资源共同影响效果。只看到参数多或网络深，不能直接断定它更适合某个任务。"
          ],
          "example": "图像识别网络可以逐步组合视觉特征。理解这种逐层表示的思想，比把每一层机械地比作人的某个脑区更有帮助。",
          "trap": "神经网络是数学模型，不是人脑的完整复制品。深度学习也不是机器学习的全部。",
          "quiz": {
            "question": "AI、机器学习、深度学习的常见关系是？",
            "options": [
              "三个完全相同的词",
              "深度学习包含所有 AI",
              "深度学习属于机器学习，机器学习属于 AI"
            ],
            "answer": 2,
            "explanation": "这描述的是常用的领域包含关系，不代表每种 AI 技术都必须使用深度学习。"
          },
          "sources": [
            "nn"
          ],
          "flow": [
            "输入",
            "多层数值变换",
            "输出"
          ]
        },
        {
          "id": "generative-ai",
          "title": "生成式 AI",
          "english": "Generative AI",
          "summary": "生成式 AI 根据输入与学习到的模式，生成文本、图像、音频等内容。",
          "detail": [
            "「生成式」强调任务与输出的性质，不是另一套与机器学习完全无关的方法。当前常见的生成系统大量采用深度学习。",
            "生成内容可以是草稿、摘要或候选方案。是否满足事实、格式和业务要求，还需要进一步核查。"
          ],
          "example": "把一段工单压缩成摘要，是生成任务；只把工单归入「登录问题」，通常是分类任务。同一个应用可以同时使用这两种能力。",
          "trap": "生成内容看起来流畅，并不能单独证明它真实或有依据。",
          "quiz": {
            "question": "哪个更典型地属于生成任务？",
            "options": [
              "根据材料写一段摘要",
              "按文件大小排序",
              "校验必填字段是否为空"
            ],
            "answer": 0,
            "explanation": "摘要需要组织并生成新的表达。排序与必填校验本身可以由确定性规则完成。"
          },
          "sources": [
            "ml"
          ],
          "flow": []
        }
      ]
    },
    {
      "id": "learning",
      "title": "模型如何学习",
      "goal": "理解模型、数据与训练过程，建立判断学习效果的基础。",
      "outcome": "能说明训练与推理的区别，并识别数据泄漏与过拟合。",
      "practice": {
        "task": "设计一个工单分类实验",
        "steps": [
          "写下分类标签与判断标准，准备少量自编示例。",
          "说明训练集、验证集、测试集各自负责什么。",
          "补充一种可能让评估看起来很好、实际却不可靠的数据泄漏。"
        ],
        "deliverable": "一份实验划分说明和一个数据泄漏反例。",
        "criteria": [
          "不同集合之间没有重复或近似重复样本。",
          "测试数据能代表真正要处理的工单。"
        ]
      },
      "lessons": [
        {
          "id": "model-parameters",
          "title": "模型与参数",
          "english": "Model & Parameters",
          "summary": "模型把输入映射到输出；参数是模型内部在学习过程中调整的数值。",
          "detail": [
            "模型还包含结构和计算方式。参数像可调旋钮，但这种比喻只用于帮助理解：实际系统中的参数往往没有单独、直观的业务含义。",
            "提示词、资料与模型参数是不同层次的东西。一次对话里补充信息，通常是在改变输入上下文，而不是重新训练模型。"
          ],
          "example": "分类器收到工单后，为各类别计算得分。训练会调整内部参数，使符合目标的类别更容易得到较高得分。",
          "trap": "参数数量不能单独决定效果；数据、结构、任务和评估同样重要。",
          "quiz": {
            "question": "向聊天中粘贴一份说明书，通常首先改变什么？",
            "options": [
              "模型的全部参数",
              "当前输入上下文",
              "芯片的制造工艺"
            ],
            "answer": 1,
            "explanation": "提供材料通常改变本次输入。参数是否改变，取决于是否进行训练等另一个过程。"
          },
          "sources": [
            "glossary"
          ],
          "flow": []
        },
        {
          "id": "training-inference",
          "title": "训练与推理",
          "english": "Training & Inference",
          "summary": "训练用于根据数据调整模型；推理用已经得到的模型处理输入。",
          "detail": [
            "训练往往包含预测、计算误差、调整参数的重复过程。推理则使用模型已有的能力给出结果。",
            "应用保存聊天历史，不等于模型已经通过这段对话完成训练。哪些记录被保存、是否用于后续训练，需要分别看具体系统。"
          ],
          "example": "先用历史工单训练分类器，再把今天的新工单交给分类器判断。前一段是训练，后一段是推理。",
          "trap": "「推理」在这里是模型执行阶段的术语，并不保证每次输出都具有可靠的逻辑推导。",
          "quiz": {
            "question": "以下哪个属于推理？",
            "options": [
              "用样本反复更新权重",
              "为训练任务计算梯度",
              "用训练好的模型分类一张新工单"
            ],
            "answer": 2,
            "explanation": "模型已训练完成，正在处理新输入；这属于推理阶段。"
          },
          "sources": [
            "nn"
          ],
          "flow": [
            "训练数据",
            "预测与误差",
            "调整参数",
            "得到模型"
          ]
        },
        {
          "id": "dataset-splits",
          "title": "数据集与划分",
          "english": "Training / Validation / Test",
          "summary": "训练集用于学习，验证集用于调试与选择方案，测试集用于评估最终方案。",
          "detail": [
            "划分的目的，是检查模型能否处理没有用于学习和选择方案的数据。反复根据测试集修改方案，会逐渐消耗它作为独立检验的价值。",
            "同一用户、同一文档的近似副本或不合理的时间划分，都可能造成信息泄漏。划分方式要符合真实使用情境。"
          ],
          "example": "如果同一张工单稍改标点后分别进入训练集和测试集，模型可能只是认出了近似文本，不能据此证明它能处理新的问题。",
          "trap": "不能只用「随机分一下」代替对重复、时间与用户分组的检查。",
          "quiz": {
            "question": "为什么要保留测试集？",
            "options": [
              "提供相对独立的最终检验",
              "让所有数据都参与调参",
              "保证模型一定不会出错"
            ],
            "answer": 0,
            "explanation": "测试集帮助估计未见数据上的表现，但前提是划分合理，且没有持续用它调参。"
          },
          "sources": [
            "datasets"
          ],
          "flow": []
        },
        {
          "id": "generalization",
          "title": "泛化与过拟合",
          "english": "Generalization & Overfitting",
          "summary": "泛化是处理新样本的能力；过拟合是对训练数据适应过度，未见数据上的表现却较差。",
          "detail": [
            "训练成绩很好，只说明模型适应了那份数据。应结合独立数据的表现、误差类型与数据分布来判断效果。",
            "可通过改进数据、控制模型复杂度、正则化等方法缓解过拟合，但具体选择需要实验验证。"
          ],
          "example": "一个分类器对历史工单几乎全对，却无法识别用户换一种说法后的同类问题。这提醒我们检查泛化，而不是只展示训练成绩。",
          "trap": "训练与测试之间的表现差距也可能受分布变化影响，不能不分析就把所有失败都归为过拟合。",
          "quiz": {
            "question": "训练表现持续提高、验证表现却变差时，应优先关注什么？",
            "options": [
              "只要训练分数高就可以上线",
              "可能发生过拟合",
              "测试集可以直接删除"
            ],
            "answer": 1,
            "explanation": "这是需要检查过拟合的常见信号，应结合数据与训练过程进一步分析。"
          },
          "sources": [
            "overfit"
          ],
          "flow": []
        }
      ]
    },
    {
      "id": "llm-basics",
      "title": "理解大语言模型",
      "goal": "从词元到上下文，理解文本生成背后的基本工作方式。",
      "outcome": "能解释 token、上下文窗口与注意力，不把它们误当作永久记忆。",
      "practice": {
        "task": "画出一次文档问答的输入与输出",
        "steps": [
          "写一个问题，并列出希望模型看见的资料和对话历史。",
          "标出哪些内容属于本次上下文，哪些没有实际传入。",
          "用「文本 → 分词 → 模型 → 输出」画一张简单流程图。"
        ],
        "deliverable": "一张输入、上下文与输出的流程图。",
        "criteria": [
          "不把 token 数等同于字数或单词数。",
          "能指出模型无法直接看到的材料。"
        ]
      },
      "lessons": [
        {
          "id": "llm",
          "title": "大语言模型",
          "english": "Large Language Model",
          "summary": "大语言模型学习大量语言数据中的模式，能够处理和生成文本。",
          "detail": [
            "常见的生成式语言模型会基于已有序列预测后续词元，逐步形成回答。训练目标与后续调整方式共同影响其表现。",
            "它可以用于总结、改写、分类与问答，但不同任务上的可靠程度不同，需要针对具体用途评估。"
          ],
          "example": "你可以让模型把工单改写成三句摘要，再单独核对日期和处理状态；不能因为语气自然，就默认所有细节都来自原文。",
          "trap": "聊天界面是应用，语言模型是其中的一项能力。文件读取、搜索和权限管理通常由应用另外提供。",
          "quiz": {
            "question": "聊天应用能够查阅某份文件，最能说明什么？",
            "options": [
              "模型天生能访问电脑所有文件",
              "模型一定已用该文件重新训练",
              "应用向模型提供了文件内容或相关工具"
            ],
            "answer": 2,
            "explanation": "模型能接触哪些内容，取决于应用传入的上下文、工具和权限。"
          },
          "sources": [
            "llm"
          ],
          "flow": []
        },
        {
          "id": "token",
          "title": "词元",
          "english": "Token",
          "summary": "词元是模型处理文本时使用的单位，可能对应一个词、词的一部分或字符等片段。",
          "detail": [
            "分词器把文本变成模型可以处理的词元 ID。不同模型可能采用不同的分词方式，同一段文字的词元数量也可能不同。",
            "估算长度、上下文占用或调用预算时，应使用目标模型对应的分词方式，不要套用固定的中英文换算比例。"
          ],
          "example": "「一个英文单词」不保证只占一个词元；中文句子的字数也不等于词元数。学习时先记住单位的区别，不必背一个通用比例。",
          "trap": "词元数量不是对文章字数的另一种命名。",
          "quiz": {
            "question": "以下哪个判断可靠？",
            "options": [
              "一段文本的 token 数取决于分词器",
              "任何单词都是一个 token",
              "所有中文字符都固定占两个 token"
            ],
            "answer": 0,
            "explanation": "token 是分词后的单位，不同分词器的结果可能不同。"
          },
          "sources": [
            "tokens"
          ],
          "flow": [
            "文本",
            "分词器",
            "词元 ID",
            "模型"
          ]
        },
        {
          "id": "context-window",
          "title": "上下文窗口",
          "english": "Context Window",
          "summary": "上下文窗口描述模型一次可以处理的上下文容量，通常以词元计量。",
          "detail": [
            "本轮指令、传入的历史消息、文档片段与工具结果都可能占用上下文。具体输入、输出限制要看所使用的模型与接口。",
            "更长的窗口提供更多容纳信息的空间，但不等于模型会同样准确地利用所有位置上的内容。材料仍然需要筛选和组织。"
          ],
          "example": "如果应用只传入最近三轮对话，前面提过的重要约束可能已不在模型可见的输入里。界面还显示着旧消息，也不能据此推断它们全部传入了模型。",
          "trap": "上下文窗口不是永久记忆；应用保存记录与本轮模型看见记录，是两回事。",
          "quiz": {
            "question": "界面保留了整段历史，是否等于模型本轮看见全部历史？",
            "options": [
              "一定看见",
              "要看应用实际传入了哪些内容",
              "窗口越大就自动看见所有文件"
            ],
            "answer": 1,
            "explanation": "界面展示、应用存储与模型输入是不同层次，需要分开判断。"
          },
          "sources": [
            "cloud"
          ],
          "flow": []
        },
        {
          "id": "transformer",
          "title": "Transformer 与注意力",
          "english": "Transformer & Attention",
          "summary": "Transformer 是常见的模型架构；注意力机制帮助模型在处理表示时结合序列中不同位置的信息。",
          "detail": [
            "理解时可以先抓住关系：某个位置的表示，不只受它自己影响，还可以综合其他位置的相关信息。实际计算发生在向量表示上。",
            "注意力权重可以提供一些观察线索，但不能简单当作对模型行为的完整解释，更不是事实核查机制。"
          ],
          "example": "阅读「这份工单比那份更紧急，请先处理它」时，系统需要利用上下文关系判断指代。注意力提供了结合不同位置表示的机制。",
          "trap": "「注意力」是技术名称，不表示模型具有人的注意体验。",
          "quiz": {
            "question": "注意力机制主要帮助完成什么？",
            "options": [
              "保证所有生成内容都正确",
              "把模型直接连接到互联网",
              "在表示计算中结合不同位置的信息"
            ],
            "answer": 2,
            "explanation": "注意力处理的是序列表示之间的关系；联网与事实核查需要其他机制。"
          },
          "sources": [
            "llm"
          ],
          "flow": []
        }
      ]
    },
    {
      "id": "prompting",
      "title": "提问与验证",
      "goal": "把任务说清楚，再用明确标准检查结果。",
      "outcome": "能写出可检查的提示词，并区分格式正确与事实正确。",
      "practice": {
        "task": "写一份工单摘要任务说明",
        "steps": [
          "准备一段自己编写、不含私人信息的工单内容。",
          "写明摘要目标、允许使用的材料、输出字段与缺失信息的处理方式。",
          "设计三项检查：是否忠于原文、字段是否齐全、有没有编造日期。"
        ],
        "deliverable": "一份提示词草稿和一张检查清单。",
        "criteria": [
          "输入材料与任务要求分开写。",
          "缺失信息的处理规则明确，不能靠语气判断正确性。"
        ]
      },
      "lessons": [
        {
          "id": "prompt",
          "title": "提示词与任务说明",
          "english": "Prompt",
          "summary": "提示词是给模型的输入指令与任务说明，通常需要配合相关材料一起使用。",
          "detail": [
            "可以从目标、输入材料、约束、输出格式、成功标准这五个方面检查自己的说明是否清楚。必要时补充少量示例，说明希望得到什么结果。",
            "改进提示词也需要对照同一批任务测试。一次回答变好，并不意味着它在其他输入上也会稳定变好。"
          ],
          "example": "原始要求是「总结一下」。更清楚的要求是「只根据下面的工单，用三点概括问题、已尝试操作和待确认信息；原文没有的内容写未提及」。",
          "trap": "写上「你是专家」不能替代任务、材料和验收标准。",
          "quiz": {
            "question": "哪种修改最有助于减少任务歧义？",
            "options": [
              "补清输入材料、目标和检查标准",
              "只增加更多赞美或角色称号",
              "不断重复「一定正确」"
            ],
            "answer": 0,
            "explanation": "具体说明任务与标准，比模糊的角色或保证语更容易检验。"
          },
          "sources": [
            "prompt"
          ],
          "flow": []
        },
        {
          "id": "structured-output",
          "title": "结构化输出",
          "english": "Structured Output",
          "summary": "结构化输出让结果遵循约定的字段、类型或格式，便于人和程序继续处理。",
          "detail": [
            "可以先规定需要哪些字段，再分别检查字段是否存在、类型是否符合要求、内容是否有依据。",
            "部分接口可以通过结构约束减少格式错误；具体支持范围和失败情形仍要看实现。即便结构有效，字段中的事实也可能错误。"
          ],
          "example": "给工单摘要约定 issue、attempted_steps、unknowns 三个字段。即使返回的是合法 JSON，也要确认其中的操作步骤确实来自原文。",
          "trap": "结构正确不等于内容正确；提示词要求 JSON，也不等于使用了接口层的结构约束。",
          "quiz": {
            "question": "收到格式完全正确的 JSON 后，还需要做什么？",
            "options": [
              "直接认定所有事实正确",
              "核对内容是否符合材料与任务目标",
              "删掉所有校验步骤"
            ],
            "answer": 1,
            "explanation": "结构校验与内容校验解决不同问题，二者不能互相替代。"
          },
          "sources": [
            "structured"
          ],
          "flow": []
        },
        {
          "id": "hallucination",
          "title": "模型幻觉",
          "english": "Hallucination",
          "summary": "模型可能生成听起来合理、却没有依据或不符合事实的内容，这类现象常被称为幻觉。",
          "detail": [
            "在学习中，可以把可核查的事实单独列出来，再对照原始材料、可靠资料或可重复的计算检查。模型的确定语气不是证据。",
            "提供资料、要求依据和设计核查步骤可以帮助发现或减少部分错误，但不能把任何单一技巧当成正确性保证。"
          ],
          "example": "模型为一段摘要补上了原文没有的关闭日期。与其问它「你确定吗」，更有效的是回到原文，逐项核对日期与处理状态。",
          "trap": "引用看起来像真的，也可能不存在或不支持结论，需要检查原始出处。",
          "quiz": {
            "question": "模型给出一个看似完整的引用，应该怎样处理？",
            "options": [
              "有引用格式就相信",
              "让同一模型再保证一次即可",
              "打开来源并核对它是否支持相关结论"
            ],
            "answer": 2,
            "explanation": "引用的存在、内容与支持关系都需要核对。"
          },
          "sources": [
            "hallucinations"
          ],
          "flow": []
        },
        {
          "id": "evaluation",
          "title": "评估与测试集",
          "english": "Evaluation",
          "summary": "评估用明确的任务、样本与标准，衡量一个模型或完整应用的实际表现。",
          "detail": [
            "先说明什么算成功，再准备普通情况、边界情况和失败情况。比较改动时，尽量保持任务集和评分方式一致。",
            "可以同时观察任务正确性、材料忠实度、格式、延迟与成本，但不要把它们未经说明地混成一个分数。"
          ],
          "example": "评估摘要功能时，准备十段自编工单，其中包含信息缺失、互相矛盾和很短的输入。分别记录是否漏掉关键信息、是否编造内容。",
          "trap": "「我试了几次，感觉不错」可作为线索，但不能代替可复查的测试记录。",
          "quiz": {
            "question": "比较两版提示词时，哪种做法更合理？",
            "options": [
              "使用相同测试任务与评分标准",
              "只展示每版最好的一次输出",
              "每次换任务且不记录标准"
            ],
            "answer": 0,
            "explanation": "尽量保持比较条件一致，才更容易判断改动是否有用。"
          },
          "sources": [
            "eval"
          ],
          "flow": []
        }
      ]
    },
    {
      "id": "grounding",
      "title": "用知识增强回答",
      "goal": "把资料接入回答过程，理解检索、RAG 与微调各自解决什么问题。",
      "outcome": "能画出 RAG 流程，并区分补充资料和调整模型。",
      "practice": {
        "task": "设计一个个人笔记问答流程",
        "steps": [
          "挑选五段自己写的简短笔记，并分别编号。",
          "为一个问题挑出最相关的两段，记录选择理由。",
          "说明如何把片段交给模型，以及如何核对回答与片段的对应关系。"
        ],
        "deliverable": "一份「问题—资料片段—回答依据」示例。",
        "criteria": [
          "能指出检索错了会怎样影响回答。",
          "区分资料更新、上下文组织和模型参数变化。"
        ]
      },
      "lessons": [
        {
          "id": "embedding",
          "title": "嵌入向量",
          "english": "Embedding",
          "summary": "嵌入把文本等对象表示成一组数值，便于计算相似性与其他关系。",
          "detail": [
            "这些数值的意义来自模型学习到的表示空间。通常不是每一个维度都对应一个人能直接命名的属性。",
            "用嵌入找相似资料时，还要看模型、领域、距离计算和检索策略是否适合当前任务。相似并不等于相关，更不等于事实正确。"
          ],
          "example": "「无法登录账户」和「账号进不去」写法不同，却可能在某个合适的表示空间里较接近。这有助于找到相似问题的处理记录。",
          "trap": "向量相似度不是事实可信度，也不是两个句子完全等价的证明。",
          "quiz": {
            "question": "嵌入检索给出的高相似度，最直接表示什么？",
            "options": [
              "内容一定真实",
              "在该表示和度量下较接近",
              "文档一定适用于所有场景"
            ],
            "answer": 1,
            "explanation": "相似度依赖表示与度量，仍需检查资料是否适合当前问题。"
          },
          "sources": [
            "embeddings"
          ],
          "flow": []
        },
        {
          "id": "retrieval",
          "title": "检索与资料选择",
          "english": "Retrieval",
          "summary": "检索根据问题，从候选资料中选择可能有用的内容。",
          "detail": [
            "关键词检索、向量检索和混合检索各有适用情境。命中哪些资料，还取决于分段方式、元数据、权限和筛选条件。",
            "应区分「找到了有用资料」和「最后写出了正确回答」。前者出错时，即使生成步骤很流畅，也可能回答错误。"
          ],
          "example": "用户询问最新版配置方法，系统却检索出旧版本笔记。此时首先应检查版本筛选与资料更新，而不是只调整回答语气。",
          "trap": "把全部资料一股脑塞进上下文，不等于已经解决了检索问题。",
          "quiz": {
            "question": "问答系统引用了过期说明，优先检查什么？",
            "options": [
              "回答是否用了礼貌语气",
              "页面标题的颜色",
              "资料版本与检索筛选"
            ],
            "answer": 2,
            "explanation": "资料是否相关、有效和可用，是检索阶段的重要问题。"
          },
          "sources": [
            "rag"
          ],
          "flow": []
        },
        {
          "id": "rag",
          "title": "检索增强生成",
          "english": "Retrieval-Augmented Generation",
          "summary": "RAG 先检索相关资料，再把资料组织到上下文中，供模型生成回答。",
          "detail": [
            "可以分别检查资料处理、检索、上下文组织和生成这几个环节。最终回答还需要回到资料核对支持关系。",
            "它通常不靠这次检索来更新模型参数。资料可以单独维护，但资料是否新、检索是否准、模型是否忠于资料，仍需评估。"
          ],
          "example": "个人知识库先找到两段相关笔记，把原文与问题一起交给模型，再要求回答标明对应的笔记编号。最后检查编号是否真正支持结论。",
          "trap": "接入 RAG 不意味着幻觉归零；错误资料、遗漏检索或错误归纳都可能影响结果。",
          "quiz": {
            "question": "RAG 中，检索到的资料通常怎样影响本次回答？",
            "options": [
              "作为本轮上下文提供给模型",
              "自动写进全部模型参数",
              "让所有后续回答都永久正确"
            ],
            "answer": 0,
            "explanation": "检索结果通常进入本轮上下文，不能据此推断模型参数发生了改变。"
          },
          "sources": [
            "rag"
          ],
          "flow": [
            "问题",
            "检索资料",
            "组织上下文",
            "生成回答",
            "核对依据"
          ]
        },
        {
          "id": "fine-tuning",
          "title": "微调与方案选择",
          "english": "Fine-tuning",
          "summary": "微调在已有模型的基础上继续训练，让模型更适应某类任务、风格或领域。",
          "detail": [
            "与只在输入中加入说明和资料不同，微调会涉及训练过程中的参数调整。它需要合适的数据和独立评估。",
            "选择提示词、检索还是微调，要先看问题来源。缺少最新资料、输出习惯不稳定和工具执行出错，往往需要不同的改进方式。"
          ],
          "example": "如果团队规则经常更新，可以先研究如何提供正确版本的资料；如果已有足够高质量示例，希望稳定某种输出习惯，再评估微调是否值得。",
          "trap": "微调不是给模型接一个实时数据库，也不保证记住所有训练事实。",
          "quiz": {
            "question": "微调与在提示词里粘贴资料的主要区别是什么？",
            "options": [
              "粘贴资料必然改变全部权重",
              "微调包含继续训练及参数调整",
              "两者完全没有差别"
            ],
            "answer": 1,
            "explanation": "二者作用层次不同，应先定位问题，再选择改进方式。"
          },
          "sources": [
            "finetune"
          ],
          "flow": []
        }
      ]
    },
    {
      "id": "applications",
      "title": "从模型走向应用",
      "goal": "理解工具、工作流与智能体，并为实际行动设置可检查的边界。",
      "outcome": "能区分工具调用、固定工作流、智能体与人工复核。",
      "practice": {
        "task": "画一条有复核节点的处理流程",
        "steps": [
          "设计一个「读取工单—整理信息—起草答复」流程。",
          "指出哪些步骤固定，哪些步骤可能由模型选择工具。",
          "把真正发送答复前的复核、失败后的停止条件画出来。"
        ],
        "deliverable": "一张包含工具、判断点与人工确认的流程图。",
        "criteria": [
          "模型建议与应用实际执行被明确区分。",
          "有任务成功标准，也有失败或停止条件。"
        ]
      },
      "lessons": [
        {
          "id": "tool-calling",
          "title": "工具调用",
          "english": "Tool / Function Calling",
          "summary": "工具调用让模型提出结构化的操作请求，由应用连接相应工具执行。",
          "detail": [
            "模型可能生成工具名称与参数；应用负责校验、执行和把结果返回。是否允许操作，应由系统的权限与业务规则决定。",
            "工具返回结果以后，还要判断结果是否满足任务要求。调用成功、拿到数据和得出正确结论，是不同的检查点。"
          ],
          "example": "模型建议查询工单编号 1024。真正连接工单系统、校验权限并查询记录的是应用提供的工具，不是模型凭文字直接进入数据库。",
          "trap": "模型输出了工具调用，不表示工具已经执行，更不表示执行结果正确。",
          "quiz": {
            "question": "谁通常负责真正执行工具操作？",
            "options": [
              "模型输出中的一段自然语言本身",
              "问题里的每一个链接",
              "应用中的工具执行层"
            ],
            "answer": 2,
            "explanation": "模型提出调用请求，应用负责受控地执行与返回结果。"
          },
          "sources": [
            "tools"
          ],
          "flow": []
        },
        {
          "id": "workflow",
          "title": "工作流",
          "english": "Workflow",
          "summary": "工作流按预先定义的步骤与条件，组织模型、工具和普通程序完成任务。",
          "detail": [
            "步骤之间可以有分支、重试与检查点。关键在于路径主要由设计好的程序逻辑安排，而不是每次都由模型自由决定。",
            "对边界明确的任务，先画出固定流程，往往更容易观察每一步发生了什么、哪里出现了错误。"
          ],
          "example": "先抽取工单字段，再校验必填项，接着生成回复草稿。缺信息就回到补充步骤，信息完整才继续下一步。",
          "trap": "包含多个模型调用的流程，不一定就是自主智能体。",
          "quiz": {
            "question": "哪种情境更接近固定工作流？",
            "options": [
              "程序规定先抽取、再校验、最后起草",
              "模型自行决定是否搜索及下一步做什么",
              "所有工具都不返回结果"
            ],
            "answer": 0,
            "explanation": "预设步骤与条件是这里区分工作流的重要线索。"
          },
          "sources": [
            "agents"
          ],
          "flow": [
            "读取输入",
            "抽取信息",
            "校验字段",
            "起草结果"
          ]
        },
        {
          "id": "agent",
          "title": "智能体",
          "english": "Agent",
          "summary": "在常见的大模型应用语境中，智能体会围绕目标，根据当前状态选择行动、使用工具并继续推进。",
          "detail": [
            "与固定工作流相比，部分步骤与工具选择由模型在运行中决定。具体产品对 agent 的定义并不完全相同，讨论时最好说明它到底能决定什么。",
            "更大的自主性也意味着需要更清楚的任务边界、可观察的执行记录和停止条件。不要只根据名字判断系统能力。"
          ],
          "example": "为了解决一张故障工单，系统可能先查日志，再按结果决定查配置还是补充提问。下一步会受刚获得的信息影响。",
          "trap": "多个步骤、多个模型或带「智能体」名称，都不能单独证明系统具有同一种自主性。",
          "quiz": {
            "question": "和固定工作流相比，这里的智能体主要多了什么？",
            "options": [
              "永不出错的保证",
              "按状态动态选择部分行动的能力",
              "无需工具与数据的能力"
            ],
            "answer": 1,
            "explanation": "关键在于哪些决策由模型动态做出，而不是名称或调用次数。"
          },
          "sources": [
            "agents"
          ],
          "flow": [
            "观察状态",
            "选择行动",
            "调用工具",
            "检查结果",
            "决定下一步"
          ]
        },
        {
          "id": "human-review",
          "title": "人工复核与反馈",
          "english": "Human-in-the-loop",
          "summary": "把人的判断放到关键检查点，能让自动化结果得到确认、纠正或退回。",
          "detail": [
            "复核需要有可核查的依据：输入材料、工具结果、草稿与操作范围。只有一个「确认」按钮，却没有足够的信息，并不能形成有效检查。",
            "练习时可以先规定哪些输出可以作为草稿，哪些行动必须在核对后才执行，再记录修改意见用于后续改进。"
          ],
          "example": "系统可以自动整理工单并起草答复，发送前由你核对事实与收件对象；发现材料不足时，退回补充信息，而不是勉强确认。",
          "trap": "人工确认不能代替前面的数据、权限和结果校验；它应是清晰流程中的一个检查点。",
          "quiz": {
            "question": "一个有效的复核节点应提供什么？",
            "options": [
              "只有一个无法查看细节的确认按钮",
              "只显示模型很有信心",
              "依据、待执行动作与可退回的选项"
            ],
            "answer": 2,
            "explanation": "复核者需要知道依据是什么、将发生什么，并能纠正或停止。"
          },
          "sources": [
            "human-review"
          ],
          "flow": []
        }
      ]
    }
  ]
};
if (typeof module !== "undefined" && module.exports) module.exports = AI_COURSE;
