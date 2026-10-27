# NAS 官网缓存节点

NAS 为官网提供公开内容的缓存，Vercel 保留源站、构建和 AI 问答。设计中的访问路径为中国大陆 → NAS 缓存，其他地区 → Vercel。当前主域名仍由 Vercel 提供，分流须在实际大陆外网的标准 HTTPS 入口通过后启用；执行状态见 [所属 Issue](../../issue/issue_通过NAS缓存加速官网大陆访问.md)。

正式用户始终访问 `https://www.freshli4.com`，地区 DNS 只选择不同服务器，不改变地址栏域名或端口。测试域名不作为正式访问入口；不启用到显式 10444 地址的地区跳转。

已部署的独立测试入口：[cn-cache.freshli4.com:10444](https://cn-cache.freshli4.com:10444/)。测试域名带 `noindex` 响应头。2026-10-27 香港、日本外部探测确认此端口可用，用户也已确认大陆蜂窝网络只有带 10444 的地址能打开。直接连接同一公网 IPv4 的 TCP 443 超时、10444 成功；路由器物理 WAN `eth1` 与 PPPoE `ppp0` 同步抓包只收到 10444 SYN，临时关闭硬件加速后复测相同，测试后已恢复。先前 80 的外网连接也未到达路由器。路由器转发和 NAS 正式域名服务已检查，现有证据指向路由器之前的入站链路，具体光猫／运营商侧原因仍需核查。未找到可直接使用的光猫管理入口，暂不切换正式地区 DNS。诊断证据保存在 NAS `logs/443-ingress-20261027.json`，详情及上游核查信息见所属 Issue；临时抓包工具已清理。

## 服务与入口

- NAS 目录：`/vol2/docker/freshli4-site-cache`；容器：`freshli4-site-cache`。
- Caddy：复用 `gitea-caddy`、外部网络 `gitea_default`。公网 443 的现有转发目标为 NAS 10444，本任务仅增加标记块中的官网路由。
- HTTPS 覆盖 `freshli4.com`、`www.freshli4.com`、`cn-cache.freshli4.com`，裸域名跳转到 `https://www.freshli4.com`。
- 新路由移除 Caddy 按内部监听端口生成的 `Alt-Svc`，避免浏览器尝试未做公网 UDP 转发的 HTTP/3 端口；HTTP/2 保持可用。
- 本机诊断端口：`127.0.0.1:8796`，不发布到公网。HTTP 跳转服务为 `192.168.0.2:10880`；路由器另有本任务独立的 `80 → 10880` 转发，不重启防火墙或改动原有转发。
- 先使用 IPv4。既有 NAS IPv6 443 入口呈现 fnOS 自签证书，本任务不向缓存测试域名添加 AAAA。
- 回源固定连接 `06a43d78bd7391ba.vercel-dns-017.com`，TLS SNI 和 Host 使用 `www.freshli4.com`，验证源站证书。修改地区 DNS 后不会回源到 NAS 自己。

## 缓存与更新

- 公开 GET/HEAD 页面、无指纹资源缓存 60 秒；过期后先返回已有副本并后台刷新。闲置后的首次访问也可能先得到旧副本，随后请求得到刷新内容。
- `/assets/` 中带构建指纹的文件缓存 30 天，独立保留旧文件，供仍打开旧页面的浏览器继续请求。
- API、Vercel 验证路径、非 GET/HEAD、Cookie、Authorization、Range、客户端 `no-cache`／`no-store` 请求不缓存；源站 `private`／`no-store`／`no-cache`、Set-Cookie、Vary 规则继续限制写入缓存。
- API 不缓冲流式响应，不保存 AI 密钥。75 秒回源读取超时覆盖当前 Vercel 函数的 60 秒上限。
- `X-FreshLi4-Cache` 表示 NAS 的 MISS、HIT、STALE 或 BYPASS；`X-Vercel-Cache` 是源站自己的状态。
- 缓存磁盘上限合计 2 GiB；页面区 512 MiB，指纹资源区 1536 MiB。容器只挂配置和本任务缓存目录，UID/GID 为 NAS 现有用户 1001，根文件系统只读、无额外 capabilities，最多 1 CPU／256 MiB 内存；容器日志最多 3 × 10 MiB。

Vercel 发布不依赖 NAS，缓存按上述时效刷新。需要立即更新时，只清页面区，保留旧指纹资源，然后预热首页：

```bash
ssh nas 'docker exec freshli4-site-cache find /var/cache/nginx/pages -type f -delete'
ssh nas 'curl -fsS -H "Host: www.freshli4.com" http://127.0.0.1:8796/ -o /dev/null'
```

## 部署与检查

从本工作区执行，只更新本任务目录与容器，不构建或发布网页内容：

```bash
./deploy/nas-cache/deploy.sh
ssh nas 'python3 /vol2/docker/freshli4-site-cache/gateway.py install'
ssh nas 'python3 /vol2/docker/freshli4-site-cache/install-cron.py'
python3 deploy/nas-cache/router-http.py install
```

部署前备份服务配置，检查 Nginx 配置后启动或重载；失败时恢复上一份服务配置。网关修改只更新 `Caddyfile.fragment` 标记范围，先验证完整候选配置，检查并发改动后保留挂载文件的 inode 写入，平滑重载。备份与诊断日志在 NAS 的私有 `state/`、`logs/`，不复制到仓库。

```bash
ssh nas 'python3 /vol2/docker/freshli4-site-cache/verify.py'
ssh nas 'python3 /vol2/docker/freshli4-site-cache/verify.py --base https://cn-cache.freshli4.com:10444'
```

检查正文与关键响应头、MISS → HIT、HEAD、Cookie／认证／Range 绕过、API 405／空问题 400 透传和平台验证路径。`--check-expiry` 另等待真实的 60 秒 TTL，验证后台刷新。空问题校验不调用付费模型；完整 AI 问答与用户视觉验收仍需另行确认。

## DNS 与证书

复用 NAS 既有 `/vol2/docker/gitea/secrets/dnspod.env`，脚本只读取，不输出或另存凭证。`dns.py prepare` 先保存原始记录，并创建只含 IPv4 的 `cn-cache`；IP 跟随现有 `git.freshli4.com` 默认 A 记录，每 5 分钟同步。现有默认、邮件、其他网站记录不变。

| 记录 | 线路 | 值 | 当前作用 |
| --- | --- | --- | --- |
| `www` | 默认 | 既有 Vercel CNAME | 保留海外入口 |
| `@` | 默认 | 既有 Vercel A | 保留默认跳转 |
| `cn-cache` | 默认 | NAS IPv4，跟随既有 DDNS | 测试节点 |
| `www` | 境内 | `cn-cache.freshli4.com` | 外网 443 通过后启用 |
| `@` | 境内 | NAS IPv4 | 外网 443 通过后启用 |

完成大陆外网验证后才启用分流：

```bash
ssh nas 'python3 /vol2/docker/freshli4-site-cache/dns.py activate'
ssh nas 'python3 /vol2/docker/freshli4-site-cache/dns.py inspect'
```

DNSPod 免费版 TTL 为 600 秒，终端仍可能受递归缓存影响；地区线路依赖递归 DNS 的来路判断，不能保证每位访客按物理所在地命中。DNS 地区记录本身不提供自动故障切换。

证书使用 NAS 既有 acme.sh／DNSPod DNS-01 签发，私钥留在既有证书目录；每日 NAS 本地时间 04:29 检查续期，更新后执行现有 Caddy 重载命令。`renew-cert.sh` 不需要公网 80 接入，也不更改其他域名的续期任务。

## 回退

先移除本任务拥有的境内记录，默认 Vercel 记录会重新承担解析；不删除或修改已有默认记录：

```bash
ssh nas 'python3 /vol2/docker/freshli4-site-cache/dns.py rollback'
```

确认 DNS 缓存经过 TTL 后，如需移除缓存入口再执行：

```bash
ssh nas 'python3 /vol2/docker/freshli4-site-cache/gateway.py remove'
ssh nas 'cd /vol2/docker/freshli4-site-cache && docker compose down'
python3 deploy/nas-cache/router-http.py remove
```

停用时仅删除 crontab 中以 `# freshli4-site-cache-ddns`、`# freshli4-site-cache-cert` 结尾的两个条目。其他站点、网关和任务保持原样；缓存卷及私有回退记录可以保留。
