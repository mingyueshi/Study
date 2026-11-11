/* 语言与框架课程、示例代码和项目材料，按内容源维护。 */
const CODING_COURSE = {
  "version": 1,
  "checkedAt": "2026-11-11",
  "sources": {
    "py-tutorial": {
      "title": "Python · 官方教程",
      "url": "https://docs.python.org/3.12/tutorial/"
    },
    "py-flow": {
      "title": "Python · 流程与函数",
      "url": "https://docs.python.org/3.12/tutorial/controlflow.html"
    },
    "py-data": {
      "title": "Python · 数据结构",
      "url": "https://docs.python.org/3.12/tutorial/datastructures.html"
    },
    "py-io": {
      "title": "Python · 输入输出",
      "url": "https://docs.python.org/3.12/tutorial/inputoutput.html"
    },
    "py-env": {
      "title": "Python · 环境与依赖",
      "url": "https://docs.python.org/3.12/tutorial/venv.html"
    },
    "py-tests": {
      "title": "Python · unittest",
      "url": "https://docs.python.org/3.12/library/unittest.html"
    },
    "vue-start": {
      "title": "Vue · 快速开始",
      "url": "https://vuejs.org/guide/quick-start.html"
    },
    "vue-state": {
      "title": "Vue · 响应式基础",
      "url": "https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
    },
    "vue-props": {
      "title": "Vue · Props",
      "url": "https://vuejs.org/guide/components/props.html"
    },
    "vue-watch": {
      "title": "Vue · 侦听器",
      "url": "https://vuejs.org/guide/essentials/watchers.html"
    },
    "vue-router": {
      "title": "Vue Router · 入门",
      "url": "https://router.vuejs.org/guide/"
    },
    "vue-composable": {
      "title": "Vue · 组合式函数",
      "url": "https://vuejs.org/guide/reusability/composables.html"
    },
    "dj-start": {
      "title": "Django 5.2 · 官方入门",
      "url": "https://docs.djangoproject.com/en/5.2/intro/tutorial01/"
    },
    "dj-queries": {
      "title": "Django · 数据查询",
      "url": "https://docs.djangoproject.com/en/5.2/topics/db/queries/"
    },
    "dj-forms": {
      "title": "Django · 模型表单",
      "url": "https://docs.djangoproject.com/en/5.2/topics/forms/modelforms/"
    },
    "dj-csrf": {
      "title": "Django · CSRF",
      "url": "https://docs.djangoproject.com/en/5.2/howto/csrf/"
    },
    "dj-tests": {
      "title": "Django · 测试",
      "url": "https://docs.djangoproject.com/en/5.2/topics/testing/overview/"
    },
    "dj-deploy": {
      "title": "Django · 发布检查",
      "url": "https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/"
    },
    "dj-auth": {
      "title": "Django · 用户与权限",
      "url": "https://docs.djangoproject.com/en/5.2/topics/auth/default/"
    },
    "dj-transactions": {
      "title": "Django · 数据库事务",
      "url": "https://docs.djangoproject.com/en/5.2/topics/db/transactions/"
    }
  },
  "tracks": [
    {
      "id": "python",
      "name": "Python",
      "kind": "开发语言",
      "summary": "从读写变量到处理文件、组织脚本与验证结果。",
      "baseline": "示例使用 Python 3.12 语法，配合标准库；先确认实际解释器版本。",
      "outcome": "写出一个可测试、可保存数据的任务清单脚本。",
      "prerequisites": [
        "会在终端进入目录并运行命令。",
        "准备 Python 3.12 或兼容版本，练习放在单独目录。"
      ],
      "sources": [
        "py-tutorial",
        "py-env"
      ],
      "lessons": [
        {
          "id": "py-environment",
          "title": "先选对解释器与环境",
          "summary": "把项目使用的 Python 和依赖放在清楚的位置。",
          "body": [
            "解释器负责执行代码，虚拟环境负责隔离当前项目的依赖。进入环境后，用 python -m pip 安装到同一个解释器。",
            "先运行版本检查；下面的激活命令用于 macOS 或 Linux 的常见 Shell，Windows 可使用环境目录下的 Scripts 激活脚本。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "shell",
              "kind": "commands",
              "filename": "setup.sh",
              "context": "在新建的独立练习目录逐行执行；创建环境需要本机已安装 Python。",
              "lines": [
                "python3 --version",
                "python3 -m venv .venv",
                "source .venv/bin/activate",
                "python -c 'import sys; print(sys.executable)'",
                "python -m pip --version"
              ],
              "expected": [
                "解释器路径指向当前目录的虚拟环境。",
                "pip 显示的路径属于同一环境。"
              ]
            }
          ],
          "pitfalls": [
            "激活环境只影响当前终端，另开终端需要重新激活。",
            "不要把项目文件命名为 json.py、typing.py 等标准库名称。"
          ],
          "task": {
            "goal": "创建自己的练习环境并记录解释器路径。",
            "checks": [
              "解释器和 pip 属于同一环境",
              "能说明如何退出环境：deactivate"
            ]
          },
          "quiz": {
            "question": "哪种方式更能避免 pip 装到另一个 Python？",
            "options": [
              "总是直接运行 pip",
              "使用 python -m pip",
              "把依赖复制到系统目录"
            ],
            "answer": 1,
            "explanation": "python -m pip 明确使用当前 python 解释器加载 pip。"
          },
          "sources": [
            "py-env"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-values",
          "title": "变量、类型与空值",
          "summary": "先看值是什么，再决定怎么计算或比较。",
          "body": [
            "变量名指向对象。字符串、数字、布尔值与 None 的用途不同；读取输入后要按业务含义转换和校验。",
            "金额示例使用整数分，避免把浮点数的近似值误当作精确金额。None 表示没有值，零则是一个具体数值。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "values.py",
              "context": "保存为 values.py，运行 python values.py。",
              "lines": [
                "price_cents = 1290",
                "quantity = 3",
                "total_cents = price_cents * quantity",
                "nickname = None",
                "print(total_cents)",
                "print(nickname is None)",
                "print(type(quantity).__name__)"
              ],
              "expected": [
                "依次输出 3870、True、int。"
              ]
            }
          ],
          "pitfalls": [
            "字符串与整数不能直接相加，要明确转换规则。",
            "判断 None 使用 is None；不要把空值和零混为一谈。"
          ],
          "task": {
            "goal": "把数量改为零，再解释总额和空值的差别。",
            "checks": [
              "数量为零时总额为零",
              "能区分 None、0 与空字符串"
            ]
          },
          "quiz": {
            "question": "这里计算金额为何使用整数分？",
            "options": [
              "能自动换算汇率",
              "可按整数进行精确乘加",
              "能跳过输入校验"
            ],
            "answer": 1,
            "explanation": "在精度要求为分的示例中，整数可避免二进制浮点近似；输入仍需校验。"
          },
          "sources": [
            "py-tutorial"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-control",
          "title": "条件判断与循环",
          "summary": "让程序按规则筛选和处理一组数据。",
          "body": [
            "if 决定当前分支，for 逐项读取可迭代对象。把规则写清楚，比写成很短的一行更容易排错。",
            "循环中记录结果或累计值时，先确定初始状态。需要删除项目时，通常生成新列表更容易保持遍历正确。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "control.py",
              "context": "保存后运行 python control.py。",
              "lines": [
                "tasks = [",
                "    {'title': '读文档', 'done': True},",
                "    {'title': '写测试', 'done': False},",
                "]",
                "for task in tasks:",
                "    if not task['done']:",
                "        print(task['title'])"
              ],
              "expected": [
                "只输出「写测试」。"
              ]
            }
          ],
          "pitfalls": [
            "缩进表示代码块，混用缩进会出错。",
            "不要一边遍历原列表，一边随意删除其中元素。"
          ],
          "task": {
            "goal": "添加一个未完成任务并让它出现在输出中。",
            "checks": [
              "已完成任务不显示",
              "新增未完成任务会显示"
            ]
          },
          "quiz": {
            "question": "要取出未完成任务，应检查什么？",
            "options": [
              "任务是否位于第一项",
              "done 是否为 False",
              "标题是不是数字"
            ],
            "answer": 1,
            "explanation": "本例的业务状态由 done 字段决定，与列表位置无关。"
          },
          "sources": [
            "py-flow"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-collections",
          "title": "列表、字典与集合",
          "summary": "按访问方式选择合适的数据结构。",
          "body": [
            "列表适合按顺序保存多项内容，字典按键读取字段，集合便于去重和成员判断。",
            "赋值不一定复制对象。把同一列表交给两个变量后，通过一个变量修改列表，另一个变量也会看到变化。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "collections_demo.py",
              "context": "保存后运行 python collections_demo.py。",
              "lines": [
                "tags = ['接口', '测试', '接口']",
                "unique_tags = sorted(set(tags))",
                "task = {'title': '学习 Python', 'done': False}",
                "print(unique_tags)",
                "print(task.get('owner', '未分配'))",
                "copy = tags.copy()",
                "copy.append('部署')",
                "print(len(tags), len(copy))"
              ],
              "expected": [
                "去重后仍含「接口」「测试」。",
                "未设置 owner 时显示「未分配」，最后输出 3 4。"
              ]
            }
          ],
          "pitfalls": [
            "集合不提供业务排序，显示顺序需要单独确定。",
            "浅复制只复制外层，嵌套对象仍可能被共享。"
          ],
          "task": {
            "goal": "为任务增加标签，并输出不重复的标签列表。",
            "checks": [
              "重复标签只保留一份",
              "显示顺序明确"
            ]
          },
          "quiz": {
            "question": "希望按名称排序显示去重标签，适合怎样做？",
            "options": [
              "直接依赖集合顺序",
              "排序 set 的结果",
              "每次随机挑一项"
            ],
            "answer": 1,
            "explanation": "集合用于去重，排序用于提供稳定的显示顺序。"
          },
          "sources": [
            "py-data"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-functions",
          "title": "函数、参数与返回值",
          "summary": "把一段处理过程变成可复用、可验证的单元。",
          "body": [
            "函数接收输入并返回结果。尽量把业务计算与打印、文件写入分开，验证时可以直接比较返回值。",
            "可变默认参数会被多次调用共享，需要新列表时用 None 作为默认值，再在函数内部创建。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "functions.py",
              "context": "保存后运行 python functions.py。",
              "lines": [
                "def add_tag(tag, tags=None):",
                "    result = [] if tags is None else list(tags)",
                "    result.append(tag)",
                "    return result",
                "",
                "first = add_tag('前端')",
                "second = add_tag('后端')",
                "print(first)",
                "print(second)"
              ],
              "expected": [
                "第一份列表只含「前端」，第二份只含「后端」。"
              ]
            }
          ],
          "pitfalls": [
            "修改传入对象可能影响调用方，需明确约定。",
            "打印结果不是返回结果，调用方不能接着处理打印值。"
          ],
          "task": {
            "goal": "增加一个返回未完成任务数量的函数。",
            "checks": [
              "函数返回整数而不是只打印",
              "空列表返回零"
            ]
          },
          "quiz": {
            "question": "默认参数写成 tags=[] 容易导致什么？",
            "options": [
              "每次调用自动清空",
              "多次调用共享同一列表",
              "函数不能接收参数"
            ],
            "answer": 1,
            "explanation": "默认值在函数定义时建立，可变对象可能跨调用保留修改。"
          },
          "sources": [
            "py-flow"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-modules",
          "title": "模块、导入与程序入口",
          "summary": "让文件既能被复用，也能单独运行。",
          "body": [
            "模块通常对应一个 Python 文件，import 用来复用其中的名称。入口判断能让演示代码只在文件直接运行时执行。",
            "导入也会执行模块顶层语句，因此把启动服务、读写文件等动作放进清楚的函数和入口。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "task_helpers.py",
              "context": "运行 python task_helpers.py；也可在同目录另一个文件中导入 pending_count。",
              "lines": [
                "def pending_count(tasks):",
                "    return sum(not task['done'] for task in tasks)",
                "",
                "if __name__ == '__main__':",
                "    demo = [{'done': False}, {'done': True}]",
                "    print(pending_count(demo))"
              ],
              "expected": [
                "直接运行输出 1。",
                "导入模块时不会自动打印示例结果。"
              ]
            }
          ],
          "pitfalls": [
            "模块名与第三方库或标准库重名会遮住原库。",
            "循环导入通常意味着模块边界需要重新整理。"
          ],
          "task": {
            "goal": "在另一个文件导入函数并传入空列表。",
            "checks": [
              "导入时没有额外输出",
              "空列表返回零"
            ]
          },
          "quiz": {
            "question": "入口判断主要用来做什么？",
            "options": [
              "保证函数只能调用一次",
              "区分直接运行与被导入",
              "自动安装所有依赖"
            ],
            "answer": 1,
            "explanation": "__name__ 在直接运行时为 __main__，被导入时通常是模块名称。"
          },
          "sources": [
            "py-tutorial"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-files",
          "title": "读写文件与 JSON",
          "summary": "明确路径、编码和数据格式，再保存结果。",
          "body": [
            "Path 让路径操作更清楚，with 或便捷方法负责正确关闭文件。JSON 用于保存结构化数据，读回来后还要确认结构是否符合业务要求。",
            "本例在运行目录创建任务数据；先在独立练习目录运行，避免覆盖同名资料。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "files_demo.py",
              "context": "在独立练习目录保存并运行，示例会创建或替换 learning-tasks.json。",
              "lines": [
                "import json",
                "from pathlib import Path",
                "",
                "path = Path('learning-tasks.json')",
                "tasks = [{'title': '练习文件读写', 'done': False}]",
                "path.write_text(json.dumps(tasks, ensure_ascii=False), encoding='utf-8')",
                "loaded = json.loads(path.read_text(encoding='utf-8'))",
                "print(loaded == tasks)"
              ],
              "expected": [
                "输出 True，目录内出现 JSON 数据文件。"
              ]
            }
          ],
          "pitfalls": [
            "相对路径取决于当前工作目录，不一定是脚本所在目录。",
            "文件存在不等于内容有效，损坏 JSON 应报告问题。"
          ],
          "task": {
            "goal": "读取自己保存的任务并显示第一条标题。",
            "checks": [
              "编码明确为 UTF-8",
              "能解释文件实际写到了哪里"
            ]
          },
          "quiz": {
            "question": "相对路径首先取决于什么？",
            "options": [
              "编辑器主题",
              "当前工作目录",
              "最后导入的库"
            ],
            "answer": 1,
            "explanation": "相对路径相对于进程的当前工作目录解析。"
          },
          "sources": [
            "py-io"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-errors",
          "title": "异常、校验与错误信息",
          "summary": "处理能恢复的问题，把必要证据留给调用方。",
          "body": [
            "异常让正常返回与错误情况分开。优先捕获你能解释并处理的具体异常，避免用一个宽泛的 except 把所有问题吞掉。",
            "输入校验应说明违反了哪条规则；用户输入有误与程序内部缺陷，需要采用不同处理方式。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "errors_demo.py",
              "context": "保存后运行；将参数改为负数或非数字，观察报错。",
              "lines": [
                "def parse_quantity(text):",
                "    try:",
                "        value = int(text)",
                "    except ValueError as error:",
                "        raise ValueError('数量应为整数') from error",
                "    if value < 0:",
                "        raise ValueError('数量不能小于零')",
                "    return value",
                "",
                "print(parse_quantity('3'))"
              ],
              "expected": [
                "正常输入输出 3。",
                "错误输入给出明确的 ValueError。"
              ]
            }
          ],
          "pitfalls": [
            "不要捕获异常后仍返回看似成功的数据。",
            "错误信息不要暴露凭据或用户敏感内容。"
          ],
          "task": {
            "goal": "为任务标题增加非空和长度校验。",
            "checks": [
              "空标题有明确错误",
              "合法标题能正常返回"
            ]
          },
          "quiz": {
            "question": "捕获异常后直接返回零有什么问题？",
            "options": [
              "会自动修复输入",
              "可能把失败伪装成正常结果",
              "一定会提高精度"
            ],
            "answer": 1,
            "explanation": "零可能本身是合法值，会使调用方无法区分失败与成功。"
          },
          "sources": [
            "py-tutorial"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-classes",
          "title": "类、对象与类型提示",
          "summary": "把一条任务的字段与行为组织起来。",
          "body": [
            "类描述对象具有什么数据和行为。dataclass 能为简单的数据对象生成初始化等方法，类型提示则帮助读者和工具理解预期类型。",
            "类型提示不会自动检查所有运行时输入；外部数据仍需实际校验，不要把注解当作输入防线。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "run",
              "filename": "classes_demo.py",
              "context": "保存后运行 python classes_demo.py。",
              "lines": [
                "from dataclasses import dataclass",
                "",
                "@dataclass",
                "class Task:",
                "    title: str",
                "    done: bool = False",
                "",
                "    def complete(self) -> None:",
                "        self.done = True",
                "",
                "task = Task('认识数据对象')",
                "task.complete()",
                "print(task.done)"
              ],
              "expected": [
                "输出 True。"
              ]
            }
          ],
          "pitfalls": [
            "类并不是所有短脚本都必须使用的结构。",
            "可变字段默认值应使用 default_factory，而非共享列表。"
          ],
          "task": {
            "goal": "为对象增加一个只读展示文本的方法。",
            "checks": [
              "原任务状态不被展示方法改变",
              "能说明类型提示与校验的区别"
            ]
          },
          "quiz": {
            "question": "title: str 是否会自动拒绝所有非字符串输入？",
            "options": [
              "会，不需要校验",
              "不会，运行时仍需要校验",
              "只有字段为空时才检查"
            ],
            "answer": 1,
            "explanation": "普通类型提示提供约定，实际输入检查需要代码或验证工具完成。"
          },
          "sources": [
            "py-tutorial"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        },
        {
          "id": "py-tests",
          "title": "用测试验证一段业务逻辑",
          "summary": "检查正常、边界和错误输入，而非只看能否启动。",
          "body": [
            "把预期写成断言，才能重复检查改动有没有破坏既有行为。unittest 是标准库的一部分，适合从小函数开始。",
            "测试名称说明要保证的规则；应观察业务结果，而不是复制实现中的每个步骤。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "test_task_helpers.py",
              "context": "与「模块与入口」中的 task_helpers.py 放在同目录，运行 python -m unittest -v。",
              "lines": [
                "import unittest",
                "from task_helpers import pending_count",
                "",
                "class PendingTests(unittest.TestCase):",
                "    def test_empty(self):",
                "        self.assertEqual(pending_count([]), 0)",
                "",
                "    def test_mixed_states(self):",
                "        self.assertEqual(pending_count([{'done': True}, {'done': False}]), 1)",
                "",
                "if __name__ == '__main__':",
                "    unittest.main()"
              ],
              "expected": [
                "两个测试均通过。"
              ]
            }
          ],
          "pitfalls": [
            "只验证程序没抛异常，不能证明结果符合规则。",
            "验证依赖的外部状态过多，会使测试难以重复。"
          ],
          "task": {
            "goal": "增加全部已完成任务的测试。",
            "checks": [
              "修复前失败的情况可以复现",
              "新测试检查具体返回值"
            ]
          },
          "quiz": {
            "question": "哪个断言更能验证空任务列表的规则？",
            "options": [
              "函数能被导入",
              "结果恰好等于零",
              "打印过一行日志"
            ],
            "answer": 1,
            "explanation": "具体返回值才能直接证明空列表的业务结果。"
          },
          "sources": [
            "py-tests"
          ],
          "links": [
            {
              "label": "Python 环境命令",
              "href": "../dev/index.html#tool=pyenv"
            },
            {
              "label": "用 AI 阅读项目",
              "href": "../ai/index.html#prompt=repo-onboard"
            }
          ]
        }
      ]
    },
    {
      "id": "vue",
      "name": "Vue",
      "kind": "前端框架",
      "summary": "使用 Vue 3 组合式 API，把数据变成可操作的页面。",
      "baseline": "采用 Vue 3、单文件组件与 script setup；脚手架及依赖首次安装需联网，Node.js 要满足当前脚手架要求。",
      "outcome": "实现包含表单、加载、错误反馈和接口联调的任务页。",
      "prerequisites": [
        "了解 HTML、CSS、JavaScript 的基本语法。",
        "按官方快速开始准备 Node.js，使用 create-vue 创建 JavaScript 项目。"
      ],
      "sources": [
        "vue-start"
      ],
      "lessons": [
        {
          "id": "vue-start",
          "title": "工程入口与单文件组件",
          "summary": "知道入口在哪里，页面由哪些部分组成。",
          "body": [
            "Vue 把状态与模板关联起来，单文件组件通常包含 script、template 和 style。这里使用 script setup 的组合式写法。",
            "按官方快速开始创建 JavaScript 项目，再在项目根目录运行开发命令；本学习页面无需这些依赖。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "在 create-vue 生成的 JavaScript 项目中替换 src/App.vue，保留原入口；执行 npm install、npm run dev。",
              "lines": [
                "<script setup>",
                "const title = '我的任务清单'",
                "</script>",
                "",
                "<template>",
                "  <main><h1>{{ title }}</h1><p>先完成一个小任务。</p></main>",
                "</template>",
                "",
                "<style scoped>",
                "main { max-width: 60rem; margin: 2rem auto; padding: 1rem; }",
                "</style>"
              ],
              "expected": [
                "页面显示任务清单标题。"
              ]
            }
          ],
          "pitfalls": [
            "首次脚手架下载和依赖安装需要联网。",
            ".vue 文件需由构建工具处理，不能直接双击当作普通 HTML 执行。"
          ],
          "task": {
            "goal": "修改标题和一条说明文字。",
            "checks": [
              "能找到应用入口与 App.vue",
              "修改后页面更新"
            ]
          },
          "quiz": {
            "question": "单文件组件通常通过什么运行？",
            "options": [
              "直接交给 Python 解释器",
              "项目的 Vue 构建工具",
              "重命名为图片"
            ],
            "answer": 1,
            "explanation": "脚手架提供构建工具，将单文件组件转换为浏览器能执行的代码。"
          },
          "sources": [
            "vue-start"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-state",
          "title": "ref、reactive 与派生数据",
          "summary": "把原始状态和计算得到的结果分清。",
          "body": [
            "ref 保存响应式值，脚本中通常通过 .value 访问，模板中会按规则自动解包。reactive 适合组织响应式对象。",
            "computed 表达可以由现有状态推导的值，避免维护两份容易不同步的数据。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "替换 Vue 3 项目的 App.vue。",
              "lines": [
                "<script setup>",
                "import { ref, computed } from 'vue'",
                "const count = ref(0)",
                "const doubled = computed(() => count.value * 2)",
                "function increment() { count.value += 1 }",
                "</script>",
                "<template>",
                "  <button @click='increment'>已完成 {{ count }} 项</button>",
                "  <p>两倍是 {{ doubled }}</p>",
                "</template>"
              ],
              "expected": [
                "点击按钮后，数量和派生值同步更新。"
              ]
            }
          ],
          "pitfalls": [
            "脚本里忘记 .value 会操作错对象。",
            "能直接计算的值，不必再用 watch 手动同步另一份状态。"
          ],
          "task": {
            "goal": "增加一个由数量推导的是否达标提示。",
            "checks": [
              "提示与数量始终一致",
              "没有额外保存重复派生状态"
            ]
          },
          "quiz": {
            "question": "两倍数量更适合怎样实现？",
            "options": [
              "每次手动改两个变量",
              "使用 computed 推导",
              "把原数量固定为零"
            ],
            "answer": 1,
            "explanation": "computed 会跟随依赖状态重新计算，减少重复状态。"
          },
          "sources": [
            "vue-state"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-template",
          "title": "条件、列表与稳定 key",
          "summary": "让不同状态的页面有清楚的显示规则。",
          "body": [
            "v-if 按条件控制内容，v-for 根据数据生成列表。稳定且唯一的 key 帮助 Vue 对应每条记录。",
            "列表会排序、插入或删除时，使用业务 ID，避免把数组位置误当作记录身份。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "替换 App.vue；再把初始列表改为空列表。",
              "lines": [
                "<script setup>",
                "import { ref } from 'vue'",
                "const tasks = ref([{ id: 1, title: '检查列表', done: false }])",
                "</script>",
                "<template>",
                "  <p v-if='tasks.length === 0'>暂时没有任务。</p>",
                "  <ul v-else>",
                "    <li v-for='task in tasks' :key='task.id'>{{ task.title }}</li>",
                "  </ul>",
                "</template>"
              ],
              "expected": [
                "非空时显示任务，空列表时显示提示。"
              ]
            }
          ],
          "pitfalls": [
            "同一列表中的 key 不能重复。",
            "不要为了隐藏空状态而保留已经不存在的假数据。"
          ],
          "task": {
            "goal": "增加一条不同 ID 的任务，并测试空列表。",
            "checks": [
              "两条记录各有稳定 ID",
              "空状态没有残留列表内容"
            ]
          },
          "quiz": {
            "question": "会重新排序的任务列表应优先用什么作 key？",
            "options": [
              "数组下标",
              "任务的稳定 ID",
              "每次渲染随机数"
            ],
            "answer": 1,
            "explanation": "稳定 ID 能对应同一条业务记录，位置和随机数不能稳定表示身份。"
          },
          "sources": [
            "vue-state"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-forms",
          "title": "表单输入与提交状态",
          "summary": "保护用户输入，给出明确反馈。",
          "body": [
            "v-model 连接表单值和状态。提交时仍需按业务要求清理和校验输入，后端也需要再次校验。",
            "页面应区分未填写、提交中、失败与成功。失败时保留输入，成功后再按约定重置。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "替换 App.vue；先提交空格，再提交真实标题。本片段只校验输入。",
              "lines": [
                "<script setup>",
                "import { ref } from 'vue'",
                "const title = ref('')",
                "const message = ref('')",
                "function submit() {",
                "  message.value = title.value.trim() ? '标题校验通过' : '请填写标题'",
                "}",
                "</script>",
                "<template>",
                "  <form @submit.prevent='submit'>",
                "    <label>任务标题 <input v-model='title' maxlength='120'></label>",
                "    <button>检查输入</button><p role='status'>{{ message }}</p>",
                "  </form>",
                "</template>"
              ],
              "expected": [
                "空白内容显示填写提示，合法内容显示校验通过。"
              ]
            }
          ],
          "pitfalls": [
            "前端 maxlength 不能代替后端长度校验。",
            "异步提交要禁止重复点击，并在结束后恢复按钮。"
          ],
          "task": {
            "goal": "增加长度下限，并让错误信息说明如何修改。",
            "checks": [
              "空格不会当作有效标题",
              "用户输入不会因错误被清空"
            ]
          },
          "quiz": {
            "question": "提交失败时通常应该怎样处理输入？",
            "options": [
              "一律清空",
              "保留输入并说明恢复方式",
              "假装提交成功"
            ],
            "answer": 1,
            "explanation": "保留输入能帮助用户修正或重试，成功与失败要明确区分。"
          },
          "sources": [
            "vue-start"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-components",
          "title": "组件、Props 与事件",
          "summary": "父组件管理数据，子组件报告操作。",
          "body": [
            "Props 把父级数据传入组件，事件让子组件表达用户动作。明确输入输出，能避免多个组件随意修改同一份状态。",
            "下面是子组件片段；父级需传入 title，并监听 complete 事件来更新自己的任务。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/components/TaskItem.vue",
              "context": "保存为子组件，在父级导入后以 :title 传值、@complete 监听事件。",
              "lines": [
                "<script setup>",
                "defineProps({ title: { type: String, required: true } })",
                "const emit = defineEmits(['complete'])",
                "function complete() { emit('complete') }",
                "</script>",
                "<template>",
                "  <article><h2>{{ title }}</h2><button @click='complete'>完成</button></article>",
                "</template>"
              ],
              "expected": [
                "子组件展示标题；点击时向父级发出 complete。"
              ]
            }
          ],
          "pitfalls": [
            "不要直接给只读 Props 重新赋值。",
            "事件应描述发生的动作，父级决定如何改变数据。"
          ],
          "task": {
            "goal": "在父组件监听完成事件并更新一条任务。",
            "checks": [
              "数据更新发生在明确的拥有者中",
              "子组件可复用到另一条任务"
            ]
          },
          "quiz": {
            "question": "子组件想修改父级任务状态，应优先怎样做？",
            "options": [
              "直接重写 Props",
              "发出事件，由父级处理",
              "修改浏览器全局变量"
            ],
            "answer": 1,
            "explanation": "事件明确了组件间的协作边界，避免隐式修改父级状态。"
          },
          "sources": [
            "vue-props"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-effects",
          "title": "侦听、生命周期与清理",
          "summary": "把外部副作用与状态推导分开。",
          "body": [
            "watch 适合在值变化后执行保存、请求等副作用，computed 适合计算结果。生命周期钩子描述组件挂载和卸载。",
            "计时器、监听器和未结束的请求，需要在合适的时机清理，避免组件离开后继续工作。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "替换 App.vue；将组件挂载后移除，观察计时器清理位置。",
              "lines": [
                "<script setup>",
                "import { ref, onMounted, onUnmounted } from 'vue'",
                "const seconds = ref(0)",
                "let timer",
                "onMounted(() => { timer = setInterval(() => { seconds.value += 1 }, 1000) })",
                "onUnmounted(() => { clearInterval(timer) })",
                "</script>",
                "<template><p>本页停留 {{ seconds }} 秒</p></template>"
              ],
              "expected": [
                "显示停留秒数，卸载时清除计时器。"
              ]
            }
          ],
          "pitfalls": [
            "反复挂载却没有清理会积累重复工作。",
            "watch 异步请求还需要处理过期响应，不能只看当前结果是否到达。"
          ],
          "task": {
            "goal": "为搜索词变化设计一个可取消的请求过程。",
            "checks": [
              "离开组件时结束外部副作用",
              "较旧请求不会覆盖新查询结果"
            ]
          },
          "quiz": {
            "question": "离开组件后仍运行的计时器应在哪里清理？",
            "options": [
              "每次改 CSS 时",
              "组件卸载阶段",
              "只在刷新浏览器时"
            ],
            "answer": 1,
            "explanation": "卸载时清理属于组件创建的外部工作，可避免重复或遗留执行。"
          },
          "sources": [
            "vue-watch"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-fetch",
          "title": "接口请求、加载与错误",
          "summary": "让失败也成为可操作的页面状态。",
          "body": [
            "fetch 遇到 HTTP 错误状态不一定抛异常，需要检查 response.ok。页面应单独保存加载、数据与错误状态。",
            "下面调用配套 Django 项目的接口；本课程页面不代为发送请求。写接口的 CSRF 流程在项目联调中继续完成。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "vue",
              "kind": "fragment",
              "filename": "src/App.vue",
              "context": "需要配套 Django 接口及 Vue 开发代理；先完成后面的两个项目。",
              "lines": [
                "<script setup>",
                "import { ref, onMounted } from 'vue'",
                "const tasks = ref([]), loading = ref(false), error = ref('')",
                "async function load() {",
                "  loading.value = true; error.value = ''",
                "  try {",
                "    const response = await fetch('/api/tasks/')",
                "    if (!response.ok) throw new Error(`请求失败：${response.status}`)",
                "    tasks.value = (await response.json()).tasks",
                "  } catch (reason) { error.value = reason.message }",
                "  finally { loading.value = false }",
                "}",
                "onMounted(load)",
                "</script>",
                "<template><p v-if='loading'>正在加载…</p><p v-else-if='error' role='alert'>{{ error }}</p><p v-else>共 {{ tasks.length }} 项</p></template>"
              ],
              "expected": [
                "成功显示条数；断开后端会显示错误，并结束加载状态。"
              ]
            }
          ],
          "pitfalls": [
            "HTTP 404 或 500 也需要显式判定失败。",
            "同时发出多个查询时，还要处理取消和响应先后顺序。"
          ],
          "task": {
            "goal": "添加重试按钮，并验证后端停止和恢复后的表现。",
            "checks": [
              "失败后加载状态能结束",
              "后端恢复后可重新读取"
            ]
          },
          "quiz": {
            "question": "fetch 返回 500 时，最该补哪项检查？",
            "options": [
              "只判断有没有返回对象",
              "检查 response.ok 或状态码",
              "直接把所有内容当作成功数据"
            ],
            "answer": 1,
            "explanation": "HTTP 错误响应仍可能正常返回 Response，需要按状态决定处理。"
          },
          "sources": [
            "vue-start"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-routing",
          "title": "路由与页面入口",
          "summary": "让 URL 对应页面，保留可分享的状态。",
          "body": [
            "路由把地址与页面组件对应起来。页面参数可表达正在查看的任务，页面需要处理无效参数与不存在记录。",
            "这里使用 Vue Router 的 createRouter 与 createWebHistory；还需在入口 app.use(router)，并在 App.vue 放入 RouterView。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "javascript",
              "kind": "fragment",
              "filename": "src/router.js",
              "context": "先在脚手架中选择路由或安装 vue-router；创建两个页面组件后接入入口。",
              "lines": [
                "import { createRouter, createWebHistory } from 'vue-router'",
                "import TaskList from './views/TaskList.vue'",
                "import TaskDetail from './views/TaskDetail.vue'",
                "export const router = createRouter({",
                "  history: createWebHistory(),",
                "  routes: [",
                "    { path: '/', component: TaskList },",
                "    { path: '/tasks/:id', component: TaskDetail },",
                "  ],",
                "})"
              ],
              "expected": [
                "两个地址对应不同页面；需要另行处理详情数据与不存在记录。"
              ]
            }
          ],
          "pitfalls": [
            "history 模式发布时需要服务器回退到应用入口。",
            "仅隐藏导航不能保护后端数据权限。"
          ],
          "task": {
            "goal": "为不存在任务设计一个可返回列表的状态。",
            "checks": [
              "直接打开详情地址可以正确加载",
              "错误地址有恢复路径"
            ]
          },
          "quiz": {
            "question": "前端路由能否代替后端权限校验？",
            "options": [
              "能，只要按钮隐藏",
              "不能，后端仍要校验",
              "只有手机需要校验"
            ],
            "answer": 1,
            "explanation": "路由负责界面导航，请求可以绕过页面直接发给后端。"
          },
          "sources": [
            "vue-router"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-composables",
          "title": "抽取可复用的状态逻辑",
          "summary": "把重复的有状态逻辑放到组合式函数。",
          "body": [
            "组合式函数可以封装响应式状态与操作，让组件专注于界面。返回 ref 时，使用方可保留响应式连接。",
            "先确认重复逻辑及其差异，再抽象。并非每一个短函数都需要共享状态或引入全局状态库。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "javascript",
              "kind": "fragment",
              "filename": "src/composables/useTasks.js",
              "context": "从组件的 script setup 导入并调用，每次调用默认创建独立状态。",
              "lines": [
                "import { ref, computed } from 'vue'",
                "export function useTasks(initial = []) {",
                "  const tasks = ref(initial.map(task => ({ ...task })))",
                "  const remaining = computed(() => tasks.value.filter(task => !task.done).length)",
                "  function complete(id) {",
                "    const task = tasks.value.find(task => task.id === id)",
                "    if (task) task.done = true",
                "  }",
                "  return { tasks, remaining, complete }",
                "}"
              ],
              "expected": [
                "完成一条任务后，remaining 自动减少。"
              ]
            }
          ],
          "pitfalls": [
            "模块顶层共享状态与函数内独立状态的范围不同。",
            "不要为了复用而把所有页面状态都放到全局。"
          ],
          "task": {
            "goal": "在两个组件实例中调用，比较状态是否独立。",
            "checks": [
              "能说明状态创建的位置",
              "完成不存在的任务不会抛错"
            ]
          },
          "quiz": {
            "question": "希望每次调用得到独立任务状态，应在哪创建 ref？",
            "options": [
              "函数内部",
              "所有页面共用的固定全局对象",
              "CSS 文件里"
            ],
            "answer": 0,
            "explanation": "在函数内部创建状态，使各次调用默认拥有独立实例。"
          },
          "sources": [
            "vue-composable"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        },
        {
          "id": "vue-build",
          "title": "构建、检查与发布验证",
          "summary": "区分开发服务器、生产构建和实际部署。",
          "body": [
            "开发服务器方便修改与调试，构建命令生成发布文件。预览构建结果能提前发现路径、资源和环境配置的问题。",
            "测试应围绕用户行为：输入、提交、错误恢复和页面跳转。采用什么工具，先看项目已经生成的脚本和依赖。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "shell",
              "kind": "commands",
              "filename": "build.sh",
              "context": "在脚手架项目根目录执行；npm run 先列出当前可用脚本。",
              "lines": [
                "npm run",
                "npm run build",
                "npm run preview"
              ],
              "expected": [
                "构建成功后，预览页面中的资源与交互正常。"
              ]
            }
          ],
          "pitfalls": [
            "npm run preview 用于本地验证，不是完整生产部署方案。",
            "环境变量进入前端产物后可被用户读取，不应包含服务端密钥。"
          ],
          "task": {
            "goal": "构建配套任务页并验证空状态、失败与成功。",
            "checks": [
              "直接打开入口和深链接均能恢复",
              "构建产物不含私密凭据"
            ]
          },
          "quiz": {
            "question": "前端环境变量能否用来隐藏服务端密钥？",
            "options": [
              "能，变量名越长越安全",
              "不能，打包内容可能被读取",
              "只要关闭控制台就能"
            ],
            "answer": 1,
            "explanation": "浏览器需要获取前端资源，包含其中的内容不能当作服务端秘密。"
          },
          "sources": [
            "vue-start"
          ],
          "links": [
            {
              "label": "Node.js 环境命令",
              "href": "../dev/index.html#tool=nvm"
            },
            {
              "label": "前端实现提示词",
              "href": "../ai/index.html#prompt=frontend-page"
            }
          ]
        }
      ]
    },
    {
      "id": "django",
      "name": "Django",
      "kind": "后端框架",
      "summary": "串起 URL、视图、数据模型、校验、权限与测试。",
      "baseline": "示例基于仍受支持的 Django 5.2 LTS，安装其最新补丁；按项目实际版本切换官方文档。",
      "outcome": "实现可校验输入、保护写请求并有测试的任务接口。",
      "prerequisites": [
        "先掌握 Python 的函数、导入、异常和基础类语法。",
        "准备独立虚拟环境，理解请求、响应和数据库表。"
      ],
      "sources": [
        "dj-start",
        "dj-deploy"
      ],
      "lessons": [
        {
          "id": "dj-start",
          "title": "项目、应用与 URL 入口",
          "summary": "沿一条请求找到实际执行的视图。",
          "body": [
            "project 管理整体配置，app 管理一块业务。URL 配置将地址分配给视图，视图处理请求并返回响应。",
            "从独立练习目录开始；本路线采用 Django 5.2 LTS 的补丁版本，不把版本号最大等同于最适合现有项目。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "shell",
              "kind": "commands",
              "filename": "setup.sh",
              "context": "在已激活的独立虚拟环境与空练习目录逐行执行；安装需联网。",
              "lines": [
                "python -m pip install 'Django>=5.2,<5.3'",
                "python -m django startproject demo .",
                "python manage.py startapp tasks",
                "python manage.py check",
                "python manage.py runserver 127.0.0.1:8000"
              ],
              "expected": [
                "项目出现 manage.py 与 demo 目录，检查通过后可启动开发服务器。"
              ]
            }
          ],
          "pitfalls": [
            "不要在已有同名项目目录直接重复创建。",
            "runserver 用于开发，发布需要另外选择服务方式。"
          ],
          "task": {
            "goal": "指出 settings、urls、views 分别负责什么。",
            "checks": [
              "能沿 URL 找到视图",
              "能说明 project 与 app 的边界"
            ]
          },
          "quiz": {
            "question": "URL 配置最直接负责什么？",
            "options": [
              "把地址对应到视图",
              "自动备份数据库",
              "把所有字段变成字符串"
            ],
            "answer": 0,
            "explanation": "URL 路由决定哪段视图处理当前地址。"
          },
          "sources": [
            "dj-start"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-views",
          "title": "视图、方法与 JSON 响应",
          "summary": "把输入、行为和状态码对应起来。",
          "body": [
            "视图接收 request 并返回响应；接口应明确允许的方法和响应结构。读取操作与写入操作应有清楚的边界。",
            "下面是只读视图片段，需要加入对应 URL 配置。完整接口放在配套项目中。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "tasks/views.py",
              "context": "在项目 URL 中导入并用 path 注册，例如 /api/health/。",
              "lines": [
                "from django.http import JsonResponse",
                "from django.views.decorators.http import require_GET",
                "",
                "@require_GET",
                "def health(request):",
                "    return JsonResponse({'status': 'ok'})"
              ],
              "expected": [
                "GET 返回状态数据；不支持的方法返回 405。"
              ]
            }
          ],
          "pitfalls": [
            "不要把异常响应也统一写成成功状态。",
            "GET 不应被用来执行有副作用的业务操作。"
          ],
          "task": {
            "goal": "注册健康检查地址并观察 GET 与 POST 的状态码。",
            "checks": [
              "GET 能返回预期字段",
              "其他方法得到明确拒绝"
            ]
          },
          "quiz": {
            "question": "哪个方法更适合只读取任务列表？",
            "options": [
              "GET",
              "通过链接执行删除",
              "把密码放在 URL"
            ],
            "answer": 0,
            "explanation": "GET 用于读取，写入操作需要另行定义方法、权限与保护。"
          },
          "sources": [
            "dj-start"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-models",
          "title": "模型与迁移",
          "summary": "用模型表达字段，用迁移记录结构变化。",
          "body": [
            "模型描述数据字段及关系，迁移文件记录数据库结构变更。修改模型后要生成并审阅迁移，再把迁移应用到目标数据库。",
            "数据库结构、运行代码和已有数据需要协调；不要把迁移简单理解为删除数据库再建一次。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "tasks/models.py",
              "context": "将 tasks 加入 INSTALLED_APPS，再运行 makemigrations tasks 和 migrate。",
              "lines": [
                "from django.db import models",
                "",
                "class Task(models.Model):",
                "    title = models.CharField(max_length=120)",
                "    completed = models.BooleanField(default=False)",
                "    created_at = models.DateTimeField(auto_now_add=True)",
                "",
                "    class Meta:",
                "        ordering = ['-id']"
              ],
              "expected": [
                "生成迁移后，数据库具备对应任务表。"
              ]
            }
          ],
          "pitfalls": [
            "改模型代码并不会直接改变数据库。",
            "有数据的项目新增约束、非空字段或回填时，要评估兼容顺序。"
          ],
          "task": {
            "goal": "新增任务模型并检查迁移文件中的操作。",
            "checks": [
              "模型与数据库结构一致",
              "理解迁移文件应和代码一起保存"
            ]
          },
          "quiz": {
            "question": "修改字段后下一步应该怎样做？",
            "options": [
              "直接手改所有生产表",
              "生成审阅迁移并按计划应用",
              "忽略数据库变化"
            ],
            "answer": 1,
            "explanation": "迁移记录结构变化并提供可追踪的执行顺序。"
          },
          "sources": [
            "dj-start"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-queries",
          "title": "查询、排序与关联读取",
          "summary": "获取需要的数据，观察实际发出了多少查询。",
          "body": [
            "QuerySet 描述查询，通常在迭代、转换为列表等求值时读取数据库。筛选、排序与截取应围绕实际展示需求。",
            "关联读取时留意逐条触发查询的问题，按关系类型考虑 select_related 或 prefetch_related，并用实际查询证据验证。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "queries.py",
              "context": "在完成迁移的项目中用 python manage.py shell 运行片段。",
              "lines": [
                "from tasks.models import Task",
                "",
                "query = Task.objects.filter(completed=False).order_by('-id')",
                "rows = list(query.values('id', 'title')[:20])",
                "print(rows)",
                "print(Task.objects.filter(completed=False).count())"
              ],
              "expected": [
                "最多列出 20 条未完成任务，并单独统计未完成数量。"
              ]
            }
          ],
          "pitfalls": [
            "不要为了计数而加载全部记录。",
            "查询优化需要结合真实关系和数据量，不能只凭函数名判断。"
          ],
          "task": {
            "goal": "加入筛选参数并检查列表与统计是否采用同一口径。",
            "checks": [
              "排序和最多条数明确",
              "统计条件与列表条件一致"
            ]
          },
          "quiz": {
            "question": "只需要数量时，哪个通常更直接？",
            "options": [
              "加载所有对象再逐个数",
              "使用 QuerySet.count()",
              "下载整个数据库"
            ],
            "answer": 1,
            "explanation": "count 表达数据库计数需求，避免仅为计数加载全部对象。"
          },
          "sources": [
            "dj-queries"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-validation",
          "title": "表单校验与明确错误",
          "summary": "让无效输入在写入前得到一致处理。",
          "body": [
            "Form 或 ModelForm 可以集中处理输入与错误。ModelForm 的 fields 应明确允许写入的字段，避免把不该编辑的数据直接开放。",
            "校验成功后再保存；仅有模型字段定义，不代表所有自定义保存路径都会自动执行完整业务校验。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "forms_demo.py",
              "context": "在已迁移的项目 Shell 中执行；合法输入会新增一条演示任务。",
              "lines": [
                "from django import forms",
                "from tasks.models import Task",
                "",
                "class TaskForm(forms.ModelForm):",
                "    class Meta:",
                "        model = Task",
                "        fields = ['title']",
                "",
                "form = TaskForm({'title': '  写一个验证  '})",
                "if form.is_valid():",
                "    task = form.save()",
                "    print(task.title)",
                "else:",
                "    print(form.errors.as_data())"
              ],
              "expected": [
                "空白被清理，合法标题保存；错误输入不会走入保存分支。"
              ]
            }
          ],
          "pitfalls": [
            "浏览器校验可绕过，后端仍必须校验。",
            "不要把请求中的所有字段原样赋给模型。"
          ],
          "task": {
            "goal": "验证空标题、过长标题和正常标题。",
            "checks": [
              "无效输入不写入记录",
              "返回错误能指出具体字段"
            ]
          },
          "quiz": {
            "question": "ModelForm 中显式 fields 有何作用？",
            "options": [
              "限制允许处理的字段",
              "自动开放所有字段",
              "取消全部校验"
            ],
            "answer": 0,
            "explanation": "明确字段范围有助于控制哪些输入可以影响数据。"
          },
          "sources": [
            "dj-forms"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-auth",
          "title": "身份、权限与对象范围",
          "summary": "登录以后，仍要检查能访问哪条数据。",
          "body": [
            "身份校验回答用户是谁，权限校验回答允许做什么，对象范围则回答允许操作谁的数据。三者需要同时考虑。",
            "下面展示基于拥有者的查询；它要求项目已经启用认证，并且模型已有 owner 字段。不是可以直接放进最简项目的独立代码。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "owned_view.py",
              "context": "集成片段：需要认证中间件、登录入口与 Task.owner 关系；片段仅说明对象范围。",
              "lines": [
                "from django.contrib.auth.decorators import login_required",
                "from django.shortcuts import get_object_or_404",
                "from django.http import JsonResponse",
                "from tasks.models import Task",
                "",
                "@login_required",
                "def owned_task(request, pk):",
                "    task = get_object_or_404(Task, pk=pk, owner=request.user)",
                "    return JsonResponse({'id': task.id, 'title': task.title})"
              ],
              "expected": [
                "只能读取属于当前用户的任务，不存在或不属于自己时不暴露记录。"
              ]
            }
          ],
          "pitfalls": [
            "隐藏按钮不是权限校验。",
            "批量接口和单条接口应采用一致的对象范围规则。"
          ],
          "task": {
            "goal": "画出管理员、任务拥有者和其他用户的权限表。",
            "checks": [
              "每个读取与写入入口有权限规则",
              "其他用户不能通过 ID 获取记录"
            ]
          },
          "quiz": {
            "question": "用户已登录，是否可以直接读取任意任务 ID？",
            "options": [
              "可以，登录已经足够",
              "不可以，还需检查权限和对象范围",
              "只要页面没有入口就可以"
            ],
            "answer": 1,
            "explanation": "有效身份并不意味着对所有对象都有访问权。"
          },
          "sources": [
            "dj-auth"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-transactions",
          "title": "事务、约束与重复请求",
          "summary": "让一次业务变化保持一致。",
          "body": [
            "transaction.atomic 将一组数据库操作放在事务中，异常时可回滚本次数据库变化。数据库约束保护数据规则，但外部请求不能被数据库事务自动撤回。",
            "事务并不会自动防止所有并发和重复请求。条件更新、唯一约束、锁或幂等标识，应根据真实业务选择。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "transactions_demo.py",
              "context": "在演示数据库 Shell 中执行；会把 ID 为 1 的未完成任务改为已完成。",
              "lines": [
                "from django.db import transaction",
                "from tasks.models import Task",
                "",
                "with transaction.atomic():",
                "    changed = Task.objects.filter(pk=1, completed=False).update(completed=True)",
                "print(changed)"
              ],
              "expected": [
                "第一次实际改变一条记录时返回 1；再次执行返回 0。"
              ]
            }
          ],
          "pitfalls": [
            "atomic 不是自动重试或自动去重器。",
            "发邮件等外部动作要考虑提交后执行及重复发送的处理。"
          ],
          "task": {
            "goal": "解释条件更新和事务各自解决了什么问题。",
            "checks": [
              "重复执行不会反复改变同一状态",
              "能说明数据库与外部副作用的边界"
            ]
          },
          "quiz": {
            "question": "atomic 会自动撤回已经发送的邮件吗？",
            "options": [
              "会",
              "不会，邮件属于外部副作用",
              "只要邮件标题相同就会"
            ],
            "answer": 1,
            "explanation": "数据库事务控制数据库变化，外部系统的动作需要独立设计。"
          },
          "sources": [
            "dj-transactions"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-tests",
          "title": "验证接口、数据和权限",
          "summary": "检查响应结果，也检查数据库实际变化。",
          "body": [
            "Django 的 TestCase 提供隔离测试数据库与请求客户端。接口测试同时观察状态码、响应结构和数据变化。",
            "测试应覆盖成功、无效输入、权限与重复请求。配套项目另有强制 CSRF 检查，避免测试客户端的默认行为遮住问题。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "tasks/tests.py",
              "context": "需要 Task 模型与迁移；运行 python manage.py test。",
              "lines": [
                "from django.test import TestCase",
                "from tasks.models import Task",
                "",
                "class TaskTests(TestCase):",
                "    def test_default_state(self):",
                "        task = Task.objects.create(title='写测试')",
                "        self.assertFalse(task.completed)",
                "        self.assertEqual(Task.objects.count(), 1)"
              ],
              "expected": [
                "测试在独立测试库中验证默认状态与记录数。"
              ]
            }
          ],
          "pitfalls": [
            "不能只断言状态码就认为数据一定正确。",
            "测试客户端默认不强制 CSRF，相关测试需显式开启。"
          ],
          "task": {
            "goal": "补充创建接口的空标题验证。",
            "checks": [
              "无效输入返回明确错误",
              "数据库没有新增无效记录"
            ]
          },
          "quiz": {
            "question": "验证创建接口时，应同时检查什么？",
            "options": [
              "状态码与数据库变化",
              "只看日志颜色",
              "只检查模板文件存在"
            ],
            "answer": 0,
            "explanation": "响应和实际持久化结果需要共同符合规则。"
          },
          "sources": [
            "dj-tests"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-csrf",
          "title": "Vue 联调、Cookie 与 CSRF",
          "summary": "把浏览器、开发代理和后端规则串起来。",
          "body": [
            "同源代理把浏览器请求转交后端，解决开发入口组织问题；它不会替代权限或 CSRF。写请求需要按后端约定带上令牌。",
            "配套项目先通过 GET 读取令牌并建立 Cookie，再用相同来源发送请求；本地代理允许的来源在开发配置中明确列出。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "python",
              "kind": "fragment",
              "filename": "csrf_view.py",
              "context": "保留 CsrfViewMiddleware，前端在同源请求中读取 csrfToken 并通过 X-CSRFToken 发送。",
              "lines": [
                "from django.http import JsonResponse",
                "from django.middleware.csrf import get_token",
                "from django.views.decorators.http import require_GET",
                "",
                "@require_GET",
                "def session_info(request):",
                "    return JsonResponse({'csrfToken': get_token(request)})"
              ],
              "expected": [
                "令牌与 Cookie 配合使用，缺少有效保护的写请求被拒绝。"
              ]
            }
          ],
          "pitfalls": [
            "不要为方便联调直接移除 CSRF 保护。",
            "CORS、CSRF 与用户权限是不同问题，不能互相替代。"
          ],
          "task": {
            "goal": "在项目中分别验证带令牌和缺少令牌的写请求。",
            "checks": [
              "正常写入能通过",
              "缺少令牌的写入返回 403"
            ]
          },
          "quiz": {
            "question": "联调写接口最合适的做法是什么？",
            "options": [
              "删掉所有保护",
              "按来源、Cookie 与令牌约定配置",
              "把 GET 改成随意写入数据"
            ],
            "answer": 1,
            "explanation": "按实际请求来源配置并携带令牌，保留写请求保护。"
          },
          "sources": [
            "dj-csrf"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        },
        {
          "id": "dj-deploy",
          "title": "配置、日志与发布检查",
          "summary": "把开发可用和上线可用分开验证。",
          "body": [
            "发布前检查密钥、DEBUG、允许域名、静态文件、数据库、HTTPS 和备份恢复。敏感配置从适合部署环境的渠道提供。",
            "运行检查只是起点；还要在实际部署方式中验证入口、数据读写、日志和失败恢复，开发服务器不是生产服务。"
          ],
          "steps": [
            "先阅读示例，判断输入、处理过程与结果。",
            "在独立练习目录运行或接入片段，再修改一处观察变化。"
          ],
          "blocks": [
            {
              "label": "动手示例",
              "language": "shell",
              "kind": "commands",
              "filename": "checks.sh",
              "context": "在自己的项目环境执行，阅读每项提示并结合实际发布配置处理。",
              "lines": [
                "python manage.py check",
                "python manage.py check --deploy",
                "python manage.py showmigrations",
                "python manage.py test"
              ],
              "expected": [
                "常规检查与测试通过；发布检查中的提示逐项有处理依据。"
              ]
            }
          ],
          "pitfalls": [
            "不要把演示密钥、DEBUG=True 和本地允许来源直接带到生产。",
            "备份需要实际恢复验证，不能只看文件是否存在。"
          ],
          "task": {
            "goal": "列出本机演示与生产配置的差异。",
            "checks": [
              "发布配置与开发配置分开",
              "有上线后验证和可行的恢复方式"
            ]
          },
          "quiz": {
            "question": "check --deploy 没有报错是否就证明线上功能正确？",
            "options": [
              "是，完全不需其他验证",
              "否，还需验证实际入口与业务路径",
              "只要能打开静态图片就够了"
            ],
            "answer": 1,
            "explanation": "部署检查覆盖一部分配置问题，无法代替真实环境的业务验证。"
          },
          "sources": [
            "dj-deploy"
          ],
          "links": [
            {
              "label": "Django 命令速查",
              "href": "../dev/index.html#tool=django"
            },
            {
              "label": "接口排查命令",
              "href": "../dev/index.html#tool=network"
            },
            {
              "label": "后端实现提示词",
              "href": "../ai/index.html#prompt=backend-feature"
            }
          ]
        }
      ]
    }
  ],
  "projects": [
    {
      "id": "python-cli",
      "track": "python",
      "title": "Python：命令行任务清单",
      "summary": "把函数、列表、JSON 文件和测试组合成一个小工具。",
      "environment": "本机 Python 3.12 或兼容版本，只使用标准库；材料可离线下载。单进程、单用户示例，不含多进程文件锁。",
      "lessonIds": [
        "py-functions",
        "py-files",
        "py-errors",
        "py-tests"
      ],
      "steps": [
        "下载材料 ZIP，在一个新的练习目录解压；在该目录运行命令。",
        "先执行测试，再添加任务、查看列表并完成任务。",
        "打开 tasks.json 观察状态；试着传入空标题，确认失败没有写入无效记录。"
      ],
      "commands": [
        "python -m unittest -v",
        "python tasks.py add '读一段官方文档'",
        "python tasks.py list",
        "python tasks.py done 1"
      ],
      "checks": [
        "测试全部通过，空文件路径读取为空列表。",
        "任务可保存并在下次启动时读取。",
        "重复完成不会增加记录，损坏文件不会被静默当成空列表。"
      ],
      "sources": [
        "py-io",
        "py-tests"
      ],
      "files": [
        {
          "path": "tasks.py",
          "lines": [
            "import argparse",
            "import json",
            "from pathlib import Path",
            "",
            "",
            "def read_tasks(path):",
            "    if not path.exists():",
            "        return []",
            "    rows = json.loads(path.read_text(encoding='utf-8'))",
            "    if not isinstance(rows, list):",
            "        raise ValueError('任务文件应为列表')",
            "    seen = set()",
            "    for row in rows:",
            "        if not isinstance(row, dict) or set(row) != {'id', 'title', 'done'}:",
            "            raise ValueError('任务字段不正确')",
            "        if type(row['id']) is not int or row['id'] <= 0 or row['id'] in seen:",
            "            raise ValueError('任务编号不正确或重复')",
            "        if not isinstance(row['title'], str) or not row['title'].strip() or len(row['title']) > 120:",
            "            raise ValueError('任务标题不正确')",
            "        if type(row['done']) is not bool:",
            "            raise ValueError('任务状态应为布尔值')",
            "        seen.add(row['id'])",
            "    return rows",
            "",
            "",
            "def write_tasks(path, rows):",
            "    temporary = path.with_name(path.name + '.tmp')",
            "    temporary.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')",
            "    temporary.replace(path)",
            "",
            "",
            "def add_task(rows, title):",
            "    title = title.strip()",
            "    if not title or len(title) > 120:",
            "        raise ValueError('标题应为 1 至 120 个字符')",
            "    next_id = max((row['id'] for row in rows), default=0) + 1",
            "    return [*rows, {'id': next_id, 'title': title, 'done': False}]",
            "",
            "",
            "def complete_task(rows, task_id):",
            "    if not any(row['id'] == task_id for row in rows):",
            "        raise ValueError('找不到该任务')",
            "    return [{**row, 'done': True} if row['id'] == task_id else dict(row) for row in rows]",
            "",
            "",
            "def main():",
            "    parser = argparse.ArgumentParser(description='本机单用户任务清单')",
            "    parser.add_argument('--file', type=Path, default=Path('tasks.json'))",
            "    commands = parser.add_subparsers(dest='command', required=True)",
            "    commands.add_parser('list')",
            "    commands.add_parser('add').add_argument('title')",
            "    commands.add_parser('done').add_argument('id', type=int)",
            "    args = parser.parse_args()",
            "    try:",
            "        rows = read_tasks(args.file)",
            "        if args.command == 'add':",
            "            rows = add_task(rows, args.title)",
            "            write_tasks(args.file, rows)",
            "        elif args.command == 'done':",
            "            rows = complete_task(rows, args.id)",
            "            write_tasks(args.file, rows)",
            "        for row in rows:",
            "            print(row['id'], '已完成' if row['done'] else '待完成', row['title'])",
            "    except (ValueError, OSError) as error:",
            "        parser.exit(2, str(error) + '\\n')",
            "",
            "",
            "if __name__ == '__main__':",
            "    main()"
          ]
        },
        {
          "path": "test_tasks.py",
          "lines": [
            "import tempfile",
            "import unittest",
            "from pathlib import Path",
            "from tasks import read_tasks, write_tasks, add_task, complete_task",
            "",
            "",
            "class TaskTests(unittest.TestCase):",
            "    def test_missing_file_is_empty(self):",
            "        with tempfile.TemporaryDirectory() as directory:",
            "            self.assertEqual(read_tasks(Path(directory) / 'tasks.json'), [])",
            "",
            "    def test_add_and_save(self):",
            "        with tempfile.TemporaryDirectory() as directory:",
            "            path = Path(directory) / 'tasks.json'",
            "            rows = add_task([], '  写测试  ')",
            "            write_tasks(path, rows)",
            "            self.assertEqual(read_tasks(path), [{'id': 1, 'title': '写测试', 'done': False}])",
            "",
            "    def test_invalid_title(self):",
            "        for title in [' ', '字' * 121]:",
            "            with self.assertRaises(ValueError):",
            "                add_task([], title)",
            "",
            "    def test_complete_is_repeatable(self):",
            "        rows = add_task([], '读文档')",
            "        completed = complete_task(rows, 1)",
            "        self.assertEqual(complete_task(completed, 1), completed)",
            "        self.assertFalse(rows[0]['done'])",
            "        with self.assertRaises(ValueError):",
            "            complete_task(rows, 99)",
            "",
            "    def test_bad_file_is_not_silently_replaced(self):",
            "        with tempfile.TemporaryDirectory() as directory:",
            "            path = Path(directory) / 'tasks.json'",
            "            path.write_text('{}', encoding='utf-8')",
            "            with self.assertRaises(ValueError):",
            "                read_tasks(path)",
            "            self.assertEqual(path.read_text(encoding='utf-8'), '{}')",
            "",
            "",
            "if __name__ == '__main__':",
            "    unittest.main()"
          ]
        },
        {
          "path": "README.txt",
          "lines": [
            "Python：命令行任务清单",
            "",
            "把函数、列表、JSON 文件和测试组合成一个小工具。",
            "",
            "本机 Python 3.12 或兼容版本，只使用标准库；材料可离线下载。单进程、单用户示例，不含多进程文件锁。",
            "",
            "步骤：",
            "下载材料 ZIP，在一个新的练习目录解压；在该目录运行命令。",
            "先执行测试，再添加任务、查看列表并完成任务。",
            "打开 tasks.json 观察状态；试着传入空标题，确认失败没有写入无效记录。",
            "",
            "命令（按步骤说明在对应目录逐行执行）：",
            "python -m unittest -v",
            "python tasks.py add '读一段官方文档'",
            "python tasks.py list",
            "python tasks.py done 1",
            "",
            "完成后检查：",
            "测试全部通过，空文件路径读取为空列表。",
            "任务可保存并在下次启动时读取。",
            "重复完成不会增加记录，损坏文件不会被静默当成空列表。"
          ]
        }
      ]
    },
    {
      "id": "django-api",
      "track": "django",
      "title": "Django：任务 JSON 接口",
      "summary": "从模型到接口，验证输入、状态码、持久化与 CSRF。",
      "environment": "Python 3.12、Django 5.2 最新补丁，首次安装需联网；SQLite、本机单用户教学接口，未实现账号和多用户权限，不可原样作为公网服务。",
      "lessonIds": [
        "dj-models",
        "dj-views",
        "dj-validation",
        "dj-tests",
        "dj-csrf"
      ],
      "steps": [
        "在独立目录解压材料，创建并激活自己的虚拟环境，安装 requirements.txt。",
        "生成任务模型的迁移并应用；执行测试，确认包括缺令牌拒绝写入的场景。",
        "启动本机后端，再打开 Vue 项目进行浏览器联调；此示例最多列出最近 100 条任务。"
      ],
      "commands": [
        "python3 -m venv .venv",
        "source .venv/bin/activate",
        "python -m pip install -r requirements.txt",
        "python manage.py makemigrations tasks",
        "python manage.py migrate",
        "python manage.py test",
        "python manage.py runserver 127.0.0.1:8000"
      ],
      "checks": [
        "空标题和错误类型返回 400，且不产生记录。",
        "创建返回 201，重复设置完成返回成功且不增加记录。",
        "测试强制检查 CSRF，缺失令牌返回 403，带有效令牌可以写入。",
        "演示密钥、DEBUG 与本地来源只用于本机学习。"
      ],
      "sources": [
        "dj-start",
        "dj-queries",
        "dj-csrf",
        "dj-tests"
      ],
      "files": [
        {
          "path": "requirements.txt",
          "lines": [
            "Django>=5.2,<5.3"
          ]
        },
        {
          "path": "manage.py",
          "lines": [
            "import os",
            "import sys",
            "from django.core.management import execute_from_command_line",
            "",
            "if __name__ == '__main__':",
            "    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'demo.settings')",
            "    execute_from_command_line(sys.argv)"
          ]
        },
        {
          "path": "demo/__init__.py",
          "lines": []
        },
        {
          "path": "demo/settings.py",
          "lines": [
            "from pathlib import Path",
            "",
            "BASE_DIR = Path(__file__).resolve().parent.parent",
            "# 仅用于本机教学演示。生产密钥与配置需单独提供。",
            "SECRET_KEY = 'local-learning-demo-only-change-before-deployment'",
            "DEBUG = True",
            "ALLOWED_HOSTS = ['127.0.0.1', 'localhost']",
            "INSTALLED_APPS = ['tasks']",
            "MIDDLEWARE = [",
            "    'django.middleware.security.SecurityMiddleware',",
            "    'django.middleware.common.CommonMiddleware',",
            "    'django.middleware.csrf.CsrfViewMiddleware',",
            "]",
            "ROOT_URLCONF = 'demo.urls'",
            "WSGI_APPLICATION = 'demo.wsgi.application'",
            "DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'tasks.sqlite3'}}",
            "DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'",
            "LANGUAGE_CODE = 'zh-hans'",
            "TIME_ZONE = 'Asia/Shanghai'",
            "USE_TZ = True",
            "# Vue 开发代理的实际浏览器来源，仅用于本机开发。",
            "CSRF_TRUSTED_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173']"
          ]
        },
        {
          "path": "demo/urls.py",
          "lines": [
            "from django.urls import path",
            "from tasks import views",
            "",
            "urlpatterns = [",
            "    path('api/tasks/', views.task_list),",
            "    path('api/tasks/<int:pk>/', views.task_detail),",
            "]"
          ]
        },
        {
          "path": "demo/wsgi.py",
          "lines": [
            "import os",
            "from django.core.wsgi import get_wsgi_application",
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'demo.settings')",
            "application = get_wsgi_application()"
          ]
        },
        {
          "path": "tasks/__init__.py",
          "lines": []
        },
        {
          "path": "tasks/migrations/__init__.py",
          "lines": []
        },
        {
          "path": "tasks/models.py",
          "lines": [
            "from django.db import models",
            "",
            "class Task(models.Model):",
            "    title = models.CharField(max_length=120)",
            "    completed = models.BooleanField(default=False)",
            "    created_at = models.DateTimeField(auto_now_add=True)",
            "",
            "    class Meta:",
            "        ordering = ['-id']"
          ]
        },
        {
          "path": "tasks/views.py",
          "lines": [
            "import json",
            "from django.http import JsonResponse",
            "from django.middleware.csrf import get_token",
            "from django.shortcuts import get_object_or_404",
            "from django.views.decorators.http import require_http_methods",
            "from .models import Task",
            "",
            "",
            "def serialize(task):",
            "    return {'id': task.pk, 'title': task.title, 'completed': task.completed}",
            "",
            "",
            "def read_object(request):",
            "    if request.content_type != 'application/json':",
            "        raise ValueError('请求应使用 application/json')",
            "    try:",
            "        value = json.loads(request.body)",
            "    except (ValueError, UnicodeDecodeError) as error:",
            "        raise ValueError('请求内容不是有效 JSON') from error",
            "    if not isinstance(value, dict):",
            "        raise ValueError('请求内容应为对象')",
            "    return value",
            "",
            "",
            "@require_http_methods(['GET', 'POST'])",
            "def task_list(request):",
            "    if request.method == 'GET':",
            "        rows = [serialize(task) for task in Task.objects.order_by('-id')[:100]]",
            "        return JsonResponse({'tasks': rows, 'csrfToken': get_token(request)})",
            "    try:",
            "        value = read_object(request)",
            "        if set(value) != {'title'} or not isinstance(value['title'], str):",
            "            raise ValueError('只接受字符串 title 字段')",
            "        title = value['title'].strip()",
            "        if not title or len(title) > 120:",
            "            raise ValueError('标题应为 1 至 120 个字符')",
            "    except ValueError as error:",
            "        return JsonResponse({'error': str(error)}, status=400)",
            "    task = Task.objects.create(title=title)",
            "    return JsonResponse({'task': serialize(task)}, status=201)",
            "",
            "",
            "@require_http_methods(['PATCH'])",
            "def task_detail(request, pk):",
            "    task = get_object_or_404(Task, pk=pk)",
            "    try:",
            "        value = read_object(request)",
            "        if set(value) != {'completed'} or type(value['completed']) is not bool:",
            "            raise ValueError('只接受布尔值 completed 字段')",
            "    except ValueError as error:",
            "        return JsonResponse({'error': str(error)}, status=400)",
            "    task.completed = value['completed']",
            "    task.save(update_fields=['completed'])",
            "    return JsonResponse({'task': serialize(task)})"
          ]
        },
        {
          "path": "tasks/tests.py",
          "lines": [
            "import json",
            "from django.test import Client, TestCase",
            "from .models import Task",
            "",
            "",
            "class TaskApiTests(TestCase):",
            "    def test_empty_list(self):",
            "        response = self.client.get('/api/tasks/')",
            "        self.assertEqual(response.status_code, 200)",
            "        self.assertEqual(response.json()['tasks'], [])",
            "        self.assertTrue(response.json()['csrfToken'])",
            "",
            "    def test_create_and_complete(self):",
            "        response = self.client.post('/api/tasks/', json.dumps({'title': '  读文档  '}), content_type='application/json')",
            "        self.assertEqual(response.status_code, 201)",
            "        task = Task.objects.get()",
            "        self.assertEqual(task.title, '读文档')",
            "        self.assertFalse(task.completed)",
            "        url = f'/api/tasks/{task.pk}/'",
            "        for _ in range(2):",
            "            response = self.client.patch(url, json.dumps({'completed': True}), content_type='application/json')",
            "            self.assertEqual(response.status_code, 200)",
            "        task.refresh_from_db()",
            "        self.assertTrue(task.completed)",
            "",
            "    def test_invalid_create_does_not_write(self):",
            "        for value in [{'title': ''}, {'title': '字' * 121}, {'title': 3}, [], {'other': 'x'}]:",
            "            response = self.client.post('/api/tasks/', json.dumps(value), content_type='application/json')",
            "            self.assertEqual(response.status_code, 400)",
            "        self.assertEqual(Task.objects.count(), 0)",
            "",
            "    def test_invalid_patch_and_missing_record(self):",
            "        task = Task.objects.create(title='检查状态')",
            "        response = self.client.patch(f'/api/tasks/{task.pk}/', json.dumps({'completed': 'true'}), content_type='application/json')",
            "        self.assertEqual(response.status_code, 400)",
            "        task.refresh_from_db()",
            "        self.assertFalse(task.completed)",
            "        self.assertEqual(self.client.patch('/api/tasks/999/', '{}', content_type='application/json').status_code, 404)",
            "",
            "    def test_methods_and_broken_json(self):",
            "        self.assertEqual(self.client.delete('/api/tasks/').status_code, 405)",
            "        self.assertEqual(self.client.post('/api/tasks/', '{bad', content_type='application/json').status_code, 400)",
            "",
            "    def test_csrf_is_enforced_and_valid_token_works(self):",
            "        client = Client(enforce_csrf_checks=True)",
            "        token = client.get('/api/tasks/').json()['csrfToken']",
            "        payload = json.dumps({'title': '检查 CSRF'})",
            "        self.assertEqual(client.post('/api/tasks/', payload, content_type='application/json').status_code, 403)",
            "        response = client.post('/api/tasks/', payload, content_type='application/json', HTTP_X_CSRFTOKEN=token)",
            "        self.assertEqual(response.status_code, 201)",
            "        response = client.post('/api/tasks/', payload, content_type='application/json', HTTP_X_CSRFTOKEN=token, HTTP_ORIGIN='http://untrusted.invalid')",
            "        self.assertEqual(response.status_code, 403)"
          ]
        },
        {
          "path": "README.txt",
          "lines": [
            "Django：任务 JSON 接口",
            "",
            "从模型到接口，验证输入、状态码、持久化与 CSRF。",
            "",
            "Python 3.12、Django 5.2 最新补丁，首次安装需联网；SQLite、本机单用户教学接口，未实现账号和多用户权限，不可原样作为公网服务。",
            "",
            "步骤：",
            "在独立目录解压材料，创建并激活自己的虚拟环境，安装 requirements.txt。",
            "生成任务模型的迁移并应用；执行测试，确认包括缺令牌拒绝写入的场景。",
            "启动本机后端，再打开 Vue 项目进行浏览器联调；此示例最多列出最近 100 条任务。",
            "",
            "命令（按步骤说明在对应目录逐行执行）：",
            "python3 -m venv .venv",
            "source .venv/bin/activate",
            "python -m pip install -r requirements.txt",
            "python manage.py makemigrations tasks",
            "python manage.py migrate",
            "python manage.py test",
            "python manage.py runserver 127.0.0.1:8000",
            "",
            "完成后检查：",
            "空标题和错误类型返回 400，且不产生记录。",
            "创建返回 201，重复设置完成返回成功且不增加记录。",
            "测试强制检查 CSRF，缺失令牌返回 403，带有效令牌可以写入。",
            "演示密钥、DEBUG 与本地来源只用于本机学习。"
          ]
        }
      ]
    },
    {
      "id": "vue-client",
      "track": "vue",
      "title": "Vue：连接 Django 的任务页",
      "summary": "把响应式、表单和请求状态接到真实本地接口。",
      "environment": "Vue 3 JavaScript 脚手架，Node.js 满足当前官方要求；首次创建与安装需联网，完成后可连接本机 Django。命令示例用于 macOS 或 Linux Shell。",
      "lessonIds": [
        "vue-state",
        "vue-template",
        "vue-forms",
        "vue-fetch",
        "dj-csrf"
      ],
      "steps": [
        "在独立空目录运行 npm create vue@latest，项目名使用 task-client，选择 JavaScript；路由、状态库和其他可选功能先不添加。",
        "进入 task-client 并安装依赖，把材料中的同路径文件放入该项目，替换对应演示文件。",
        "先启动 Django 项目，再运行 Vue 开发服务器；本示例固定 5173 端口，开发代理转发到 8000 端口。",
        "添加、完成和重新加载任务；停止后端后提交一条内容，再恢复后端，检查错误反馈和输入保留。"
      ],
      "commands": [
        "npm create vue@latest",
        "cd task-client",
        "npm install",
        "npm run dev -- --host 127.0.0.1",
        "npm run build"
      ],
      "checks": [
        "浏览器只向本机 Vue 入口发送 /api 请求，由代理连接 Django。",
        "GET 建立 CSRF Cookie 并返回令牌，POST 与 PATCH 带 X-CSRFToken。",
        "后端失联时显示错误，提交中的按钮禁用，失败保留尚未成功提交的标题。",
        "刷新后能看到已保存数据；生产构建通过。"
      ],
      "sources": [
        "vue-start",
        "vue-state",
        "dj-csrf"
      ],
      "files": [
        {
          "path": "src/App.vue",
          "lines": [
            "<script setup>",
            "import { ref, computed, onMounted } from 'vue'",
            "const tasks = ref([]), title = ref(''), error = ref(''), busy = ref(false), csrf = ref('')",
            "const completedLabel = '已完成', pendingLabel = '待完成'",
            "const remaining = computed(() => tasks.value.filter(task => !task.completed).length)",
            "",
            "async function request(path, options = {}) {",
            "  const response = await fetch(path, { credentials: 'same-origin', ...options })",
            "  const value = await response.json().catch(() => ({}))",
            "  if (!response.ok) throw new Error(value.error || `请求失败：${response.status}`)",
            "  return value",
            "}",
            "async function refresh() {",
            "  const value = await request('/api/tasks/')",
            "  if (!Array.isArray(value.tasks)) throw new Error('任务列表格式不正确')",
            "  tasks.value = value.tasks",
            "  csrf.value = value.csrfToken",
            "}",
            "async function act(work) {",
            "  if (busy.value) return",
            "  busy.value = true; error.value = ''",
            "  try { await work() }",
            "  catch (reason) { error.value = reason.message || '请求失败，请重试' }",
            "  finally { busy.value = false }",
            "}",
            "function load() { return act(refresh) }",
            "function add() {",
            "  if (!title.value.trim() || !csrf.value) return",
            "  return act(async () => {",
            "    await request('/api/tasks/', {",
            "      method: 'POST',",
            "      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf.value },",
            "      body: JSON.stringify({ title: title.value.trim() }),",
            "    })",
            "    title.value = ''",
            "    await refresh()",
            "  })",
            "}",
            "function updateTask(task, event) {",
            "  const completed = event.target.checked",
            "  event.target.checked = task.completed",
            "  return act(async () => {",
            "    await request(`/api/tasks/${task.id}/`, {",
            "      method: 'PATCH',",
            "      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf.value },",
            "      body: JSON.stringify({ completed }),",
            "    })",
            "    await refresh()",
            "  })",
            "}",
            "onMounted(load)",
            "</script>",
            "",
            "<template>",
            "  <main>",
            "    <h1>我的任务清单</h1>",
            "    <p>未完成 {{ remaining }} 项 · 本机单用户学习示例，列表最多显示最近 100 条。</p>",
            "    <form @submit.prevent='add'>",
            "      <label for='task-title'>任务标题</label>",
            "      <div class='input-row'>",
            "        <input id='task-title' v-model='title' maxlength='120' :disabled='busy' placeholder='下一件要做的事'>",
            "        <button :disabled='busy || !title.trim() || !csrf'>添加</button>",
            "      </div>",
            "    </form>",
            "    <p v-if='busy' role='status'>正在处理…</p>",
            "    <p v-if='error' role='alert'>{{ error }}</p>",
            "    <button type='button' @click='load' :disabled='busy'>重新加载</button>",
            "    <p v-if='!busy && !error && !tasks.length'>还没有任务，从上面添加一条。</p>",
            "    <ul>",
            "      <li v-for='task in tasks' :key='task.id'>",
            "        <label><input type='checkbox' :checked='task.completed' :disabled='busy || !csrf' @change='updateTask(task, $event)'>{{ task.title }}</label>",
            "        <span>{{ task.completed ? completedLabel : pendingLabel }}</span>",
            "      </li>",
            "    </ul>",
            "  </main>",
            "</template>",
            "",
            "<style scoped>",
            "main { max-width: 60rem; margin: 2rem auto; padding: 1.5rem; }",
            "form { margin-block: 2rem; }",
            ".input-row { display: flex; gap: 1rem; margin-top: .75rem; }",
            ".input-row input { flex: 1; min-width: 0; }",
            "input, button { font: inherit; padding: .7rem; }",
            "button { cursor: pointer; }",
            "li { display: flex; justify-content: space-between; gap: 1rem; padding-block: 1rem; border-bottom: 1px solid #bac8cc; }",
            "li label { display: flex; align-items: baseline; gap: .75rem; overflow-wrap: anywhere; }",
            "li span { flex-shrink: 0; }",
            "[role=alert] { color: #a02828; }",
            "@media (max-width: 500px) { .input-row { flex-direction: column; } li { flex-wrap: wrap; } }",
            "</style>"
          ]
        },
        {
          "path": "src/main.js",
          "lines": [
            "import { createApp } from 'vue'",
            "import App from './App.vue'",
            "import './assets/main.css'",
            "createApp(App).mount('#app')"
          ]
        },
        {
          "path": "src/assets/main.css",
          "lines": [
            "* { box-sizing: border-box; }",
            "body { margin: 0; background: #f5f7f8; color: #20303b; font: 17px/1.8 system-ui, sans-serif; }",
            "input, button { color: inherit; }",
            "button:disabled { opacity: .6; cursor: wait; }"
          ]
        },
        {
          "path": "vite.config.js",
          "lines": [
            "import { defineConfig } from 'vite'",
            "import vue from '@vitejs/plugin-vue'",
            "export default defineConfig({",
            "  plugins: [vue()],",
            "  server: {",
            "    host: '127.0.0.1', port: 5173, strictPort: true,",
            "    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },",
            "  },",
            "})"
          ]
        },
        {
          "path": "README.txt",
          "lines": [
            "Vue：连接 Django 的任务页",
            "",
            "把响应式、表单和请求状态接到真实本地接口。",
            "",
            "Vue 3 JavaScript 脚手架，Node.js 满足当前官方要求；首次创建与安装需联网，完成后可连接本机 Django。命令示例用于 macOS 或 Linux Shell。",
            "",
            "步骤：",
            "在独立空目录运行 npm create vue@latest，项目名使用 task-client，选择 JavaScript；路由、状态库和其他可选功能先不添加。",
            "进入 task-client 并安装依赖，把材料中的同路径文件放入该项目，替换对应演示文件。",
            "先启动 Django 项目，再运行 Vue 开发服务器；本示例固定 5173 端口，开发代理转发到 8000 端口。",
            "添加、完成和重新加载任务；停止后端后提交一条内容，再恢复后端，检查错误反馈和输入保留。",
            "",
            "命令（按步骤说明在对应目录逐行执行）：",
            "npm create vue@latest",
            "cd task-client",
            "npm install",
            "npm run dev -- --host 127.0.0.1",
            "npm run build",
            "",
            "完成后检查：",
            "浏览器只向本机 Vue 入口发送 /api 请求，由代理连接 Django。",
            "GET 建立 CSRF Cookie 并返回令牌，POST 与 PATCH 带 X-CSRFToken。",
            "后端失联时显示错误，提交中的按钮禁用，失败保留尚未成功提交的标题。",
            "刷新后能看到已保存数据；生产构建通过。"
          ]
        }
      ]
    }
  ]
};
if (typeof module !== 'undefined' && module.exports) module.exports = CODING_COURSE;
