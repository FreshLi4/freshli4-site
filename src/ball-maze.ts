import "./ball-maze.css";

type Lang = "zh" | "en" | "ja";
type Copy = { zh: string; en: string; ja: string };

const visualFiles = import.meta.glob("/asset/ball-maze/visual-content/**/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const brandFiles = import.meta.glob("/asset/ball-maze/brand/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const ballIconFiles = import.meta.glob("/asset/ball-maze/ball-icons/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const visual = (fileName: string) => visualFiles[`/asset/ball-maze/visual-content/${fileName}`] ?? "";
const brand = (fileName: string) => brandFiles[`/asset/ball-maze/brand/${fileName}`] ?? "";
const ballIcon = (fileName: string) => ballIconFiles[`/asset/ball-maze/ball-icons/${fileName}`] ?? "";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const copy = (zh: string, en: string, ja = en): Copy => ({ zh, en, ja });

const translations: Record<string, Copy> = {};
const text = (key: string, value: Copy) => {
  translations[key] = value;
  return `<span data-bm-i18n="${escapeHtml(key)}">${escapeHtml(value.zh)}</span>`;
};
const html = (key: string, value: Copy, tag = "span") => {
  translations[key] = value;
  return `<${tag} data-bm-i18n-html="${escapeHtml(key)}">${value.zh}</${tag}>`;
};

type Ball = {
  id: string;
  name: Copy;
  role: Copy;
  description: Copy;
  note: Copy;
  state: "demo" | "next";
};

const balls: Ball[] = [
  { id: "normal", name: copy("普通球", "Normal Ball", "ノーマルボール"), role: copy("把重力交给你", "Let gravity work", "重力に任せる"), description: copy("最直观的起点：倾斜迷宫、控制惯性，让小球沿着轨道滚到终点。", "The clearest starting point: tilt the maze, manage momentum, and roll to the goal.", "いちばん素直なボール。迷路を傾け、勢いを読み、ゴールへ転がします。"), note: copy("DEMO / 基础规则", "DEMO / CORE RULE", "DEMO / 基本ルール"), state: "demo" },
  { id: "gravity", name: copy("引力球", "Gravity Ball", "引力ボール"), role: copy("把球拉向中心", "Pull toward the center", "中心へ引き寄せる"), description: copy("用新的引力关系改变路线判断，让熟悉的轨道出现另一种解法。", "A new gravity relationship changes how you read the route and gives familiar rails another solution.", "新しい重力関係がルートの読み方を変え、見慣れたレールに別の答えを与えます。"), note: copy("SPECIAL / 机制球", "SPECIAL / SYSTEM BALL", "SPECIAL / ギミック"), state: "demo" },
  { id: "repulsion", name: copy("斥力球", "Repulsion Ball", "斥力ボール"), role: copy("把路线推开", "Push the route away", "ルートを押し開く"), description: copy("通过斥力和阻力重新安排球与迷宫的距离，适合把轨道当成一道动态算式。", "Use repulsion and resistance to rethink distance between the ball and the maze, treating the rails like a moving equation.", "斥力と抵抗でボールと迷路の距離を読み替え、レールを動く方程式として扱います。"), note: copy("SPECIAL / 机制球", "SPECIAL / SYSTEM BALL", "SPECIAL / ギミック"), state: "demo" },
  { id: "phase", name: copy("相位球", "Phase Ball", "フェイズボール"), role: copy("穿过不可能的角度", "Find an impossible angle", "不可能な角度へ"), description: copy("当迷宫被旋转到极限，短暂改变碰撞关系，寻找普通球无法通过的缝隙。", "Temporarily changes its collision relationship at the limit of a tilt, opening gaps a normal ball cannot take.", "迷路が限界まで傾いたとき、衝突関係を一時的に変え、普通のボールでは通れない隙間を探します。"), note: copy("SPECIAL / 机制球", "SPECIAL / SYSTEM BALL", "SPECIAL / ギミック"), state: "demo" },
  { id: "rocket", name: copy("火箭球", "Rocket Ball", "ロケットボール"), role: copy("用一记冲力改写路线", "Rewrite the route with one burst", "一撃でルートを書き換える"), description: copy("以普通球体作为碰撞基础，把喷嘴收进球体里，用瞬时冲力把球送过关键段。", "It keeps a normal ball collision body, hides the nozzle inside the sphere, and uses a short burst to clear a critical section.", "通常のボール形状を衝突体に使い、ノズルを内側に収め、短い推進で重要な区間を越えます。"), note: copy("NEXT / 开发中", "NEXT / IN DEVELOPMENT", "NEXT / 開発中"), state: "next" },
  { id: "rewind", name: copy("回溯球", "Rewind Ball", "リワインドボール"), role: copy("回到两秒之前", "Go back two seconds", "2秒前へ戻る"), description: copy("记录前两秒的运动轨迹，沿着幻影路径回退；技能冷却时间为 8 秒。", "Records the previous two seconds, then rewinds along a ghost trail. Its skill has an 8-second cooldown.", "直前2秒の軌跡を記録し、残像のスプラインに沿って戻ります。クールダウンは8秒です。"), note: copy("NEXT / 开发中", "NEXT / IN DEVELOPMENT", "NEXT / 開発中"), state: "next" },
  { id: "paint", name: copy("油漆球", "Paint Ball", "ペイントボール"), role: copy("让路径留下痕迹", "Leave a trace", "軌跡を残す"), description: copy("在移动和交互中留下油漆痕迹，让一次成功不只发生在终点，也发生在路上。", "Leaves paint traces through movement and interaction, making the journey visible instead of only celebrating the goal.", "移動とインタラクションにペイントの跡を残し、ゴールだけでなく道のりも見せます。"), note: copy("NEXT / 开发中", "NEXT / IN DEVELOPMENT", "NEXT / 開発中"), state: "next" },
  { id: "time", name: copy("时停球", "Time Ball", "タイムボール"), role: copy("给下一步留出时间", "Make room for the next move", "次の一手を作る"), description: copy("冻结滚动节奏，重新观察球、机关和轨道之间的关系，再决定下一次旋转。", "Freezes the rhythm of a run so you can read the ball, mechanism, and rail before the next turn.", "転がるリズムを止め、ボール・ギミック・レールの関係を見直してから次の回転を選びます。"), note: copy("NEXT / 开发中", "NEXT / IN DEVELOPMENT", "NEXT / 開発中"), state: "next" },
];

const ballIconNames: Record<string, string> = { normal: "BallName=OrdinaryBall.png", gravity: "BallName=AttractionBall.png", repulsion: "BallName=RepulsionBall.png", phase: "BallName=PhasingBall.png", rocket: "BallName=rocketball.png", rewind: "BallName=rewindball.png", time: "BallName=TimeStopBall.png" };

const navItem = (href: string, number: string, label: Copy) => `<a href="${href}"><b>${number}</b>${text(`nav.${number}`, label)}</a>`;

const ballCard = (ball: Ball, index: number) => `
  <article class="bm-ball-card bm-reveal" data-bm-ball="${ball.state}" data-ball-id="${ball.id}">
    <div class="bm-ball-card-top"><span>0${index + 1}</span><i class="bm-ball-dot bm-ball-dot-${escapeHtml(ball.id)}" aria-hidden="true">${ballIconNames[ball.id] ? `<img src="${escapeHtml(ballIcon(ballIconNames[ball.id]))}" alt="" />` : ""}</i><span>${text(`ball.${ball.id}.note`, ball.note)}</span></div>
    <h3>${text(`ball.${ball.id}.name`, ball.name)}</h3>
    <p class="bm-ball-role">${text(`ball.${ball.id}.role`, ball.role)}</p>
    <p>${text(`ball.${ball.id}.description`, ball.description)}</p>
    <span class="bm-card-arrow" aria-hidden="true">↗</span>
  </article>`;

const renderBallMazePage = () => `
  <div class="ball-maze-page" data-bm-language="zh">
    <header class="bm-header">
      <a class="bm-brand" href="/" aria-label="返回 FreshLi4 首页">
        <img src="${escapeHtml(brand("logo.png"))}" alt="Ball Maze" />
        <span>FRESHLi4 / 02</span>
      </a>
      <nav class="bm-nav" aria-label="迷宫球详情页导航">
        ${navItem("#play", "01", copy("玩法", "PLAY", "プレイ"))}
        ${navItem("#worlds", "02", copy("世界", "WORLDS", "ワールド"))}
        ${navItem("#balls", "03", copy("小球", "BALLS", "ボール"))}
        ${navItem("#build", "04", copy("创造", "BUILD", "ビルド"))}
      </nav>
      <div class="bm-header-tools">
        <a class="bm-header-steam" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">STEAM ↗</a>
        <label class="bm-language"><span class="sr-only">选择语言</span><select id="bm-language-select" aria-label="选择语言"><option value="zh">中文</option><option value="en">English</option><option value="ja">日本語</option></select></label>
      </div>
    </header>

    <main>
      <section class="bm-hero" id="ball-maze-hero" aria-labelledby="bm-hero-title">
        <div class="bm-hero-background" style="background-image:url('${escapeHtml(brand("page-background.png"))}')" aria-hidden="true"></div>
        <div class="bm-hero-grid" aria-hidden="true"></div>
        <div class="bm-hero-photo bm-reveal"><img src="${escapeHtml(visual("1-hero.jpg"))}" alt="城市主题中的迷宫轨道" /></div>
        <div class="bm-hero-copy bm-reveal">
          <p class="bm-kicker">PROJECT 02 / PHYSICS PUZZLE</p>
          <img class="bm-hero-logo" src="${escapeHtml(brand("logo.png"))}" alt="Ball Maze 迷宫球" />
          <h1 id="bm-hero-title">${html("hero.title", copy("旋转世界，<br /><em>让重力带路。</em>", "Turn the world.<br /><em>Let gravity lead.</em>", "世界を回して、<br /><em>重力に導かれる。</em>"), "span")}</h1>
          <p class="bm-hero-dek">${text("hero.dek", copy("你不直接控制小球。你旋转整座三维迷宫，让重力与惯性替你寻找下一条路。", "You do not steer the ball directly. Rotate the whole 3D maze and let gravity and momentum find the next route.", "ボールを直接操るのではなく、立体迷路全体を回して重力と慣性に次の道を探させます。"))}</p>
          <div class="bm-hero-actions"><a class="bm-button bm-button-primary" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">${text("hero.cta", copy("加入 Steam 愿望单", "ADD TO WISHLIST", "Steam ウィッシュリストに追加"))}<span>↗</span></a><a class="bm-button bm-button-quiet" href="#play">${text("hero.more", copy("继续往下看", "KEEP READING", "続きを読む"))}<span>↓</span></a></div>
        </div>
        <div class="bm-hero-side bm-reveal"><span>ROLL / TILT / REPEAT</span><strong>360°</strong><small>${text("hero.side", copy("每一次旋转，都是一次新的解题。", "Every turn is a new solution.", "回すたびに、新しい答え。"))}</small></div>
        <div class="bm-hero-bottom"><span>FRESHLi4 GAME STUDIO · SHANGHAI</span><a href="#play">SCROLL <b>↓</b></a></div>
      </section>

      <section class="bm-section bm-play-section" id="play" aria-labelledby="bm-play-title">
        <div class="bm-section-index"><span>01</span><i></i><span>THE RULE</span></div>
        <div class="bm-section-heading bm-reveal"><p class="bm-kicker">THE ANOMALY / 核心玩法</p><h2 id="bm-play-title">${html("play.title", copy("你不控制小球。<br /><em>你控制整个世界。</em>", "You do not control the ball.<br /><em>You control the world.</em>", "ボールを操るのではない。<br /><em>世界を操る。</em>"), "span")}</h2><p>${text("play.intro", copy("把一座迷宫想成一块悬浮的立体拼图。旋转它，观察坡度，等待惯性把小球送进下一段轨道。简单的输入，持续变化的空间关系。", "Think of the maze as a floating 3D puzzle. Rotate it, read the slope, and wait for momentum to carry the ball into the next rail. Simple input, constantly changing space.", "迷路を浮かぶ立体パズルとして捉えます。回し、傾斜を読み、慣性がボールを次のレールへ運ぶのを待つ。入力はシンプル、空間の関係は変わり続けます。"))}</p></div>
        <div class="bm-play-diagram bm-reveal" aria-label="迷宫球的游玩循环"><div class="bm-orbit bm-orbit-one"></div><div class="bm-orbit bm-orbit-two"></div><div class="bm-diagram-ball"></div><span class="bm-diagram-label bm-diagram-label-a">TILT</span><span class="bm-diagram-label bm-diagram-label-b">READ</span><span class="bm-diagram-label bm-diagram-label-c">ROLL</span><span class="bm-diagram-caption">GRAVITY / MOMENTUM / ROUTE</span></div>
        <div class="bm-play-cards">
          <article class="bm-principle-card bm-reveal"><span>01 / TILT</span><h3>${text("play.card1.title", copy("旋转迷宫", "Tilt the maze", "迷路を回す"))}</h3><p>${text("play.card1.copy", copy("控制的是迷宫的朝向，而不是小球的方向。", "You control the maze's orientation, not the ball's direction.", "操るのはボールの向きではなく、迷路の向き。"))}</p></article>
          <article class="bm-principle-card bm-reveal"><span>02 / READ</span><h3>${text("play.card2.title", copy("读懂轨道", "Read the rail", "レールを読む"))}</h3><p>${text("play.card2.copy", copy("坡度、速度、碰撞和特殊机关共同组成一条会变化的路线。", "Slope, speed, collision, and mechanisms make a route that keeps changing.", "傾斜、速度、衝突、ギミックが変化し続けるルートを作ります。"))}</p></article>
          <article class="bm-principle-card bm-reveal"><span>03 / REPEAT</span><h3>${text("play.card3.title", copy("一次又一次", "Try again", "何度でも"))}</h3><p>${text("play.card3.copy", copy("失误不是失败，是下一次旋转前多得到的一条信息。", "A mistake is not failure; it is one more piece of information before the next turn.", "ミスは失敗ではなく、次に回す前に得られる情報です。"))}</p></article>
        </div>
      </section>

      <section class="bm-section bm-worlds-section" id="worlds" aria-labelledby="bm-worlds-title">
        <div class="bm-section-index"><span>02</span><i></i><span>THE WORLDS</span></div>
        <div class="bm-worlds-intro bm-reveal"><div><p class="bm-kicker">A WORLD INSIDE THE MAZE / 主题世界</p><h2 id="bm-worlds-title">建筑、矿洞与<br /><em>悬浮的风景。</em></h2></div><p>${text("worlds.intro", copy("迷宫不是一块空白的棋盘。城市的楼宇、矿山的深处、未来的海岛与山谷，会随着轨道一起悬浮、旋转，成为解题的一部分，也成为每一次转身都值得看的场景。", "The maze is not an empty board. Cities, mines, future islands, and valleys float and turn with the rails, becoming part of the puzzle—and a scene worth seeing from every angle.", "迷路は空白の盤面ではありません。都市、鉱山、未来の島や谷がレールと一緒に浮かび、回転し、謎の一部になり、どの角度からも眺めたくなる風景になります。"))}</p></div>
        <div class="bm-world-stat-strip bm-reveal"><div><strong>02</strong><span>WORLDS / 世界</span></div><div><strong>20</strong><span>LEVELS / 关卡</span></div><div><strong>10</strong><span>UNLOCKABLE BALLS / 可解锁小球</span></div><b>PUBLIC DEMO / 公开 Demo</b></div>
        <div class="bm-world-grid">
          <article class="bm-world-card bm-world-city bm-reveal"><div class="bm-world-card-label"><span>WORLD 01</span><b>AVAILABLE</b></div><h3>THE CITY<br /><em>城市</em></h3><p>${text("world.city", copy("霓虹、樱花、街道与立体轨道。公开 Demo 的第一座世界。", "Neon, cherry blossoms, streets, and layered rails. The first world in the public demo.", "ネオン、桜、街路、立体レール。公開デモの最初の世界。"))}</p><img src="${escapeHtml(visual("1-hero.jpg"))}" alt="城市主题迷宫" /></article>
          <article class="bm-world-card bm-world-mine bm-reveal"><div class="bm-world-card-label"><span>WORLD 02</span><b>AVAILABLE</b></div><h3>THE MINE<br /><em>矿山</em></h3><p>${text("world.mine", copy("更暗的空间、更长的路线，以及把视线和惯性一起纳入计算的关卡。", "Darker spaces, longer routes, and levels that make sightlines and momentum part of the calculation.", "暗い空間、長いルート、視線と慣性を同時に読むレベル。"))}</p><img src="${escapeHtml(visual("3-level.jpg"))}" alt="轨道关卡中的迷宫" /></article>
          <article class="bm-world-card bm-world-next bm-reveal"><div class="bm-world-card-label"><span>WORLD 03+</span><b>IN DEVELOPMENT</b></div><h3>THE ISLAND<br /><em>海岛 / 山谷</em></h3><p>${text("world.next", copy("后续世界正在制作中。新的风景，也意味着新的特殊轨道和新的物理问题。", "Future worlds are in production. New scenery means new special rails and new physics questions.", "次の世界を制作中。新しい景色は、新しい特殊レールと物理の問題を連れてきます。"))}</p><div class="bm-world-placeholder"><span>MORE WORLDS</span><strong>→</strong></div></article>
        </div>
        <figure class="bm-feature-figure bm-reveal"><img src="${escapeHtml(visual("2-track.jpg"))}" alt="城市街道中的立体轨道" /><figcaption><span>TURN THE WORLD / 03</span><b>${text("worlds.caption", copy("轨道在空间里生长，建筑只是它留下的风景。", "Rails grow through space; buildings are the scenery they leave behind.", "空間に伸びるレール。その跡に残るのが建物です。"))}</b></figcaption></figure>
      </section>

      <section class="bm-section bm-balls-section" id="balls" aria-labelledby="bm-balls-title">
        <div class="bm-section-index"><span>03</span><i></i><span>THE BALLS</span></div>
        <div class="bm-balls-heading bm-reveal"><p class="bm-kicker">EVERY BALL CHANGES THE RULE / 特殊能力</p><h2 id="bm-balls-title">同一座迷宫，<br /><em>不同的解法。</em></h2><p>${text("balls.intro", copy("完成挑战可以解锁拥有特殊能力的个性小球。它们不是换皮，而是让你重新理解坡度、碰撞、路线和风险。", "Complete challenges to unlock balls with distinct abilities. They are not cosmetic swaps—they make you rethink slope, collision, routes, and risk.", "挑戦を達成すると、固有能力を持つボールが解放されます。見た目違いではなく、傾斜、衝突、ルート、リスクの読み方を変えます。"))}</p></div>
        <div class="bm-ball-filters" role="tablist" aria-label="小球状态筛选"><button type="button" class="is-active" data-ball-filter="all" role="tab" aria-selected="true">ALL / 全部</button><button type="button" data-ball-filter="demo" role="tab" aria-selected="false">DEMO / 公开内容</button><button type="button" data-ball-filter="next" role="tab" aria-selected="false">NEXT / 开发中</button></div>
        <div class="bm-ball-grid">${balls.map(ballCard).join("")}</div>
      </section>

      <section class="bm-section bm-modes-section" id="modes" aria-labelledby="bm-modes-title">
        <div class="bm-section-index"><span>04</span><i></i><span>THE MODES</span></div>
        <div class="bm-modes-heading bm-reveal"><p class="bm-kicker">PLAY TOGETHER / 多人玩法</p><h2 id="bm-modes-title">一个迷宫，<br /><em>两种一起玩的方式。</em></h2></div>
        <div class="bm-mode-grid">
          <article class="bm-mode-card bm-reveal"><span>01 / SOLO</span><h3>${text("mode.solo.title", copy("单人挑战", "Solo challenge", "ソロチャレンジ"))}</h3><p>${text("mode.solo.copy", copy("在主题世界中逐关前进，完成挑战、收集星星，解锁新的球与路线。", "Move through themed worlds, complete challenges, collect stars, and unlock new balls and routes.", "テーマ世界を進み、挑戦を達成し、星を集め、新しいボールとルートを解放します。"))}</p><strong>01</strong></article>
          <article class="bm-mode-card bm-reveal"><span>02 / SPLIT-SCREEN</span><h3>${text("mode.split.title", copy("分屏竞速", "Split-screen race", "画面分割レース"))}</h3><p>${text("mode.split.copy", copy("和朋友在本地分屏进行连续迷宫马拉松，计算总用时，比拼速度与技巧。", "Race a local split-screen maze marathon with a friend. Compare total time, speed, and technique.", "友達とローカル画面分割で迷路マラソン。合計タイムと技術を競います。"))}</p><strong>02</strong></article>
          <article class="bm-mode-card bm-reveal"><span>03 / CO-OP</span><h3>${text("mode.coop.title", copy("同屏协作", "Same-screen co-op", "同画面協力"))}</h3><p>${text("mode.coop.copy", copy("多个玩家分别控制迷宫的不同部分。只有精准沟通，才能把同一颗球送到终点。", "Players control different parts of one maze. Precise communication is the only way to deliver one ball to the goal.", "複数のプレイヤーが一つの迷路の別々の部分を担当。正確な会話で一つのボールをゴールへ運びます。"))}</p><strong>03</strong></article>
        </div>
      </section>

      <section class="bm-section bm-build-section" id="build" aria-labelledby="bm-build-title">
        <div class="bm-section-index"><span>05</span><i></i><span>THE EDITOR</span></div>
        <div class="bm-build-layout">
          <div class="bm-build-copy bm-reveal"><p class="bm-kicker">BUILD · TEST · SHARE / 迷宫编辑器</p><h2 id="bm-build-title">把你的<br /><em>奇思妙想搭出来。</em></h2><p>${text("build.copy", copy("从轨道模块开始，自由移动、连接和旋转，搭建一座属于自己的迷宫。编辑器首个版本正在开发中；在线分享与 Steam 创意工坊属于后续计划。", "Start with rail modules. Move, connect, and rotate them to build a maze of your own. The first editor version is in development; online sharing and Steam Workshop are planned for later.", "レールモジュールから始め、自由に動かし、つなぎ、回転させて自分だけの迷路を作ります。エディター初版を開発中。オンライン共有とSteam Workshopは今後の計画です。"))}</p><ul><li>${text("build.item1", copy("轨道模块", "Rail modules", "レールモジュール"))}</li><li>${text("build.item2", copy("自由移动与旋转", "Move and rotate freely", "自由移動と回転"))}</li><li>${text("build.item3", copy("测试、记录、分享", "Test, record, share", "テスト、記録、共有"))}</li></ul><a class="bm-inline-link" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">${text("build.cta", copy("关注编辑器进展", "FOLLOW THE BUILD", "開発の進捗を見る"))}<span>↗</span></a></div>
          <div class="bm-editor-card bm-reveal"><img src="${escapeHtml(visual("concepts/2-editor.svg"))}" alt="迷宫编辑器概念图" /><div class="bm-editor-card-label"><span>EDITOR / PROTOTYPE</span><b>MAKE A MAZE</b></div></div>
        </div>
      </section>

      <section class="bm-section bm-record-section" id="records" aria-labelledby="bm-record-title">
        <div class="bm-section-index"><span>06</span><i></i><span>THE RECORD</span></div>
        <div class="bm-record-layout">
          <div class="bm-record-heading bm-reveal"><p class="bm-kicker">CHALLENGE / 记录</p><h2 id="bm-record-title">每一条路线，<br /><em>都可以更好。</em></h2><p>${text("records.copy", copy("过关不只看能不能到终点。挑战完成数、过关时间、循轨比例与游玩次数，会共同构成你的下一次目标。", "Reaching the goal is only the beginning. Challenges, time, route ratio, and attempts become the next target to beat.", "ゴールだけが答えではありません。挑戦、タイム、ルート率、プレイ回数が次の目標になります。"))}</p></div>
          <div class="bm-record-board bm-reveal"><div class="bm-record-board-head"><span>LOCAL / ONLINE</span><b>BEST RUN</b></div><div class="bm-record-row"><b>01</b><span>CHALLENGES</span><strong>◎ ◎ ◎</strong></div><div class="bm-record-row"><b>02</b><span>CLEAR TIME</span><strong>00:42.18</strong></div><div class="bm-record-row"><b>03</b><span>RAIL RATIO</span><strong>87.4%</strong></div><div class="bm-record-row"><b>04</b><span>ATTEMPTS</span><strong>12</strong></div><div class="bm-record-board-foot">KEEP ROLLING / 迷宫不会替你停下</div></div>
        </div>
      </section>

      <section class="bm-final-section" id="steam" aria-labelledby="bm-final-title">
        <div class="bm-final-background" style="background-image:url('${escapeHtml(brand("hero-graphic.png"))}')" aria-hidden="true"></div>
        <div class="bm-final-copy bm-reveal"><p class="bm-kicker">BALL MAZE / FRESHLi4</p><h2 id="bm-final-title">现在，<br /><em>轮到你来转。</em></h2><p>${text("final.copy", copy("当小球停在起点，真正的问题才开始。", "When the ball is waiting at the start, the real question begins.", "ボールがスタートで待つとき、本当の問いが始まります。"))}</p><a class="bm-button bm-button-primary" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">${text("final.cta", copy("前往 Steam", "VISIT STEAM", "Steamへ"))}<span>↗</span></a></div>
        <div class="bm-final-mark"><img src="${escapeHtml(brand("logo.png"))}" alt="Ball Maze" /><span>FRESHLi4 / PROJECT 02</span></div>
      </section>
    </main>
    <footer class="bm-footer"><a href="/">FRESHLi4</a><span>© 2026 FRESHLI4 GAME STUDIO</span><a href="#top">BACK TO TOP ↑</a></footer>
    <div id="games-mount" hidden></div>
  </div>`;

const setLanguage = (language: Lang) => {
  const page = document.querySelector<HTMLElement>(".ball-maze-page");
  const lang = translations["hero.title"]?.[language] ? language : "zh";
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  document.body.dataset.lang = lang;
  page?.setAttribute("data-bm-language", lang);
  document.querySelectorAll<HTMLElement>("[data-bm-i18n]").forEach((element) => {
    const value = translations[element.dataset.bmI18n ?? ""]?.[lang];
    if (value !== undefined) element.textContent = value;
  });
  document.querySelectorAll<HTMLElement>("[data-bm-i18n-html]").forEach((element) => {
    const value = translations[element.dataset.bmI18nHtml ?? ""]?.[lang];
    if (value !== undefined) element.innerHTML = value;
  });
  const select = document.querySelector<HTMLSelectElement>("#bm-language-select");
  if (select) select.value = lang;
  localStorage.setItem("freshli4-language", lang);
};

const setupBallMazeInteractions = () => {
  const select = document.querySelector<HTMLSelectElement>("#bm-language-select");
  const savedLanguage = localStorage.getItem("freshli4-language") as Lang | null;
  setLanguage(savedLanguage === "en" || savedLanguage === "ja" || savedLanguage === "zh" ? savedLanguage : "zh");
  select?.addEventListener("change", () => setLanguage(select.value as Lang));

  const filters = [...document.querySelectorAll<HTMLButtonElement>("[data-ball-filter]")];
  const cards = [...document.querySelectorAll<HTMLElement>("[data-bm-ball]")];
  filters.forEach((filter) => filter.addEventListener("click", () => {
    const value = filter.dataset.ballFilter ?? "all";
    filters.forEach((button) => {
      const active = button === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    cards.forEach((card) => { card.hidden = value !== "all" && card.dataset.bmBall !== value; });
  }));

  const sections = [...document.querySelectorAll<HTMLElement>(".bm-section, .bm-final-section")];
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>(".bm-nav a")];
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
    const section = entry.target as HTMLElement;
    if (entry.isIntersecting && section.id && navLinks.some((link) => link.hash === `#${section.id}`)) {
      navLinks.forEach((link) => link.classList.toggle("is-current", link.hash === `#${section.id}`));
    }
  }), { threshold: 0.16 });
  document.querySelectorAll<HTMLElement>(".bm-reveal").forEach((element) => observer.observe(element));
  sections.forEach((section) => observer.observe(section));
};

export const bootBallMazePage = (): boolean => {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  if (pathname !== "/ball-maze") return false;

  document.documentElement.lang = "zh-CN";
  document.title = "迷宫球 — Ball Maze — FreshLi4";
  document.querySelector('meta[name="description"]')?.setAttribute("content", "《迷宫球》是一款基于物理模拟的 3D 滚球解谜游戏。旋转整座迷宫，让重力、惯性与特殊能力小球带你抵达终点。FreshLi4 新鲜李四游戏工作室。");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#45AEA4");
  document.body.dataset.theme = "ballmaze";
  document.body.classList.add("is-ball-maze-page");
  document.querySelector<HTMLElement>("#top")!.innerHTML = renderBallMazePage();
  document.querySelector(".site-header")?.classList.add("is-hidden-on-ball-maze");
  document.querySelector("#mobile-menu")?.remove();
  setupBallMazeInteractions();
  return true;
};
