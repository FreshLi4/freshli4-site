import "./rules.css";

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

const renderRulesPage = () => `
  <div class="rules-page">
    <header class="rules-header">
      <a class="rules-brand" href="/" aria-label="返回 FreshLi4 首页"><span class="rules-brand-mark" aria-hidden="true"><i></i><b></b></span><span><strong>新鲜李四</strong><small>FRESHLI4 GAME STUDIO</small></span></a>
      <div class="rules-header-meta"><span>INVESTIGATION GUILD OF ANOMALY</span><a href="/">返回官网 <b aria-hidden="true">↗</b></a></div>
    </header>

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
          <div class="rules-sidebar-note"><span>CASE NOTE</span><p>规则书中没有写明的情况，请和同桌讨论后达成共识，继续调查。</p></div>
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
            ${callout("卡牌统计", "当前数据源包含 20 位调查员、39 种策略、21 种环境、8 种辅助，以及 25 张情报牌（其中包含 1 张【禁忌真相】）。", "is-ink")}
          `)}

          ${section("setup", "03", "SETUP / 游戏准备", "把桌面变成调查现场。", `
            <h3>确定指挥者人数与队伍</h3>
            ${paragraph("游戏支持 2—6 名玩家。组队时，同队指挥者共享情报区和窥探信息，但不能互相检视手牌；每位指挥者只能指挥自己的调查员、使用自己的手牌。")}
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
          `)}

          ${section("faq", "09", "FAQ / 规则判定", "遇到边界情况，先看这里。", `
            <div class="faq-list"><details open><summary>没有特殊描述时，窥探从哪里开始？<span>+</span></summary><p>默认从情报卡组顶部向下执行；「正向窥探」也指从顶部向下。</p></details><details><summary>仿生人可以成为消耗 SAN 的目标吗？<span>+</span></summary><p>不可以。仿生人没有 SAN，因此不能成为消耗队友 SAN 的指定对象，也不能恢复 SAN。</p></details><details><summary>调查到禁忌真相后又把它洗回去，降雨概率如何处理？<span>+</span></summary><p>如果通过任何手段洗回【禁忌真相】，计数不上升；若计数已经达到阈值，则下一个调查到【禁忌真相】的调查员消耗 SAN。</p></details><details><summary>卡牌印刷与规则文本冲突时怎么办？<span>+</span></summary><p>优先查阅最新版规则指引书、调查附录与 FAQ。实体卡牌的印刷问题以已公开的勘误为准。</p></details><details><summary>规则书中没有写明的情况怎么办？<span>+</span></summary><p>与同桌讨论并达成共识后继续游戏；如果该问题反复出现，建议反馈给制作团队，纳入后续规则更新。</p></details></div>
            <div class="source-panel"><p class="chapter-label">SOURCE / 来源</p><h3>一份会继续生长的规则书。</h3><p>本页面根据《规则指引书 - v1.1》整理，并同步展示《调查附录》《FAQ》的核心内容。卡牌构成详见当前《调查深入 · 卡牌统计表》。</p><div><span>LAST EDITION</span><b>v1.1 + APPENDIX</b></div></div>
          `)}
        </div>
      </div>
    </main>
    <footer class="rules-footer"><span>© FRESHLI4 GAME STUDIO / INVESTIGATION : DELVE</span><a href="#rules">返回顶部 ↑</a><a href="/">FreshLi4 官网 ↗</a></footer>
  </div>`;

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
};

export const bootRulesPage = (): boolean => {
  if (!window.location.pathname.startsWith("/games/investigation-delve/rules")) return false;

  document.documentElement.lang = "zh-CN";
  document.title = "调查深入 · 规则指引书 — FreshLi4";
  document.querySelector('meta[name="description"]')?.setAttribute("content", "《调查深入》规则指引书：快速开始、轮次流程、SAN、特殊行动、附录与 FAQ。FreshLi4 新鲜李四游戏工作室。" );
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0d0d0d");
  document.body.dataset.theme = "investigation";
  document.body.classList.add("is-rules-page");
  document.querySelector<HTMLElement>("#top")!.innerHTML = `<div id="rules-mount"></div><div id="games-mount" hidden></div>`;
  document.querySelector<HTMLElement>("#rules-mount")!.innerHTML = renderRulesPage();
  document.querySelector(".site-header")?.classList.add("is-hidden-on-rules");
  document.querySelector("#mobile-menu")?.remove();
  setupRulesInteractions();
  return true;
};
