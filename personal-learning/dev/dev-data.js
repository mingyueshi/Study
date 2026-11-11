'use strict';
/* 常用开发命令数据：按工具组织，每个工具按使用场景分组，每条命令有自己的 id。
 *
 * 添加命令怎么填：
 * - id：全模块唯一的小写短横线名，掌握记录按它保存，改了会丢进度；
 * - cmd：展示的命令本体，也可以是一个按键（如 dd），等宽字体展示；
 * - desc：一句话说明这条命令做什么，用中文标点；
 * - example：可选，真实的使用示例；
 * - note：可选，补充说明、系统差异或危险提示，危险提示用 ⚠️ 开头。
 * 工具级 platform 说明适用环境，references 保存官方参考资料的 name 和 HTTPS url。
 * 数据字符串里用中文标点，不要英文双引号和裸换行，测试会拦截。
 */
const DEV_TOOLS = {
  version: 1,
  updatedAt: "2026-11-11",
  tools: [
    {
      id: "mac",
      name: "macOS",
      emoji: "🍎",
      tagline: "访达、剪贴板、端口和系统设置，一行命令搞定。",
      platform: "macOS，Homebrew 命令需先安装 brew",
      references: [{ name: "Homebrew 手册", url: "https://docs.brew.sh/Manpage"}],
      groups: [
        { id: "mac-brew", name: "Homebrew 包管理", commands: [
          { id: "mac-brew-install", cmd: "brew install 包名", desc: "用 Homebrew 安装命令行软件。", example: "brew install wget" },
          { id: "mac-brew-search", cmd: "brew search 关键词", desc: "搜索 Homebrew 里能安装的软件。", example: "brew search python" },
          { id: "mac-brew-uninstall", cmd: "brew uninstall 包名", desc: "卸载用 brew 装的软件。", example: "brew uninstall wget" },
          { id: "mac-brew-list", cmd: "brew list", desc: "查看已经装了哪些软件。" },
          { id: "mac-brew-upgrade", cmd: "brew update && brew upgrade", desc: "更新 brew 自身和所有已装的软件。" },
          { id: "mac-brew-services", cmd: "brew services list", desc: "查看 brew 管理的后台服务。", example: "brew services start redis", note: "stop 停止，restart 重启。" },
          { id: "mac-brew-doctor", cmd: "brew doctor", desc: "检查 Homebrew 环境中常见的配置问题。" },
          { id: "mac-brew-outdated", cmd: "brew outdated", desc: "先列出可升级的软件，再决定升级哪些。" }
        ]},
        { id: "mac-app", name: "打开与剪贴板", commands: [
          { id: "mac-open", cmd: "open 文件或目录", desc: "用默认应用打开，相当于双击。", example: "open ." },
          { id: "mac-open-app", cmd: "open -a 应用名 文件", desc: "用指定应用打开文件。", example: "open -a TextEdit README.md" },
          { id: "mac-pbcopy", cmd: "命令 | pbcopy", desc: "把命令输出直接复制到剪贴板。", example: "pwd | pbcopy" },
          { id: "mac-pbpaste", cmd: "pbpaste > 文件", desc: "把剪贴板内容存进文件。", example: "pbpaste > notes.txt" },
          { id: "mac-caffeinate", cmd: "caffeinate -t 3600", desc: "一小时内不让 Mac 休眠，演示或挂机时好用。", note: "按 Ctrl+C 提前结束。" },
          { id: "mac-screencapture", cmd: "screencapture 文件.png", desc: "在终端里截一张全屏图。", example: "screencapture ~/Desktop/shot.png", note: "平时用 Shift+Command+4 更快。" }
        ]},
        { id: "mac-system", name: "进程与系统", commands: [
          { id: "mac-lsof", cmd: "lsof -i :8080", desc: "查看哪个进程占用了 8080 端口。" },
          { id: "mac-killall", cmd: "killall 进程名", desc: "按名字结束进程。", example: "killall node" },
          { id: "mac-dock-hide", cmd: "defaults write com.apple.dock autohide -bool true", desc: "开启 Dock 自动隐藏。", note: "再执行 killall Dock 让设置生效。" },
          { id: "mac-diskutil", cmd: "diskutil list", desc: "查看磁盘和分区列表。" },
          { id: "mac-swvers", cmd: "sw_vers", desc: "查看 macOS 系统版本号。" },
          { id: "mac-xattr", cmd: "xattr -dr com.apple.quarantine 目录", desc: "解除打开下载应用时的隔离标记。", note: "⚠️ 只对自己信任的软件使用。" }
        ]},
        { id: "mac-ops", name: "系统维护", commands: [
          { id: "mac-softwareupdate", cmd: "sudo softwareupdate -i -a", desc: "在命令行里安装全部系统更新。" },
          { id: "mac-flush-dns", cmd: "sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder", desc: "清除系统 DNS 缓存。", note: "改了 hosts 或换 DNS 后用它。" },
          { id: "mac-mdfind", cmd: "mdfind 关键词", desc: "用 Spotlight 全盘秒搜文件。", example: "mdfind -name '会议记录'" },
          { id: "mac-sips", cmd: "sips -Z 1024 图片.jpg", desc: "把图片最长边缩到 1024 像素。", note: "⚠️ 默认直接修改原图；用 --out 新文件.jpg 另存，批量处理前先留原图。" },
          { id: "mac-brew-cleanup", cmd: "brew cleanup", desc: "清掉旧版本软件包和缓存。", note: "加 -n 先看看会删什么。" }
        ]}
      ]
    },
    {
      id: "shell",
      name: "Shell 基础",
      emoji: "🐧",
      tagline: "文件、文本、进程、网络，每天都要敲的基础命令。",
      platform: "macOS / Linux；部分工具需另装，选项可能不同",
      references: [{ name: "Bash 手册", url: "https://www.gnu.org/software/bash/manual/"}, { name: "GNU Coreutils 手册", url: "https://www.gnu.org/software/coreutils/manual/"}],
      groups: [
        { id: "sh-file", name: "文件与目录", commands: [
          { id: "sh-pwd", cmd: "pwd", desc: "显示当前所在的目录。" },
          { id: "sh-ls", cmd: "ls -la", desc: "列出目录内容，含隐藏文件和权限。" },
          { id: "sh-cd", cmd: "cd 目录", desc: "切换目录。", example: "cd ~/Documents", note: "cd - 回到上一个目录，cd 回到家目录。" },
          { id: "sh-mkdir", cmd: "mkdir -p a/b/c", desc: "一次创建整条嵌套目录。" },
          { id: "sh-touch", cmd: "touch file.txt", desc: "创建空文件，或刷新文件时间。" },
          { id: "sh-cp", cmd: "cp 源 目标", desc: "复制文件或目录。", example: "cp -r src/ backup/", note: "复制目录要加 -r。" },
          { id: "sh-mv", cmd: "mv 源 目标", desc: "移动文件，也能用来重命名。", example: "mv old.txt new.txt" },
          { id: "sh-rm", cmd: "rm -i -- '文件名'", desc: "逐项确认后，删除指定文件。", example: "rm -i -- './旧 文件.txt'", note: "⚠️ 文件名带空格时，要引用完整路径；-- 表示后面都是路径。删除通常不进废纸篓，先核对文件，避免直接用 -rf。" },
          { id: "sh-cat", cmd: "cat file.txt", desc: "把整个文件内容输出到屏幕。" },
          { id: "sh-less", cmd: "less file.log", desc: "分页查看大文件。", note: "空格翻页，/ 搜索，q 退出。" },
          { id: "sh-head", cmd: "head -n 20 文件", desc: "看文件开头几行，默认十行。" },
          { id: "sh-tail", cmd: "tail -f app.log", desc: "实时盯着文件新增的内容，看日志常用。", note: "Ctrl+C 退出。" },
          { id: "sh-ln", cmd: "ln -s 目标 链接名", desc: "创建软链接，像快捷方式。", example: "ln -s ~/code/project ~/latest" },
          { id: "sh-find", cmd: "find 目录 -name '*.log'", desc: "按名字查找文件。", example: "find . -type f -size +10M" }
        ]},
        { id: "sh-text", name: "查找与文本", commands: [
          { id: "sh-grep", cmd: "grep -rn 关键词 目录", desc: "在文件里搜文字，-n 显示行号，-r 递归进子目录。" },
          { id: "sh-sort", cmd: "sort file.txt", desc: "给文件里的行排序。", example: "sort -n nums.txt" },
          { id: "sh-uniq", cmd: "sort names.txt | uniq", desc: "去掉相邻的重复行。", note: "常和 sort 连用；uniq -c 顺便数次数。" },
          { id: "sh-wc", cmd: "wc -l file.txt", desc: "统计行数。" },
          { id: "sh-cut", cmd: "cut -d, -f1 data.csv", desc: "按分隔符取出第几列。", note: "适合简单分隔文本，不能正确解析引号内也含逗号的完整 CSV。" },
          { id: "sh-sed", cmd: "sed 's/old/new/g' file.txt", desc: "批量替换文本并输出结果。" },
          { id: "sh-awk", cmd: "awk '{print $1}' file.txt", desc: "按列提取字段。" },
          { id: "sh-diff", cmd: "diff a.txt b.txt", desc: "比较两个文件的差异。" },
          { id: "sh-pipe", cmd: "命令一 | 命令二", desc: "管道：把前一个命令的输出交给后一个。", example: "history | grep git" },
          { id: "sh-redirect", cmd: "命令 > 文件", desc: "把输出写进文件。", example: "ls > list.txt", note: "用 >> 追加，不覆盖原内容。" },
          { id: "sh-rg", cmd: "rg -n 关键词 目录", desc: "快速搜索项目文本，并显示行号。", note: "需先安装 ripgrep；默认跳过隐藏文件和被忽略的文件。" },
          { id: "sh-rg-files", cmd: "rg --files", desc: "列出项目中可搜索的文件。", note: "默认遵守忽略规则，可接管道筛选文件名。" }
        ]},
        { id: "sh-adv", name: "管道与进阶", commands: [
          { id: "sh-xargs", cmd: "命令 | xargs 子命令", desc: "把前一个命令的输出变成参数。", example: "find . -type f -name '*.tmp' -print0 | xargs -0 ls -ld", note: "示例只列出普通文件，不执行删除。文件名有空格或换行时，-print0 与 -0 必须配对；不要把 find 的按行输出直接交给 rm。" },
          { id: "sh-tee", cmd: "命令 | tee 文件", desc: "屏幕看得到，同时写进文件。", note: "加 -a 追加不覆盖。" },
          { id: "sh-tr", cmd: "cat 文件 | tr a-z A-Z", desc: "逐字符替换，大小写转换常用。" },
          { id: "sh-jq", cmd: "jq '.' data.json", desc: "格式化并高亮 JSON。", note: "取字段：jq '.name'；配合管道处理接口输出。" },
          { id: "sh-file", cmd: "file 文件", desc: "识别文件的真实类型，不看扩展名。" },
          { id: "sh-env", cmd: "env", desc: "查看当前全部环境变量。", note: "配合管道找变量：env | grep PATH。" },
          { id: "sh-stderr", cmd: "命令 > run.log 2>&1", desc: "把正常输出和错误输出一起存进日志。", note: "顺序有意义：先重定向标准输出，再让错误输出跟随。" }
        ]},
        { id: "sh-proc", name: "进程与权限", commands: [
          { id: "sh-chmod", cmd: "chmod +x run.sh", desc: "给脚本加上可执行权限。", note: "数字写法：644 给普通文件，755 给脚本。" },
          { id: "sh-chown", cmd: "sudo chown 用户 文件", desc: "改变文件的所有者。" },
          { id: "sh-sudo", cmd: "sudo 命令", desc: "以管理员身份执行命令。", note: "⚠️ 越权越方便也越危险，看清再回车。" },
          { id: "sh-ps", cmd: "ps aux | grep 关键词", desc: "查找正在运行的进程。" },
          { id: "sh-top", cmd: "top", desc: "实时查看进程和内存、CPU 占用。", note: "按 q 退出；macOS 可以 brew install htop。" },
          { id: "sh-kill", cmd: "kill 进程号", desc: "结束指定进程。", note: "不听话再加 -9：kill -9 进程号。" },
          { id: "sh-jobs", cmd: "jobs", desc: "查看当前终端的后台任务。", note: "fg %1 把 1 号任务调回前台。" },
          { id: "sh-nohup", cmd: "nohup 命令 &", desc: "关掉终端也让命令继续跑。", example: "nohup python server.py &" }
        ]},
        { id: "sh-net", name: "网络与传输", commands: [
          { id: "sh-ping", cmd: "ping example.com", desc: "测试网络通不通。" },
          { id: "sh-curl", cmd: "curl 网址", desc: "请求网页或接口。", example: "curl -I https://example.com", note: "-o 文件名 可下载保存。" },
          { id: "sh-wget", cmd: "wget 网址", desc: "下载文件。" },
          { id: "sh-ssh", cmd: "ssh 用户@主机", desc: "登录远程服务器。", example: "ssh ming@192.168.1.10" },
          { id: "sh-scp", cmd: "scp 本地文件 用户@主机:路径", desc: "向远程机器复制文件。", example: "scp app.tar.gz ming@server:/tmp" },
          { id: "sh-netstat", cmd: "netstat -an | grep LISTEN", desc: "查看本机监听了哪些端口。", note: "找占用进程在 macOS 用 lsof -i :端口。" }
        ]},
        { id: "sh-disk", name: "归档与磁盘", commands: [
          { id: "sh-tar-c", cmd: "tar -czf 包.tar.gz 目录", desc: "打包并压缩一个目录。" },
          { id: "sh-tar-x", cmd: "tar -xzf 包.tar.gz", desc: "解开 .tar.gz 包。" },
          { id: "sh-zip", cmd: "zip -r 包.zip 目录", desc: "压缩成 zip 格式。" },
          { id: "sh-unzip", cmd: "unzip 包.zip", desc: "解压 zip 文件。" },
          { id: "sh-df", cmd: "df -h", desc: "看磁盘还剩多少空间。" },
          { id: "sh-du", cmd: "du -sh 目录", desc: "看某个目录占了多大地方。", note: "配合排序：du -sh * | sort -h。" }
        ]},
        { id: "sh-env", name: "环境与效率", commands: [
          { id: "sh-export", cmd: "export KEY=值", desc: "设置环境变量。", note: "对当前 Shell 及之后启动的子进程有效；Zsh 常写进 ~/.zshrc。" },
          { id: "sh-echo-path", cmd: "echo $PATH", desc: "查看命令的搜索路径。", note: "pyenv、nvm 就是靠它排到最前面的。" },
          { id: "sh-which", cmd: "which python3", desc: "查看一个命令实际用的是哪个。" },
          { id: "sh-alias", cmd: "alias gs='git status'", desc: "给长命令起个短别名。", note: "写进 ~/.zshrc，每个新终端都能用。" },
          { id: "sh-source", cmd: "source ~/.zshrc", desc: "让改过的配置立刻生效。" },
          { id: "sh-history", cmd: "history", desc: "列出用过的命令。", example: "history | grep ssh" },
          { id: "sh-man", cmd: "man 命令", desc: "查看命令的说明书。", note: "按 q 退出。" },
          { id: "sh-clear", cmd: "clear", desc: "清空屏幕。", note: "快捷键 Ctrl+L 一样好用。" },
          { id: "sh-command-v", cmd: "command -v python3", desc: "查看 Shell 会找到哪个 Python 命令。" },
          { id: "sh-type", cmd: "type -a python3", desc: "查看同名命令的多个来源，排查版本用错。", note: "适用于 Bash / Zsh，可识别别名、函数和可执行文件。" }
        ]}
      ]
    },
    {
      id: "git",
      name: "Git 版本控制",
      emoji: "🌿",
      tagline: "从提交到分支协作，改错了也有后悔药。",
      platform: "macOS / Linux，需安装 Git",
      references: [{ name: "Git 命令手册", url: "https://git-scm.com/docs"}],
      groups: [
        { id: "git-view", name: "查看与历史", commands: [
          { id: "git-init", cmd: "git init", desc: "把当前目录变成 git 仓库。" },
          { id: "git-clone", cmd: "git clone 网址", desc: "把远程仓库完整下载到本地。" },
          { id: "git-status", cmd: "git status", desc: "查看改动和暂存状态。", note: "最常用的命令，动手前先看一眼。" },
          { id: "git-log", cmd: "git log --oneline --graph", desc: "图形化浏览提交历史，一行一条。" },
          { id: "git-diff", cmd: "git diff", desc: "查看还没暂存的改动。", note: "加 --staged 看已暂存的部分。" },
          { id: "git-show", cmd: "git show 提交号", desc: "查看某一次提交的完整改动。" },
          { id: "git-blame", cmd: "git blame 文件", desc: "查看每一行是谁、哪次提交改的。" }
        ]},
        { id: "git-stage", name: "暂存与提交", commands: [
          { id: "git-add", cmd: "git add 文件名", desc: "把改动放进暂存区。", note: "git add . 收下当前目录全部改动。" },
          { id: "git-add-p", cmd: "git add -p", desc: "一块一块确认要提交的改动。", note: "y 收下，n 跳过。" },
          { id: "git-commit", cmd: "git commit -m 说明", desc: "提交暂存区的改动。", note: "说明写清做了什么、为什么。" },
          { id: "git-amend", cmd: "git commit --amend", desc: "补充或修改上一次提交。", note: "⚠️ 已经推送到远端的提交慎用。" },
          { id: "git-restore", cmd: "git restore 文件名", desc: "用暂存区版本还原文件，丢弃该文件未暂存的改动。", note: "⚠️ 未暂存的内容会被覆盖；只想取消暂存用 --staged。" },
          { id: "git-reset", cmd: "git reset --soft HEAD~1", desc: "撤销上一次提交，改动退回暂存区。", note: "⚠️ 换成 --hard 会连改动一起丢，先想清楚。" },
          { id: "git-revert", cmd: "git revert 提交号", desc: "生成一条新提交来抵消旧提交。", note: "安全，适合已经推送的历史。" },
          { id: "git-stash", cmd: "git stash", desc: "把当前改动临时收起来，切换任务用。", example: "git stash pop", note: "pop 取回最近一次；列表看 git stash list。" },
          { id: "git-restore-staged", cmd: "git restore --staged 文件名", desc: "取消暂存，保留工作区里的改动。" },
          { id: "git-diff-check", cmd: "git diff --check", desc: "检查未暂存改动中的空白错误。", note: "暂存区改动用 git diff --cached --check。" },
          { id: "git-reflog", cmd: "git reflog", desc: "查找本机分支和 HEAD 曾经指向过的提交。", note: "可据提交号新建分支找回提交；不能找回从未保存过的文件内容。" }
        ]},
        { id: "git-branch", name: "分支与合并", commands: [
          { id: "git-branch", cmd: "git branch", desc: "列出本地分支。", note: "新建：git branch 分支名。" },
          { id: "git-switch", cmd: "git switch -c 新分支", desc: "创建并切换到新分支。", note: "老版本写法：git checkout -b 新分支。" },
          { id: "git-merge", cmd: "git merge 分支名", desc: "把指定分支的改动并进当前分支。" },
          { id: "git-rebase", cmd: "git rebase 主分支", desc: "把当前分支的提交挪到主分支最新处重放。", note: "⚠️ 共享分支先和团队约定，别随意改历史。" },
          { id: "git-cherry-pick", cmd: "git cherry-pick 提交号", desc: "把别的分支上的某次提交摘过来。" }
        ]},
        { id: "git-remote", name: "远程协作", commands: [
          { id: "git-remote", cmd: "git remote -v", desc: "查看远程仓库地址。", note: "添加：git remote add origin 网址。" },
          { id: "git-pull", cmd: "git pull", desc: "下载远程更新，再按配置整合到当前分支。", note: "整合可用 merge 或 rebase，取决于参数和配置；只许快进可用 --ff-only。" },
          { id: "git-push", cmd: "git push -u origin 分支名", desc: "首次推送并建立跟踪关系。", note: "之后直接 git push。" },
          { id: "git-force-push", cmd: "git push --force-with-lease", desc: "用本地历史覆盖远程分支。", note: "⚠️ 会重写远程历史；远端与本机预期不符时会拒绝。共享分支先协调，不能当作绝对保护。" },
          { id: "git-fetch", cmd: "git fetch", desc: "只下载远程的更新，先不合并。", note: "配合 git log origin/main 看看再决定。" },
          { id: "git-tag", cmd: "git tag v1.0", desc: "给当前提交打个版本标签。", example: "git push --tags" },
          { id: "git-pull-ff", cmd: "git pull --ff-only", desc: "只允许快进更新，分支分叉时先停下来。", note: "不会自动生成合并提交；分叉后需自己选择合并或变基。" }
        ]},
        { id: "git-conflict", name: "冲突处理与中止", commands: [
          { id: "git-merge-abort", cmd: "git merge --abort", desc: "中止正在进行的合并。", note: "开始合并前先提交或暂存现场，已有未提交改动可能难以完整恢复。" },
          { id: "git-rebase-continue", cmd: "git rebase --continue", desc: "解决冲突并 git add 后，继续变基。" },
          { id: "git-rebase-abort", cmd: "git rebase --abort", desc: "中止变基，回到变基前的分支状态。" }
        ]},
        { id: "git-worktree", name: "并行工作目录", commands: [
          { id: "git-worktree-add", cmd: "git worktree add -b 新分支 ../新目录 HEAD", desc: "从当前提交新建分支，并放进独立工作目录。", note: "适合一边修问题，一边保留当前目录的工作现场。" },
          { id: "git-worktree-list", cmd: "git worktree list", desc: "列出此仓库关联的工作目录和分支。" },
          { id: "git-worktree-remove", cmd: "git worktree remove ../目录", desc: "移除不再使用且干净的工作目录。", note: "保留分支；有未提交改动时会拒绝移除。" }
        ]}
      ]
    },
    {
      id: "docker",
      name: "Docker 与容器",
      emoji: "🐳",
      tagline: "起容器、看日志、清垃圾，部署调试都靠它。",
      platform: "macOS / Linux，需启动 Docker；编排使用 Compose v2",
      references: [{ name: "Docker 命令手册", url: "https://docs.docker.com/reference/cli/docker/"}, { name: "Compose 手册", url: "https://docs.docker.com/reference/cli/docker/compose/"}],
      groups: [
        { id: "docker-life", name: "容器操作", commands: [
          { id: "docker-ps", cmd: "docker ps", desc: "查看正在运行的容器。", note: "加 -a 连已停止的容器一起列出。" },
          { id: "docker-run", cmd: "docker run -d -p 8080:80 --name web nginx", desc: "后台新建并启动一个容器。", note: "-d 后台运行，-p 主机端口:容器端口，--name 给容器起名。" },
          { id: "docker-stop", cmd: "docker stop 容器名", desc: "优雅停止一个容器。", note: "再启动用 docker start，重启用 docker restart。" },
          { id: "docker-rm", cmd: "docker rm 容器名", desc: "删除已停止的容器。", note: "⚠️ 运行中的要先 stop，或用 docker rm -f 强删。" },
          { id: "docker-exec", cmd: "docker exec -it 容器名 bash", desc: "进入容器里开个 shell 排查问题。", note: "精简镜像可能没有 bash，换成 sh。" },
          { id: "docker-logs", cmd: "docker logs -f 容器名", desc: "跟踪容器日志。", note: "--tail 100 只看最后 100 行。" },
          { id: "docker-cp", cmd: "docker cp 本地文件 容器名:路径", desc: "在主机和容器之间复制文件。" },
          { id: "docker-stats", cmd: "docker stats --no-stream", desc: "看一次各容器的 CPU、内存和网络占用。" },
          { id: "docker-inspect", cmd: "docker inspect 容器名", desc: "查看容器的配置、挂载和网络详情。", note: "输出可能包含环境变量，分享前先检查。" },
          { id: "docker-port", cmd: "docker port 容器名", desc: "查看容器端口映射到了主机哪里。" }
        ]},
        { id: "docker-image", name: "镜像与构建", commands: [
          { id: "docker-images", cmd: "docker images", desc: "查看本地已有的镜像列表。" },
          { id: "docker-pull", cmd: "docker pull 镜像名", desc: "从镜像仓库下载镜像。", example: "docker pull python:3.12-slim" },
          { id: "docker-build", cmd: "docker build -t 镜像名:标签 .", desc: "按 Dockerfile 构建镜像。", note: "结尾的 . 表示构建上下文是当前目录。" },
          { id: "docker-rmi", cmd: "docker rmi 镜像名", desc: "删除本地镜像。", note: "⚠️ 还有容器引用时要先删容器。" },
          { id: "docker-prune", cmd: "docker system prune", desc: "清理停止的容器、悬空镜像等无用资源。", note: "⚠️ 加 -a 会清理所有未被容器引用的镜像，包括以前使用过的镜像。" },
          { id: "docker-system-df", cmd: "docker system df", desc: "先看镜像、容器和卷占用多少空间。" }
        ]},
        { id: "docker-compose", name: "compose 编排", commands: [
          { id: "compose-up", cmd: "docker compose up -d", desc: "按 compose.yaml 等编排文件启动整套服务。", note: "也兼容 docker-compose.yml，指定文件用 -f。" },
          { id: "compose-down", cmd: "docker compose down", desc: "停止并删除整套服务和网络。", note: "⚠️ 加 -v 连数据卷一起删。" },
          { id: "compose-logs", cmd: "docker compose logs -f 服务名", desc: "跟踪编排里某个服务的日志。" },
          { id: "compose-ps", cmd: "docker compose ps", desc: "查看编排里各服务的状态。" },
          { id: "compose-config", cmd: "docker compose config --quiet", desc: "检查编排配置能否正确解析。", note: "去掉 --quiet 可看合并后的配置，注意其中可能包含环境变量值。" },
          { id: "compose-pull", cmd: "docker compose pull", desc: "拉取编排里引用的镜像，不启动服务。", note: "不会替换正在运行的容器。" },
          { id: "compose-exec", cmd: "docker compose exec 服务名 sh", desc: "在正在运行的编排服务里打开终端。" },
          { id: "compose-up-build", cmd: "docker compose up -d --build 服务名", desc: "构建并更新指定服务及所需依赖。", note: "可能重建容器；只更新该服务、不动依赖时加 --no-deps。" }
        ]}
      ]
    },
    {
      id: "linux",
      name: "Linux 运维",
      emoji: "🖥️",
      tagline: "apt、systemd 和定时任务，管好一台服务器。",
      platform: "Linux；apt 适用 Debian / Ubuntu，服务命令需 systemd",
      references: [{ name: "systemd 手册", url: "https://www.freedesktop.org/software/systemd/man/latest/systemctl.html"}, { name: "journalctl 手册", url: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"}, { name: "Nginx 命令参数", url: "https://nginx.org/en/docs/switches.html"}],
      groups: [
        { id: "linux-apt", name: "apt 软件包", commands: [
          { id: "apt-update", cmd: "sudo apt update", desc: "刷新软件源索引。", note: "只是更新目录，不升级软件；Ubuntu、Debian 系列适用。" },
          { id: "apt-upgrade", cmd: "sudo apt upgrade", desc: "把已安装的软件升到最新。" },
          { id: "apt-install", cmd: "sudo apt install 包名", desc: "安装一个软件包。", example: "sudo apt install -y htop", note: "-y 跳过确认。" },
          { id: "apt-search", cmd: "apt search 关键词", desc: "搜索仓库里有哪些软件包。" },
          { id: "apt-remove", cmd: "sudo apt remove 包名", desc: "卸载软件包。", note: "换 purge 连配置文件一起删。" },
          { id: "apt-list", cmd: "apt list --installed | grep 关键词", desc: "查看已安装的软件包。" }
        ]},
        { id: "linux-service", name: "服务与日志", commands: [
          { id: "systemctl-status", cmd: "systemctl status 服务名", desc: "看服务是否在跑和最近日志。" },
          { id: "systemctl-restart", cmd: "sudo systemctl restart 服务名", desc: "重启一个服务。", note: "start 启动，stop 停止。" },
          { id: "systemctl-enable", cmd: "sudo systemctl enable 服务名", desc: "设置开机自启。", note: "enable --now 顺手立即启动。" },
          { id: "systemctl-list", cmd: "systemctl list-units --type=service", desc: "列出系统里的服务和状态。" },
          { id: "journalctl-service", cmd: "journalctl -u 服务名 -f", desc: "跟踪某个服务的日志。", note: "-e 看最新几条，--disk-usage 看日志占了多少盘。" },
          { id: "systemctl-daemon-reload", cmd: "sudo systemctl daemon-reload", desc: "修改服务单元文件后，让 systemd 重新读取。", note: "重新读取配置不会自动重启服务。" },
          { id: "systemctl-failed", cmd: "systemctl --failed", desc: "快速查看启动失败的单元。" },
          { id: "journalctl-recent", cmd: "journalctl -u 服务名 --since '1 hour ago' --no-pager", desc: "查看某个服务最近一小时的日志。", note: "若权限不足，用 sudo 或合适的日志读取权限。" },
          { id: "journalctl-boot", cmd: "journalctl -b -p err --no-pager", desc: "查看本次开机以来的错误及更严重的日志。" }
        ]},
        { id: "linux-sys", name: "系统与任务", commands: [
          { id: "linux-free", cmd: "free -h", desc: "查看内存和交换空间。", note: "macOS 上没有这个命令，用 vm_stat。" },
          { id: "linux-ss", cmd: "ss -tlnp", desc: "查看监听中的端口和对应进程。", note: "netstat 的现代替代品。" },
          { id: "linux-uname", cmd: "uname -a", desc: "看内核版本和系统架构。" },
          { id: "linux-uptime", cmd: "uptime", desc: "看开机时长，以及近一、五、十五分钟的平均负载。", note: "负载不是 CPU 使用率，要结合 CPU 核数判断。" },
          { id: "crontab-edit", cmd: "crontab -e", desc: "编辑当前用户的定时任务。", note: "格式：分 时 日 月 周 命令，例如 0 9 * * 1 每周一九点。" },
          { id: "crontab-list", cmd: "crontab -l", desc: "查看已有的定时任务。" },
          { id: "linux-watch", cmd: "watch -n 2 命令", desc: "每两秒刷新一次命令输出。", note: "Ctrl+C 退出。" },
          { id: "linux-ip", cmd: "ip addr show", desc: "查看网卡及其 IP 地址。", note: "macOS 改用 ifconfig。" },
          { id: "linux-route", cmd: "ip route show", desc: "查看默认网关和路由。" },
          { id: "linux-df-inode", cmd: "df -i", desc: "检查 inode 是否耗尽，排查还有空间却无法建文件。" }
        ]},
        { id: "linux-nginx", name: "Nginx 配置检查", commands: [
          { id: "nginx-test", cmd: "sudo nginx -t", desc: "检查 Nginx 配置语法及引用文件能否打开。", note: "需先安装 Nginx，改完配置先检查。" },
          { id: "nginx-reload", cmd: "sudo nginx -t && sudo nginx -s reload", desc: "检查通过后，再让 Nginx 平滑加载新配置。" },
          { id: "nginx-version", cmd: "nginx -V", desc: "查看 Nginx 版本、编译模块与默认配置路径。" }
        ]}
      ]
    },
    {
      id: "remote",
      name: "SSH 与远程",
      emoji: "🔐",
      tagline: "免密登录、增量同步、tmux 挂任务。",
      platform: "macOS / Linux，rsync、tmux 等需在对应机器安装",
      references: [{ name: "OpenSSH 手册", url: "https://man.openbsd.org/ssh"}, { name: "rsync 手册", url: "https://download.samba.org/pub/rsync/rsync.1"}],
      groups: [
        { id: "remote-ssh", name: "SSH 连接与密钥", commands: [
          { id: "ssh-keygen", cmd: "ssh-keygen -t ed25519", desc: "生成一对新的 SSH 密钥。", note: "公钥 .pub 可以交给别人，私钥绝不能外传。" },
          { id: "ssh-copy-id", cmd: "ssh-copy-id 用户@主机", desc: "把公钥装到服务器，之后免密登录。" },
          { id: "ssh-port", cmd: "ssh -p 端口 用户@主机", desc: "服务器改了默认端口时用 -p 指定。" },
          { id: "ssh-key-file", cmd: "ssh -i 密钥文件 用户@主机", desc: "用指定的私钥连接。" },
          { id: "ssh-tunnel", cmd: "ssh -L 127.0.0.1:9000:localhost:3306 用户@主机", desc: "把远程端口转发到本机。", note: "例子里把服务器的 MySQL 映射到本机 9000。" },
          { id: "ssh-config", cmd: "ssh 主机别名", desc: "连接 ~/.ssh/config 里配置好的主机。", note: "config 里写 Host 别名、HostName、User、Port，之后短名直连。" },
          { id: "ssh-debug", cmd: "ssh -v 用户@主机", desc: "查看连接过程，排查密钥或认证失败。", note: "更多细节用 -vvv，分享日志前检查主机、用户名等信息。" },
          { id: "ssh-jump", cmd: "ssh -J 跳板用户@跳板机 用户@目标机", desc: "经过跳板机连接目标服务器。" },
          { id: "ssh-forward-only", cmd: "ssh -N -L 127.0.0.1:9000:localhost:3306 用户@主机", desc: "只建立本机到远程数据库的隧道，不打开远程终端。", note: "只监听本机回环地址；Ctrl+C 关闭隧道。" }
        ]},
        { id: "remote-sync", name: "传输与同步", commands: [
          { id: "rsync", cmd: "rsync -avz 源目录 用户@主机:路径", desc: "增量同步目录到远程。", note: "默认按大小和修改时间判断是否需要传输；要保留未完成文件可加 -P。源目录带 / 表示复制里面的内容。" },
          { id: "rsync-pull", cmd: "rsync -avz 用户@主机:路径 本地目录", desc: "把远程目录拉回本地，方向反过来即可。" },
          { id: "rsync-delete", cmd: "rsync -avz --delete 源 目标", desc: "让目标和源完全一致。", note: "⚠️ 会删掉目标里多出来的文件，先加 -n 空跑演练。" },
          { id: "rsync-dry-run", cmd: "rsync -avzn --delete 源目录/ 用户@主机:目标目录/", desc: "空跑同步，先检查会传哪些文件、删哪些文件。", note: "-n 不真正修改；源目录末尾带 / 表示同步目录里的内容。" },
          { id: "rsync-partial", cmd: "rsync -avzP 源目录/ 用户@主机:目标目录/", desc: "保留未完成的文件，并显示传输进度。", note: "-P 等于 --partial --progress，重跑时可利用上次留下的部分文件。" }
        ]},
        { id: "remote-tmux", name: "tmux 终端复用", commands: [
          { id: "tmux-new", cmd: "tmux new -s 名字", desc: "新建一个可分离的终端会话。" },
          { id: "tmux-detach", cmd: "Ctrl+b d", desc: "分离当前会话，里面的命令继续跑。", note: "ssh 断线任务也不丢。" },
          { id: "tmux-attach", cmd: "tmux attach -t 名字", desc: "回到之前的会话。" },
          { id: "tmux-ls", cmd: "tmux ls", desc: "列出所有会话。", note: "结束用 tmux kill-session -t 名字。" },
          { id: "tmux-split", cmd: "Ctrl+b %", desc: "左右分屏。", note: "上下分屏按 Ctrl+b 加双引号键；Ctrl+b 加方向键切换窗格。" }
        ]}
      ]
    },
    {
      id: "pyenv",
      name: "pyenv 与 pip",
      emoji: "🐍",
      tagline: "一台电脑装多个 Python，互不打架。",
      platform: "macOS / Linux；先选 Python 版本，再在项目环境装包",
      references: [{ name: "pyenv 用法", url: "https://github.com/pyenv/pyenv#usage"}, { name: "Python 虚拟环境", url: "https://docs.python.org/3/library/venv.html"}, { name: "pip 命令手册", url: "https://pip.pypa.io/en/stable/cli/"}],
      groups: [
        { id: "pyenv-core", name: "版本管理", commands: [
          { id: "pyenv-install-list", cmd: "pyenv install --list", desc: "查看可以安装的 Python 版本。" },
          { id: "pyenv-install", cmd: "pyenv install 3.12.4", desc: "安装指定版本的 Python。" },
          { id: "pyenv-versions", cmd: "pyenv versions", desc: "查看已装版本和当前正在用的版本。" },
          { id: "pyenv-global", cmd: "pyenv global 3.12.4", desc: "设置全局默认的 Python 版本。" },
          { id: "pyenv-local", cmd: "pyenv local 3.11.9", desc: "只在当前目录用指定版本。", note: "会在目录里写一个 .python-version 文件。" },
          { id: "pyenv-shell", cmd: "pyenv shell 3.10.14", desc: "只在当前终端会话用指定版本。" },
          { id: "pyenv-uninstall", cmd: "pyenv uninstall 3.10.14", desc: "删除不用的版本。" },
          { id: "pyenv-virtualenv", cmd: "pyenv virtualenv 3.12.4 项目名", desc: "创建绑定指定版本的独立虚拟环境。", example: "pyenv activate 项目名", note: "退出用 pyenv deactivate；需要先装 pyenv-virtualenv 插件。" }
        ]},
        { id: "pyenv-pip", name: "pip 包管理", commands: [
          { id: "pip-install", cmd: "pip install 包名", desc: "安装第三方包。", example: "pip install requests" },
          { id: "pip-install-r", cmd: "pip install -r requirements.txt", desc: "按清单一次装好全部依赖。" },
          { id: "pip-freeze", cmd: "pip freeze > requirements.txt", desc: "把当前环境的依赖导出成清单。" },
          { id: "pip-list", cmd: "pip list", desc: "查看已安装的包。" },
          { id: "pip-show", cmd: "pip show requests", desc: "查看某个包的版本和信息。" },
          { id: "pip-upgrade", cmd: "pip install --upgrade pip", desc: "把 pip 自己升级到最新。" }
        ]},
        { id: "pyenv-venv", name: "项目环境与排查", commands: [
          { id: "python-venv", cmd: "python3 -m venv .venv", desc: "用当前 Python 创建项目虚拟环境。", note: "某些 Linux 发行版需先安装对应的 python3-venv 包。" },
          { id: "python-activate", cmd: "source .venv/bin/activate", desc: "在 Bash / Zsh 中启用项目环境。", note: "退出用 deactivate，也可直接运行 .venv/bin/python。" },
          { id: "python-pip-version", cmd: "python -m pip --version", desc: "确认当前 Python 使用的是哪个 pip。" },
          { id: "pip-check", cmd: "python -m pip check", desc: "检查已安装依赖之间是否存在缺失或版本冲突。" },
          { id: "pyenv-which", cmd: "pyenv which python", desc: "查看 pyenv 当前选中的 Python 可执行文件。" }
        ]}
      ]
    },
    {
      "id": "django",
      "name": "Django",
      "emoji": "🎸",
      "tagline": "从创建项目到迁移、测试和发布，常用操作随手查。",
      "platform": "先激活项目虚拟环境并安装 Django；manage.py 命令在项目根目录执行。按 Django 5.2 文档核对，实际版本以项目依赖为准。",
      "learning": {
        "label": "学习 Django：课程、代码与任务接口实操",
        "href": "../coding/index.html#track=django"
      },
      "references": [
        {
          "name": "Django 管理命令",
          "url": "https://docs.djangoproject.com/en/5.2/ref/django-admin/"
        },
        {
          "name": "模型迁移",
          "url": "https://docs.djangoproject.com/en/5.2/topics/migrations/"
        },
        {
          "name": "测试运行方式",
          "url": "https://docs.djangoproject.com/en/5.2/topics/testing/overview/"
        },
        {
          "name": "静态文件发布",
          "url": "https://docs.djangoproject.com/en/5.2/howto/static-files/deployment/"
        }
      ],
      "groups": [
        {
          "id": "django-project",
          "name": "初始化与帮助",
          "commands": [
            {
              "id": "django-install",
              "cmd": "python -m pip install 'Django>=5.2,<5.3'",
              "desc": "在新学习环境中安装 Django 5.2 系列的最新补丁。",
              "note": "需要联网；与配套课程版本一致。已有项目按依赖文件安装，避免直接改变其版本。"
            },
            {
              "id": "django-version",
              "cmd": "python -m django --version",
              "desc": "确认当前解释器使用的 Django 版本。",
              "note": "如果提示找不到模块，先检查虚拟环境和依赖安装位置。"
            },
            {
              "id": "django-startproject",
              "cmd": "python -m django startproject config .",
              "desc": "在当前空目录创建项目配置和 manage.py。",
              "note": "config 是项目包名示例；先新建独立目录，避免覆盖已有项目文件。"
            },
            {
              "id": "django-startapp",
              "cmd": "python manage.py startapp tasks",
              "desc": "为任务功能生成一个应用目录。",
              "note": "tasks 是应用名示例；创建后按项目需要注册到 INSTALLED_APPS，并连接 URL。"
            },
            {
              "id": "django-help",
              "cmd": "python manage.py help",
              "desc": "列出当前项目可用的管理命令。",
              "note": "已安装应用也可能提供自定义命令。"
            },
            {
              "id": "django-help-migrate",
              "cmd": "python manage.py help migrate",
              "desc": "查看迁移命令的参数与使用方式。",
              "note": "遇到版本差异时，先看当前环境中的帮助。"
            },
            {
              "id": "django-check",
              "cmd": "python manage.py check",
              "desc": "检查项目中常见的配置和模型问题。",
              "note": "检查通过不能代替接口、权限和业务测试。"
            }
          ]
        },
        {
          "id": "django-development",
          "name": "启动与交互",
          "commands": [
            {
              "id": "django-runserver",
              "cmd": "python manage.py runserver 127.0.0.1:8000",
              "desc": "在本机启动开发服务器。",
              "note": "按 Ctrl+C 停止；端口可按项目约定调整，runserver 不用于生产部署。"
            },
            {
              "id": "django-runserver-noreload",
              "cmd": "python manage.py runserver 127.0.0.1:8000 --noreload",
              "desc": "启动开发服务，并关闭代码改动后的自动重载。",
              "note": "排查启动或重载问题时使用；改代码后需要手动重启。"
            },
            {
              "id": "django-shell",
              "cmd": "python manage.py shell",
              "desc": "进入已经加载项目配置的 Python 交互环境。",
              "note": "可导入模型检查数据；在交互环境中的保存、更新和删除也会影响当前数据库。"
            },
            {
              "id": "django-shell-command",
              "cmd": "python manage.py shell -c 'print(1 + 1)'",
              "desc": "在项目环境中执行一段简短 Python 代码。",
              "note": "示例仅打印 2；实际代码如涉及模型写入，要先核对数据库环境。"
            },
            {
              "id": "django-dbshell",
              "cmd": "python manage.py dbshell --database default",
              "desc": "打开当前配置数据库的原生命令行客户端。",
              "note": "需安装对应的 sqlite3、psql 或 mysql 客户端；连接的是实际配置的数据库。"
            }
          ]
        },
        {
          "id": "django-migrations",
          "name": "模型与迁移",
          "commands": [
            {
              "id": "django-makemigrations",
              "cmd": "python manage.py makemigrations tasks",
              "desc": "把任务应用的模型变化生成迁移文件。",
              "note": "换成自己的应用名；生成后先审阅，迁移文件应随代码保存。"
            },
            {
              "id": "django-makemigrations-preview",
              "cmd": "python manage.py makemigrations tasks --dry-run --verbosity 3",
              "desc": "预览将生成的迁移及文件内容。",
              "note": "不会写入迁移文件；用它检查字段、约束和操作是否符合预期。"
            },
            {
              "id": "django-makemigrations-check",
              "cmd": "python manage.py makemigrations --check --dry-run",
              "desc": "检查模型变化是否缺少对应迁移文件。",
              "note": "发现缺失迁移时以非零状态退出，适合加入持续集成检查。"
            },
            {
              "id": "django-showmigrations",
              "cmd": "python manage.py showmigrations",
              "desc": "查看迁移文件和已经应用的状态。",
              "note": "[X] 表示已应用；可加应用名缩小范围。"
            },
            {
              "id": "django-sqlmigrate",
              "cmd": "python manage.py sqlmigrate tasks 0001",
              "desc": "查看指定迁移将使用的 SQL。",
              "note": "需要迁移文件和对应数据库连接；只输出 SQL，不执行该迁移。应用名与编号按实际替换。"
            },
            {
              "id": "django-migrate-plan",
              "cmd": "python manage.py migrate --plan",
              "desc": "先列出准备执行的迁移操作。",
              "note": "只查看计划，不应用迁移；结合当前数据库状态与部署顺序复核。"
            },
            {
              "id": "django-migrate",
              "cmd": "python manage.py migrate",
              "desc": "把尚未应用的迁移执行到当前数据库。",
              "note": "⚠️ 会改变数据库结构，也可能运行数据迁移。先核对环境、计划和备份恢复方式。"
            },
            {
              "id": "django-migrate-check",
              "cmd": "python manage.py migrate --check",
              "desc": "检查数据库是否仍有尚未应用的迁移。",
              "note": "存在未应用迁移时以非零状态退出；只检查，不应用迁移。"
            }
          ]
        },
        {
          "id": "django-testing",
          "name": "测试与回归",
          "commands": [
            {
              "id": "django-test",
              "cmd": "python manage.py test",
              "desc": "运行项目中的测试。",
              "note": "数据库测试通常创建独立测试库，仍要核对自定义测试配置是否指向隔离环境。"
            },
            {
              "id": "django-test-app",
              "cmd": "python manage.py test tasks",
              "desc": "只运行任务应用的测试。",
              "note": "tasks 换成自己的应用或测试包。"
            },
            {
              "id": "django-test-case",
              "cmd": "python manage.py test tasks.tests.TaskApiTests.test_create_and_complete",
              "desc": "只验证一个具体测试方法。",
              "note": "这是配套任务接口项目中的用例名称；其他项目按自己的测试路径修改。"
            },
            {
              "id": "django-test-keepdb",
              "cmd": "python manage.py test --keepdb",
              "desc": "保留测试数据库，减少下次测试的建库时间。",
              "note": "保留的是测试库；它不表示跳过测试之间的数据隔离，也不应使用生产库。"
            },
            {
              "id": "django-test-parallel",
              "cmd": "python manage.py test --parallel 2",
              "desc": "最多使用两个进程并行运行测试。",
              "note": "按测试、数据库和运行环境的支持情况使用；遇到并发或序列化问题先单进程复现。"
            }
          ]
        },
        {
          "id": "django-data",
          "name": "账号与数据",
          "commands": [
            {
              "id": "django-createsuperuser",
              "cmd": "python manage.py createsuperuser",
              "desc": "交互创建一个超级用户账号。",
              "note": "需要项目启用认证应用并完成相关迁移；按提示填写账号和密码。"
            },
            {
              "id": "django-changepassword",
              "cmd": "python manage.py changepassword 用户名",
              "desc": "通过交互提示修改指定用户的密码。",
              "note": "把用户名替换为实际账号，密码不要直接写在命令行里。"
            },
            {
              "id": "django-dumpdata",
              "cmd": "python manage.py dumpdata tasks --indent 2 --output tasks-export.json",
              "desc": "把指定应用的数据导出到 JSON 文件。",
              "note": "输出文件名按实际修改，避免覆盖已有文件；导出可能含敏感数据，也不是完整数据库备份。"
            },
            {
              "id": "django-loaddata",
              "cmd": "python manage.py loaddata fixtures/demo.json",
              "desc": "从固定数据文件加载记录。",
              "note": "⚠️ 会写入当前数据库，同主键记录可能被更新。先核对环境、文件来源、关联与已有数据。"
            },
            {
              "id": "django-inspectdb",
              "cmd": "python manage.py inspectdb --database default",
              "desc": "根据现有数据库表输出模型草稿。",
              "note": "只打印模型定义，不自动修改 models.py；字段、关系和约束需要人工复核。"
            }
          ]
        },
        {
          "id": "django-deployment",
          "name": "静态文件与发布",
          "commands": [
            {
              "id": "django-collectstatic-preview",
              "cmd": "python manage.py collectstatic --dry-run --noinput",
              "desc": "预览静态文件收集过程。",
              "note": "需要启用 staticfiles 并配置存储；预演不会复制或删除文件。"
            },
            {
              "id": "django-collectstatic",
              "cmd": "python manage.py collectstatic",
              "desc": "把静态资源收集到配置的目标存储。",
              "note": "先预演并核对 STATIC_ROOT 或存储后端；可能更新已收集文件，随后还需配置实际资源服务。"
            },
            {
              "id": "django-check-deploy",
              "cmd": "python manage.py check --deploy",
              "desc": "检查发布环境中的常见配置问题。",
              "note": "应使用实际发布配置；示例 config.settings.production 需换成项目真实模块。检查通过仍需验证业务路径。",
              "example": "python manage.py check --deploy --settings=config.settings.production"
            },
            {
              "id": "django-diffsettings",
              "cmd": "python manage.py diffsettings",
              "desc": "查看当前配置与 Django 默认配置的差异。",
              "note": "⚠️ 输出可能包含密钥、数据库连接等敏感配置；仅在受控终端查阅，分享前先脱敏。"
            },
            {
              "id": "django-findstatic",
              "cmd": "python manage.py findstatic admin/css/base.css --verbosity 2",
              "desc": "查找指定静态资源及搜索目录。",
              "note": "示例需要启用 admin 和 staticfiles；路径可换成自己项目的资源。"
            }
          ]
        }
      ]
    },
    {
      id: "nvm",
      name: "nvm 与 npm",
      emoji: "📦",
      tagline: "多个 Node 版本随用随切，npm 装包不迷路。",
      platform: "macOS / Linux，需先加载 nvm；版本号仅作示例",
      references: [{ name: "nvm 用法", url: "https://github.com/nvm-sh/nvm#usage"}, { name: "npm 命令手册", url: "https://docs.npmjs.com/cli/v11/commands/"}],
      groups: [
        { id: "nvm-core", name: "版本管理", commands: [
          { id: "nvm-install-lts", cmd: "nvm install --lts", desc: "安装最新的长期支持版 Node。" },
          { id: "nvm-install", cmd: "nvm install 20", desc: "安装指定大版本，自动选最新小版本。" },
          { id: "nvm-use", cmd: "nvm use 20", desc: "在当前终端切换 Node 版本。" },
          { id: "nvm-ls", cmd: "nvm ls", desc: "查看已装版本和当前版本。" },
          { id: "nvm-alias", cmd: "nvm alias default 20", desc: "设置新终端默认使用的版本。" },
          { id: "nvm-current", cmd: "nvm current", desc: "显示当前正在用的 Node 版本。" },
          { id: "nvm-uninstall", cmd: "nvm uninstall 16", desc: "删除不用的版本。" },
          { id: "nvm-use-project", cmd: "nvm use", desc: "按当前目录或父目录的 .nvmrc 切换版本。", note: "项目尚未安装该版本时，先运行 nvm install。" },
          { id: "nvm-install-project", cmd: "nvm install", desc: "按 .nvmrc 安装并切换到项目需要的 Node。", note: "项目应维护 .nvmrc，团队使用一致的版本。" }
        ]},
        { id: "nvm-npm", name: "npm 包管理", commands: [
          { id: "npm-init", cmd: "npm init -y", desc: "快速生成 package.json，跳过问答。" },
          { id: "npm-install", cmd: "npm install", desc: "按 package.json 装好全部依赖。" },
          { id: "npm-install-pkg", cmd: "npm install 包名", desc: "安装一个包并写进依赖。", example: "npm install lodash" },
          { id: "npm-install-g", cmd: "npm install -g 包名", desc: "全局安装命令行工具。", example: "npm install -g pnpm" },
          { id: "npm-run", cmd: "npm run dev", desc: "运行 package.json 里定义的脚本。" },
          { id: "npm-uninstall", cmd: "npm uninstall 包名", desc: "移除一个依赖。" },
          { id: "npx", cmd: "npx 包名", desc: "运行本地包的命令，缺少时可下载到 npm 缓存后运行。", example: "npx create-vite my-app", note: "可能需要联网并执行安装脚本，先确认包名和版本。" },
          { id: "npm-ci", cmd: "npm ci", desc: "严格按锁文件重新安装依赖，常用于 CI。", note: "需要锁文件与 package.json 一致；会先移除现有 node_modules，不修改锁文件。" },
          { id: "npm-scripts", cmd: "npm run", desc: "列出项目定义的可运行脚本。" },
          { id: "npm-outdated", cmd: "npm outdated", desc: "查看哪些依赖有可更新版本。" },
          { id: "npm-ls", cmd: "npm ls --depth=0", desc: "查看项目直接依赖及实际安装版本。" },
          { id: "npm-explain", cmd: "npm explain 包名", desc: "查看一个依赖为什么会被安装进来。" }
        ]}
      ]
    },
    {
      id: "vi",
      name: "vi 编辑器",
      emoji: "📝",
      tagline: "打开、修改、保存、退出都不慌的必备按键。",
      platform: "以下以 Vim 为准；精简 vi 可能不支持全部按键",
      references: [{ name: "Vim 官方帮助", url: "https://vimhelp.org/"}],
      groups: [
        { id: "vi-mode", name: "进入与保存", commands: [
          { id: "vi-open", cmd: "vim 文件名", desc: "打开文件，没有就新建。" },
          { id: "vi-insert", cmd: "i", desc: "进入插入模式开始打字。", note: "a 在光标后插入，o 在下一行新开一行。" },
          { id: "vi-esc", cmd: "Esc", desc: "回到普通模式。", note: "拿不准就按几下 Esc，不会错。" },
          { id: "vi-save", cmd: ":w", desc: "保存文件。", note: ":w 新文件名 另存为。" },
          { id: "vi-wq", cmd: ":wq", desc: "保存并退出。", note: ":q! 不保存强制退出。" },
          { id: "vi-zz", cmd: "ZZ", desc: "普通模式下按两下大写 Z，保存退出。" }
        ]},
        { id: "vi-move", name: "移动", commands: [
          { id: "vi-hjkl", cmd: "h j k l", desc: "左、下、上、右移动光标。" },
          { id: "vi-gg", cmd: "gg", desc: "跳到文件开头。", note: "大写 G 跳到文件末尾。" },
          { id: "vi-line-start", cmd: "0", desc: "跳到行首。", note: "$ 跳到行尾。" },
          { id: "vi-word", cmd: "w", desc: "跳到下一个单词开头。", note: "b 回到上一个单词。" },
          { id: "vi-page", cmd: "Ctrl+f", desc: "向下翻一页。", note: "Ctrl+b 向上翻一页。" }
        ]},
        { id: "vi-edit", name: "编辑", commands: [
          { id: "vi-x", cmd: "x", desc: "删掉光标处的字符。" },
          { id: "vi-dd", cmd: "dd", desc: "剪切整行。", note: "3dd 一次剪三行。" },
          { id: "vi-yy", cmd: "yy", desc: "复制整行。", note: "3yy 一次复制三行。" },
          { id: "vi-p", cmd: "p", desc: "粘贴到光标后面。", note: "大写 P 粘贴到光标前面。" },
          { id: "vi-u", cmd: "u", desc: "撤销上一步。", note: "Ctrl+r 重做。" },
          { id: "vi-dw", cmd: "dw", desc: "删掉一个单词。", note: "cw 删掉单词并直接进入插入模式改写。" },
          { id: "vi-r", cmd: "r", desc: "替换光标处的一个字符。" },
          { id: "vi-join", cmd: "J", desc: "把下一行接上来，合并成一行。" },
          { id: "vi-dot", cmd: ".", desc: "重复上一次的修改。", note: "配合移动键，改哪儿按哪儿。" }
        ]},
        { id: "vi-find", name: "查找与替换", commands: [
          { id: "vi-search", cmd: "/关键词", desc: "向下搜索。", note: "n 跳到下一个，N 回到上一个。" },
          { id: "vi-sub", cmd: ":%s/旧/新/g", desc: "全文把旧词换成新词。", note: "结尾加 c 逐处确认。" },
          { id: "vi-noh", cmd: ":noh", desc: "取消搜索后的高亮。" },
          { id: "vi-search-back", cmd: "?关键词", desc: "向上搜索，n 继续沿当前搜索方向查找。" },
          { id: "vi-sub-confirm", cmd: ":%s/旧/新/gc", desc: "全文替换，每一处先确认再修改。", note: "y 替换当前处，n 跳过，q 退出。" }
        ]},
        { id: "vi-set", name: "设置与可视", commands: [
          { id: "vi-number", cmd: ":set number", desc: "显示行号。" },
          { id: "vi-syntax", cmd: ":syntax on", desc: "打开语法高亮。" },
          { id: "vi-v", cmd: "v", desc: "进入可视模式自由选中。", note: "大写 V 按行选中；选中后 d 剪切、y 复制。" },
          { id: "vi-indent", cmd: ">>", desc: "当前行整体右移一个缩进。", note: "<< 左移；可视模式下用 > 或 < 批量缩进。" },
          { id: "vi-paste", cmd: ":set paste", desc: "开启粘贴模式，减少终端粘贴时缩进乱跳。", note: "粘贴后用 :set nopaste 关闭；现代终端可能已自动处理。" }
        ]}
      ]
    },
    {
      id: "nano",
      name: "nano 编辑器",
      emoji: "✏️",
      tagline: "直接打字就能改文件，照着底部提示保存退出。",
      platform: "macOS / Linux，GNU nano 默认键位；老版本功能可能不同，以底部帮助为准",
      references: [{ name: "GNU nano 手册", url: "https://www.nano-editor.org/dist/latest/nano.html" }, { name: "nano 快捷键表", url: "https://www.nano-editor.org/dist/latest/cheatsheet.html" }],
      groups: [
        { id: "nano-file", name: "打开、保存与退出", commands: [
          { id: "nano-open", cmd: "nano 文件名", desc: "打开文件后直接打字修改，不需要切换编辑模式。", example: "nano notes.txt", note: "用 nano --version 查看版本；没有文件时会在保存后创建。" },
          { id: "nano-open-line", cmd: "nano +行号 文件名", desc: "打开文件，并把光标放到指定行。", example: "nano +42 app.conf" },
          { id: "nano-save", cmd: "Ctrl+O", desc: "写出当前内容，确认文件名后按 Enter 保存。", note: "底部的 ^O 表示 Ctrl 加字母 O，不是数字零。" },
          { id: "nano-exit", cmd: "Ctrl+X", desc: "关闭当前文件，最后一个文件关闭后退出。", note: "有未保存改动时，按底部提示选择是否保存；保存时再确认文件名。" },
          { id: "nano-help", cmd: "Ctrl+G", desc: "打开帮助，查看当前版本的快捷键。", note: "^ 代表 Ctrl，M- 通常代表 Alt；Alt 组合键无效时，可先按 Esc，再按对应键。" }
        ]},
        { id: "nano-search", name: "查找、替换与移动", commands: [
          { id: "nano-search", cmd: "Ctrl+W", desc: "输入关键词，再按 Enter 查找。", note: "新版也支持 Ctrl+F；搜索时的选项会显示在底部。" },
          { id: "nano-replace", cmd: "Alt+R", desc: "依次输入查找词和替换词，再逐处确认替换。", note: "是否全部替换或取消，按底部提示选择；已经完成的替换不会因取消而自动撤销。" },
          { id: "nano-goto", cmd: "Alt+G", desc: "输入行号，跳到文件中的指定位置。", note: "也可以输入「行号，列号」对应的英文逗号格式，如 42,5。" },
          { id: "nano-position", cmd: "Ctrl+C", desc: "在编辑区查看光标所在的行、列和位置。", note: "在搜索或保存提示中，Ctrl+C 通常用于取消当前操作。" },
          { id: "nano-line-start", cmd: "Ctrl+A", desc: "把光标移到当前行开头。", note: "Ctrl+E 移到行尾；方向键也可以直接移动。" }
        ]},
        { id: "nano-edit", name: "选择、剪切与撤销", commands: [
          { id: "nano-mark", cmd: "Alt+A", desc: "开始或取消选择，随后用方向键扩展选区。", note: "Ctrl+6 也可以设置选择起点；选好后再剪切或复制。" },
          { id: "nano-cut", cmd: "Ctrl+K", desc: "剪切当前行；有选区时剪切选中的文字。", note: "文字暂存在 nano 内部缓冲区，稍后可以粘贴。" },
          { id: "nano-copy", cmd: "Alt+6", desc: "复制当前行或选区，保留原来的文字。" },
          { id: "nano-paste", cmd: "Ctrl+U", desc: "把 nano 内部缓冲区的文字粘贴到光标处。", note: "这与系统剪贴板不同；从其他应用粘贴时使用终端自己的粘贴快捷键。" },
          { id: "nano-undo", cmd: "Alt+U", desc: "撤销上一次编辑。", note: "老版本可能不支持，先用 Ctrl+G 查看帮助。" },
          { id: "nano-redo", cmd: "Alt+E", desc: "重做刚刚撤销的编辑。" },
          { id: "nano-line-numbers", cmd: "Alt+N", desc: "显示或隐藏行号，查配置位置更方便。", note: "需要当前版本支持行号功能。" }
        ]}
      ]
    },
    {
      id: "network",
      name: "网络与接口",
      emoji: "🌐",
      tagline: "从域名、端口到 HTTP 响应，一步步找到卡住的地方。",
      platform: "macOS / Linux；dig、nc、curl 的安装情况与选项可能不同",
      references: [{ name: "curl 手册", url: "https://curl.se/docs/manpage.html"}, { name: "dig 手册", url: "https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility"}, { name: "OpenBSD nc 手册", url: "https://man.openbsd.org/nc"}],
      groups: [
        { id: "network-http", name: "HTTP 请求与响应", commands: [
          { id: "curl-headers", cmd: "curl -i https://example.com", desc: "请求页面，同时显示响应头和正文。", note: "与 -I 不同，-i 仍发送常规 GET 请求。" },
          { id: "curl-follow", cmd: "curl -L https://example.com", desc: "跟随重定向，查看最终响应。" },
          { id: "curl-timeout", cmd: "curl --connect-timeout 5 --max-time 15 https://example.com", desc: "连接最多等五秒，整个请求最多等十五秒。" },
          { id: "curl-fail", cmd: "curl -fSso /dev/null https://example.com", desc: "检查请求是否成功，不把正文打印出来。", note: "-f 让 HTTP 400 及以上返回失败；-sS 保留错误提示，3xx 不算失败。" },
          { id: "curl-json", cmd: "curl -H 'Content-Type: application/json' --data @data.json 网址", desc: "把本地 JSON 文件作为 POST 请求正文发送。", note: "先准备 data.json，并把网址换成自己的测试接口。" }
        ]},
        { id: "network-dns", name: "域名与端口", commands: [
          { id: "dig-short", cmd: "dig +short example.com", desc: "查看域名解析结果。", note: "结果为空不一定是断网，也可能是记录类型不匹配。" },
          { id: "dig-ns", cmd: "dig NS example.com", desc: "查看域名使用的权威 DNS 服务器。" },
          { id: "dig-server", cmd: "dig @1.1.1.1 example.com A", desc: "向指定 DNS 服务器查询域名的 IPv4 记录。", note: "需要能访问该 DNS 服务器，可换成自己的服务器地址。" },
          { id: "nc-port", cmd: "nc -vz -w 3 主机 443", desc: "尝试连接 TCP 端口，检查服务是否可达。", note: "macOS / OpenBSD nc 适用；连通不等于业务服务正常。" }
        ]}
      ]
    }
  ]
};
if (typeof module !== "undefined" && module.exports) module.exports = DEV_TOOLS;
