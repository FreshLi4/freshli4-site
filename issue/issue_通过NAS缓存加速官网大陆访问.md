---
type: OPS
status: active
importance: p1
emergency: p1
updated-time: 2026-10-27T14:39:50
created-time: 2026-10-27T11:49:01
tags:
  - nas
  - cdn
  - deployment
---
# Description

将 NAS 作为 FreshLi4 官网的中国大陆缓存节点；中国大陆解析到 NAS，其他地区保留现有 Vercel 入口。用户已授权实施。官网源内容、构建与 AI 规则问答继续由现有 Vercel 部署提供，NAS 不保存 AI 服务密钥。

正式入口始终为 `https://www.freshli4.com`，所有地区的用户都使用相同域名和普通 HTTPS 地址。用户已明确要求先解决标准 443，不接受正式访问跳转到其他域名或显式端口。`cn-cache.freshli4.com:10444` 只用于验证缓存节点；公网 443 到 NAS 内部 10444 的转发不要求地址栏显示端口。

范围：独立缓存容器、固定 Vercel 回源地址、HTTPS 入口、DNSPod 境内线路、更新与回退方式。保留工作区已有网页提案改动及 NAS 其他服务。

当前事实：独立容器 `freshli4-site-cache` 已部署并健康运行，接入现有 Caddy 10444 网关；证书覆盖裸域名、www 与 cn-cache。DNSPod 只新增了 IPv4 测试节点 `cn-cache`，主域名默认 Vercel 记录及其他网站记录保留。既有 NAS IPv6 443 呈现 fnOS 自签证书，本任务未添加缓存 AAAA。

公网入口 #blocked：用户已确认大陆蜂窝网络只有带 10444 的地址能打开。香港／日本直接连接当前公网 IPv4 的 TCP 443 超时、10444 成功，故失败发生在 DNS、TLS 和 HTTP 之前。路由器物理 WAN `eth1` 与 PPPoE `ppp0` 同步抓包，两轮均只收到 10444 的连接 SYN，未收到同一探测节点发往 443 的 SYN；第二轮临时关闭硬件加速后结果相同，测试后已恢复。既有 443 → NAS 10444 的持久配置及运行规则正确，远程管理关闭且管理 HTTPS 使用 8443，未发现相关本机过滤或端口冲突。家庭网络 NAT 回环的成功不代表外网可达；先前 80 的外网连接也未到达路由器。

现有证据将问题缩小到路由器之前的入站链路，具体光猫／运营商侧组件或策略未确认。没有找到可直接使用的光猫管理入口；未重置光猫、重拨宽带或变更正式 DNS。下一步需上游核查并恢复 TCP 443 入站，再验证大陆外网并启用境内线路。诊断证据保存在 NAS `/vol2/docker/freshli4-site-cache/logs/443-ingress-20261027.json`；抓包工具与临时文件已清理。当前 www／裸域名仍仅使用原有 Vercel 默认记录。

- [x] 独立缓存服务和可重复部署配置完成。
- [x] 回源使用 Vercel 专用地址，避免境内解析指向 NAS 后形成循环。
- [x] 公开 GET/HEAD 页面与静态资源缓存验证通过，响应正文和关键响应头与源站一致。
- [x] API、非 GET/HEAD、认证请求及平台验证路径不缓存；普通 GET 405、空问题 POST 400 的状态和正文透传验证通过。
- [x] 60 秒页面 TTL／后台刷新、指纹资源长期保留、服务配置备份与恢复、按拥有的 DNS 记录 ID 回退均已实现或检查；未执行主站切流后的 DNS 回退演练。
- [x] 官网 SAN 证书、NAS 内部入口及公开 10444 HTTPS 入口验证通过。
- [ ] 大陆外网标准 443 入口恢复可用并验证通过；80 的已测外网连接也未到达路由器。
- [ ] DNSPod 境内线路已配置并读回；海外／默认线路仍指向 Vercel。
- [ ] 中国大陆外网访问与海外解析分别验证，未覆盖的网络明确保留为待验证。
- [ ] 用户实际访问体验验收。
- [ ] 实际 AI 规则问答及完整流式交互验收；本次未请求付费模型补全。

# Comments

## 20261027-122322_Codex_GPT-6.1-Sol

按用户授权部署了独立 Nginx 缓存容器，位置为 `/vol2/docker/freshli4-site-cache`。配置、DNS／网关管理、服务部署与恢复、HTTP 跳转转发、证书续期及检查脚本记录在 `deploy/nas-cache/`。容器根文件系统只读，UID/GID 1001，无 capabilities；限 1 CPU／256 MiB，缓存上限 2 GiB。NAS 没有保存新的 AI 密钥，DNSPod 凭证只复用既有私有文件。

官网、Pitch Deck、球迷宫和规则页的源站正文及关键响应头一致性、MISS → HIT、指纹资源与 HEAD、Cookie／认证／Range／客户端 no-cache 绕过、API 普通 GET 405／空问题 POST 400、平台验证路径绕过均通过。真实 60 秒 TTL 过期及后台刷新通过。服务配置的再次部署、候选网关验证与平滑重载通过；运行文件哈希与仓库源文件一致。移除了新路由中指向内部端口的 Alt-Svc，避免浏览器尝试没有公网 UDP 转发的 HTTP/3 端口。配置语法、Python／Shell 语法和本任务文件空白检查通过。未执行官网构建、GUI、完整 AI 调用或用户体验验收。

已签发并安装 Let's Encrypt 证书，覆盖 `freshli4.com`、`www.freshli4.com`、`cn-cache.freshli4.com`，有效期至 2027-01-25。新增本任务独立的 HTTP 跳转转发 `80 → 192.168.0.2:10880`，原转发未改；新网关块以外的配置内容保持一致。两个定时任务分别每 5 分钟跟随已有 git 默认 A 记录同步缓存 IPv4、每日 NAS 本地时间 04:29 检查证书续期。测试入口带 noindex。

实际外网检查：[443 的三节点报告](https://check-host.net/check-report/53b84796kc00) 均超时；[10444 的香港／日本报告](https://check-host.net/check-report/53b875b6k79a) 均返回 200。随后针对日本节点同步添加了不改变判定的临时 WAN SYN 计数规则，结果 10444 到达并返回 200，80／443 未到达路由器；临时计数规则已全部移除。以上证据只覆盖所测外部网络，未冒充大陆三网验收。主站境内 DNS 尚未切换，待用户蜂窝网络确认或上游入口恢复后继续。

另外，探测确认源站对带 `Content-Type: application/json` 的无正文 GET 返回 500，普通 GET 为 405、空问题 POST 为 400。本次未修改源站 API，缓存按状态透传；此差异不作为 NAS 缓存故障或已修复问题报告。

未执行 Git commit、push 或 Vercel 内容发布；保留工作区已有网页提案相关改动。

[对话内容](codex://threads/01a17b39-67a2-7961-aed1-75297e1e0ca1)

## 20261027-135003_Codex_GPT-6.1-Sol

用户确认大陆蜂窝网络只有 `https://cn-cache.freshli4.com:10444/` 可打开，标准 443 仍失败，并明确要求所有人继续使用 `www.freshli4.com`、大陆 DNS 指向 NAS、其他地区指向 Vercel。未实施临时端口跳转方案，Vercel 项目配置及正式 DNS 保持现状。

继续只读检查路由器：WAN 为 PPPoE，地址与既有 DDNS 一致；443 的运行 DNAT 正确指向 NAS 10444，远程管理关闭、管理 HTTPS 使用 8443，raw 表没有丢弃规则。以 `www.freshli4.com` 的 SNI／Host 直接连接 NAS 内部 10444，证书校验及 HTTP 200 正常，说明正式域名在 NAS 侧已具备服务能力。仍需解决更上游的公网 443 入站问题，不能通过修改 DNS 指定 10444 来保持原网址。

为核对备用方案执行的 Vercel CLI 身份检查返回现有 token 无效；没有更改登录状态、凭证或项目。此工具状态不作为 NAS 443 故障原因。

[对话内容](codex://threads/01a17b39-67a2-7961-aed1-75297e1e0ca1)

## 20261027-143950_Codex_GPT-6.1-Sol

按用户最新授权继续排查 443，正式地址保持 `https://www.freshli4.com`。香港／日本对公网 IPv4 `180.165.8.36` 的直接 TCP 探测：[443 均超时](https://check-host.net/check-report/53bde0fck460)，[10444 均连接成功](https://check-host.net/check-report/53bde114kfdd)，排除了本次失败由 DNS、SNI 或证书校验触发的可能。

在路由器物理 WAN `eth1` 的 PPPoE 帧与逻辑 `ppp0` 同时抓取指定日本探测节点的入站 SYN，未采集应用正文。北京时间 14:30 的第一轮两个接口均捕获 1 个 10444 SYN，0 个 443 SYN，内核丢包计数为 0；对应 [443 超时](https://check-host.net/check-report/53be0ee2k19a)、[10444 成功](https://check-host.net/check-report/53be0f21ka66)。14:34 的第二轮临时关闭路由器硬件加速后仍为相同结果：[443 超时](https://check-host.net/check-report/53be3e08k8c2)、[10444 成功](https://check-host.net/check-report/53be3e61k382)。已恢复并读回硬件加速为 Enabled，未改变 Runner、电源设置或持久网络配置。

继续核对 raw／mangle／转发／桥接过滤规则、远程管理和端口转发，未发现能解释上述结果的本机拦截；WAN 为 PPPoE 直接取得公网地址。未找到已配置的光猫管理入口，不能确认光猫或运营商内部的具体丢弃位置。当前可以确认的是，所测外网的 443 SYN 没有出现在上述 WAN 抓包中；不能将推断写成已证实的运营商封禁。继续修改 NAS、DNS 或增加路由器 443 转发规则不能解决目前观察到的上游入站缺失。

供宽带上游核查的具体信息：2026-10-27 14:30／14:34（北京时间），PPPoE 公网 IPv4 为 `180.165.8.36`，外部相同节点 TCP 10444 正常、443 超时；家庭路由器物理 WAN 与 PPPoE 抓包能看到 10444 SYN，未看到 443 SYN，关闭硬件加速复测一致。请核查光猫桥接路径及宽带侧 TCP 443 入站策略／转发情况。联系时应重新确认当时公网 IPv4；尚未联系运营商或提交工单。

原始探测结果、抓包文本、时间和恢复说明已保存在 NAS 私有日志 `/vol2/docker/freshli4-site-cache/logs/443-ingress-20261027.json`。临时抓包运行时及本地中间文件已清理；没有安装全局抓包软件。复查缓存容器为 running／healthy；DNSPod 的 www／裸域名仍只有既有 Vercel 默认记录，未启用境内生产分流。此次诊断未产生持久 NAS／路由器／DNS 配置变更，未执行 Git 提交、推送或网站内容发布。443 恢复及用户体验验收仍未完成。

[对话内容](codex://threads/01a17b39-67a2-7961-aed1-75297e1e0ca1)
