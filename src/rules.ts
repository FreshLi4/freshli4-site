import "./rules.css";
import { allInvestigationCards, cardCategoryMeta, cardSets, wikiDocumentById, type CardCategory, type InvestigationCard } from "./investigation-data";
import { searchWikiDocuments, shouldRouteToAi, type WikiSearchHit } from "./wiki-search";
import { localizeWikiHtml, localizeWikiText, localizeWikiTree, type WikiLanguage } from "./wiki-i18n";

const investigationVisualFiles = import.meta.glob("/asset/investigation-delve/visual-content/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const investigationVisual = (fileName: string) => investigationVisualFiles[`/asset/investigation-delve/visual-content/${fileName}`] ?? "";

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
const originalParagraph = (content: string) => `<p class="rules-original">${content}</p>`;
const originalList = (items: string[], ordered = false) => `<div class="rules-original">${list(items, ordered)}</div>`;
const originalCallout = (label: string, content: string, tone = "") => `<aside class="rules-callout rules-original ${tone}"><span class="callout-label">${label}</span><p>${content}</p></aside>`;
const stat = (value: string, label: string, note: string) => `<div class="rule-stat"><strong>${value}</strong><span>${label}</span><small>${note}</small></div>`;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const lineBreaks = (value: string) => escapeHtml(value).replace(/\n/g, "<br />");

type PagefindResult = {
  url?: string;
  excerpt?: string;
  plain_excerpt?: string;
  meta?: Record<string, string>;
};

type PagefindRuntime = {
  search: (query: string) => Promise<{ results: Array<{ data: () => Promise<PagefindResult> }> }>;
};

let pagefindRuntimePromise: Promise<PagefindRuntime | null> | undefined;
const loadPagefind = () => {
  if (!pagefindRuntimePromise) {
    const pagefindPath = "/pagefind/pagefind.js";
    pagefindRuntimePromise = import(/* @vite-ignore */ pagefindPath)
      .then((module) => module as unknown as PagefindRuntime)
      .catch(() => null);
  }
  return pagefindRuntimePromise;
};

const pagefindHits = async (query: string, localHits: WikiSearchHit[]) => {
  const runtime = await loadPagefind();
  if (!runtime) return localHits;
  try {
    const result = await runtime.search(query);
    const localById = new Map(searchWikiDocuments(query, 128).map((hit) => [hit.document.id, hit]));
    const hits = await Promise.all(result.results.slice(0, 8).map(async (rawResult) => {
      const data = await rawResult.data();
      const id = data.meta?.id;
      const localHit = id ? localById.get(id) : undefined;
      if (!localHit) return undefined;
      const pagefindExcerpt = data.plain_excerpt || data.excerpt?.replace(/<[^>]+>/g, "");
      return { ...localHit, excerpt: pagefindExcerpt || localHit.excerpt };
    }));
    const resolved = hits.filter((hit): hit is WikiSearchHit => Boolean(hit));
    return resolved.length ? resolved : localHits;
  } catch {
    return localHits;
  }
};

type RulesRoute = "home" | "rules" | "appendix" | "faq" | "wiki";

const rulesToc = (className = "rules-toc") => `<nav class="${className}" aria-label="规则章节导航"><p>CASE INDEX</p><a href="#quick-start" class="is-current"><span>00</span>快速游玩</a><a href="#briefing"><span>01</span>任务简报</a><a href="#components"><span>02</span>游戏配件</a><a href="#setup"><span>03</span>游戏准备</a><a href="#round"><span>04</span>一轮游戏</a><a href="#operation"><span>05</span>操作阶段</a><a href="#san"><span>06</span>SAN 与疯狂</a><a href="#victory"><span>07</span>胜负判定</a><a href="#appendix"><span>08</span>调查附录</a><a href="#faq"><span>09</span>FAQ</a></nav>`;

const routeLinks = (active: RulesRoute) => `
  <nav class="rules-route-nav" aria-label="调查深入资料导航">
    <button class="rules-route-menu-toggle" type="button" aria-expanded="false" aria-controls="rules-route-menu-panel">资料导航 <span aria-hidden="true">⌄</span></button>
    <div class="rules-route-menu-panel" id="rules-route-menu-panel">
      <div class="rules-route-links">
        <a class="${active === "rules" ? "is-current" : ""}" href="/investigation-delve-boardgame/rules">规则书<span>RULEBOOK</span></a>
        <a class="${active === "appendix" ? "is-current" : ""}" href="/investigation-delve-boardgame/appendix">调查附录<span>APPENDIX</span></a>
        <a class="${active === "faq" ? "is-current" : ""}" href="/investigation-delve-boardgame/faq">FAQ<span>RULINGS</span></a>
        <a class="${active === "wiki" ? "is-current" : ""}" href="/investigation-delve-boardgame/wiki">卡牌 Wiki<span>CARD INDEX</span></a>
      </div>
      ${active === "rules" ? rulesToc("rules-toc rules-toc-mobile") : ""}
      <div class="rules-route-tools">
        <label class="rules-language"><select id="rules-language-select" aria-label="选择语言"><option value="zh">中文</option><option value="en">English</option><option value="ja">日本語</option></select></label>
        <a href="/">返回官网 <b aria-hidden="true">↗</b></a>
      </div>
    </div>
  </nav>`;

const rulesHeader = (active: RulesRoute) => `
  <header class="rules-header">
    <a class="rules-brand" href="/investigation-delve-boardgame" aria-label="返回调查深入桌游首页"><img class="rules-brand-logo" src="/investigation-delve-logo.png" alt="" aria-hidden="true" /><span><strong>调查深入</strong><small>INVESTIGATION : DELVE</small></span></a>
    ${routeLinks(active)}
  </header>`;

const referenceFigure = (src: string, alt: string, caption: string, note: string) => `
  <figure class="rules-reference-figure">
    <div class="rules-reference-image"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" /></div>
    <figcaption><span>${escapeHtml(caption)}</span><b>${escapeHtml(note)}</b></figcaption>
  </figure>`;

const subpageHero = (kicker: string, title: string, dek: string, active: "appendix" | "faq" | "wiki") => {
  const indexLabel = active === "wiki" ? "规则 / 百科" : `FILE / ${active.toUpperCase()}`;
  const versionLabel = active === "wiki" ? "v1.1" : "v1.1 · LIVE REFERENCE";
  return `
    <section class="rules-subpage-hero" aria-labelledby="subpage-title">
      <div><p class="rules-kicker">${kicker}</p><h1 id="subpage-title">${title}</h1><p class="rules-dek rules-editorial">${dek}</p></div>
      <div class="subpage-index"><span>INVESTIGATION : DELVE</span><strong>${indexLabel}</strong><small>${versionLabel}</small></div>
    </section>`;
};

const subpageShell = (active: "appendix" | "faq" | "wiki", hero: string, content: string, sidebar: string) => `
  <div class="rules-page rules-subpage rules-subpage-${active}">
    ${rulesHeader(active)}
    <main class="rules-layout" id="rules">${hero}<div class="rules-body"><aside class="rules-sidebar rules-subpage-sidebar">${sidebar}</aside><div class="rules-content">${content}</div></div></main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

const sourceDocument = (documentId: string) => {
  const document = wikiDocumentById[documentId];
  if (!document) return "";
  return `<details class="wiki-source-document"><summary>打开规范 Markdown 文档 <span>+</span></summary><div class="wiki-source-document-body" data-wiki-localize="${escapeHtml(document.id)}">${document.html}</div><p class="wiki-source-path">${escapeHtml(document.sourcePath)}</p></details>`;
};

const sourcePanel = (title: string, content: string, label = "SOURCE / 资料来源", documentId = "") => `<div class="source-panel"><p class="chapter-label">${label}</p><h3>${title}</h3><p class="rules-editorial">${content}</p><div><span>CANONICAL SOURCE</span><b>SHARED / DELVE</b></div>${documentId ? sourceDocument(documentId) : ""}</div>`;

const renderInvestigationHome = () => `
  <div class="rules-page rules-home">
    ${rulesHeader("home")}

    <main class="rules-layout" id="rules">
      <section class="rules-home-hero" aria-labelledby="investigation-home-title">
        <div class="rules-home-copy">
          <p class="rules-kicker">INVESTIGATION : DELVE / 调查深入</p>
          <h1 id="investigation-home-title">调查<br /><em>深入</em></h1>
          <p class="rules-hero-english">A NON-DIRECT-CONFLICT TABLETOP GAME</p>
          <p class="rules-dek rules-editorial">一款支持 2–6 人游玩的非直接对战美式桌游。你将扮演“指挥者”，操控调查员，在调查中规避禁忌真相，并诱导对手比你更早陷入疯狂。</p>
          <div class="rules-hero-actions"><span class="rules-edition">2—6 人<br />策略 · 调查 · 卡牌</span></div>
        </div>
        <div class="rules-home-visual">
          <img src="${investigationVisual("3-游戏配件-1.png")}" alt="《调查深入》游戏配件与卡牌" />
          <span class="home-visual-stamp">ANOMALY<br /><small>FILE / 0001</small></span>
          <span class="home-visual-note">INVESTIGATION<br />STARTS HERE</span>
        </div>
      </section>

      <section class="rules-home-intro" aria-labelledby="investigation-intro-title">
        <div><p class="chapter-label">THE ANOMALY</p><h2 id="investigation-intro-title">调查异常环境，<br /><em>谨慎追寻真相。</em></h2></div>
        <div><p class="rules-original">在《调查 : 深入》的游戏中，每名玩家扮演一位「指挥者」，指挥「调查员」对「情报卡组」进行调查，尝试了解【禁忌真相】在「情报卡组」中的位置，让自己的「调查员」规避它，并让其他队伍的「调查员」调查到【禁忌真相】。</p><p class="rules-original">「调查员」调查到【禁忌真相】会损失「SAN」，「SAN」消耗完的「调查员」会「陷入疯狂」。</p></div>
      </section>

      <section class="rules-ai" id="rules-ai" aria-labelledby="rules-ai-title">
        <div class="rules-ai-heading"><p class="chapter-label">AI Q&A / 规则问答</p><h2 id="rules-ai-title">问你想问的，<br />工会总有答案</h2><p>输入任意问题，获得规则解答或者指引</p></div>
        <div class="rules-ai-panel">
          <form id="rules-ai-form" class="rules-ai-form">
            <label for="rules-ai-input">向调查助手提问</label>
            <div><input id="rules-ai-input" type="search" placeholder="例如：调查到禁忌真相后会发生什么？" autocomplete="off" /><button type="submit">查询 <span aria-hidden="true">↗</span></button></div>
          </form>
          <div class="rules-ai-prompts" aria-label="常用问题"><button type="button" data-rules-ai-prompt="游戏支持几个人？">支持几个人？</button><button type="button" data-rules-ai-prompt="SAN 归零怎么办？">SAN 归零怎么办？</button><button type="button" data-rules-ai-prompt="怎样获胜？">怎样获胜？</button></div>
          <div class="rules-search-results" id="rules-search-results" aria-live="polite"></div>
          <div class="rules-ai-answer" id="rules-ai-answer" aria-live="polite"><span>ASSISTANT / READY</span><p class="rules-editorial">选择一个问题，或者输入你想确认的规则。</p></div>
        </div>
      </section>

      <section class="rules-portals" aria-labelledby="rules-portals-title">
        <div class="rules-portals-heading"><p class="chapter-label">CASE FILES / 资料入口</p><h2 id="rules-portals-title">四个页面，<br />从不同角度继续调查。</h2></div>
        <div class="rules-portal-grid">
          <a class="rules-portal-card" href="/investigation-delve-boardgame/rules"><span>01 / RULEBOOK</span><strong>规则书</strong><p>从快速游玩开始，按章节了解完整流程。</p><b aria-hidden="true">↗</b></a>
          <a class="rules-portal-card" href="/investigation-delve-boardgame/appendix"><span>02 / APPENDIX</span><strong>调查附录</strong><p>统一行动词典、文本标识与版本边界。</p><b aria-hidden="true">↗</b></a>
          <a class="rules-portal-card" href="/investigation-delve-boardgame/faq"><span>03 / RULINGS</span><strong>FAQ</strong><p>查看常见机制、调查员与印刷判例。</p><b aria-hidden="true">↗</b></a>
          <a class="rules-portal-card" href="/investigation-delve-boardgame/wiki"><span>04 / CARD INDEX</span><strong>卡牌 Wiki</strong><p>搜索调查员、策略、环境、情报与辅助卡牌。</p><b aria-hidden="true">↗</b></a>
        </div>
      </section>
    </main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

const renderRulesPage = () => `
  <div class="rules-page rules-rulebook">
    ${rulesHeader("rules")}

    <main class="rules-layout" id="rules">
      <section class="rules-overview" aria-label="规则书概览">
        <div class="rules-overview-intro"><p class="chapter-label">READING NOTES / 阅读提示</p><h2>规则是地图，<br />不是答案。</h2><p class="rules-original">规则指引书里没说怎么办？</p><p class="rules-original">对于首次体验《调查 : 深入》的玩家，我们建议先以标注了Vol.1脚标的卡牌组成卡组，进行游戏。</p><p class="rules-original">当你熟悉了游戏流程，将标注了Vol.2脚标的卡牌加入各个卡组，以获得完整体验。</p></div>
        <div class="rules-stats">
          ${stat("2—6", "PLAYERS", "玩家人数")}
          ${stat("4", "DECKS", "四类卡组")}
          ${stat("∞", "PRESSURE", "理智压力")}
        </div>
      </section>

      <div class="rules-body">
        <aside class="rules-sidebar" aria-label="规则章节导航">
          <div class="rules-search"><label for="rules-search-input">SEARCH / 搜索</label><div><input id="rules-search-input" type="search" placeholder="搜索规则关键词" autocomplete="off" /><span aria-hidden="true">⌕</span></div><small id="rules-search-status">显示全部章节</small></div>
          ${rulesToc()}
          <div class="rules-sidebar-note"><span>CASE NOTE</span><p>规则书中没有写明的情况，请和同桌讨论后达成共识，继续调查。</p><a href="/investigation-delve-boardgame/wiki">浏览全部卡牌 →</a></div>
        </aside>

        <div class="rules-content">
          ${section("quick-start", "00", "QUICK START / 快速游玩流程", "快速游玩流程指南。", `
            ${originalCallout("规则指引书里没说怎么办？", "即使你已经玩过很多次《调查 : 深入》，即使我们已经尽力让这份《规则指引书》尽善尽美，有时也会遇到规则指引书中未明确规定的情况。请不要过于纠结，和大家商量达成共识后继续游戏。", "is-red")}
            ${originalParagraph("对于首次体验《调查 : 深入》的玩家，我们建议先以标注了Vol.1脚标的卡牌组成卡组，进行游戏。")}
            ${originalParagraph("当你熟悉了游戏流程，将标注了Vol.2脚标的卡牌加入各个卡组，以获得完整体验。")}
            <div class="flow-list rules-original">
              <div><b>01</b><span>「指挥者」确认组队情况，选择「调查员」，随机分配「调查顺位」</span></div>
              <div><b>02</b><span>「指挥者」抽取(4)张初始手牌</span></div>
              <div><b>03</b><span>开始一「轮」游戏，触发一张新的「环境」卡牌</span></div>
              <div><b>04</b><span>「调查员」依照「调查顺位」轮流进行「操作阶段」</span></div>
              <div><b>05</b><span>「操作阶段」开始、进入与结束时，依照规则执行对应操作</span></div>
              <div><b>06</b><span>【禁忌真相】被调查，（或基于其他「环境」效果本「轮」结束）</span></div>
              <div><b>07</b><span>结算「SAN」消耗，收回场上所有「情报」卡牌，开始下一「轮」游戏。回到步骤3。</span></div>
              <div><b>08</b><span>仅剩一个队伍「调查员」存活，胜负已定。</span></div>
            </div>
          `)}

          ${section("briefing", "01", "BRIEFING / 任务简报", "欢迎回到调查现场。", `
            ${originalParagraph("欢迎回来，这里是「异常联合调查工会」（Investigation Guild of Anomaly），通常被简称为「调查工会」。我们是一个跨国独立组织，成员围绕一些基本的规则，各自在自己的行动范围内执行任务。")}
            ${originalParagraph("你是「调查工会」的一名「指挥者」，能有这样的身份，说明你已经熬过了最困难的头几年，不仅活了下来，而且还神志清醒地坚持留在了这里。坐到这个位置，你已经不需要实地执行任务，你的工作就是为你的「调查员」在任务过程中下发「策略」指令，通过经验、直觉和智慧引领他们完成任务。")}
            ${originalParagraph("每次任务中，你都需要应对不同的异常「环境」，你将会揭示其中的【禁忌真相】所在。「情报」虽然是多多益善，但调查到【禁忌真相】却十分危险，频繁调查到【禁忌真相】的「调查员」往往都会「陷入疯狂」。")}
            <div class="briefing-columns"><div><span class="column-label">指挥者</span>${originalParagraph("你的工作就是为你的「调查员」在任务过程中下发「策略」指令，通过经验、直觉和智慧引领他们完成任务。")}</div><div><span class="column-label">调查员</span>${originalParagraph("「调查员」调查到【禁忌真相】会损失「SAN」，「SAN」消耗完的「调查员」会「陷入疯狂」。")}</div><div><span class="column-label">环境</span>${originalParagraph("每一「轮」游戏都伴随与众不同的「环境」卡牌开展，给玩家们带来新的威胁（又或者机遇？）。")}</div></div>
          `)}

          ${section("components", "02", "COMPONENTS / 游戏配件", "四类卡组，一张真相。", `
            ${originalParagraph("关于卡牌的详细介绍，以及众筹版/补充包信息，请参考《调查深入 · 卡牌统计表》。")}
            <div class="component-grid rules-original"><div><strong>策略</strong><span>STRATEGY</span><p>将「策略」卡牌各自洗切整理成一堆。</p></div><div><strong>情报</strong><span>INTEL</span><p>将「情报」卡牌各自洗切整理成一堆。</p></div><div><strong>环境</strong><span>ENVIRONMENT</span><p>将「环境」卡牌各自洗切整理成一堆。</p></div><div><strong>辅助</strong><span>SUPPORT</span><p>将「辅助」卡牌各自洗切整理成一堆。</p></div></div>
            <div class="rules-reference-grid">
              ${referenceFigure(investigationVisual("3-游戏配件-1.png"), "《调查深入》打开的游戏盒与配件", "FIG. 02-A / 配件索引", "先认出四类卡组，再开始布置。")}
              ${referenceFigure(investigationVisual("6-游戏配件-4.png"), "《调查深入》盒内的卡牌与骰子配件", "FIG. 02-B / COMPONENTS", "骰子记录 SAN，卡牌按类型分区。")}
            </div>
            ${callout("卡牌统计", "当前数据源包含 20 位调查员、39 种策略、21 种环境、8 种辅助，以及 25 张情报牌（其中包含 1 张【禁忌真相】）。", "is-ink")}
          `)}

          ${section("setup", "03", "SETUP / 游戏准备", "把桌面变成调查现场。", `
            <h3>准备卡组</h3>
            ${originalParagraph("将「策略」、「情报」、「环境」、「辅助」卡牌各自洗切整理成一堆，分别组成(4)组卡组。")}
            <h3>确定「指挥者」人数</h3>
            ${originalParagraph("《调查 : 深入》支持2~6名玩家游玩。若是组队对战，同一队伍的各位「指挥者」会共享「情报区」的「情报」卡牌（使用或消耗），共享获得的信息（手牌或「情报」相关），但只能指挥自己的「调查员」、使用自己的手牌。")}
            ${originalParagraph("原则上，同一队伍的信息共享仅限于窥探的信息，队友间不可互相检视手牌，沟通信息需公开对话。但玩家们可以按照实际游戏情况，选择合适的信息共享规则。")}
            <div class="rules-layout-guide"><div class="layout-guide-copy"><span>TABLE MAP / 桌面布置</span><h3>先给每一叠牌找到位置。</h3><p>将调查员顺位、情报区与四类卡组拉开距离。桌面布局不是装饰，它让“谁能看见什么”变得清楚。</p></div><div class="layout-guide-map"><i class="layout-zone zone-turn">调查员顺位</i><i class="layout-zone zone-intel">情报区</i><i class="layout-zone zone-strategy">策略卡组</i><i class="layout-zone zone-env">环境卡组</i><i class="layout-zone zone-support">辅助卡组</i><i class="layout-zone zone-deck">情报卡组</i><span class="layout-arrow arrow-one">↘</span><span class="layout-arrow arrow-two">↗</span></div></div>
            <h3>分配「调查员」</h3>
            ${originalParagraph("每位「指挥者」会被派发(2 × N)张候选的「调查员」卡牌，从中选取指挥(N)位「调查员」，建议以如下配比进行游戏：")}
            <div class="player-ratios rules-original"><div><b>2 位玩家</b><span>分别在2个队伍；每人指挥2位「调查员」</span></div><div><b>3 位玩家</b><span>分别在3个队伍；每人指挥2位「调查员」</span></div><div><b>4 位玩家</b><span>分别在2个队伍；每人指挥1位「调查员」</span></div><div><b>6 位玩家</b><span>分别在2个或3个队伍；每人指挥1位「调查员」</span></div></div>
            ${originalParagraph("玩家也可以其他配比开始游戏，场上开局时调查员数量需≥4。")}
            <h3>分配「调查顺位」</h3>
            ${originalParagraph("将参与本局游戏的「调查员指示卡」洗切，随机布置到场上的「顺位指示卡」边。")}
            <h3>记录「SAN」与抽取初始手牌</h3>
            ${originalList(["卡牌右上角的骰子点数，标识该「调查员」的「SAN」上限。", "将(1)个骰子以「SAN」上限的点数朝上，放到该处，用以记录该「调查员」的当前「SAN」。多余的骰子可以放置到一边待用。", "各位「指挥者」需要按「调查员」的「调查顺位」，依次从「策略卡组」抽取(4)张「策略」卡牌纳入手牌。", "确认完成以上步骤后，你们可以参照下图“场地布置”，设置你们的桌面（以6位玩家，分属2个队伍为例），或选择适合你们的布局。"])}
          `)}

          ${section("round", "04", "ROUND / 轮次结构", "每一轮，真相都更近一点。", `
            ${originalParagraph("每局游戏开始后，将以多「轮」游戏进行推进。")}
            <div class="timeline rules-original"><div class="timeline-step"><span>01</span><div><b>触发「环境」卡牌</b><p>每「轮」游戏开始前，从「环境卡组」顶部抽取(1)张「环境」卡牌，该卡牌卡面效果在本「轮」内会对所有「调查员」持续生效。若本「轮」并非第一「轮」游戏，这张新的「环境」卡牌会代替上一轮的「环境」卡牌生效（上一「轮」的「环境」卡牌不洗回「环境卡组」）。</p></div></div><div class="timeline-step"><span>02</span><div><b>新一「轮」游戏开始</b><p>每「轮」游戏由上一「轮」调查到【禁忌真相】的「调查员」先执行「操作阶段」。如果这是第一「轮」游戏，第(1)顺位的「调查员」先执行「操作阶段」。</p></div></div><div class="timeline-step"><span>03</span><div><b>轮流进行「操作阶段」</b><p>每一「轮」游戏包含不限数量的「操作阶段」，每位「指挥者」指挥对应「调查员」在其「操作阶段」内行动。</p></div></div><div class="timeline-step"><span>04</span><div><b>结束一「轮」游戏</b><p>任意「调查员」调查到【禁忌真相】时，本「轮」游戏结束。该「调查员」的「SAN」将相应减少（无特殊效果时，减少(1)点「SAN」）。收回场上所有的「情报」卡牌，洗切组成新的「情报卡组」。</p></div></div></div>
            ${originalCallout("规则指引书原文", "各位「指挥者」的手牌、场上已布置的「个体机制」均不变。此后，下一「轮」游戏开始。", "is-red")}
          `)}

          ${section("operation", "05", "OPERATION / 操作阶段", "三段式行动，顺序很重要。", `
            ${originalParagraph("每一「轮」游戏包含不限数量的「操作阶段」，每位「指挥者」指挥对应「调查员」在其「操作阶段」内行动。「操作阶段」分为以下3个步骤：")}
            <div class="operation-grid rules-original"><div class="operation-card"><span>01 / START</span><h3>开始「操作阶段」</h3>${originalList(["判定「环境」、已经对「调查员」布置的「个体机制」或「调查员」技能，是否有可以/必须触发生效的，如有，触发卡牌或技能。", "从「策略卡组」顶部抽(1)张牌，加入手牌。"])}</div><div class="operation-card is-active"><span>02 / MAIN</span><h3>进入「操作阶段」</h3>${originalList(["对「情报卡组」进行调查（从「情报卡组」顶部，顺序翻看并公示(1)~(3)张「情报」卡牌，然后纳入自己的「情报区」）。如无特殊描述，每位「调查员」每个「操作阶段」必须、且只能执行一次调查。", "使用「情报区」的「情报」卡牌，执行其卡面效果。该行动可以不限次数自由执行。", "使用自己手牌中的「策略」卡牌（通常需要消耗「情报区」的「情报」卡牌），该行动可以不限次数自由执行。", "触发可以或必须在「操作阶段」使用的的「个体机制」，如无特殊说明，可以不限数量使用所有布置在当前「调查员」身上的「个体机制」。", "使用「调查员」的技能，如无特殊说明，可以不限次数使用任意技能。"])}</div><div class="operation-card"><span>03 / END</span><h3>结束「操作阶段」</h3>${originalList(["判定「环境」卡牌、已经对「调查员」布置的「个体机制」，或「调查员」技能是否有可以/必须触发生效的，如有，触发卡牌或技能。", "「调查员」的「指挥者」需要将手牌弃置到 ≤ (8)张。"])}</div></div>
            <div class="investigate-rule rules-original"><span class="rule-sigil">↳</span><div><strong>调查</strong><p>从「情报卡组」顶部，顺序翻看并公示(1)~(3)张「情报」卡牌，然后纳入自己的「情报区」。如无特殊描述，每位「调查员」每个「操作阶段」必须、且只能执行一次调查。</p></div></div>
          `)}

          ${section("san", "06", "SAN / 理智与疯狂", "你可以知道很多，但不能承受一切。", `
            ${originalParagraph("任意「调查员」调查到【禁忌真相】时，本「轮」游戏结束。该「调查员」的「SAN」将相应减少（无特殊效果时，减少(1)点「SAN」）。")}
            <div class="rules-reference-grid rules-reference-grid-single">${referenceFigure(investigationVisual("13-游戏配件-11.png"), "《调查深入》情报卡牌与禁忌真相示例", "FIG. 06-A / 情报牌面", "情报区应当保持公示；禁忌真相是这一轮的警示线。")}</div>
            <div class="san-meter"><div class="san-meter-track"><span></span><span></span><span></span><span></span><span></span></div><div class="san-meter-legend"><b>清醒</b><span>每一次真相命中，压力都会留下痕迹。</span><b>疯狂</b></div></div>
            <div class="madness-columns rules-original"><div><h3>「SAN」归零的「调查员」</h3>${originalList(["若「调查员」因此导致「SAN」归零，其将会「陷入疯狂」。将其「调查员」卡牌与「调查员指示卡」翻面，所有对其布置的「个体机制」被弃置。", "「陷入疯狂」的「调查员」没有「操作阶段」，其调查顺位在所有判定中被自然跳过（如：下一顺位的「调查员」「陷入疯狂」，则针对下一顺位的效果将顺延到下下顺位）。", "「陷入疯狂」的「调查员」具有额外的【禁忌知识】和【疯狂蔓延】技能，如无特殊说明，在「调查员」「陷入疯狂」时立即触发。", "如无特殊说明，「陷入疯狂」的「调查员」无法成为卡牌的指定对象、也不受卡牌或技能的效果影响。", "由「调查员」的【疯狂蔓延】技能带来的「辅助」卡牌，依旧可以受到其他「策略」卡牌的影响，但需要检查其卡面文本。"])} </div><div><h3>恢复清醒</h3>${originalParagraph("「陷入疯狂」的「调查员」若通过任意手段恢复「SAN」，其将会「恢复清醒」并拥有恢复点数的「SAN」，没有「SAN」的特殊「调查员」无法用此手段「恢复清醒」。")}${originalCallout("规则指引书原文", "各位「指挥者」的手牌、场上已布置的「个体机制」均不变。此后，下一「轮」游戏开始。", "is-red")}</div></div>
          `)}

          ${section("victory", "07", "VICTORY / 胜负判定", "让别人的调查先结束。", `
            ${originalParagraph("其他队伍的所有「调查员」都「陷入疯狂」时，最后一只队伍及其「指挥者」获得游戏胜利。")}
            <div class="victory-card rules-original"><span>END CONDITION</span><strong>只剩一个队伍<br /><em>保持清醒</em></strong><p>若出现一个操作导致所有剩余「调查员」都「陷入疯狂」的情况，最后「陷入疯狂」的「调查员」及其所在队伍获得游戏胜利。</p></div>
          `)}

          ${section("appendix", "08", "APPENDIX / 调查附录", "特殊行动词典。", `
            ${paragraph("卡面中的特殊行动使用固定含义。若某张卡牌没有额外说明，就按以下定义处理。")}
            <div class="keyword-grid"><div><b>调查</b><span>从情报卡组顶部翻看并公示 1—3 张。</span></div><div><b>窥探</b><span>私下（队内）查看指定数量的情报牌后原样放回。</span></div><div><b>调整</b><span>将卡牌放回卡组或弃牌区的顶部、底部或原位。</span></div><div><b>跳过</b><span>本操作阶段无需且不能调查。</span></div><div><b>反转</b><span>反转当前调查顺序，将顺位指示卡翻面。</span></div><div><b>胁迫</b><span>最近一次调查的情报牌数量增加指定数值。</span></div><div><b>盲从</b><span>操作阶段开始后，必须首先进行调查。</span></div><div><b>回收</b><span>将卡牌移回上一个所在位置；若无说明，洗切该位置。</span></div></div>
            <a class="chapter-forward-link" href="/investigation-delve-boardgame/appendix">打开完整调查附录 →</a>
          `)}

          ${section("faq", "09", "FAQ / 规则判定", "遇到边界情况，先看这里。", `
            <div class="faq-list"><details open><summary>没有特殊描述时，窥探从哪里开始？<span>+</span></summary><p>默认从情报卡组顶部向下执行；「正向窥探」也指从顶部向下。</p></details><details><summary>仿生人可以成为消耗 SAN 的目标吗？<span>+</span></summary><p>不可以。仿生人没有 SAN，因此不能成为消耗队友 SAN 的指定对象，也不能恢复 SAN。</p></details><details><summary>调查到禁忌真相后又把它洗回去，降雨概率如何处理？<span>+</span></summary><p>如果通过任何手段洗回【禁忌真相】，计数不上升；若计数已经达到阈值，则下一个调查到【禁忌真相】的调查员消耗 SAN。</p></details><details><summary>卡牌印刷与规则文本冲突时怎么办？<span>+</span></summary><p>优先查阅最新版规则指引书、调查附录与 FAQ。实体卡牌的印刷问题以已公开的勘误为准。</p></details><details><summary>规则书中没有写明的情况怎么办？<span>+</span></summary><p>与同桌讨论并达成共识后继续游戏；如果该问题反复出现，建议反馈给制作团队，纳入后续规则更新。</p></details></div>
            <a class="chapter-forward-link" href="/investigation-delve-boardgame/faq">打开完整 FAQ →</a>
            ${sourcePanel("一份会继续生长的规则书。", "本页面根据《规则指引书 - v1.1》整理，并同步展示《调查附录》《FAQ》的核心内容。卡牌构成详见当前《调查深入 · 卡牌统计表》。", "SOURCE / 来源", "rulebook")}
          `)}
        </div>
      </div>
    </main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

const appendixItem = (name: string, description: string, note = "") => `<div class="appendix-entry"><div class="appendix-entry-heading"><b>${name}</b>${note ? `<span>${note}</span>` : ""}</div><p class="rules-editorial">${description}</p></div>`;

const renderAppendixPage = () => subpageShell(
  "appendix",
  subpageHero("APPENDIX / 调查附录", "定义的开始，<br />就是智慧的开始。", "特殊文本标识、行动词典，以及版本边界都集中在这里。它是规则书的判例层，也是查牌时最快的入口。", "appendix"),
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
    ${sourcePanel("附录与卡牌 Wiki 互相校验。", "附录负责定义词汇，Wiki 负责呈现每张卡牌的效果与说明更新版本；当卡牌印刷与当前规则冲突时，先看这里，再看 FAQ 的具体判例。", "SOURCE / 资料来源", "appendix")}
  </article>`,
  `<div class="subpage-sidebar-card"><span>APPENDIX / 08</span><strong>行动词典</strong><p>8 个特殊行动，构成所有卡面文本的共同语法。</p></div><nav class="subpage-sidebar-links" aria-label="附录导航"><a href="#markers">特殊文本标识</a><a href="#actions">特殊行动列表</a><a href="/investigation-delve-boardgame/faq">FAQ 判例 →</a><a href="/investigation-delve-boardgame/wiki">卡牌 Wiki →</a></nav>`
);

const faqDetail = (question: string, answer: string, open = false) => `<details${open ? " open" : ""}><summary>${question}<span>+</span></summary><div class="faq-answer rules-original">${answer}</div></details>`;
const faqGroup = (label: string, details: string) => `<section class="faq-group"><p class="chapter-label">${label}</p><div class="faq-list">${details}</div></section>`;

const renderFaqPage = () => subpageShell(
  "faq",
  subpageHero("FAQ / 规则判定", "明辨过往，<br />未雨绸缪。", "这里记录已经明确的机制判例、环境卡牌边界与印刷勘误。FAQ 是对规则正文的补充，不会取代最新版规则指引书。", "faq"),
  `<article class="subpage-article">
    ${faqGroup("GAME MECHANICS / 游戏机制", faqDetail("没有特殊描述时，窥探从哪里开始？", "默认从情报卡组顶部向下执行；“正向窥探”也指从顶部向下。", true) + faqDetail("【照亮前路 · I】什么时候可以生效？", "它可以在以下情况下生效：即时行动打出并指定你时；个体机制打出并对你布置时；个体机制满足条件触发时（如【盲从 · I】）；个体机制持续对你生效时（如【俄罗斯转轮 · I】）。不必在俄罗斯转轮首次生效的瞬间触发照亮前路。", false) + faqDetail("【俄罗斯转轮 · I】可以和【砥砺前行 · I】互动吗？", "不可以。俄罗斯转轮必须结算完成，才能使用下一张卡牌。"))}
    ${faqGroup("INVESTIGATORS / 调查员", faqDetail("仿生人可以成为消耗 SAN 的目标吗？", "不可以。两位仿生人的过热/过载效果是“消耗队友 (1) 点 SAN”，而仿生人没有 SAN，因此不能成为指定对象，也不能恢复 SAN。", true) + faqDetail("初火、癫火和禁忌真相对仿生人分别如何处理？", "【初火】、【癫火】结算时会略过仿生人；禁忌真相伤害加深类效果对仿生人依然有效；【献祭】不能以仿生人为指定对象。"))}
    ${faqGroup("ENVIRONMENT / 环境卡牌", faqDetail("【降雨概率】遇到被洗回的【禁忌真相】怎么办？", "如果玩家通过任何手段洗回【禁忌真相】（例如使用【直视神】），降雨概率的计数不上升。如果计数已经达到 (N)，则下一个调查到禁忌真相的调查员消耗 SAN。", true) + faqDetail("【初火】如何集中同队的 SAN？", "初火只在同一队伍内结算，将所有 SAN 集中到“尽可能少”的调查员；不能超过原有 SAN 上限，也可能让清醒者疯狂或让疯狂者恢复清醒。若队友是【中之人】，则全部集中到【中之人】。例如 SAN 为 3、2、1 时，结果为 3、3、0。出现多种最小变动方案时，由对应指挥者决定。") + faqDetail("【癫火】如何平均分配 SAN？", "癫火只在同一队伍内结算。由高 SAN 调查员向低 SAN 调查员匀 SAN，例如 3、0、1 会变成 2、1、1。若存在多个满足最小变动量的结果，由指挥者决定；若当前已经平均（例如 2、3），不能为了交换位置而调整成 3、2。") + faqDetail("【许愿池】为什么不能调用【献祭】或【俄罗斯转轮】？", "因为这些卡牌的效果需要涉及 (2) 位调查员；许愿池无法满足这个调用条件。"))}
    ${faqGroup("PRINT ERRATA / 印刷相关", faqDetail("当前仍未修复的印刷问题是什么？", "【劳改犯】的调查员指示卡名称被错误印刷为【老侦探】的名称【菲利普 · 钱德勒】（双面皆是），实际应该为【丹泽 · 罗比】。", true) + faqDetail("标准版 2.0 已修复了哪些问题？", "【目击者】的疯狂技能【疯狂蔓延 · 目击者】中错误印刷了“紧急真相”，应为“禁忌真相”；【老侦探】的清醒技能【博学多闻】中，加入目标错误写成“手牌”，实际应为加入自己的“情报区”。") + faqDetail("卡牌印刷与规则文本冲突时怎么办？", "优先查阅最新版规则指引书、调查附录与 FAQ；实体卡牌的印刷问题以已公开的勘误为准。"))}
    <div class="rules-callout is-ink"><span class="callout-label">OPEN CASE</span><p>规则书中没有写明的情况，请和同桌讨论并达成共识后继续游戏。如果同一问题反复出现，反馈给制作团队，纳入后续版本。</p></div>
    ${sourcePanel("FAQ 会和规则一起更新。", "当前页面整理自共享资料库中的《FAQ》；每张卡牌的具体版本与效果请继续前往卡牌 Wiki 对照。", "SOURCE / 资料来源", "rulings")}
  </article>`,
  `<div class="subpage-sidebar-card"><span>FAQ / 09</span><strong>已归档判例</strong><p>机制、调查员、环境与印刷勘误的快速查找页。</p></div><nav class="subpage-sidebar-links" aria-label="FAQ 导航"><a href="#game-mechanics">游戏机制</a><a href="#investigators">调查员</a><a href="#environment">环境卡牌</a><a href="#print-errata">印刷相关</a><a href="/investigation-delve-boardgame/appendix">调查附录 →</a></nav>`
);

const cardMeta = (label: string, value: string) => value ? `<div><span>${label}</span><b>${lineBreaks(value)}</b></div>` : "";
const cardMarkup = (card: InvestigationCard) => {
  const wikiDocument = wikiDocumentById[card.id];
  const searchableText = `${card.name} ${card.type} ${card.style} ${card.effect} ${card.awake} ${card.madness}`;
  const localizedSearchText = `${searchableText} ${localizeWikiText(searchableText, "en")} ${localizeWikiText(searchableText, "ja")}`.toLocaleLowerCase();
  const meta = card.category === "investigator"
    ? [cardMeta("职业", card.type), cardMeta("调查风格", card.style), cardMeta("SAN", card.san), cardMeta("包含版本", card.edition), cardMeta("说明更新", card.update)].join("")
    : [cardMeta("类型", card.type), cardMeta("费用", card.cost), cardMeta("数量", card.quantity), cardMeta("包含版本", card.edition), cardMeta("说明更新", card.update)].join("");
  const abilities = card.category === "investigator"
    ? `<div class="card-text-block rules-original"><span>清醒技能</span><p>${lineBreaks(card.awake) || "暂无独立文本"}</p></div><div class="card-text-block rules-original is-madness"><span>疯狂技能</span><p>${lineBreaks(card.madness) || "暂无独立文本"}</p></div>`
    : `<div class="card-text-block rules-original"><span>卡牌效果</span><p>${lineBreaks(card.effect) || "暂无独立文本"}</p></div>`;
  const summary = card.category === "investigator"
    ? `<span class="wiki-card-heading"><span class="wiki-card-role">${escapeHtml(card.type || "调查员")}</span><strong>${escapeHtml(card.name)}</strong></span><small>${escapeHtml(card.edition || "SHARED")}</small><i>+</i>`
    : `<span class="wiki-card-index">${card.categoryLabel}</span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.edition || "SHARED")}</small><i>+</i>`;
  const supplementalContent = wikiDocument?.html
    ? `<div class="wiki-card-document" data-wiki-localize="${escapeHtml(wikiDocument.id)}">${localizeWikiHtml(wikiDocument.html, "zh")}</div>`
    : "";
  return `<article class="wiki-card wiki-card-${card.category}" data-card-searchable data-card-category="${card.category}" data-card-name="${escapeHtml(localizedSearchText)}"><details><summary>${summary}</summary><div class="wiki-card-body">${abilities}<div class="wiki-card-meta">${meta}</div>${supplementalContent}</div></details></article>`;
};

const renderWikiPage = () => {
  const categories = (Object.keys(cardCategoryMeta) as CardCategory[]);
  const categoryButtons = categories.map((category) => `<button type="button" data-card-filter="${category}">${cardCategoryMeta[category].label}<span>${cardSets[category].length}</span></button>`).join("");
  const cardCards = allInvestigationCards.map(cardMarkup).join("");
  return subpageShell(
    "wiki",
    subpageHero("卡牌索引 / CARD WIKI", "所有卡牌，<br />一览无遗。", "这里收录《调查深入》的全部卡牌。你可以按类别、版本、费用和效果查找；展开卡片即可查看完整文本，说明更新版本也一并标注。", "wiki"),
    `<article class="subpage-article wiki-article">
      <div class="wiki-intro-bar"><div><p class="chapter-label">LIVE CARD INDEX / 当前卡牌索引</p><h2>逐张查牌，不再翻箱倒柜。</h2></div><div class="wiki-counts">${categories.map((category) => `<div><strong>${cardSets[category].length}</strong><span>${cardCategoryMeta[category].label}</span></div>`).join("")}</div></div>
      <div class="wiki-controls"><label class="wiki-search"><span>SEARCH / 搜索卡牌</span><input id="wiki-search-input" type="search" placeholder="输入卡名、职业或效果" autocomplete="off" /><b>⌕</b></label><div class="wiki-filters" role="group" aria-label="卡牌类别筛选"><button type="button" class="is-active" data-card-filter="all">全部<span>${allInvestigationCards.length}</span></button>${categoryButtons}</div><p id="wiki-search-status">显示 ${allInvestigationCards.length} 张卡牌</p></div>
      <div class="wiki-grid">${cardCards}</div>
      ${sourcePanel("Wiki 的每一张卡牌都有来源。", "调查员、策略、环境、情报与辅助五类数据都从《调查深入 · 卡牌统计表》导入；“说明更新版本”用于判断当前文本应匹配哪一版规则。", "DATA / 数据来源")}
    </article>`,
    `<div class="subpage-sidebar-card"><span>WIKI / 10</span><strong>${allInvestigationCards.length} 张卡牌</strong><p>五个类别，一套可搜索的规则资料索引。</p></div><nav class="subpage-sidebar-links" aria-label="Wiki 导航"><a href="#wiki-search-input">搜索与筛选</a><a href="/investigation-delve-boardgame/appendix">特殊行动词典 →</a><a href="/investigation-delve-boardgame/faq">FAQ 判例 →</a></nav>`
  );
};

const setupRulesInteractions = () => {
  const page = document.querySelector<HTMLElement>(".rules-page");
  let currentWikiLanguage: WikiLanguage = "zh";
  const input = document.querySelector<HTMLInputElement>("#rules-search-input");
  const status = document.querySelector<HTMLElement>("#rules-search-status");
  const chapters = [...document.querySelectorAll<HTMLElement>("[data-rule-searchable]")];
  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".rules-toc a")];

  const updateRuleSearch = () => {
    const query = input?.value.trim().toLocaleLowerCase() ?? "";
    let visible = 0;
    chapters.forEach((chapter) => {
      const matches = !query || (chapter.textContent ?? "").toLocaleLowerCase().includes(query);
      chapter.hidden = !matches;
      if (matches) visible += 1;
    });
    if (status) {
      const displayQuery = input?.value.trim() ?? "";
      status.textContent = currentWikiLanguage === "en"
        ? query ? `${visible} Chapters Match “${displayQuery}”` : "Showing All Chapters"
        : currentWikiLanguage === "ja"
          ? query ? `「${displayQuery}」に一致する章：${visible}` : "すべての章を表示"
          : query ? `${visible} 个章节匹配“${displayQuery}”` : "显示全部章节";
    }
  };
  input?.addEventListener("input", updateRuleSearch);

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
    if (wikiStatus) {
      const displayQuery = wikiInput?.value.trim() ?? "";
      wikiStatus.textContent = currentWikiLanguage === "en"
        ? query ? `${visible} Cards Match “${displayQuery}”` : `Showing ${visible} Cards`
        : currentWikiLanguage === "ja"
          ? query ? `「${displayQuery}」に一致するカード：${visible} 枚` : `${visible} 枚のカードを表示`
          : query ? `${visible} 张卡牌匹配“${displayQuery}”` : `显示 ${visible} 张卡牌`;
    }
  };
  wikiInput?.addEventListener("input", updateWiki);
  filterButtons.forEach((button) => button.addEventListener("click", () => {
    selectedCategory = button.dataset.cardFilter ?? "all";
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    updateWiki();
  }));

  const aiForm = document.querySelector<HTMLFormElement>("#rules-ai-form");
  const aiInput = document.querySelector<HTMLInputElement>("#rules-ai-input");
  const aiAnswer = document.querySelector<HTMLElement>("#rules-ai-answer");
  const aiPrompts = [...document.querySelectorAll<HTMLButtonElement>("[data-rules-ai-prompt]")];
  let activeAiRequest: AbortController | undefined;
  const formatAiContent = (content: string) => {
    const normalized = content
      .replace(/\r\n?/g, "\n")
      .replace(/\*\*/g, "")
      .replace(/\s*>\s*/g, "\n")
      .replace(/\s+(?=[-•]\s+)/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (normalized.includes("\n") || normalized.length <= 80) return normalized;
    return normalized.replace(/([。！？；])\s*/g, "$1\n").replace(/\n{3,}/g, "\n").trim();
  };
  const isSafeAiLink = (href: string) => {
    if (href.startsWith("/") && !href.startsWith("//")) return true;
    if (href.startsWith("#")) return true;
    return /^https?:\/\//i.test(href);
  };
  const renderAiContent = (paragraph: HTMLElement, content: string) => {
    const normalized = formatAiContent(content);
    const linkPattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
    let cursor = 0;
    for (const match of normalized.matchAll(linkPattern)) {
      const [fullMatch, label, href] = match;
      const matchIndex = match.index ?? 0;
      paragraph.append(document.createTextNode(normalized.slice(cursor, matchIndex)));
      if (isSafeAiLink(href)) {
        const link = document.createElement("a");
        link.href = href;
        const icon = document.createElement("span");
        icon.className = "rules-link-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "↗";
        link.append(icon, document.createTextNode(label));
        if (/^https?:\/\//i.test(href)) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        paragraph.append(link);
      } else {
        paragraph.append(document.createTextNode(fullMatch));
      }
      cursor = matchIndex + fullMatch.length;
    }
    paragraph.append(document.createTextNode(normalized.slice(cursor)));
  };
  const renderAiAnswer = (status: string, content: string, pending = false) => {
    if (!aiAnswer) return;
    aiAnswer.classList.toggle("is-pending", pending);
    const label = document.createElement("span");
    label.textContent = `ASSISTANT / ${status}`;
    const paragraph = document.createElement("p");
    paragraph.className = "rules-ai-response";
    renderAiContent(paragraph, content);
    if (!pending) {
      aiAnswer.replaceChildren(label, paragraph);
      return;
    }
    const thinking = document.createElement("span");
    thinking.className = "rules-ai-thinking";
    thinking.setAttribute("role", "status");
    thinking.setAttribute("aria-label", "AI 正在思考");
    [0, 1, 2, 3, 4].forEach((index) => {
      const orb = document.createElement("i");
      orb.style.setProperty("--rules-ai-orb-index", String(index));
      thinking.append(orb);
    });
    const responseLine = document.createElement("div");
    responseLine.className = "rules-ai-response-line";
    responseLine.append(thinking, paragraph);
    aiAnswer.replaceChildren(label, responseLine);
  };
  const searchResults = document.querySelector<HTMLElement>("#rules-search-results");
  let lastSearchHits: WikiSearchHit[] = [];
  const renderSearchResults = (hits: WikiSearchHit[]) => {
    if (!searchResults) return;
    lastSearchHits = hits;
    if (!hits.length) {
      searchResults.innerHTML = `<div class="rules-search-results-empty"><span>SEARCH / 传统检索</span><p>没有直接命中，正在转交规则问答。</p></div>`;
      return;
    }
    searchResults.innerHTML = `<div class="rules-search-results-heading"><span>SEARCH / 传统检索</span><b>${hits.length} 条资料命中</b></div><ol class="rules-search-results-list">${hits.map((hit) => `<li><a href="${escapeHtml(hit.document.route)}"><span class="rules-search-result-category"><span class="rules-link-icon" aria-hidden="true">↗</span>${escapeHtml(localizeWikiText(hit.document.category, currentWikiLanguage))}</span><strong>${escapeHtml(localizeWikiText(hit.document.title, currentWikiLanguage))}</strong><p>${escapeHtml(localizeWikiText(hit.excerpt, currentWikiLanguage))}</p></a></li>`).join("")}</ol>`;
  };
  const answerQuestion = async (question: string) => {
    activeAiRequest?.abort();
    activeAiRequest = new AbortController();
    aiPrompts.forEach((button) => { button.disabled = true; });
    renderAiAnswer("CONNECTING", "正在查阅规则指引书和卡牌资料……", true);
    try {
      const response = await fetch("/api/rules-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
        signal: activeAiRequest.signal,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(error.error ?? "AI 暂时无法回答，请稍后再试。");
      }
      if (!response.body) throw new Error("AI 没有返回可读取的回答。");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const consume = (event: string) => {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const chunk = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              answer += content;
              renderAiAnswer("STREAMING", answer);
            }
          } catch {
            // Ignore incomplete SSE payloads; the next chunk completes them.
          }
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        events.forEach(consume);
        if (done) break;
      }
      if (buffer) consume(buffer);
      renderAiAnswer("ANSWER", answer || "资料库中没有明确记载，可以换一种问法，或查看[规则书](/investigation-delve-boardgame/rules)、[调查附录](/investigation-delve-boardgame/appendix)、[FAQ](/investigation-delve-boardgame/faq) 和[卡牌 Wiki](/investigation-delve-boardgame/wiki)。");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      renderAiAnswer("ERROR", error instanceof Error ? error.message : "AI 暂时无法回答，请稍后再试。");
    } finally {
      aiPrompts.forEach((button) => { button.disabled = false; });
    }
  };
  const submitQuestion = async (question: string) => {
    const localHits = searchWikiDocuments(question, 8);
    const hits = (await pagefindHits(question, localHits)).slice(0, 1);
    renderSearchResults(hits);
    if (!shouldRouteToAi(question, localHits)) {
      renderAiAnswer("SEARCH", "已找到相关资料，请查看上方命中结果。", false);
      return;
    }
    await answerQuestion(question);
  };
  aiForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = aiInput?.value.trim() ?? "";
    if (question) void submitQuestion(question);
  });
  aiPrompts.forEach((button) => button.addEventListener("click", () => {
    const question = button.dataset.rulesAiPrompt ?? "";
    if (aiInput) aiInput.value = question;
    void submitQuestion(question);
  }));

  const routeMenu = document.querySelector<HTMLElement>(".rules-route-nav");
  const routeMenuToggle = routeMenu?.querySelector<HTMLButtonElement>(".rules-route-menu-toggle");
  const rulebookHeader = document.querySelector<HTMLElement>(".rules-rulebook .rules-header");
  const mobileViewport = window.matchMedia("(max-width: 640px)");
  let previousScrollY = window.scrollY;
  let scrollFrame: number | null = null;
  const setRouteMenuOpen = (isOpen: boolean) => {
    routeMenu?.classList.toggle("is-open", isOpen);
    routeMenuToggle?.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) rulebookHeader?.classList.remove("is-scroll-hidden");
  };
  const updateRulebookHeader = () => {
    if (!rulebookHeader || !mobileViewport.matches) {
      rulebookHeader?.classList.remove("is-scroll-hidden");
      previousScrollY = window.scrollY;
      return;
    }
    const currentScrollY = window.scrollY;
    if (routeMenu?.classList.contains("is-open") || currentScrollY <= 8) {
      rulebookHeader.classList.remove("is-scroll-hidden");
    } else if (currentScrollY > previousScrollY + 2) {
      rulebookHeader.classList.add("is-scroll-hidden");
    } else if (currentScrollY < previousScrollY - 2) {
      rulebookHeader.classList.remove("is-scroll-hidden");
    }
    previousScrollY = currentScrollY;
  };
  const handleRulebookScroll = () => {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      updateRulebookHeader();
    });
  };
  window.addEventListener("scroll", handleRulebookScroll, { passive: true });
  window.addEventListener("resize", updateRulebookHeader);
  routeMenuToggle?.addEventListener("click", () => {
    setRouteMenuOpen(!routeMenu?.classList.contains("is-open"));
  });
  routeMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setRouteMenuOpen(false)));
  document.addEventListener("click", (event) => {
    if (routeMenu?.classList.contains("is-open") && event.target instanceof Node && !routeMenu.contains(event.target)) setRouteMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setRouteMenuOpen(false);
  });

  const languageSelect = document.querySelector<HTMLSelectElement>("#rules-language-select");
  const rulesPage = document.querySelector<HTMLElement>(".rules-page");
  const savedLanguage = localStorage.getItem("freshli4-language");
  if (languageSelect && (savedLanguage === "zh" || savedLanguage === "en" || savedLanguage === "ja")) languageSelect.value = savedLanguage;
  const applyRulesLanguage = (language: WikiLanguage) => {
    currentWikiLanguage = language;
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.body.dataset.lang = language;
    document.querySelectorAll<HTMLElement>("[data-wiki-localize]").forEach((element) => {
      const documentId = element.dataset.wikiLocalize ?? "";
      const source = wikiDocumentById[documentId];
      if (source) element.innerHTML = source.html;
    });
    if (rulesPage) localizeWikiTree(rulesPage, language);
    if (lastSearchHits.length) renderSearchResults(lastSearchHits);
    updateRuleSearch();
    updateWiki();
    if (languageSelect) {
      languageSelect.value = language;
      languageSelect.title = language === "zh" ? "中文" : language === "en" ? "English" : "日本語";
    }
  };
  const initialLanguage = savedLanguage === "en" || savedLanguage === "ja" ? savedLanguage : "zh";
  applyRulesLanguage(initialLanguage);
  languageSelect?.addEventListener("change", () => {
    const language = languageSelect.value === "en" || languageSelect.value === "ja" ? languageSelect.value : "zh";
    localStorage.setItem("freshli4-language", language);
    applyRulesLanguage(language);
  });
};

export const bootRulesPage = (): boolean => {
  const pathname = window.location.pathname;
  if (!pathname.startsWith("/investigation-delve-boardgame") && !pathname.startsWith("/games/investigation-delve/rules")) return false;

  const route: RulesRoute = pathname.includes("/appendix") ? "appendix" : pathname.includes("/faq") ? "faq" : pathname.includes("/wiki") ? "wiki" : pathname.endsWith("/rules") || pathname.includes("/games/investigation-delve/rules") ? "rules" : "home";
  const renderPage = route === "home" ? renderInvestigationHome : route === "rules" ? renderRulesPage : route === "appendix" ? renderAppendixPage : route === "faq" ? renderFaqPage : renderWikiPage;
  const titles = {
    home: "调查深入",
    rules: "调查深入 · 规则指引书",
    appendix: "调查深入 · 调查附录",
    faq: "调查深入 · FAQ",
    wiki: "调查深入 · 卡牌 Wiki",
  };

  document.documentElement.lang = "zh-CN";
  document.title = `${titles[route]} — FreshLi4`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", route === "home" ? "《调查深入》是一款支持 2—6 人游玩的非直接对战美式桌游。FreshLi4 新鲜李四游戏工作室。" : `《调查深入》${titles[route].replace("调查深入 · ", "")}：规则、判例、特殊行动与完整卡牌索引。FreshLi4 新鲜李四游戏工作室。` );
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
