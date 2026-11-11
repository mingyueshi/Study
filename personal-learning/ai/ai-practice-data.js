/* AI 实操、模型与工具资料。正文分段存储，运行时不请求外部服务。 */
'use strict';
const AI_PRACTICE = {
  "version": 1,
  "checkedAt": "2026-11-11",
  "sources": {
    "gpt": {
      "title": "OpenAI · 模型目录",
      "url": "https://developers.openai.com/api/docs/models"
    },
    "chatgpt": {
      "title": "OpenAI · ChatGPT 功能说明",
      "url": "https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview"
    },
    "codex": {
      "title": "OpenAI · 编程与 Codex",
      "url": "https://developers.openai.com/api/docs/guides/code-generation"
    },
    "claude": {
      "title": "Anthropic · Claude 模型概览",
      "url": "https://platform.claude.com/docs/en/models/overview"
    },
    "claude-code": {
      "title": "Anthropic · Claude Code",
      "url": "https://code.claude.com/docs/en/overview"
    },
    "gemini": {
      "title": "Google · Gemini 模型目录",
      "url": "https://ai.google.dev/gemini-api/docs/models"
    },
    "deepseek": {
      "title": "DeepSeek · API 文档",
      "url": "https://api-docs.deepseek.com/"
    },
    "qwen": {
      "title": "Qwen · 官方模型仓库",
      "url": "https://github.com/QwenLM/Qwen3"
    },
    "llama": {
      "title": "Meta · Llama 模型仓库",
      "url": "https://github.com/meta-llama/llama-models"
    },
    "glm": {
      "title": "智谱 · GLM 模型概览",
      "url": "https://docs.z.ai/guides/overview/overview"
    },
    "doubao": {
      "title": "火山引擎 · 方舟模型服务",
      "url": "https://docs.volcengine.com/docs/ark?lang=zh"
    },
    "cursor": {
      "title": "Cursor · 官方文档",
      "url": "https://cursor.com/docs"
    },
    "copilot": {
      "title": "GitHub · Copilot 介绍",
      "url": "https://docs.github.com/en/copilot/get-started/about-github-copilot"
    },
    "notebook": {
      "title": "Google · 资料笔记工具说明",
      "url": "https://support.google.com/notebooklm/answer/16164461"
    },
    "perplexity": {
      "title": "Perplexity · 产品介绍",
      "url": "https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity"
    },
    "ollama": {
      "title": "Ollama · 本地运行入门",
      "url": "https://docs.ollama.com/quickstart"
    },
    "qwen-local": {
      "title": "Ollama · Qwen3 4B 示例模型",
      "url": "https://ollama.com/library/qwen3:4b"
    },
    "lm-studio": {
      "title": "LM Studio · 本地模型入门",
      "url": "https://lmstudio.ai/docs/app"
    },
    "dify": {
      "title": "Dify · 应用与工作流",
      "url": "https://docs.dify.ai/en/home"
    },
    "n8n": {
      "title": "n8n · 工作流文档",
      "url": "https://docs.n8n.io/"
    },
    "file-analysis": {
      "title": "OpenAI · 文件与数据分析",
      "url": "https://help.openai.com/en/articles/8437071"
    },
    "prompting": {
      "title": "Anthropic · 提示词设计",
      "url": "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"
    },
    "quantization": {
      "title": "Hugging Face · 模型量化",
      "url": "https://huggingface.co/docs/transformers/quantization/overview"
    },
    "deepseek-weights": {
      "title": "DeepSeek · 开放权重模型示例",
      "url": "https://github.com/deepseek-ai/DeepSeek-R1"
    }
  },
  "categories": [
    {
      "id": "chat",
      "name": "通用对话"
    },
    {
      "id": "coding",
      "name": "编程助手"
    },
    {
      "id": "research",
      "name": "资料与搜索"
    },
    {
      "id": "local",
      "name": "本地模型"
    },
    {
      "id": "workflow",
      "name": "工作流"
    }
  ],
  "models": [
    {
      "id": "gpt",
      "name": "GPT",
      "provider": "OpenAI",
      "summary": "用于文本、代码及多模态任务的模型家族，具体输入输出能力随版本变化。",
      "access": [
        "hosted"
      ],
      "accessNote": "通过 ChatGPT 或受支持的平台与 API 使用；应用功能和 API 能力分别查看。",
      "useCases": [
        "解释概念与改写草稿",
        "代码、资料和图像理解"
      ],
      "choose": "先确认需要聊天、编程还是多模态，再用自己的样例比较质量与耗时。",
      "caution": "GPT 是模型家族，ChatGPT 是应用；聊天订阅与 API 的额度和计费分别核对。",
      "toolIds": [
        "chatgpt",
        "codex"
      ],
      "sources": [
        "gpt"
      ]
    },
    {
      "id": "claude",
      "name": "Claude",
      "provider": "Anthropic",
      "summary": "包含不同能力与响应速度取向的语言模型，可用于知识工作、代码和图像理解。",
      "access": [
        "hosted"
      ],
      "accessNote": "通过 Claude 应用、Claude Code 或 API 等入口使用。",
      "useCases": [
        "长材料整理与写作",
        "代码理解与修改"
      ],
      "choose": "材料较长时，先检查选定版本的上下文和文件限制，再检查答案是否引用到原文。",
      "caution": "应用能调用什么工具、能访问哪些文件，取决于使用入口和设置。",
      "toolIds": [
        "claude-chat",
        "claude-code"
      ],
      "sources": [
        "claude"
      ]
    },
    {
      "id": "gemini",
      "name": "Gemini",
      "provider": "Google",
      "summary": "Google 的模型家族，覆盖文本、图像、音频或视频等任务，按具体型号选择。",
      "access": [
        "hosted"
      ],
      "accessNote": "通过 Gemini 应用、AI Studio 或相关 API 平台使用。",
      "useCases": [
        "多模态资料理解",
        "文本整理与代码任务"
      ],
      "choose": "如果输入含图片、视频或音频，先查所选版本支持的格式，再用短样本验证。",
      "caution": "Gemini 模型、Gemini 应用与资料笔记工具的功能不能直接画等号。",
      "toolIds": [
        "gemini-chat",
        "notebook"
      ],
      "sources": [
        "gemini"
      ]
    },
    {
      "id": "deepseek",
      "name": "DeepSeek",
      "provider": "深度求索",
      "summary": "提供对话和推理相关模型及托管 API，也有公开权重的模型版本。",
      "access": [
        "hosted",
        "weights"
      ],
      "accessNote": "可以使用托管服务；本地运行需另选已发布且适配运行器的权重版本。",
      "useCases": [
        "中文问答与归纳",
        "推理、代码与结构化任务"
      ],
      "choose": "同一份任务同时测格式、内容、速度，记录实际使用的模型标识。",
      "caution": "思考过程长或回答很自信，都不能代替对结果的验证。",
      "toolIds": [
        "ollama",
        "lm-studio"
      ],
      "sources": [
        "deepseek",
        "deepseek-weights"
      ]
    },
    {
      "id": "qwen",
      "name": "Qwen（通义千问）",
      "provider": "阿里巴巴 Qwen 团队",
      "summary": "包含多种规模和任务方向的模型家族，部分模型提供开放权重。",
      "access": [
        "hosted",
        "weights"
      ],
      "accessNote": "可以通过服务平台使用，也可选择与设备适配的开放权重版本。",
      "useCases": [
        "中文与多语言任务",
        "本地模型与代码实验"
      ],
      "choose": "本地入门先挑设备能容纳的小规模量化版本，再比较回答效果。",
      "caution": "模型家族名不等于某个固定大小；许可证、量化版本和多模态能力逐个核对。",
      "toolIds": [
        "ollama",
        "lm-studio"
      ],
      "sources": [
        "qwen"
      ]
    },
    {
      "id": "llama",
      "name": "Llama",
      "provider": "Meta",
      "summary": "提供可获取权重的模型家族，常用于研究、本地运行和自定义应用。",
      "access": [
        "weights"
      ],
      "accessNote": "通常通过模型仓库、运行器或第三方托管服务使用。",
      "useCases": [
        "本地推理与部署学习",
        "定制应用与对照实验"
      ],
      "choose": "先看许可证和硬件条件，确认所选运行器能加载对应版本。",
      "caution": "开放权重不等于没有使用条件，也不等于在任意电脑上都能顺畅运行。",
      "toolIds": [
        "ollama",
        "lm-studio"
      ],
      "sources": [
        "llama"
      ]
    },
    {
      "id": "glm",
      "name": "GLM",
      "provider": "智谱 / Z.ai",
      "summary": "面向文本、代码、推理或多模态等场景的模型家族，包含不同定位的型号。",
      "access": [
        "hosted",
        "weights"
      ],
      "accessNote": "通过平台服务使用；部分版本开放权重，按官方发布说明选择。",
      "useCases": [
        "中文知识与代码任务",
        "工具调用和应用实验"
      ],
      "choose": "核对具体型号，再用相同的输入材料与检查表进行比较。",
      "caution": "不要直接把厂商榜单分数当作自己任务上的效果结论。",
      "toolIds": [
        "dify",
        "n8n"
      ],
      "sources": [
        "glm"
      ]
    },
    {
      "id": "doubao",
      "name": "豆包（Doubao）",
      "provider": "字节跳动 / 火山引擎",
      "summary": "通过火山方舟等入口提供文本生成、多模态理解等模型服务。",
      "access": [
        "hosted"
      ],
      "accessNote": "模型服务与豆包聊天应用是不同入口，能力按所选服务型号确认。",
      "useCases": [
        "中文内容处理",
        "图片、文档等多模态理解"
      ],
      "choose": "先确认自己的材料类型与输出格式，再查看平台支持的具体模型。",
      "caution": "服务可用区域、账号权限和具体能力需要在官方入口确认。",
      "toolIds": [
        "dify",
        "n8n"
      ],
      "sources": [
        "doubao"
      ]
    }
  ],
  "tools": [
    {
      "id": "chatgpt",
      "name": "ChatGPT",
      "category": "chat",
      "summary": "把问题、文字和文件放进对话中，完成解释、写作、资料整理或数据分析。",
      "environment": "在线应用；功能随账号、方案和工作区设置变化。",
      "url": "https://chatgpt.com/",
      "firstTask": "用练习提供的六行 CSV 做一次可复核的汇总。",
      "steps": [
        "新建对话，粘贴练习材料或上传练习文件。",
        "写清需要的表格列、计算方式和不能补编的信息。",
        "检查原始行、计算过程和引用，保留修订后的结果。"
      ],
      "caution": "搜索、文件分析和代码执行是否可用，要看当前对话实际提供的工具。",
      "modelIds": [
        "gpt"
      ],
      "sources": [
        "chatgpt",
        "file-analysis"
      ]
    },
    {
      "id": "claude-chat",
      "name": "Claude",
      "category": "chat",
      "summary": "通过对话整理材料、改写内容、解释代码，并对长资料提出问题。",
      "environment": "在线应用，需使用可用账号。",
      "url": "https://claude.ai/",
      "firstTask": "让它根据同一段材料，分别写面向同事与新手的说明。",
      "steps": [
        "开始一个新对话并提供练习材料。",
        "说明读者、目标、篇幅和必须保留的事实。",
        "逐条核对关键数字，再追问遗漏和不确定处。"
      ],
      "caution": "应用和 API 的配额、文件限制分别核对；不要只看回答流畅程度。",
      "modelIds": [
        "claude"
      ],
      "sources": [
        "claude"
      ]
    },
    {
      "id": "gemini-chat",
      "name": "Gemini",
      "category": "chat",
      "summary": "Google 的对话应用，可按当前能力处理文字或多模态输入。",
      "environment": "在线应用；账号与功能开放情况以实际界面为准。",
      "url": "https://gemini.google.com/",
      "firstTask": "根据一份文字材料生成问答，再检查材料没有回答的问题。",
      "steps": [
        "新建对话，放入本页的虚构练习材料。",
        "指定只根据材料回答，并标记依据位置。",
        "用一个材料外的问题测试它会不会补编。"
      ],
      "caution": "同名模型支持的能力，不一定都出现在当前应用入口。",
      "modelIds": [
        "gemini"
      ],
      "sources": [
        "gemini"
      ]
    },
    {
      "id": "codex",
      "name": "Codex",
      "category": "coding",
      "summary": "OpenAI 的编程智能体，可理解代码、修改文件、运行检查并协助审阅改动。",
      "environment": "开发工具；在自己的练习目录中使用，按入口完成账号配置。",
      "url": "https://openai.com/codex/",
      "firstTask": "修复本页的小型金额汇总函数，并运行给定测试。",
      "steps": [
        "创建独立练习目录，保存两个练习文件。",
        "给出失败现象、范围和验收测试，请它先定位再修复。",
        "查看差异，确认只改需要的代码，再核对测试输出。"
      ],
      "caution": "能运行命令不等于所有操作都应自动执行；发布、迁移和删除要单独明确范围。",
      "modelIds": [
        "gpt"
      ],
      "sources": [
        "codex"
      ]
    },
    {
      "id": "claude-code",
      "name": "Claude Code",
      "category": "coding",
      "summary": "Anthropic 的编程工具，可阅读代码库、编辑文件、执行命令并连接开发流程。",
      "environment": "终端、编辑器或其他受支持入口，需配置可用账号或提供方。",
      "url": "https://code.claude.com/docs/en/overview",
      "firstTask": "让它为金额汇总的失败用例定位原因，修复后解释变更。",
      "steps": [
        "在练习目录中打开工具，并让它先阅读任务与测试。",
        "要求最小改动，保持给定测试的预期结果。",
        "检查每个文件的差异，独立运行测试再接受结果。"
      ],
      "caution": "不要直接把练习操作套到生产目录，先检查所在目录和变更范围。",
      "modelIds": [
        "claude"
      ],
      "sources": [
        "claude-code"
      ]
    },
    {
      "id": "cursor",
      "name": "Cursor",
      "category": "coding",
      "summary": "结合编辑器与编程智能体的开发工具，支持代码理解、修改和检查。",
      "environment": "桌面开发工具；可用模型与功能按当前配置查看。",
      "url": "https://cursor.com/",
      "firstTask": "在编辑器中定位汇总错误，查看生成补丁并运行测试。",
      "steps": [
        "打开独立练习文件夹。",
        "附上失败用例，让工具指出相关代码与修复方法。",
        "逐块查看差异，运行测试并检查边界情况。"
      ],
      "caution": "补全、问答和代理执行是不同能力，使用时先确认当前模式。",
      "modelIds": [],
      "sources": [
        "cursor"
      ]
    },
    {
      "id": "copilot",
      "name": "GitHub Copilot",
      "category": "coding",
      "summary": "融入 GitHub 和编辑器工作流的 AI 编程助手，提供补全、问答及相关开发协助。",
      "environment": "受支持的编辑器或 GitHub 入口，需账号及对应功能权限。",
      "url": "https://github.com/features/copilot",
      "firstTask": "解释一段测试为什么失败，再独立核对建议的修改。",
      "steps": [
        "打开练习代码与测试文件。",
        "请求解释输入、实际输出和预期输出的差异。",
        "确认修改建议，再运行测试，而不是只接受解释。"
      ],
      "caution": "不同入口与方案提供的代理、审阅等功能可能不同。",
      "modelIds": [],
      "sources": [
        "copilot"
      ]
    },
    {
      "id": "notebook",
      "name": "NotebookLM / Gemini Notebook",
      "category": "research",
      "summary": "Google 的资料笔记工具，围绕你提供的来源整理信息与回答问题；官方界面可能显示 Gemini Notebook。",
      "environment": "在线应用，先准备自己有权使用的资料。",
      "url": "https://notebooklm.google.com/",
      "firstTask": "上传练习说明书，询问退款条件并打开引用核对。",
      "steps": [
        "创建笔记项目，只加入本页练习材料。",
        "提问并要求引用来源位置。",
        "打开引用，核对原句，再测试资料没有给出的信息。"
      ],
      "caution": "引用存在还要检查是否支持结论；不能把资料中的指令当作自己的操作授权。",
      "modelIds": [
        "gemini"
      ],
      "sources": [
        "notebook"
      ]
    },
    {
      "id": "perplexity",
      "name": "Perplexity",
      "category": "research",
      "summary": "结合网络搜索与 AI 回答的资料查找工具，答案带来源链接供进一步核查。",
      "environment": "在线应用，需要联网才能搜索最新来源。",
      "url": "https://www.perplexity.ai/",
      "firstTask": "查一个工具的官方安装方式，并核对发布日期与原站链接。",
      "steps": [
        "明确产品名、操作系统与要查的事实。",
        "优先打开官方文档，核对原文和时间。",
        "把已确认的事实与自己的推断分开记录。"
      ],
      "caution": "有引用不代表每句话都被引用支持；遇到付费或区域限制时说明实际范围。",
      "modelIds": [],
      "sources": [
        "perplexity"
      ]
    },
    {
      "id": "ollama",
      "name": "Ollama",
      "category": "local",
      "summary": "用于下载、管理和运行模型的工具，可以在本机与模型对话。",
      "environment": "首次安装与下载需要联网；本地模型下载完成后可离线运行。",
      "url": "https://ollama.com/",
      "firstTask": "运行 qwen3:4b 处理三句虚构工单，再断网复测。",
      "steps": [
        "从官方入口安装，先用 ollama --version 确认命令可用。",
        "执行 ollama run qwen3:4b；首次运行会下载示例模型。",
        "用相同提示词测试，再用 /bye 退出对话。"
      ],
      "caution": "本练习使用本地模型；不要把云端模型入口当成离线运行。内存和速度取决于设备与模型。",
      "modelIds": [
        "qwen",
        "deepseek",
        "llama"
      ],
      "sources": [
        "ollama",
        "qwen-local"
      ]
    },
    {
      "id": "lm-studio",
      "name": "LM Studio",
      "category": "local",
      "summary": "提供模型搜索、下载和本地聊天界面，也可提供本机模型服务。",
      "environment": "桌面应用；首次下载需要联网，本地推理取决于已下载模型与硬件。",
      "url": "https://lmstudio.ai/",
      "firstTask": "下载与设备匹配的小模型，记录量化版本，再完成一次固定任务。",
      "steps": [
        "从官方入口安装应用并检查设备条件。",
        "下载一个兼容的小规模量化模型并加载。",
        "在聊天中使用本页材料，记录模型名、版本和用时。"
      ],
      "caution": "本地运行不能只看下载文件大小；加载、上下文和并发还会占用额外内存。",
      "modelIds": [
        "qwen",
        "llama",
        "deepseek"
      ],
      "sources": [
        "lm-studio"
      ]
    },
    {
      "id": "dify",
      "name": "Dify",
      "category": "workflow",
      "summary": "通过可视化编排构建 AI 应用，可组织模型、知识资料与工具。",
      "environment": "云服务或自行部署；模型提供方需要另行配置。",
      "url": "https://dify.ai/",
      "firstTask": "做一个只输出客服回复草稿的流程，实际发送前由人检查。",
      "steps": [
        "新建工作流，添加输入、条件判断、模型与输出。",
        "把本页提示词和虚构工单接到对应输入。",
        "测试正常输入、缺少材料和异常输入，再由人检查输出。"
      ],
      "caution": "流程发布与模型调用是不同步骤；自行部署也不自动包含模型和免费调用额度。",
      "modelIds": [],
      "sources": [
        "dify"
      ]
    },
    {
      "id": "n8n",
      "name": "n8n",
      "category": "workflow",
      "summary": "通过节点连接应用和数据的自动化工具，也能把模型步骤接入工作流。",
      "environment": "云服务或自行部署；连接第三方应用时需要相应凭据。",
      "url": "https://n8n.io/",
      "firstTask": "用手动触发处理虚构工单，先只在调试结果中查看草稿。",
      "steps": [
        "建立手动触发与测试输入节点。",
        "连接模型步骤，整理结构化输出与错误分支。",
        "用虚构数据试跑并检查每个节点，先保留人工处理环节。"
      ],
      "caution": "自动化工具可能真的写入外部系统；练习阶段使用手动触发与测试数据。",
      "modelIds": [],
      "sources": [
        "n8n"
      ]
    }
  ],
  "labs": [
    {
      "id": "prompt-iteration",
      "title": "把模糊需求改成可执行提示词",
      "category": "入门",
      "duration": "约 15 分钟",
      "environment": "阅读、编辑与复制可离线；在聊天工具中试用需联网。",
      "summary": "用同一份通知材料比较两版提示词，体验补充目标、读者和检查条件的作用。",
      "deliverable": "一份可直接使用的通知，以及两版提示词的差异记录。",
      "toolIds": [
        "chatgpt",
        "claude-chat",
        "gemini-chat"
      ],
      "lessonIds": [
        "prompt",
        "evaluation"
      ],
      "materials": [
        {
          "title": "维护通知材料",
          "filename": "maintenance.txt",
          "language": "text",
          "lines": [
            "项目：练习网站，全部信息为虚构。",
            "维护时间：周六 22:00 至 23:00。",
            "影响：期间不能上传图片，已上传的图片可正常查看。",
            "用户操作：维护前保存编辑内容。",
            "材料没有提供具体日期，也没有说明其他功能受影响。"
          ]
        }
      ],
      "prompt": [
        "请依据给定材料，写一份发给普通用户的网站维护通知。",
        "输出一个标题和三条要点，总计不超过 120 字。",
        "准确保留时间、受影响功能与用户需要做的事。",
        "没有给出的具体日期不要补编；不要把影响扩大到整个网站。"
      ],
      "steps": [
        "先用「帮我写个维护通知」试一次，保留原回答。",
        "下载或复制材料，使用右侧的完整提示词再试一次。",
        "对照时间、功能范围、操作要求和篇幅，记录第二版具体改善在哪里。"
      ],
      "checks": [
        "维护窗口和材料一致。",
        "只说明上传图片受影响，已上传图片仍可查看。",
        "没有补编日期或其他故障。",
        "记录了两版提示词与至少一处结果差异。"
      ],
      "reference": [
        "好提示词包含任务、材料、读者、输出形式与检查标准。",
        "即使第二版更清楚，也要独立检查事实，不能只比较语气。"
      ],
      "sources": [
        "prompting"
      ],
      "validation": null
    },
    {
      "id": "grounded-qa",
      "title": "根据材料回答，并核对引用",
      "category": "资料与数据",
      "duration": "约 20 分钟",
      "environment": "材料可离线阅读；试用聊天或资料工具需联网。",
      "summary": "用一份虚构活动说明练习找依据，也练习识别材料不足的问题。",
      "deliverable": "三条带依据的回答，以及一条明确说明材料不足的回答。",
      "toolIds": [
        "notebook",
        "chatgpt",
        "claude-chat",
        "gemini-chat"
      ],
      "lessonIds": [
        "rag",
        "hallucination"
      ],
      "materials": [
        {
          "title": "活动说明",
          "filename": "event-guide.txt",
          "language": "text",
          "lines": [
            "［A］活动只接受年满 18 周岁的用户报名。",
            "［B］报名成功后七日内，且课程尚未开始，可以申请退款。",
            "［C］退款申请通过后，原路退回付款账户。",
            "［D］客服受理时间为工作日 09:00 至 18:00。",
            "本说明未给出退款到账需要几天。"
          ]
        }
      ],
      "prompt": [
        "只根据附带的活动说明回答，不补充材料外的规则。",
        "问题一：未满 18 周岁能否报名？",
        "问题二：什么条件下可以申请退款？",
        "问题三：退款退到哪里？",
        "问题四：退款几天到账？",
        "每条回答都写出依据编号和对应原句；材料未说明时直接写「材料未说明」。"
      ],
      "steps": [
        "把说明加入对话或资料笔记工具，逐个提出四个问题。",
        "要求给出依据编号，打开引用或回到原句核对。",
        "把材料中的七日退款条件改成五日，重新提问，观察答案是否随来源变化。"
      ],
      "checks": [
        "退款条件同时包括报名后七日内与课程未开始。",
        "每条有依据的结论都能对应原句。",
        "到账时间回答材料未说明。",
        "记录了修改材料前后的答案变化。"
      ],
      "reference": [
        "有引用还要检查引用是否支持这条结论。",
        "这只是材料约束问答练习，不等于已经构建了自动检索的 RAG 系统。"
      ],
      "sources": [
        "notebook",
        "prompting"
      ],
      "validation": null
    },
    {
      "id": "ticket-json",
      "title": "把三条工单转成可检查的 JSON",
      "category": "资料与数据",
      "duration": "约 20 分钟",
      "environment": "材料、参考结果和 JSON 检查器可离线使用；调用模型需相应工具。",
      "summary": "让模型按固定字段提取信息，再在本页分别检查结构与材料对应关系。",
      "deliverable": "一个恰好包含三条记录的 JSON 数组。",
      "toolIds": [
        "chatgpt",
        "claude-chat",
        "gemini-chat",
        "ollama"
      ],
      "lessonIds": [
        "structured-output",
        "evaluation"
      ],
      "materials": [
        {
          "title": "虚构工单",
          "filename": "tickets.txt",
          "language": "text",
          "lines": [
            "T-01：用户输入正确密码仍无法登录，页面显示账号已锁定。",
            "T-02：用户询问如何修改个人头像，其他功能正常。",
            "T-03：同一笔订单显示两次扣款，用户要求核对账单。"
          ]
        }
      ],
      "prompt": [
        "把附带的三条工单转换成 JSON 数组，只输出 JSON，不要 Markdown 代码围栏。",
        "每条记录只含 id、category、evidence 三个字段，字段值都为字符串。",
        "category 只能取「登录」「资料设置」「支付」。",
        "evidence 必须摘取对应工单中的连续原句片段，不能改写。",
        "保留原来的工单编号，不能增加、遗漏或重复工单。"
      ],
      "steps": [
        "复制完整提示词和材料，让模型生成结果。",
        "把回答粘到本页的结果框，先检查 JSON 能否解析及字段是否正确。",
        "故意改错一条分类或证据，再检查一次，体会结构正确与内容正确的区别。"
      ],
      "checks": [
        "JSON 能解析，且只有三条记录。",
        "每条只含要求的三个字符串字段，工单编号不重复。",
        "分类与对应工单内容一致。",
        "证据来自对应工单原句。"
      ],
      "reference": [
        "本页按这三条固定材料检查分类与证据，不能据此判断任意工单。",
        "检查通过只代表本练习的规则通过，不会自动标记任务完成。"
      ],
      "sources": [
        "prompting"
      ],
      "validation": {
        "kind": "ticket-json",
        "rows": [
          {
            "id": "T-01",
            "category": "登录",
            "evidence": "页面显示账号已锁定"
          },
          {
            "id": "T-02",
            "category": "资料设置",
            "evidence": "如何修改个人头像"
          },
          {
            "id": "T-03",
            "category": "支付",
            "evidence": "同一笔订单显示两次扣款"
          }
        ]
      }
    },
    {
      "id": "log-triage",
      "title": "读一段 502 日志，提出可验证的排查步骤",
      "category": "开发与运维",
      "duration": "约 20 分钟",
      "environment": "本页练习只分析虚构日志，无需连接服务器。",
      "summary": "把已观察到的事实、排查假设和下一步证据分开，避免看到报错就直接重启。",
      "deliverable": "一张「事实—假设—只读核查—预期现象」排查表。",
      "toolIds": [
        "chatgpt",
        "claude-chat",
        "codex",
        "claude-code"
      ],
      "lessonIds": [
        "hallucination",
        "tool-calling"
      ],
      "materials": [
        {
          "title": "虚构部署日志",
          "filename": "upstream.log.txt",
          "language": "text",
          "lines": [
            "09:30:00 release=R2 app_listen=127.0.0.1:9001",
            "09:30:04 nginx: connect() failed (111: Connection refused), upstream: http://127.0.0.1:9000/api",
            "09:30:05 health-check http://127.0.0.1:9001/health -> 200",
            "09:30:06 access: GET /api -> 502"
          ]
        }
      ],
      "prompt": [
        "分析这段练习日志，先列出直接观察到的事实，再给出按优先级排列的假设。",
        "每个假设写出只读核查方式，以及支持或否定该假设的预期结果。",
        "不要直接建议重启、删除数据或修改生产配置。",
        "如果信息不足，请明确还需要哪些日志或配置；不要声称根因已经证实。"
      ],
      "steps": [
        "复制日志与提示词，让工具先整理证据。",
        "检查它是否注意到应用监听 9001，而 Nginx 上游指向 9000。",
        "追问如何验证端口与配置对应关系，再记录何时才值得考虑改配置。"
      ],
      "checks": [
        "把端口不一致写成有依据的假设。",
        "没有把健康检查成功理解成所有业务都正常。",
        "每个建议都有可观察的预期结果。",
        "没有未经验证就执行或要求重启、删除等操作。"
      ],
      "reference": [
        "优先核对应用实际监听端口与 Nginx 生效配置，不能只看配置文件中的一行文字。",
        "这是教学材料中的线索，真实 502 还可能有超时、网络或其他原因。"
      ],
      "sources": [
        "codex",
        "prompting"
      ],
      "validation": null
    },
    {
      "id": "code-fix",
      "title": "让编程助手修复金额汇总错误",
      "category": "开发与运维",
      "duration": "约 25 分钟",
      "environment": "需 Node.js；聊天工具可只给出补丁，编程工具可在独立练习目录运行。",
      "summary": "给出能复现错误的输入和测试，要求修复实现，并核对真正的执行结果。",
      "deliverable": "一份最小补丁和三条通过的测试记录。",
      "toolIds": [
        "codex",
        "claude-code",
        "cursor",
        "copilot"
      ],
      "lessonIds": [
        "evaluation",
        "human-review"
      ],
      "materials": [
        {
          "title": "有意保留错误的函数",
          "filename": "total.js",
          "language": "javascript",
          "lines": [
            "'use strict';",
            "function calculateTotal(items) {",
            "  return items.reduce((sum, item) => sum + item.price, 0);",
            "}",
            "module.exports = { calculateTotal };"
          ]
        },
        {
          "title": "验收测试",
          "filename": "total.test.js",
          "language": "javascript",
          "lines": [
            "'use strict';",
            "const assert = require('node:assert/strict');",
            "const { calculateTotal } = require('./total.js');",
            "assert.equal(calculateTotal([{ price: 12, quantity: 2 }, { price: 8, quantity: 3 }]), 48);",
            "assert.equal(calculateTotal([]), 0);",
            "assert.equal(calculateTotal([{ price: 15, quantity: 0 }]), 0);",
            "console.log('三条测试通过');"
          ]
        }
      ],
      "prompt": [
        "修复练习文件中的 calculateTotal，让给定测试通过。",
        "先说明失败用例、当前输出与预期输出，再给出最小修改。",
        "不要修改测试的预期值，不要引入依赖。",
        "运行 node total.test.js 验证；如果不能执行，请明确说明，不要声称已经通过。"
      ],
      "steps": [
        "把两个文件下载到同一个独立练习目录，先运行 node total.test.js 观察失败。",
        "让工具定位问题并给出最小补丁，核对它有没有擅自改测试。",
        "自己再次运行测试，记录实际输出，再检查空数组与数量为零的情况。"
      ],
      "checks": [
        "先复现了错误，没有把猜测当成已验证结果。",
        "汇总考虑了单价与数量，示例结果为 48。",
        "没有修改测试预期，也没有增加依赖。",
        "保存了实际执行的测试输出。"
      ],
      "reference": [
        "原实现只加单价，因此首个用例得到 20；应按每项单价乘数量后求和。",
        "这道练习只处理给定数值。真实金额系统还要另行约定精度、币种和舍入规则。"
      ],
      "sources": [
        "codex",
        "claude-code",
        "copilot"
      ],
      "validation": null
    },
    {
      "id": "csv-analysis",
      "title": "用六行数据做一次可复算的分析",
      "category": "资料与数据",
      "duration": "约 20 分钟",
      "environment": "本页数据可离线下载；在带文件分析能力的工具中试用。",
      "summary": "让模型算出渠道汇总，并识别没有访问量时不能计算转化率。",
      "deliverable": "渠道汇总表、总订单数、总金额及一条数据限制说明。",
      "toolIds": [
        "chatgpt",
        "claude-chat",
        "gemini-chat"
      ],
      "lessonIds": [
        "evaluation",
        "hallucination"
      ],
      "materials": [
        {
          "title": "虚构订单汇总",
          "filename": "orders.csv",
          "language": "csv",
          "lines": [
            "渠道,订单数,金额",
            "网站,8,108",
            "网站,6,72",
            "应用,4,60",
            "应用,10,150",
            "活动,5,90",
            "活动,9,120"
          ]
        }
      ],
      "prompt": [
        "分析附带的练习 CSV，按渠道汇总订单数与金额。",
        "再计算全部订单数、全部金额和整体平均每单金额，展示计算过程。",
        "说明能否计算转化率；缺少必要字段时不要补编数据。",
        "请区分「发现的事实」与「需要更多证据的解释」。"
      ],
      "steps": [
        "下载并上传 CSV，或把六行数据粘到对话中。",
        "要求列出分组求和过程，并用自己的计算核对结果。",
        "追问哪个渠道转化率最高，检查它是否指出缺少访问量。"
      ],
      "checks": [
        "订单数合计为 42，金额合计为 600。",
        "渠道金额分别为网站 180、应用 210、活动 210。",
        "整体平均每单金额约为 14.29，使用总金额除总订单数。",
        "指出没有访问量，不能计算转化率。"
      ],
      "reference": [
        "分组订单数：网站 14、应用 14、活动 14。",
        "整体平均值不能简单取各行平均值；相关解释也不能单凭这六行数据推断。"
      ],
      "sources": [
        "file-analysis"
      ],
      "validation": null
    },
    {
      "id": "model-comparison",
      "title": "同题比较两个模型，留下选择依据",
      "category": "入门",
      "duration": "约 25 分钟",
      "environment": "需两个可访问的模型入口；表格与评分标准可离线准备。",
      "summary": "固定材料、提示词和检查规则，用可复查的任务表现代替笼统排名。",
      "deliverable": "两份原始回答和一张四项对照表。",
      "toolIds": [
        "chatgpt",
        "claude-chat",
        "gemini-chat",
        "ollama"
      ],
      "lessonIds": [
        "evaluation",
        "model-parameters"
      ],
      "materials": [
        {
          "title": "比较用材料",
          "filename": "comparison-brief.txt",
          "language": "text",
          "lines": [
            "练习项目准备在周五上线。",
            "已完成：登录页与帮助页。",
            "未完成：找回密码功能。",
            "本周目标：先让内部测试人员试用。",
            "材料没有给出正式对外开放的日期。"
          ]
        }
      ],
      "prompt": [
        "根据给定材料写一段不超过 100 字的项目进展说明。",
        "分清已完成与未完成，保留内部试用的范围。",
        "不要给出材料没有提供的对外开放日期。",
        "最后单独写出需要进一步确认的问题。"
      ],
      "steps": [
        "固定同一份材料和提示词，在两个模型中分别新建对话测试。",
        "记录产品入口、模型标识、测试日期，以及是否开启搜索等额外工具。",
        "按事实、完整性、格式、未知信息处理四项各给 0 至 2 分，并摘录具体证据。",
        "换一个自己的常见任务再试一次，观察结论是否仍成立。"
      ],
      "checks": [
        "两边输入、材料和额外工具条件尽量一致。",
        "记录了具体模型标识，而不只记产品名。",
        "每项评分都能指出原回答中的证据。",
        "没有把单次样例推广成所有任务的模型排名。"
      ],
      "reference": [
        "四项各 0 至 2 分，满分 8 分；分数用于这份任务的对照。",
        "回复速度、费用和可用性可单独记录，不与事实正确性混为一项。"
      ],
      "sources": [
        "gpt",
        "claude"
      ],
      "validation": null
    },
    {
      "id": "local-model",
      "title": "用 Ollama 完成本地模型第一次对话",
      "category": "本地与工作流",
      "duration": "约 30 分钟，下载时间另计",
      "environment": "需要能安装软件的电脑；首次安装与下载需联网，并预留模型和运行内存。",
      "summary": "从安装、运行、固定提示词到断网复测，分清本地模型与云端聊天。",
      "deliverable": "模型名、版本、运行记录和一次离线复测结果。",
      "toolIds": [
        "ollama",
        "lm-studio"
      ],
      "lessonIds": [
        "training-inference",
        "model-parameters"
      ],
      "materials": [
        {
          "title": "本地运行命令",
          "filename": "local-model.txt",
          "language": "text",
          "lines": [
            "ollama --version",
            "ollama run qwen3:4b",
            "/bye",
            "ollama list",
            "ollama ps"
          ]
        }
      ],
      "prompt": [
        "请用两句话向新手解释：训练与推理分别在做什么？",
        "再用一个本地模型运行的例子说明，不要声称我刚才运行模型是在重新训练。",
        "如果问题超出已有信息，请直接说明。"
      ],
      "steps": [
        "先从官方入口安装 Ollama，运行 ollama --version 确认命令可用。",
        "运行 ollama run qwen3:4b，首次会下载示例模型；设备资源不足时先停止并选择更小的兼容模型。",
        "进入对话后粘贴提示词，完成后用 /bye 退出；用 ollama list 与 ollama ps 查看已下载和正在运行的模型。",
        "确认模型已在本机下载后，断网再运行相同任务，记录结果与耗时。"
      ],
      "checks": [
        "记录了实际运行的模型名与版本。",
        "区分下载文件与运行内存，没有只看文件大小。",
        "确认使用的是本地模型入口，并实际做了离线复测。",
        "知道本地运行是在推理，没有重新训练模型。"
      ],
      "reference": [
        "qwen3:4b 是供练习的具体示例，不代表最新或最适合每台机器的模型。",
        "若网络、硬件或安装权限不满足，可以先在 LM Studio 阅读模型信息，记录卡在哪里。"
      ],
      "sources": [
        "ollama",
        "qwen-local",
        "lm-studio"
      ],
      "validation": null
    },
    {
      "id": "workflow-draft",
      "title": "搭一个只产出草稿的客服工作流",
      "category": "本地与工作流",
      "duration": "约 30 分钟",
      "environment": "需可用的 Dify 或 n8n 环境和模型提供方；本页不保存密钥，也不替你发送消息。",
      "summary": "用手动触发、输入检查和草稿输出体验工作流，再在应用外加入人工复核。",
      "deliverable": "一个可手动试跑的流程，以及正常、缺信息、空输入三条测试记录。",
      "toolIds": [
        "dify",
        "n8n"
      ],
      "lessonIds": [
        "workflow",
        "tool-calling",
        "human-review"
      ],
      "materials": [
        {
          "title": "虚构客服任务",
          "filename": "support-task.txt",
          "language": "text",
          "lines": [
            "用户问题：忘记密码，想知道如何找回。",
            "允许引用的资料：登录页有「忘记密码」入口；用户可按页面提示操作。",
            "未提供：用户邮箱、具体账号状态、找回链接地址。",
            "任务范围：只起草回复，不发送邮件，不修改账号。"
          ]
        }
      ],
      "prompt": [
        "仅依据所给资料起草客服回复，语气清楚、简短。",
        "若缺少必要信息，先列出需要确认的问题。",
        "不要编造重置链接、邮箱或账号状态。",
        "只输出待人工检查的草稿，不执行发送或修改账号操作。"
      ],
      "steps": [
        "建立手动触发或用户输入入口，先传入虚构资料。",
        "加入条件判断：输入为空时返回提示；有内容时进入模型步骤。",
        "把提示词与输入变量连接到模型步骤，再连接输出节点。",
        "分别试跑正常问题、材料外问题和空输入，逐个查看节点结果。",
        "在流程外逐条复核草稿，确认后才由人决定是否使用。"
      ],
      "checks": [
        "流程可手动启动，输入变量能正确传到模型步骤。",
        "空输入和材料不足有明确处理。",
        "输出没有编造链接或账号状态。",
        "没有接入真实发送、删除或账号修改动作。"
      ],
      "reference": [
        "最小流程可以是输入、条件判断、模型和输出；人工复核可先放在流程之外完成。",
        "做出了固定流程，不代表模型已经能自主决定一切，也不等于完成生产部署。"
      ],
      "sources": [
        "dify",
        "n8n"
      ],
      "validation": null
    }
  ],
  "modelBasics": [
    {
      "term": "模型",
      "description": "负责理解与生成，例如 GPT、Claude、Qwen。"
    },
    {
      "term": "工具",
      "description": "提供聊天、文件、代码或工作流入口，例如 ChatGPT、Codex、Ollama。"
    },
    {
      "term": "使用条件",
      "description": "同一个工具可能使用不同模型；可用功能、文件限制、价格和模型版本以当前官方说明为准。"
    }
  ],
  "modelGlossary": [
    {
      "term": "开放权重",
      "description": "可以按对应许可证获取模型权重并自行运行；不代表训练数据、完整训练过程都公开，也不代表没有使用条件。",
      "sources": [
        "llama",
        "qwen"
      ]
    },
    {
      "term": "量化",
      "description": "用较低的数值精度表示模型参数等数据，通常可减少内存占用；效果和速度还要结合具体方法、设备与任务检查。",
      "sources": [
        "quantization"
      ]
    },
    {
      "term": "API 与聊天应用",
      "description": "API 是让程序调用服务的接口，聊天应用提供现成界面。两种入口的权限、额度和计费需要分别确认。",
      "sources": [
        "gpt",
        "deepseek"
      ]
    }
  ]
};
if (typeof module !== 'undefined' && module.exports) module.exports = AI_PRACTICE;
