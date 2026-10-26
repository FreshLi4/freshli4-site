---
type: FE
status: ready-for-review
importance: p1
emergency: p1
created-time: 2026-10-27T01:33:52+08:00
updated-time: 2026-10-27T01:35:36+08:00
tags: [pitch-deck, website, free-to-play]
---
# Description

在 `/pitch-deck` 导览中新增 “Free to play” 分区模块，加入 Roshambo 与《案件待处理：观澜公寓》，沿用现有卡片、独立详情页和循环导航。保留此前已完成的 Fun with friends / Immerse yourself 分区与当前工作区改动。

Roshambo 内容以其 `roshambo_main` README 与 itch 页面说明为准，介绍 3×3 卡牌矩阵、Duel、Matrix、Roguelike 及在线 PvP 预览；阶段按用户说明标为“接近完成”，详情同时列出仓库资料记录的 v0.9.0 与待完善功能。《案件待处理》沿用当前项目资料确认的外包理赔审查、2002 年企业内网、证据检索与结构化报告概念；用户指定“观澜公寓”作为此次展示名。现有项目资料中的第一案仍名为“南栖公寓”，所以页面不扩写具体案件冲突。Free to play 是用户指定的展示分区，不代表本次确认了每个项目的实际发行状态。

- [x] 新增 Free to play 分区和两张项目卡片。
- [x] 补充 Roshambo 与《案件待处理：观澜公寓》的独立详情页内容及概念配图。
- [x] 更新项目数量、导览说明、内容依据与配图提示词。
- [x] 生成并读回导览和详情 HTML，核对项目唯一性、路由及配图引用。
- [ ] 用户视觉、内容与分区验收。

# Comments

## 20261027-013536_Codex_GPT-6

新增 “Free to play” 分区，纳入 Roshambo 和《案件待处理：观澜公寓》，并为两款游戏新增详情页。共 12 张唯一项目卡片、1 个导览页及 12 个详情页；Roshambo 阶段按用户说明标为“接近完成”，详情列出 v0.9.0 中已有的矩阵、三种模式与在线 PvP 预览，并保留待完善项。案件页只写入项目资料支持的 2002 年保险审核、证据检索和报告机制。当前项目资料的第一案名为“南栖公寓”，展示页按用户指定使用“观澜公寓”，未补写具体案情。

新增两张 1536 × 1024 概念图并压缩为 WebP，分别约 214 KiB、237 KiB。`node --check`、`npm run generate:pitch-deck`、结构读回（13 个 HTML、12 张唯一卡片、三个分区、缺失页面/图片为 0）及 `git diff --check` 均通过。未运行测试、完整生产构建、部署或 GUI 视觉验收。

[对话内容](codex://threads/01a1793f-e22b-7412-99c5-e8f09e9ce2b1)
