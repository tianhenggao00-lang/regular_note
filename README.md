# 自律小记（zlj-app）

个人自律追踪 App 的源码仓库，用于**版本管理 + GitHub 远程备份**，避免本地代码丢失。

## 项目背景
- **本地仓库位置**：`D:\100_code\110_regular_note`（本目录，D 盘项目区，与 C 盘 WorkBuddy 工作区分离）
- 设计稿：WorkBuddy Ardot「自律App_移动端设计稿」
- 平台：Android 高保真移动端（后续可装壳 / 直接以整段 HTML 当 PWA 用）
- 任务模型：待办池 + 今日任务两栏；长线任务（按个数 / 进度条）/ 短线任务（完成-未完成，未完可勾「明日回池」）

## 核心外设目标：日记导入 Obsidian
App 的「日记 / 每日总结」模块需要支持**导出为 Markdown，导入到 Obsidian** 做长期知识管理：
- Obsidian 库路径：`D:\500_else\520_Obsidian_record\personal_record`
- 目标落盘目录：`005日记`（或 `日记`）——导入时按 Obsidian 的文件夹命名约定放置
- 导出格式：每篇日记一个 `.md` 文件，含 YAML frontmatter（日期、心情、标签等），正文为纯文本 / Markdown
- 设计阶段要预留：日记数据模型需便于序列化为 md；导出入口放在「每日总结 / 日记」页面

## 代码结构
- 以纯 HTML 形式存放源码，手机添加到主屏幕即可当 App 使用。
- 后续模块：今日、任务中枢、记录中心（八宫格）、习惯年度视图。

## 备份策略
- 本地 git 仓库（本目录 `.git`）
- 远程：`origin` 指向 GitHub 私有仓库，定期 `git push` 防本地丢失

## 使用
1. 克隆 / 拉取最新：`git pull`
2. 改完提交：`git add -A && git commit -m "..."`
3. 推送：`git push`
