'use strict';
/* 常用开发命令数据：六个工具组，每个工具按使用场景分组，每条命令有自己的 id。
 *
 * 添加命令怎么填：
 * - id：全模块唯一的小写短横线名，掌握记录按它保存，改了会丢进度；
 * - cmd：展示的命令本体，也可以是一个按键（如 dd），等宽字体展示；
 * - desc：一句话说明这条命令做什么，用中文标点；
 * - example：可选，真实的使用示例；
 * - note：可选，补充说明、系统差异或危险提示，危险提示用 ⚠️ 开头。
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
      groups: [
        { id: "mac-brew", name: "Homebrew 包管理", commands: [
          { id: "mac-brew-install", cmd: "brew install 包名", desc: "用 Homebrew 安装命令行软件。", example: "brew install wget" },
          { id: "mac-brew-search", cmd: "brew search 关键词", desc: "搜索 Homebrew 里能安装的软件。", example: "brew search python" },
          { id: "mac-brew-uninstall", cmd: "brew uninstall 包名", desc: "卸载用 brew 装的软件。", example: "brew uninstall wget" },
          { id: "mac-brew-list", cmd: "brew list", desc: "查看已经装了哪些软件。" },
          { id: "mac-brew-upgrade", cmd: "brew update && brew upgrade", desc: "更新 brew 自身和所有已装的软件。" },
          { id: "mac-brew-services", cmd: "brew services list", desc: "查看 brew 管理的后台服务。", example: "brew services start redis", note: "stop 停止，restart 重启。" }
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
          { id: "mac-sips", cmd: "sips -Z 1024 图片.jpg", desc: "把图片最长边缩到 1024 像素。", note: "批量：sips -Z 1024 *.jpg。" },
          { id: "mac-brew-cleanup", cmd: "brew cleanup", desc: "清掉旧版本软件包和缓存。", note: "加 -n 先看看会删什么。" }
        ]}
      ]
    },
    {
      id: "shell",
      name: "Shell 基础",
      emoji: "🐧",
      tagline: "文件、文本、进程、网络，每天都要敲的基础命令。",
      groups: [
        { id: "sh-file", name: "文件与目录", commands: [
          { id: "sh-pwd", cmd: "pwd", desc: "显示当前所在的目录。" },
          { id: "sh-ls", cmd: "ls -la", desc: "列出目录内容，含隐藏文件和权限。" },
          { id: "sh-cd", cmd: "cd 目录", desc: "切换目录。", example: "cd ~/Documents", note: "cd - 回到上一个目录，cd 回到家目录。" },
          { id: "sh-mkdir", cmd: "mkdir -p a/b/c", desc: "一次创建整条嵌套目录。" },
          { id: "sh-touch", cmd: "touch file.txt", desc: "创建空文件，或刷新文件时间。" },
          { id: "sh-cp", cmd: "cp 源 目标", desc: "复制文件或目录。", example: "cp -r src/ backup/", note: "复制目录要加 -r。" },
          { id: "sh-mv", cmd: "mv 源 目标", desc: "移动文件，也能用来重命名。", example: "mv old.txt new.txt" },
          { id: "sh-rm", cmd: "rm 文件", desc: "删除文件。", example: "rm -rf 目录", note: "⚠️ -r 连目录一起删，-f 不再确认，删掉找不回，回车前再看一遍路径。" },
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
          { id: "sh-cut", cmd: "cut -d, -f1 data.csv", desc: "按分隔符取出第几列。" },
          { id: "sh-sed", cmd: "sed 's/old/new/g' file.txt", desc: "批量替换文本并输出结果。" },
          { id: "sh-awk", cmd: "awk '{print $1}' file.txt", desc: "按列提取字段。" },
          { id: "sh-diff", cmd: "diff a.txt b.txt", desc: "比较两个文件的差异。" },
          { id: "sh-pipe", cmd: "命令一 | 命令二", desc: "管道：把前一个命令的输出交给后一个。", example: "history | grep git" },
          { id: "sh-redirect", cmd: "命令 > 文件", desc: "把输出写进文件。", example: "ls > list.txt", note: "用 >> 追加，不覆盖原内容。" }
        ]},
        { id: "sh-adv", name: "管道与进阶", commands: [
          { id: "sh-xargs", cmd: "命令 | xargs 子命令", desc: "把前一个命令的输出变成参数。", example: "find . -name '*.tmp' | xargs rm", note: "⚠️ 删除前先不带 xargs 跑一遍，看清会删哪些。" },
          { id: "sh-tee", cmd: "命令 | tee 文件", desc: "屏幕看得到，同时写进文件。", note: "加 -a 追加不覆盖。" },
          { id: "sh-tr", cmd: "cat 文件 | tr a-z A-Z", desc: "逐字符替换，大小写转换常用。" },
          { id: "sh-jq", cmd: "jq '.' data.json", desc: "格式化并高亮 JSON。", note: "取字段：jq '.name'；配合管道处理接口输出。" },
          { id: "sh-file", cmd: "file 文件", desc: "识别文件的真实类型，不看扩展名。" },
          { id: "sh-env", cmd: "env", desc: "查看当前全部环境变量。", note: "配合管道找变量：env | grep PATH。" }
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
          { id: "sh-export", cmd: "export KEY=值", desc: "设置环境变量。", note: "只对当前终端有效，长期生效写进 ~/.zshrc。" },
          { id: "sh-echo-path", cmd: "echo $PATH", desc: "查看命令的搜索路径。", note: "pyenv、nvm 就是靠它排到最前面的。" },
          { id: "sh-which", cmd: "which python3", desc: "查看一个命令实际用的是哪个。" },
          { id: "sh-alias", cmd: "alias gs='git status'", desc: "给长命令起个短别名。", note: "写进 ~/.zshrc，每个新终端都能用。" },
          { id: "sh-source", cmd: "source ~/.zshrc", desc: "让改过的配置立刻生效。" },
          { id: "sh-history", cmd: "history", desc: "列出用过的命令。", example: "history | grep ssh" },
          { id: "sh-man", cmd: "man 命令", desc: "查看命令的说明书。", note: "按 q 退出。" },
          { id: "sh-clear", cmd: "clear", desc: "清空屏幕。", note: "快捷键 Ctrl+L 一样好用。" }
        ]}
      ]
    },
    {
      id: "git",
      name: "Git 版本控制",
      emoji: "🌿",
      tagline: "从提交到分支协作，改错了也有后悔药。",
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
          { id: "git-restore", cmd: "git restore 文件名", desc: "丢弃工作区里未提交的改动。", note: "⚠️ 丢弃后找不回来。" },
          { id: "git-reset", cmd: "git reset --soft HEAD~1", desc: "撤销上一次提交，改动退回暂存区。", note: "⚠️ 换成 --hard 会连改动一起丢，先想清楚。" },
          { id: "git-revert", cmd: "git revert 提交号", desc: "生成一条新提交来抵消旧提交。", note: "安全，适合已经推送的历史。" },
          { id: "git-stash", cmd: "git stash", desc: "把当前改动临时收起来，切换任务用。", example: "git stash pop", note: "pop 取回最近一次；列表看 git stash list。" }
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
          { id: "git-pull", cmd: "git pull", desc: "拉取远程更新并合并到当前分支。", note: "相当于 fetch 加 merge。" },
          { id: "git-push", cmd: "git push -u origin 分支名", desc: "首次推送并建立跟踪关系。", note: "之后直接 git push。" },
          { id: "git-force-push", cmd: "git push --force-with-lease", desc: "用本地历史覆盖远程分支。", note: "⚠️ 会盖掉别人的提交，确认只有自己在用这个分支。" },
          { id: "git-fetch", cmd: "git fetch", desc: "只下载远程的更新，先不合并。", note: "配合 git log origin/main 看看再决定。" },
          { id: "git-tag", cmd: "git tag v1.0", desc: "给当前提交打个版本标签。", example: "git push --tags" }
        ]}
      ]
    },
    {
      id: "docker",
      name: "Docker 与容器",
      emoji: "🐳",
      tagline: "起容器、看日志、清垃圾，部署调试都靠它。",
      groups: [
        { id: "docker-life", name: "容器操作", commands: [
          { id: "docker-ps", cmd: "docker ps", desc: "查看正在运行的容器。", note: "加 -a 连已停止的容器一起列出。" },
          { id: "docker-run", cmd: "docker run -d -p 8080:80 --name web nginx", desc: "后台新建并启动一个容器。", note: "-d 后台运行，-p 主机端口:容器端口，--name 给容器起名。" },
          { id: "docker-stop", cmd: "docker stop 容器名", desc: "优雅停止一个容器。", note: "再启动用 docker start，重启用 docker restart。" },
          { id: "docker-rm", cmd: "docker rm 容器名", desc: "删除已停止的容器。", note: "⚠️ 运行中的要先 stop，或用 docker rm -f 强删。" },
          { id: "docker-exec", cmd: "docker exec -it 容器名 bash", desc: "进入容器里开个 shell 排查问题。", note: "精简镜像可能没有 bash，换成 sh。" },
          { id: "docker-logs", cmd: "docker logs -f 容器名", desc: "跟踪容器日志。", note: "--tail 100 只看最后 100 行。" },
          { id: "docker-cp", cmd: "docker cp 本地文件 容器名:路径", desc: "在主机和容器之间复制文件。" }
        ]},
        { id: "docker-image", name: "镜像与构建", commands: [
          { id: "docker-images", cmd: "docker images", desc: "查看本地已有的镜像列表。" },
          { id: "docker-pull", cmd: "docker pull 镜像名", desc: "从镜像仓库下载镜像。", example: "docker pull python:3.12-slim" },
          { id: "docker-build", cmd: "docker build -t 镜像名:标签 .", desc: "按 Dockerfile 构建镜像。", note: "结尾的 . 表示构建上下文是当前目录。" },
          { id: "docker-rmi", cmd: "docker rmi 镜像名", desc: "删除本地镜像。", note: "⚠️ 还有容器引用时要先删容器。" },
          { id: "docker-prune", cmd: "docker system prune", desc: "清理停止的容器、悬空镜像等无用资源。", note: "⚠️ 加 -a 会连没用过的镜像一起清。" }
        ]},
        { id: "docker-compose", name: "compose 编排", commands: [
          { id: "compose-up", cmd: "docker compose up -d", desc: "按 docker-compose.yml 一次起好全套服务。" },
          { id: "compose-down", cmd: "docker compose down", desc: "停止并删除整套服务和网络。", note: "⚠️ 加 -v 连数据卷一起删。" },
          { id: "compose-logs", cmd: "docker compose logs -f 服务名", desc: "跟踪编排里某个服务的日志。" },
          { id: "compose-ps", cmd: "docker compose ps", desc: "查看编排里各服务的状态。" }
        ]}
      ]
    },
    {
      id: "linux",
      name: "Linux 运维",
      emoji: "🖥️",
      tagline: "apt、systemd 和定时任务，管好一台服务器。",
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
          { id: "journalctl-service", cmd: "journalctl -u 服务名 -f", desc: "跟踪某个服务的日志。", note: "-e 看最新几条，--disk-usage 看日志占了多少盘。" }
        ]},
        { id: "linux-sys", name: "系统与任务", commands: [
          { id: "linux-free", cmd: "free -h", desc: "查看内存和交换空间。", note: "macOS 上没有这个命令，用 vm_stat。" },
          { id: "linux-ss", cmd: "ss -tlnp", desc: "查看监听中的端口和对应进程。", note: "netstat 的现代替代品。" },
          { id: "linux-uname", cmd: "uname -a", desc: "看内核版本和系统架构。" },
          { id: "linux-uptime", cmd: "uptime", desc: "看开机时长和一分钟负载。" },
          { id: "crontab-edit", cmd: "crontab -e", desc: "编辑当前用户的定时任务。", note: "格式：分 时 日 月 周 命令，例如 0 9 * * 1 每周一九点。" },
          { id: "crontab-list", cmd: "crontab -l", desc: "查看已有的定时任务。" },
          { id: "linux-watch", cmd: "watch -n 2 命令", desc: "每两秒刷新一次命令输出。", note: "Ctrl+C 退出。" }
        ]}
      ]
    },
    {
      id: "remote",
      name: "SSH 与远程",
      emoji: "🔐",
      tagline: "免密登录、增量同步、tmux 挂任务。",
      groups: [
        { id: "remote-ssh", name: "SSH 连接与密钥", commands: [
          { id: "ssh-keygen", cmd: "ssh-keygen -t ed25519", desc: "生成一对新的 SSH 密钥。", note: "公钥 .pub 可以交给别人，私钥绝不能外传。" },
          { id: "ssh-copy-id", cmd: "ssh-copy-id 用户@主机", desc: "把公钥装到服务器，之后免密登录。" },
          { id: "ssh-port", cmd: "ssh -p 端口 用户@主机", desc: "服务器改了默认端口时用 -p 指定。" },
          { id: "ssh-key-file", cmd: "ssh -i 密钥文件 用户@主机", desc: "用指定的私钥连接。" },
          { id: "ssh-tunnel", cmd: "ssh -L 9000:localhost:3306 用户@主机", desc: "把远程端口转发到本机。", note: "例子里把服务器的 MySQL 映射到本机 9000。" },
          { id: "ssh-config", cmd: "ssh 主机别名", desc: "连接 ~/.ssh/config 里配置好的主机。", note: "config 里写 Host 别名、HostName、User、Port，之后短名直连。" }
        ]},
        { id: "remote-sync", name: "传输与同步", commands: [
          { id: "rsync", cmd: "rsync -avz 源目录 用户@主机:路径", desc: "增量同步目录到远程。", note: "只传改动过的文件，中途断了还能续。" },
          { id: "rsync-pull", cmd: "rsync -avz 用户@主机:路径 本地目录", desc: "把远程目录拉回本地，方向反过来即可。" },
          { id: "rsync-delete", cmd: "rsync -avz --delete 源 目标", desc: "让目标和源完全一致。", note: "⚠️ 会删掉目标里多出来的文件，先加 -n 空跑演练。" }
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
        ]}
      ]
    },
    {
      id: "nvm",
      name: "nvm 与 npm",
      emoji: "📦",
      tagline: "多个 Node 版本随用随切，npm 装包不迷路。",
      groups: [
        { id: "nvm-core", name: "版本管理", commands: [
          { id: "nvm-install-lts", cmd: "nvm install --lts", desc: "安装最新的长期支持版 Node。" },
          { id: "nvm-install", cmd: "nvm install 20", desc: "安装指定大版本，自动选最新小版本。" },
          { id: "nvm-use", cmd: "nvm use 20", desc: "在当前终端切换 Node 版本。" },
          { id: "nvm-ls", cmd: "nvm ls", desc: "查看已装版本和当前版本。" },
          { id: "nvm-alias", cmd: "nvm alias default 20", desc: "设置新终端默认使用的版本。" },
          { id: "nvm-current", cmd: "nvm current", desc: "显示当前正在用的 Node 版本。" },
          { id: "nvm-uninstall", cmd: "nvm uninstall 16", desc: "删除不用的版本。" }
        ]},
        { id: "nvm-npm", name: "npm 包管理", commands: [
          { id: "npm-init", cmd: "npm init -y", desc: "快速生成 package.json，跳过问答。" },
          { id: "npm-install", cmd: "npm install", desc: "按 package.json 装好全部依赖。" },
          { id: "npm-install-pkg", cmd: "npm install 包名", desc: "安装一个包并写进依赖。", example: "npm install lodash" },
          { id: "npm-install-g", cmd: "npm install -g 包名", desc: "全局安装命令行工具。", example: "npm install -g pnpm" },
          { id: "npm-run", cmd: "npm run dev", desc: "运行 package.json 里定义的脚本。" },
          { id: "npm-uninstall", cmd: "npm uninstall 包名", desc: "移除一个依赖。" },
          { id: "npx", cmd: "npx 包名", desc: "不安装，直接运行一个包提供的命令。", example: "npx create-vite my-app" }
        ]}
      ]
    },
    {
      id: "vi",
      name: "vi 编辑器",
      emoji: "📝",
      tagline: "打开、修改、保存、退出都不慌的必备按键。",
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
          { id: "vi-noh", cmd: ":noh", desc: "取消搜索后的高亮。" }
        ]},
        { id: "vi-set", name: "设置与可视", commands: [
          { id: "vi-number", cmd: ":set number", desc: "显示行号。" },
          { id: "vi-syntax", cmd: ":syntax on", desc: "打开语法高亮。" },
          { id: "vi-v", cmd: "v", desc: "进入可视模式自由选中。", note: "大写 V 按行选中；选中后 d 剪切、y 复制。" },
          { id: "vi-indent", cmd: ">>", desc: "当前行整体右移一个缩进。", note: "<< 左移；可视模式下用 > 或 < 批量缩进。" }
        ]}
      ]
    }
  ]
};
if (typeof module !== "undefined" && module.exports) module.exports = DEV_TOOLS;
