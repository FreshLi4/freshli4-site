import "./rules.css";
import { allInvestigationCards, cardCategoryMeta, cardSets, type CardCategory, type InvestigationCard } from "./investigation-data";

const section = (id: string, number: string, label: string, title: string, content: string, extra = "") => `
  <article class="rules-chapter" id="${id}" data-rule-searchable>
    <div class="chapter-marker"><span>${number}</span><i aria-hidden="true"></i></div>
    <div class="chapter-content">
      <p class="chapter-label">${label}</p>
      <h2>${title}</h2>
      ${content}
      ${extra}
    </div>
  </article>`;

const paragraph = (content: string) => `<p>${content}</p>`;
const list = (items: string[], ordered = false) => `<${ordered ? "ol" : "ul"}>${items.map((item) => `<li>${item}</li>`).join("")}</${ordered ? "ol" : "ul"}>`;
const callout = (label: string, content: string, tone = "") => `<aside class="rules-callout ${tone}"><span class="callout-label">${label}</span><p>${content}</p></aside>`;
const stat = (value: string, label: string, note: string) => `<div class="rule-stat"><strong>${value}</strong><span>${label}</span><small>${note}</small></div>`;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const lineBreaks = (value: string) => escapeHtml(value).replace(/\n/g, "<br />");

const routeLinks = (active: "rules" | "appendix" | "faq" | "wiki") => `
  <nav class="rules-route-nav" aria-label="调查深入资料导航">
    <a class="${active === "rules" ? "is-current" : ""}" href="/investigation-delve-boardgame">规则书<span>RULEBOOK</span></a>
    <a class="${active === "appendix" ? "is-current" : ""}" href="/investigation-delve-boardgame/appendix">调查附录<span>APPENDIX</span></a>
    <a class="${active === "faq" ? "is-current" : ""}" href="/investigation-delve-boardgame/faq">FAQ<span>RULINGS</span></a>
    <a class="${active === "wiki" ? "is-current" : ""}" href="/investigation-delve-boardgame/wiki">卡牌 Wiki<span>CARD INDEX</span></a>
  </nav>`;

const rulesHeader = (active: "rules" | "appendix" | "faq" | "wiki") => `
  <header class="rules-header">
    <a class="rules-brand" href="/" aria-label="返回 FreshLi4 首页"><span class="rules-brand-mark" aria-hidden="true"><i></i><b></b></span><span><strong>新鲜李四</strong><small>FRESHLI4 GAME STUDIO</small></span></a>
    ${routeLinks(active)}
    <div class="rules-header-meta"><span>INVESTIGATION GUILD OF ANOMALY</span><a href="/">返回官网 <b aria-hidden="true">↗</b></a></div>
  </header>`;

const referenceFigure = (src: string, alt: string, caption: string, note: string) => `
  <figure class="rules-reference-figure">
    <div class="rules-reference-image"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" /></div>
    <figcaption><span>${escapeHtml(caption)}</span><b>${escapeHtml(note)}</b></figcaption>
  </figure>`;

const subpageHero = (kicker: string, title: string, dek: string, active: "appendix" | "faq" | "wiki") => `
  <section class="rules-subpage-hero" aria-labelledby="subpage-title">
    <div><p class="rules-kicker">${kicker}</p><h1 id="subpage-title">${title}</h1><p class="rules-dek">${dek}</p></div>
    <div class="subpage-index"><span>INVESTIGATION : DELVE</span><strong>FILE / ${active.toUpperCase()}</strong><small>v1.1 · LIVE REFERENCE</small></div>
  </section>`;

const subpageShell = (active: "appendix" | "faq" | "wiki", hero: string, content: string, sidebar: string) => `
  <div class="rules-page rules-subpage">
    ${rulesHeader(active)}
    <main class="rules-layout" id="rules">${hero}<div class="rules-body"><aside class="rules-sidebar rules-subpage-sidebar">${sidebar}</aside><div class="rules-content">${content}</div></div></main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

const sourcePanel = (title: string, content: string, label = "SOURCE / 资料来源") => `<div class="source-panel"><p class="chapter-label">${label}</p><h3>${title}</h3><p>${content}</p><div><span>CANONICAL SOURCE</span><b>SHARED / DELVE</b></div></div>`;

const renderRulesPage = () => `
  <div class="rules-page">
    ${rulesHeader("rules")}

    <main class="rules-layout" id="rules">
      <section class="rules-hero" aria-labelledby="rules-title">
        <div class="rules-hero-copy">
          <p class="rules-kicker">FIELD MANUAL / 规则指引书</p>
          <h1 id="rules-title">调查<br /><em>深入</em></h1>
          <p class="rules-hero-english">INVESTIGATION : DELVE</p>
          <p class="rules-dek">成为「指挥者」。在异常环境中带领调查员寻找情报、避开【禁忌真相】，并让对手先一步失去清醒。</p>
          <div class="rules-hero-actions"><a class="rules-primary-link" href="#quick-start">从这里开始 <span aria-hidden="true">↓</span></a><span class="rules-edition">规则指引书 v1.1<br />附录与 FAQ 持续更新</span></div>
        </div>
        <div class="rules-hero-dossier" aria-label="调查工会档案封面">
          <div class="dossier-grid"></div><div class="dossier-redline"></div>
          <div class="dossier-stamp">I.G.A.<br /><small>FILE 02—06</small></div>
          <div class="dossier-card"><span>ANOMALY</span><strong>?</strong><small>DO NOT LOOK<br />TOO DEEP</small></div>
          <p class="dossier-caption">ARCHIVE / 0001<br /><b>异常联合调查工会</b></p>
        </div>
      </section>

      <section class="rules-overview" aria-label="规则书概览">
        <div class="rules-overview-intro"><p class="chapter-label">READING NOTES / 阅读提示</p><h2>规则是地图，<br />不是答案。</h2><p>第一次游玩，建议先用标注 Vol.1 的卡牌组成卡组；熟悉流程后，再加入 Vol.2 及后续补充内容。</p></div>
        <div class="rules-stats">
          ${stat("2—6", "PLAYERS", "玩家人数")}
          ${stat("4", "DECKS", "四类卡组")}
          ${stat("∞", "PRESSURE", "理智压力")}
        </div>
      </section>

      <div class="rules-body">
        <aside class="rules-sidebar" aria-label="规则章节导航">
          <div class="rules-search"><label for="rules-search-input">SEARCH / 搜索</label><div><input id="rules-search-input" type="search" placeholder="搜索规则关键词" autocomplete="off" /><span aria-hidden="true">⌕</span></div><small id="rules-search-status">显示全部章节</small></div>
          <nav class="rules-toc"><p>CASE INDEX</p><a href="#quick-start" class="is-current"><span>00</span>快速游玩</a><a href="#briefing"><span>01</span>任务简报</a><a href="#components"><span>02</span>游戏配件</a><a href="#setup"><span>03</span>游戏准备</a><a href="#round"><span>04</span>一轮游戏</a><a href="#operation"><span>05</span>操作阶段</a><a href="#san"><span>06</span>SAN 与疯狂</a><a href="#victory"><span>07</span>胜负判定</a><a href="#appendix"><span>08</span>调查附录</a><a href="#faq"><span>09</span>FAQ</a></nav>
          <div class="rules-sidebar-note"><span>CASE NOTE</span><p>规则书中没有写明的情况，请和同桌讨论后达成共识，继续调查。</p><a href="/investigation-delve-boardgame/wiki">浏览全部卡牌 →</a></div>
        </aside>

        <div class="rules-content">
          ${section("quick-start", "00", "QUICK START / 快速游玩流程", "先让调查开始。", `
            ${paragraph("《调查：深入》是一款 2—6 人游玩的非直接对战美式桌游。每一轮，调查员依照调查顺位行动，在情报卡组中寻找线索；有人先触及【禁忌真相】，这一轮便结束。")}
            <div class="flow-list">
              <div><b>01</b><span>确认组队，选择调查员，随机分配调查顺位。</span></div>
              <div><b>02</b><span>每位指挥者按顺位抽取 4 张策略牌。</span></div>
              <div><b>03</b><span>翻开一张新的环境牌，开始一轮游戏。</span></div>
              <div><b>04</b><span>调查员依次进入自己的操作阶段。</span></div>
              <div><b>05</b><span>调查情报、使用策略与技能，管理队伍的 SAN。</span></div>
              <div><b>06</b><span>有人调查到【禁忌真相】时，结算 SAN 并结束本轮。</span></div>
              <div><b>07</b><span>重复以上流程，直到只剩一个队伍的调查员保持清醒。</span></div>
            </div>
            ${callout("副官提示", "不要把一次轮次的输赢当成整局胜负。真正的目标，是让自己的队伍活到最后。", "is-red")}
          `)}

          ${section("briefing", "01", "BRIEFING / 任务简报", "欢迎回到调查工会。", `
            ${paragraph("这里是「异常联合调查工会」（Investigation Guild of Anomaly），一家跨国独立组织。异常环境的识别案例正在增加，而你是一名已经活过前几次任务、仍然保持清醒的「指挥者」。")}
            ${paragraph("你不再亲自踏入任务区域。你的工作，是通过策略指令、情报判断和调查员技能，带领自己的队伍完成任务。情报越多越好——但在情报卡组中，始终藏着一张不该被轻易触及的牌。")}
            <div class="briefing-columns"><div><span class="column-label">指挥者</span><p>管理自己的策略手牌，决定调查员在危险信息上的取舍。</p></div><div><span class="column-label">调查员</span><p>执行调查、承受 SAN 损耗，也可能在疯狂后获得新的能力。</p></div><div><span class="column-label">环境</span><p>每一轮改变桌面规则，带来新的限制、机会或陷阱。</p></div></div>
          `)}

          ${section("components", "02", "COMPONENTS / 游戏配件", "四类卡组，一张真相。", `
            ${paragraph("开始前，将「策略」「情报」「环境」「辅助」卡牌分别洗切成四组。详细卡牌构成以当前的《调查深入 · 卡牌统计表》为准。")}
            <div class="component-grid"><div><strong>策略</strong><span>Strategy</span><p>指挥者手中的行动、机制与反制。</p></div><div><strong>情报</strong><span>Intel</span><p>调查员在任务区域中翻开的线索。</p></div><div><strong>环境</strong><span>Environment</span><p>贯穿一轮、影响所有人的异常条件。</p></div><div><strong>辅助</strong><span>Support</span><p>由技能或效果召唤的临时支援。</p></div></div>
            <div class="rules-reference-grid">
              ${referenceFigure("/asset/investigation-delve/visual-content/3-游戏配件-1.png", "《调查深入》打开的游戏盒与配件", "FIG. 02-A / 配件索引", "先认出四类卡组，再开始布置。")}
              ${referenceFigure("/asset/investigation-delve/visual-content/6-游戏配件-4.png", "《调查深入》盒内的卡牌与骰子配件", "FIG. 02-B / COMPONENTS", "骰子记录 SAN，卡牌按类型分区。")}
            </div>
            ${callout("卡牌统计", "当前数据源包含 20 位调查员、39 种策略、21 种环境、8 种辅助，以及 25 张情报牌（其中包含 1 张【禁忌真相】）。", "is-ink")}
          `)}

          ${section("setup", "03", "SETUP / 游戏准备", "把桌面变成调查现场。", `
            <h3>确定指挥者人数与队伍</h3>
            ${paragraph("游戏支持 2—6 名玩家。组队时，同队指挥者共享情报区和窥探信息，但不能互相检视手牌；每位指挥者只能指挥自己的调查员、使用自己的手牌。")}
            <div class="rules-layout-guide"><div class="layout-guide-copy"><span>TABLE MAP / 桌面布置</span><h3>先给每一叠牌找到位置。</h3><p>将调查员顺位、情报区与四类卡组拉开距离。桌面布局不是装饰，它让“谁能看见什么”变得清楚。</p></div><div class="layout-guide-map"><i class="layout-zone zone-turn">调查员顺位</i><i class="layout-zone zone-intel">情报区</i><i class="layout-zone zone-strategy">策略卡组</i><i class="layout-zone zone-env">环境卡组</i><i class="layout-zone zone-support">辅助卡组</i><i class="layout-zone zone-deck">情报卡组</i><span class="layout-arrow arrow-one">↘</span><span class="layout-arrow arrow-two">↗</span></div></div>
            <div class="player-ratios"><div><b>2 人</b><span>2 队伍 · 每人 2 位调查员</span></div><div><b>3 人</b><span>3 队伍 · 每人 2 位调查员</span></div><div><b>4 人</b><span>2 队伍 · 每人 1 位调查员</span></div><div><b>6 人</b><span>2 或 3 队伍 · 每人 1 位调查员</span></div></div>
            <h3>选择调查员</h3>
            ${paragraph("每位指挥者获得 2 × N 张候选调查员，选择其中 N 位加入自己的队伍。你也可以自定义配比，但开局场上的调查员总数必须至少为 4。")}
            <h3>排定调查顺位与 SAN</h3>
            ${list(["将参与本局的调查员指示卡洗切，随机布置到顺位指示卡旁。", "查看调查员卡右上角的骰子点数，那是 SAN 上限；用骰子记录当前 SAN。", "按调查顺位依次从策略卡组抽取 4 张初始手牌。"])}
          `)}

          ${section("round", "04", "ROUND / 轮次结构", "每一轮，真相都更近一点。", `
            <div class="timeline"><div class="timeline-step"><span>01</span><div><b>触发环境</b><p>从环境卡组顶部抽 1 张。它在本轮持续生效；下一轮的新环境会替代它。</p></div></div><div class="timeline-step"><span>02</span><div><b>确定起始调查员</b><p>第一轮由第 1 顺位开始；之后由上一轮调查到【禁忌真相】的调查员开始。</p></div></div><div class="timeline-step"><span>03</span><div><b>轮流操作</b><p>每位清醒调查员依照调查顺位执行一个操作阶段。</p></div></div><div class="timeline-step"><span>04</span><div><b>结束本轮</b><p>任意调查员调查到【禁忌真相】时，结算 SAN，收回所有情报并重洗情报卡组。</p></div></div></div>
            ${callout("注意", "上一轮的环境牌不会洗回环境卡组。指挥者的手牌和已布置的个体机制也不会因为轮次结束而清除。", "is-red")}
          `)}

          ${section("operation", "05", "OPERATION / 操作阶段", "三段式行动，顺序很重要。", `
            <div class="operation-grid"><div class="operation-card"><span>01 / START</span><h3>开始操作阶段</h3>${list(["结算环境、个体机制或调查员技能的触发。", "从策略卡组顶部抽取 1 张牌加入手牌。"])}</div><div class="operation-card is-active"><span>02 / MAIN</span><h3>进入操作阶段</h3>${list(["对情报卡组进行调查，通常为 1—3 张。", "使用情报区中的情报牌。", "使用手牌中的策略牌（通常需要支付情报）。", "触发个体机制，使用调查员技能。"])}<small>除卡牌特别说明外，可按任意顺序执行。</small></div><div class="operation-card"><span>03 / END</span><h3>结束操作阶段</h3>${list(["再次结算环境、个体机制或调查员技能。", "将手牌弃置到不超过 8 张。"])} </div></div>
            <div class="investigate-rule"><span class="rule-sigil">↳</span><div><strong>调查</strong><p>从情报卡组顶部顺序翻看并公示 1—3 张情报牌，然后将它们纳入自己的情报区。除非有特殊描述，每位调查员每个操作阶段必须且只能调查一次。</p></div></div>
          `)}

          ${section("san", "06", "SAN / 理智与疯狂", "你可以知道很多，但不能承受一切。", `
            ${paragraph("调查到【禁忌真相】时，调查员通常损失 1 点 SAN。SAN 归零，调查员便会「陷入疯狂」；卡牌或环境可以修改伤害，也可能让疯狂的调查员恢复清醒。")}
            <div class="rules-reference-grid rules-reference-grid-single">${referenceFigure("/asset/investigation-delve/visual-content/13-游戏配件-11.png", "《调查深入》情报卡牌与禁忌真相示例", "FIG. 06-A / 情报牌面", "情报区应当保持公示；禁忌真相是这一轮的警示线。")}</div>
            <div class="san-meter"><div class="san-meter-track"><span></span><span></span><span></span><span></span><span></span></div><div class="san-meter-legend"><b>清醒</b><span>每一次真相命中，压力都会留下痕迹。</span><b>疯狂</b></div></div>
            <div class="madness-columns"><div><h3>陷入疯狂</h3>${list(["翻转调查员卡牌与调查员指示卡。", "弃置所有布置在其身上的个体机制。", "不再拥有操作阶段，调查顺位判定时自然跳过。", "获得额外的【禁忌知识】与【疯狂蔓延】技能。", "除非特殊说明，不能成为卡牌指定对象或受其影响。"])} </div><div><h3>恢复清醒</h3>${paragraph("疯狂的调查员通过任意手段恢复 SAN 后，会恢复清醒，并拥有恢复后的 SAN 点数。没有 SAN 的特殊调查员不能以此方式恢复清醒。")}${callout("最后的警告", "只有让自己的队伍保持到最后，才算真正完成任务。", "is-red")}</div></div>
          `)}

          ${section("victory", "07", "VICTORY / 胜负判定", "让别人的调查先结束。", `
            ${paragraph("当除某一队伍外，其他队伍的调查员全部陷入疯狂时，最后存活的队伍及其指挥者获得胜利。")}
            <div class="victory-card"><span>END CONDITION</span><strong>只剩一个队伍<br /><em>保持清醒</em></strong><p>若一次操作导致所有剩余调查员同时陷入疯狂，则最后陷入疯狂的调查员所在队伍获得胜利。</p></div>
            ${callout("战略提示", "情报是资源，SAN 是时间。你要同时管理两者：知道真相的位置，也要决定谁来承担接近它的风险。", "is-ink")}
          `)}

          ${section("appendix", "08", "APPENDIX / 调查附录", "特殊行动词典。", `
            ${paragraph("卡面中的特殊行动使用固定含义。若某张卡牌没有额外说明，就按以下定义处理。")}
            <div class="keyword-grid"><div><b>调查</b><span>从情报卡组顶部翻看并公示 1—3 张。</span></div><div><b>窥探</b><span>私下（队内）查看指定数量的情报牌后原样放回。</span></div><div><b>调整</b><span>将卡牌放回卡组或弃牌区的顶部、底部或原位。</span></div><div><b>跳过</b><span>本操作阶段无需且不能调查。</span></div><div><b>反转</b><span>反转当前调查顺序，将顺位指示卡翻面。</span></div><div><b>胁迫</b><span>最近一次调查的情报牌数量增加指定数值。</span></div><div><b>盲从</b><span>操作阶段开始后，必须首先进行调查。</span></div><div><b>回收</b><span>将卡牌移回上一个所在位置；若无说明，洗切该位置。</span></div></div>
            <a class="chapter-forward-link" href="/investigation-delve-boardgame/appendix">打开完整调查附录 →</a>
          `)}

          ${section("faq", "09", "FAQ / 规则判定", "遇到边界情况，先看这里。", `
            <div class="faq-list"><details open><summary>没有特殊描述时，窥探从哪里开始？<span>+</span></summary><p>默认从情报卡组顶部向下执行；「正向窥探」也指从顶部向下。</p></details><details><summary>仿生人可以成为消耗 SAN 的目标吗？<span>+</span></summary><p>不可以。仿生人没有 SAN，因此不能成为消耗队友 SAN 的指定对象，也不能恢复 SAN。</p></details><details><summary>调查到禁忌真相后又把它洗回去，降雨概率如何处理？<span>+</span></summary><p>如果通过任何手段洗回【禁忌真相】，计数不上升；若计数已经达到阈值，则下一个调查到【禁忌真相】的调查员消耗 SAN。</p></details><details><summary>卡牌印刷与规则文本冲突时怎么办？<span>+</span></summary><p>优先查阅最新版规则指引书、调查附录与 FAQ。实体卡牌的印刷问题以已公开的勘误为准。</p></details><details><summary>规则书中没有写明的情况怎么办？<span>+</span></summary><p>与同桌讨论并达成共识后继续游戏；如果该问题反复出现，建议反馈给制作团队，纳入后续规则更新。</p></details></div>
            <a class="chapter-forward-link" href="/investigation-delve-boardgame/faq">打开完整 FAQ →</a>
            <div class="source-panel"><p class="chapter-label">SOURCE / 来源</p><h3>一份会继续生长的规则书。</h3><p>本页面根据《规则指引书 - v1.1》整理，并同步展示《调查附录》《FAQ》的核心内容。卡牌构成详见当前《调查深入 · 卡牌统计表》。</p><div><span>LAST EDITION</span><b>v1.1 + APPENDIX</b></div></div>
          `)}
        </div>
      </div>
    </main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

const appendixItem = (name: string, description: string, note = "") => `<div class="appendix-entry"><div class="appendix-entry-heading"><b>${name}</b>${note ? `<span>${note}</span>` : ""}</div><p>${description}</p></div>`;

const renderAppendixPage = () => subpageShell(
  "appendix",
  subpageHero("APPENDIX / 调查附录", "把卡面上的词，读成同一种语言。", "特殊文本标识、行动词典，以及版本边界都集中在这里。它是规则书的判例层，也是查牌时最快的入口。", "appendix"),
  `<article class="subpage-article">
    <p class="chapter-label">TEXT MARKERS / 特殊文本标识</p>
    <h2>先识别文字的身份。</h2>
    <p class="subpage-lead">《调查深入》的卡面把名称、概念和行动分开标记。看到不同的括号与字形时，不要只按日常语义理解；它们对应的是不同的规则入口。</p>
    <div class="marker-grid">
      <div><b>【卡牌名称】</b><span>方括号表示卡牌（包括调查员）名称；【禁忌真相】有特殊颜色标识。</span></div>
      <div><b>「概念词汇」</b><span>直角引号表示特有概念；「SAN」与「陷入疯狂」有特殊颜色标识。</span></div>
      <div><b><em>特殊行动</em></b><span>斜体加粗的词才指代特殊行动。普通文本中出现同名词汇，不自动获得特殊行动含义。</span></div>
    </div>
    <div class="rules-callout is-red"><span class="callout-label">版本边界</span><p>部分早期卡牌沿用了普通字形，但后续版本已经把对应词汇定义为特殊行动。请以本附录的行动列表与卡牌 Wiki 的说明更新版本共同判定。</p></div>
    <p class="chapter-label appendix-section-label">ACTION INDEX / 特殊行动列表</p>
    <div class="appendix-entries">
      ${appendixItem("调查", "从「情报卡组」顶部，顺序翻看并公示 (1)～(3) 张「情报」卡牌，然后纳入自己的「情报区」。如无特殊描述，每位「调查员」每个「操作阶段」必须、且只能执行一次调查。", "CORE")}
      ${appendixItem("窥探", "私下（队内）顺序查看 (N) 张「情报」卡牌，并将其原样放回。没有特殊描述时，默认从情报卡组顶部向下执行。", "PRIVATE")}
      ${appendixItem("调整", "将卡牌放回对应「卡组」的最上、最下或其原位。若对象来自「弃牌区」，可以放回所属卡组或弃牌区的最上、最下，或其在弃牌区中的原位。", "POSITION")}
      ${appendixItem("跳过", "你在当前的「操作阶段」无需且不能调查。跳过可以在操作阶段的任意节点生效，效果持续到该操作阶段结束。", "BLOCK")}
      ${appendixItem("反转", "反转当前的调查顺序，将所有「顺位指示卡」翻面。", "ORDER")}
      ${appendixItem("胁迫", "调查的「情报」卡牌数量 + (N)，N 取决于胁迫后的数字。所有对同一位「调查员」布置的胁迫，在其最近一次调查中累加；若没有调查，胁迫视为未生效。", "PRESSURE")}
      ${appendixItem("盲从", "「调查员」的「操作阶段」开始后，必须首先进行调查。若调查员因【跳过】或【异时癖】等效果无需调查，盲从视为未生效。", "FIRST MOVE")}
      ${appendixItem("回收", "将卡牌移至其上一个所在位置；如无特殊说明，应当对上一个所在位置的卡牌进行洗切。由技能直接触发的「辅助」卡牌，其上一个所在位置为「辅助卡组」而非手牌。", "VOL.3")}
    </div>
    <div class="appendix-version-panel"><p class="chapter-label">VERSION NOTE / 版本说明</p><h3>回收从 Vol.3 开始进入规则语言。</h3><p>Vol.1、Vol.2 中未标识“回收”但受其影响的对象包括：调查员【赌徒：丹尼 · 达比】、【催眠师：哈米伦 · 修普诺斯】、【猛男：“阿诺”】、【仿生人：OP3-C】，以及辅助卡牌【胁迫 · 催眠师】、【盲从 · 催眠师】、【任务负债 · 赏金猎人】、【禁忌仪式】。</p></div>
    ${sourcePanel("附录与卡牌 Wiki 互相校验。", "附录负责定义词汇，Wiki 负责呈现每张卡牌的效果与说明更新版本；当卡牌印刷与当前规则冲突时，先看这里，再看 FAQ 的具体判例。")}
  </article>`,
  `<div class="subpage-sidebar-card"><span>APPENDIX / 08</span><strong>行动词典</strong><p>8 个特殊行动，构成所有卡面文本的共同语法。</p></div><nav class="subpage-sidebar-links" aria-label="附录导航"><a href="#markers">特殊文本标识</a><a href="#actions">特殊行动列表</a><a href="/investigation-delve-boardgame/faq">FAQ 判例 →</a><a href="/investigation-delve-boardgame/wiki">卡牌 Wiki →</a></nav>`
);

const faqDetail = (question: string, answer: string, open = false) => `<details${open ? " open" : ""}><summary>${question}<span>+</span></summary><div class="faq-answer">${answer}</div></details>`;
const faqGroup = (label: string, title: string, details: string) => `<section class="faq-group"><p class="chapter-label">${label}</p><h3>${title}</h3><div class="faq-list">${details}</div></section>`;

const renderFaqPage = () => subpageShell(
  "faq",
  subpageHero("FAQ / 规则判定", "当桌面停在一个问号上。", "这里记录已经明确的机制判例、环境卡牌边界与印刷勘误。FAQ 是对规则正文的补充，不会取代最新版规则指引书。", "faq"),
  `<article class="subpage-article">
    ${faqGroup("GAME MECHANICS / 游戏机制", "先解决最常见的行动问题。", faqDetail("没有特殊描述时，窥探从哪里开始？", "默认从情报卡组顶部向下执行；“正向窥探”也指从顶部向下。", true) + faqDetail("【照亮前路 · I】什么时候可以生效？", "它可以在以下情况下生效：即时行动打出并指定你时；个体机制打出并对你布置时；个体机制满足条件触发时（如【盲从 · I】）；个体机制持续对你生效时（如【俄罗斯转轮 · I】）。不必在俄罗斯转轮首次生效的瞬间触发照亮前路。", false) + faqDetail("【俄罗斯转轮 · I】可以和【砥砺前行 · I】互动吗？", "不可以。俄罗斯转轮必须结算完成，才能使用下一张卡牌。"))}
    ${faqGroup("INVESTIGATORS / 调查员", "仿生人与 SAN。", faqDetail("仿生人可以成为消耗 SAN 的目标吗？", "不可以。两位仿生人的过热/过载效果是“消耗队友 (1) 点 SAN”，而仿生人没有 SAN，因此不能成为指定对象，也不能恢复 SAN。", true) + faqDetail("初火、癫火和禁忌真相对仿生人分别如何处理？", "【初火】、【癫火】结算时会略过仿生人；禁忌真相伤害加深类效果对仿生人依然有效；【献祭】不能以仿生人为指定对象。"))}
    ${faqGroup("ENVIRONMENT / 环境卡牌", "平均分配与计数。", faqDetail("【降雨概率】遇到被洗回的【禁忌真相】怎么办？", "如果玩家通过任何手段洗回【禁忌真相】（例如使用【直视神】），降雨概率的计数不上升。如果计数已经达到 (N)，则下一个调查到禁忌真相的调查员消耗 SAN。", true) + faqDetail("【初火】如何集中同队的 SAN？", "初火只在同一队伍内结算，将所有 SAN 集中到“尽可能少”的调查员；不能超过原有 SAN 上限，也可能让清醒者疯狂或让疯狂者恢复清醒。若队友是【中之人】，则全部集中到【中之人】。例如 SAN 为 3、2、1 时，结果为 3、3、0。出现多种最小变动方案时，由对应指挥者决定。") + faqDetail("【癫火】如何平均分配 SAN？", "癫火只在同一队伍内结算。由高 SAN 调查员向低 SAN 调查员匀 SAN，例如 3、0、1 会变成 2、1、1。若存在多个满足最小变动量的结果，由指挥者决定；若当前已经平均（例如 2、3），不能为了交换位置而调整成 3、2。") + faqDetail("【许愿池】为什么不能调用【献祭】或【俄罗斯转轮】？", "因为这些卡牌的效果需要涉及 (2) 位调查员；许愿池无法满足这个调用条件。"))}
    ${faqGroup("PRINT ERRATA / 印刷相关", "把实体印刷与当前文本对齐。", faqDetail("当前仍未修复的印刷问题是什么？", "【劳改犯】的调查员指示卡名称被错误印刷为【老侦探】的名称【菲利普 · 钱德勒】（双面皆是），实际应该为【丹泽 · 罗比】。", true) + faqDetail("标准版 2.0 已修复了哪些问题？", "【目击者】的疯狂技能【疯狂蔓延 · 目击者】中错误印刷了“紧急真相”，应为“禁忌真相”；【老侦探】的清醒技能【博学多闻】中，加入目标错误写成“手牌”，实际应为加入自己的“情报区”。") + faqDetail("卡牌印刷与规则文本冲突时怎么办？", "优先查阅最新版规则指引书、调查附录与 FAQ；实体卡牌的印刷问题以已公开的勘误为准。"))}
    <div class="rules-callout is-ink"><span class="callout-label">OPEN CASE</span><p>规则书中没有写明的情况，请和同桌讨论并达成共识后继续游戏。如果同一问题反复出现，反馈给制作团队，纳入后续版本。</p></div>
    ${sourcePanel("FAQ 会和规则一起更新。", "当前页面整理自共享资料库中的《FAQ》；每张卡牌的具体版本与效果请继续前往卡牌 Wiki 对照。")}
  </article>`,
  `<div class="subpage-sidebar-card"><span>FAQ / 09</span><strong>已归档判例</strong><p>机制、调查员、环境与印刷勘误的快速查找页。</p></div><nav class="subpage-sidebar-links" aria-label="FAQ 导航"><a href="#game-mechanics">游戏机制</a><a href="#investigators">调查员</a><a href="#environment">环境卡牌</a><a href="#print-errata">印刷相关</a><a href="/investigation-delve-boardgame/appendix">调查附录 →</a></nav>`
);

const cardMeta = (label: string, value: string) => value ? `<div><span>${label}</span><b>${lineBreaks(value)}</b></div>` : "";
const cardMarkup = (card: InvestigationCard) => {
  const meta = card.category === "investigator"
    ? [cardMeta("职业", card.type), cardMeta("调查风格", card.style), cardMeta("SAN", card.san), cardMeta("包含版本", card.edition), cardMeta("说明更新", card.update)].join("")
    : [cardMeta("类型", card.type), cardMeta("费用", card.cost), cardMeta("数量", card.quantity), cardMeta("包含版本", card.edition), cardMeta("说明更新", card.update)].join("");
  const abilities = card.category === "investigator"
    ? `<div class="card-text-block"><span>清醒技能</span><p>${lineBreaks(card.awake) || "暂无独立文本"}</p></div><div class="card-text-block is-madness"><span>疯狂技能</span><p>${lineBreaks(card.madness) || "暂无独立文本"}</p></div>`
    : `<div class="card-text-block"><span>卡牌效果</span><p>${lineBreaks(card.effect) || "暂无独立文本"}</p></div>`;
  return `<article class="wiki-card wiki-card-${card.category}" data-card-searchable data-card-category="${card.category}" data-card-name="${escapeHtml(`${card.name} ${card.type} ${card.style} ${card.effect} ${card.awake} ${card.madness}`.toLocaleLowerCase())}"><details><summary><span class="wiki-card-index">${card.categoryLabel}</span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.edition || "SHARED")}</small><i>+</i></summary><div class="wiki-card-body"><div class="wiki-card-meta">${meta}</div>${abilities}</div></details></article>`;
};

const renderWikiPage = () => {
  const categories = (Object.keys(cardCategoryMeta) as CardCategory[]);
  const categoryButtons = categories.map((category) => `<button type="button" data-card-filter="${category}">${cardCategoryMeta[category].label}<span>${cardSets[category].length}</span></button>`).join("");
  const cardCards = allInvestigationCards.map(cardMarkup).join("");
  return subpageShell(
    "wiki",
    subpageHero("CARD WIKI / 卡牌索引", "所有卡牌，放回同一张桌面。", "这是《调查深入》的可检索卡牌 Wiki。数据直接来自共享卡牌统计表，按类别、版本、费用与效果整理；展开任意卡片即可查看完整文本。", "wiki"),
    `<article class="subpage-article wiki-article">
      <div class="wiki-intro-bar"><div><p class="chapter-label">LIVE CARD INDEX / 当前卡牌索引</p><h2>逐张查牌，不再翻箱倒柜。</h2></div><div class="wiki-counts">${categories.map((category) => `<div><strong>${cardSets[category].length}</strong><span>${cardCategoryMeta[category].label}</span></div>`).join("")}</div></div>
      <div class="wiki-controls"><label class="wiki-search"><span>SEARCH / 搜索卡牌</span><input id="wiki-search-input" type="search" placeholder="输入卡名、职业或效果" autocomplete="off" /><b>⌕</b></label><div class="wiki-filters" role="group" aria-label="卡牌类别筛选"><button type="button" class="is-active" data-card-filter="all">全部<span>${allInvestigationCards.length}</span></button>${categoryButtons}</div><p id="wiki-search-status">显示全部 ${allInvestigationCards.length} 张卡牌</p></div>
      <div class="wiki-grid">${cardCards}</div>
      ${sourcePanel("Wiki 的每一张卡牌都有来源。", "调查员、策略、环境、情报与辅助五类数据都从《调查深入 · 卡牌统计表》导入；“说明更新版本”用于判断当前文本应匹配哪一版规则。", "DATA / 数据来源")}
    </article>`,
    `<div class="subpage-sidebar-card"><span>WIKI / 10</span><strong>${allInvestigationCards.length} 张卡牌</strong><p>五个类别，一套可搜索的规则资料索引。</p></div><nav class="subpage-sidebar-links" aria-label="Wiki 导航"><a href="#wiki-search-input">搜索与筛选</a><a href="/investigation-delve-boardgame/appendix">特殊行动词典 →</a><a href="/investigation-delve-boardgame/faq">FAQ 判例 →</a></nav>`
  );
};

const setupRulesInteractions = () => {
  const page = document.querySelector<HTMLElement>(".rules-page");
  const input = document.querySelector<HTMLInputElement>("#rules-search-input");
  const status = document.querySelector<HTMLElement>("#rules-search-status");
  const chapters = [...document.querySelectorAll<HTMLElement>("[data-rule-searchable]")];
  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".rules-toc a")];

  input?.addEventListener("input", () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    chapters.forEach((chapter) => {
      const matches = !query || (chapter.textContent ?? "").toLocaleLowerCase().includes(query);
      chapter.hidden = !matches;
      if (matches) visible += 1;
    });
    if (status) status.textContent = query ? `${visible} 个章节匹配“${input.value.trim()}”` : "显示全部章节";
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${(entry.target as HTMLElement).id}`));
    }), { rootMargin: "-18% 0px -64% 0px", threshold: 0 });
    chapters.forEach((chapter) => observer.observe(chapter));
  }

  page?.querySelectorAll<HTMLDetailsElement>("details").forEach((detail) => detail.addEventListener("toggle", () => detail.classList.toggle("is-open", detail.open)));

  const wikiInput = document.querySelector<HTMLInputElement>("#wiki-search-input");
  const wikiStatus = document.querySelector<HTMLElement>("#wiki-search-status");
  const wikiCards = [...document.querySelectorAll<HTMLElement>("[data-card-searchable]")];
  const filterButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-card-filter]")];
  let selectedCategory = "all";
  const updateWiki = () => {
    const query = wikiInput?.value.trim().toLocaleLowerCase() ?? "";
    let visible = 0;
    wikiCards.forEach((card) => {
      const matchesCategory = selectedCategory === "all" || card.dataset.cardCategory === selectedCategory;
      const matchesQuery = !query || (card.dataset.cardName ?? "").includes(query);
      card.hidden = !(matchesCategory && matchesQuery);
      if (!card.hidden) visible += 1;
    });
    if (wikiStatus) wikiStatus.textContent = query ? `${visible} 张卡牌匹配“${wikiInput?.value.trim() ?? ""}”` : `显示 ${visible} 张卡牌`;
  };
  wikiInput?.addEventListener("input", updateWiki);
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    selectedCategory = button.dataset.cardFilter ?? "all";
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    updateWiki();
  }));
};

export const bootRulesPage = (): boolean => {
  const pathname = window.location.pathname;
  if (!pathname.startsWith("/investigation-delve-boardgame") && !pathname.startsWith("/games/investigation-delve/rules")) return false;

  const route = pathname.includes("/appendix") ? "appendix" : pathname.includes("/faq") ? "faq" : pathname.includes("/wiki") ? "wiki" : "rules";
  const renderPage = route === "appendix" ? renderAppendixPage : route === "faq" ? renderFaqPage : route === "wiki" ? renderWikiPage : renderRulesPage;
  const titles = {
    rules: "调查深入 · 规则指引书",
    appendix: "调查深入 · 调查附录",
    faq: "调查深入 · FAQ",
    wiki: "调查深入 · 卡牌 Wiki",
  };

  document.documentElement.lang = "zh-CN";
  document.title = `${titles[route]} — FreshLi4`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", `《调查深入》${titles[route].replace("调查深入 · ", "")}：规则、判例、特殊行动与完整卡牌索引。FreshLi4 新鲜李四游戏工作室。` );
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0d0d0d");
  document.body.dataset.theme = "investigation";
  document.body.classList.add("is-rules-page");
  document.querySelector<HTMLElement>("#top")!.innerHTML = `<div id="rules-mount"></div><div id="games-mount" hidden></div>`;
  document.querySelector<HTMLElement>("#rules-mount")!.innerHTML = renderPage();
  document.querySelector(".site-header")?.classList.add("is-hidden-on-rules");
  document.querySelector("#mobile-menu")?.remove();
  setupRulesInteractions();
  return true;
};
