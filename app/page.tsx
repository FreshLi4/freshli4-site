const games = [
  {
    id: "01",
    status: "2025",
    title: "跃入迷城",
    roman: "Dive Up",
    tags: ["赛博朋克", "ARPG", "肉鸽", "搜打撤", "魂Like"],
    description:
      "一款赛博朋克主题、轴侧视角的 3D 动作肉鸽游戏。玩家在垂直迷城中战斗、探索、构筑装备，并在撤离与深入之间做出高压选择。",
    image: "/diveup-overview.jpg",
    accent: "orange",
    metrics: [
      ["视角", "3D ISO"],
      ["玩法", "Soul-like Combat"],
      ["循环", "Loot / Build / Extract"],
    ],
  },
  {
    id: "02",
    status: "Prototype",
    title: "下一款游戏",
    roman: "FreshLi4 Lab",
    tags: ["Prototype", "Original IP", "Playable First"],
    description:
      "FreshLi4 的官网结构为多游戏展示预留了同样的纵向 block。每个项目都可以拥有自己的美术、动效和叙事节奏，但由统一的外包络系统收束成同一个工作室品牌。",
    image: "/diveup-combat.jpg",
    accent: "blue",
    metrics: [
      ["阶段", "Incubating"],
      ["原则", "Fresh Mechanics"],
      ["展示", "Coming Soon"],
    ],
  },
];

const principles = ["Hard tempo", "Tactical extraction", "Build craft", "Fresh worlds"];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="FreshLi4 primary navigation">
        <a className="brand" href="#top" aria-label="FreshLi4 home">
          <span>新鲜李四</span>
          <strong>FreshLi4</strong>
        </a>
        <div className="navlinks">
          <a href="#games">Games</a>
          <a href="#studio">Studio</a>
          <a href="mailto:taobe.gong@freshli4.com">Contact</a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">www.freshli4.com / Game Studio</p>
          <h1>
            新鲜李四
            <span>游戏工作室</span>
          </h1>
          <p className="hero-lede">
            我们做带有硬朗节奏、明确反馈和新鲜机制的原创游戏。每个项目都可以拥有自己的美术世界，但玩家第一眼要感到：这东西能玩，而且值得跳进去。
          </p>
        </div>
        <div className="hero-card" aria-label="Featured game artwork from Dive Up">
          <img src="/diveup-cover.jpg" alt="跃入迷城 pitch deck cover artwork" />
          <div className="hero-card-caption">
            <span>First playable world</span>
            <strong>跃入迷城 2025</strong>
          </div>
        </div>
      </header>

      <section className="ticker" aria-label="FreshLi4 design principles">
        {principles.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section className="games" id="games" aria-label="FreshLi4 games">
        <div className="section-label">
          <span>(Games)</span>
          <p>一行对应一个游戏。统一的 bento 外包络承载项目身份，内部视觉由游戏自己主导。</p>
        </div>

        {games.map((game) => (
          <article className={`game-block ${game.accent}`} key={game.id}>
            <div className="game-index">
              <span>{game.id}</span>
              <small>{game.status}</small>
            </div>
            <div className="game-content">
              <div className="game-heading">
                <p>{game.roman}</p>
                <h2>{game.title}</h2>
              </div>
              <p className="game-description">{game.description}</p>
              <div className="tag-row">
                {game.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="metric-grid">
                {game.metrics.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="bento-wrap">
              <div className="image-tile main-tile">
                <img src={game.image} alt={`${game.title} visual block`} />
              </div>
              <div className="image-tile small-tile">
                <img src="/diveup-escape.jpg" alt="跃入迷城 escape choice gameplay screenshot" />
              </div>
              <div className="system-tile">
                <span>FreshLi4 System</span>
                <strong>Art direction stays wild. The frame stays ours.</strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="studio" id="studio">
        <div>
          <p className="eyebrow">Studio</p>
          <h2>小团队，重手感，先把核心玩出来。</h2>
        </div>
        <div className="studio-copy">
          <p>
            FreshLi4 目前以《跃入迷城》为主项目。官网第一版采用纵向单页结构，后续新增游戏时只需要增加新的 game block，让每个项目在自己的容器里释放美术风格。
          </p>
          <a href="mailto:taobe.gong@freshli4.com">taobe.gong@freshli4.com</a>
        </div>
      </section>
    </main>
  );
}
