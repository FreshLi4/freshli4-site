import "./ball-maze.css";
import { ballMazeBalls as balls, ballMazeWorlds as worlds } from "./ball-maze-catalog";
import { setupBallMazeGallery } from "./ball-maze-gallery";
import { setupMediaCarousel } from "./media-carousel";
import { setupBallMazeWorldVideos } from "./ball-maze-world-videos";
import { ballMazeHero, renderBallMazeHeroSlide } from "./ball-maze-hero";
import { initialBallMazeSection, setupBallMazeSections } from "./ball-maze-sections";

type Lang = "zh" | "en" | "ja";
type Copy = { zh: string; en: string; ja: string };

const visualFiles = import.meta.glob("/asset/ball-maze/visual-content/**/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const brandFiles = import.meta.glob("/asset/ball-maze/brand/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const visual = (fileName: string) => visualFiles[`/asset/ball-maze/visual-content/${fileName}`] ?? "";
const brand = (fileName: string) => brandFiles[`/asset/ball-maze/brand/${fileName}`] ?? "";
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


const navItem = (href: string, number: string, label: Copy) => `<a href="${href}" data-bm-nav="nav.${number}" aria-label="${number} ${escapeHtml(label.zh)}"><b>${number}</b>${text(`nav.${number}`, label)}</a>`;
const video = (id: string, title: string, feature = false) => `<video data-bm-video${feature ? ' data-bm-recording="'+id+'"' : ''} muted loop playsinline controls preload="${feature ? 'metadata' : 'none'}" poster="${escapeHtml(visual(`latest/${id}.webp`))}" aria-label="${title}"><source src="${escapeHtml(visual(`latest/${id}.mp4`))}" type="video/mp4" /></video>`;
const heroClips = ballMazeHero.clips;
const heroSlide = (clip: typeof heroClips[number], index: number) => renderBallMazeHeroSlide(clip, index, visual);
const worldCard = (world: typeof worlds[number], index: number) => `
  <article class="bm-world-card bm-world-${world.id} bm-reveal${world.id !== "darkroom" ? ' bm-video-frame' : ''}" data-world-id="${world.id}" aria-labelledby="bm-world-name-${world.id}"${world.id !== "darkroom" ? ' tabindex="0"' : ''}>
    ${world.id !== "darkroom" ? `<video data-bm-world-video="${world.id}" muted loop playsinline preload="none" poster="${escapeHtml(visual(`latest/world-${world.id}.webp`))}" aria-hidden="true"><source src="${escapeHtml(visual(`latest/world-${world.id}.mp4`))}" type="video/mp4" /></video>` : `<div class="bm-darkroom-art" aria-hidden="true"><span>06</span></div>`}
    <div class="bm-world-card-label"><span>WORLD ${String(index + 1).padStart(2, "0")}</span><b>COMPLETE</b></div>
    <h3 id="bm-world-name-${world.id}">${text(`world.${world.id}.name`, copy(world.name.zh, world.english, world.name.ja))}<em class="bm-world-english" lang="en">${escapeHtml(world.english)}</em></h3>
    <p>${text(`world.${world.id}.description`, world.description)}</p>
  </article>`;
const ballCard = (ball: typeof balls[number], index: number) => `<article class="bm-ball-card" data-ball-id="${ball.id}" aria-labelledby="bm-ball-name-${ball.id}">
  <div class="bm-ball-card-top"><span>${String(index + 1).padStart(2, "0")} / 20</span></div>
  <div class="bm-ball-canvas" aria-busy="true" data-state="loading" data-mode="follow">
    <model-viewer data-bm-ball-model="${ball.id}" alt="${escapeHtml(ball.name.zh)} · 3D" aria-describedby="bm-model-help" camera-controls touch-action="pan-y" disable-pan disable-zoom camera-orbit="25deg 70deg 140%" min-camera-orbit="auto 12deg auto" max-camera-orbit="auto 168deg 140%" interpolation-decay="0" field-of-view="30deg" shadow-intensity="0.25" shadow-softness="1" exposure="1" tone-mapping="neutral" interaction-prompt="none" loading="lazy" reveal="auto" environment-image="neutral" poster="/ball-maze/posters/${ball.id}.webp" tabindex="0"></model-viewer>
    <p class="bm-model-status" role="status">${text(`ball.${ball.id}.loading`, copy("正在加载实际模型…", "Loading game model…", "ゲームモデルを読み込み中…"))}</p>
    <button type="button" class="bm-model-retry" data-bm-model-retry hidden>${text(`ball.${ball.id}.retry`, copy("重试加载", "RETRY", "再試行"))}</button>
  </div>
  <h3 id="bm-ball-name-${ball.id}">${text(`ball.${ball.id}.name`, ball.name)}</h3>
  <p class="bm-ball-role">${text(`ball.${ball.id}.role`, ball.role)}</p>
  <p class="bm-ball-description">${text(`ball.${ball.id}.description`, ball.description)}</p>
</article>`;

const renderBallMazePage = () => `
  <div class="ball-maze-page" data-bm-language="zh">
    <header class="bm-header">
      <a class="bm-brand" href="/" aria-label="返回 FreshLi4 首页">
        <img src="${escapeHtml(brand("logo.png"))}" alt="Ball Maze" />
        <span>FRESHLi4 / 02</span>
      </a>
      <div class="bm-header-tools">
        <a class="bm-header-steam" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">STEAM ↗</a>
        <label class="bm-language"><span class="sr-only">选择语言</span><select id="bm-language-select" aria-label="选择语言"><option value="zh">中文</option><option value="en">English</option><option value="ja">日本語</option></select></label>
      </div>
    </header>
    <nav class="bm-side-nav" aria-label="迷宫球详情页导航"><div class="bm-side-tabs">
      ${navItem("#ball-maze-hero", "00", copy("迷宫球", "BALL MAZE", "迷宮ボール"))}
      ${navItem("#play", "01", copy("玩法", "PLAY", "プレイ"))}
      ${navItem("#worlds", "02", copy("世界", "WORLDS", "ワールド"))}
      ${navItem("#balls", "03", copy("小球", "BALLS", "ボール"))}
      ${navItem("#modes", "04", copy("一起玩", "TOGETHER", "一緒に"))}
      ${navItem("#build", "05", copy("创造", "BUILD", "ビルド"))}
      ${navItem("#records", "06", copy("记录", "RECORDS", "記録"))}
      ${navItem("#steam", "07", copy("Steam", "STEAM", "Steam"))}
    </div></nav>

    <main>
      <section class="bm-hero" id="ball-maze-hero" aria-labelledby="bm-hero-title">
        <div class="bm-hero-background" style="background-image:url('${escapeHtml(visual("latest/island.webp"))}')" aria-hidden="true"></div>
        <div class="bm-hero-grid" aria-hidden="true"></div>
        <div class="bm-hero-photo bm-reveal" data-bm-hero-carousel>
          <div class="bm-hero-viewport media-viewport bm-video-frame">${heroClips.map(heroSlide).join("")}</div>
          <div class="bm-hero-media-controls">
            <div class="media-pagination bm-hero-pagination">${heroClips.map((clip, index) => `<button type="button" data-target="${index}"><b>${String(index + 1).padStart(2, "0")}</b>${text(`hero.clip.${clip.id}`, clip.label)}</button>`).join("")}</div>
            <button class="bm-hero-autoplay" type="button" data-carousel-toggle aria-pressed="true"><b data-carousel-icon aria-hidden="true">Ⅱ</b>${text("hero.autoplay", ballMazeHero.autoplay)}</button>
          </div>
        </div>
        <div class="bm-hero-copy bm-reveal">
          <p class="bm-kicker">${ballMazeHero.kicker}</p>
          <img class="bm-hero-logo" src="${escapeHtml(brand(ballMazeHero.logo))}" alt="${escapeHtml(ballMazeHero.logoAlt)}" />
          <h1 id="bm-hero-title">${html("hero.title", ballMazeHero.title, "span")}</h1>
          <p class="bm-hero-dek">${text("hero.dek", ballMazeHero.description)}</p>
          <div class="bm-hero-actions"><a class="bm-button bm-button-primary" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">${text("hero.cta", copy("加入 Steam 愿望单", "ADD TO WISHLIST", "Steam ウィッシュリストに追加"))}<span>↗</span></a><a class="bm-button bm-button-quiet" href="#play">${text("hero.more", copy("继续往下看", "KEEP READING", "続きを読む"))}<span>↓</span></a></div>
        </div>
        <div class="bm-hero-side bm-reveal"><span>ROLL / TILT / REPEAT</span><strong>360°</strong><small>${text("hero.side", copy("每一次旋转，都是一次新的解题。", "Every turn is a new solution.", "回すたびに、新しい答え。"))}</small></div>
        <div class="bm-hero-bottom"><span>FRESHLi4 GAME STUDIO · SHANGHAI</span><a href="#play">SCROLL <b>↓</b></a></div>
      </section>

      <section class="bm-section bm-play-section" id="play" aria-labelledby="bm-play-title">
        <div class="bm-section-index"><span>01</span><i></i><span>THE RULE</span></div>
        <div class="bm-play-layout">
          <div class="bm-section-heading bm-reveal"><p class="bm-kicker">THE ANOMALY / 核心玩法</p><h2 id="bm-play-title">${html("play.title", copy("你不控制小球。<br /><em>你控制整个世界。</em>", "You do not control the ball.<br /><em>You control the world.</em>", "ボールを操るのではない。<br /><em>世界を操る。</em>"), "span")}</h2><p>${text("play.intro", copy("把一座迷宫想成一块悬浮的立体拼图。旋转它，观察坡度，等待惯性把小球送进下一段轨道。简单的输入，持续变化的空间关系。", "Think of the maze as a floating 3D puzzle. Rotate it, read the slope, and wait for momentum to carry the ball into the next rail. Simple input, constantly changing space.", "迷路を浮かぶ立体パズルとして捉えます。回し、傾斜を読み、慣性がボールを次のレールへ運ぶのを待つ。入力はシンプル、空間の関係は変わり続けます。"))}</p></div>
          <div class="bm-play-footage bm-video-frame bm-reveal">${video("play", "旋转迷宫实机演示")}</div>
        </div>
        <div class="bm-play-cards">
          <article class="bm-principle-card bm-reveal"><span>01 / TILT</span><h3>${text("play.card1.title", copy("旋转迷宫", "Tilt the maze", "迷路を回す"))}</h3><p>${text("play.card1.copy", copy("控制的是迷宫的朝向，而不是小球的方向。", "You control the maze's orientation, not the ball's direction.", "操るのはボールの向きではなく、迷路の向き。"))}</p></article>
          <article class="bm-principle-card bm-reveal"><span>02 / READ</span><h3>${text("play.card2.title", copy("读懂轨道", "Read the rail", "レールを読む"))}</h3><p>${text("play.card2.copy", copy("坡度、速度、碰撞和特殊机关共同组成一条会变化的路线。", "Slope, speed, collision, and mechanisms make a route that keeps changing.", "傾斜、速度、衝突、ギミックが変化し続けるルートを作ります。"))}</p></article>
          <article class="bm-principle-card bm-reveal"><span>03 / REPEAT</span><h3>${text("play.card3.title", copy("一次又一次", "Try again", "何度でも"))}</h3><p>${text("play.card3.copy", copy("失误不是失败，是下一次旋转前多得到的一条信息。", "A mistake is not failure; it is one more piece of information before the next turn.", "ミスは失敗ではなく、次に回す前に得られる情報です。"))}</p></article>
        </div>
      </section>

      <section class="bm-section bm-worlds-section" id="worlds" aria-labelledby="bm-worlds-title">
        <div class="bm-section-index"><span>02</span><i></i><span>THE WORLDS</span></div>
        <div class="bm-worlds-intro bm-reveal"><div><p class="bm-kicker">SIX WORLDS / 六个世界</p><h2 id="bm-worlds-title">${html("worlds.title", copy("六种风景，<br /><em>六种重力谜题。</em>", "Six landscapes.<br /><em>Six gravity puzzles.</em>", "六つの風景。<br /><em>六つの重力の謎。</em>"))}</h2></div><p>${text("worlds.intro", copy("从都市与矿洞出发，越过海岛与峡谷，再深入黑洞与暗室。六个世界已经完成，每一种风景都有自己的轨道、机关与解题方式。", "From city and mine to island and valley, then into black hole and darkroom. All six worlds are complete, each with its own rails, mechanisms, and puzzles.", "都市と鉱山から島と峡谷へ、そしてブラックホールと暗室へ。六つの世界が完成し、それぞれに独自のレール、仕掛け、解き方があります。"))}</p></div>
        <div class="bm-world-stat-strip bm-reveal">
          <div>${html("stats.worlds.count", copy("6 个", "6", "6 つ"), "strong")}<span>${text("stats.worlds", copy("待挑战的世界", "WORLDS TO CHALLENGE", "挑戦を待つ世界"))}</span></div>
          <div>${html("stats.balls.count", copy("20 个", "20", "20 個"), "strong")}<span>${text("stats.balls", copy("超能力小球", "SUPERPOWER BALLS", "超能力ボール"))}</span></div>
          <div>${html("stats.tracks.count", copy("200+ 个", "200+", "200+ 個"), "strong")}<span>${text("stats.tracks", copy("与众不同的轨道", "DISTINCT TRACKS", "個性豊かなレール"))}</span></div>
          <b>BALL MAZE / 六个世界</b>
        </div>
        <div class="bm-world-grid">${worlds.map(worldCard).join("")}</div>
      </section>

      <section class="bm-section bm-balls-section" id="balls" aria-labelledby="bm-balls-title">
        <div class="bm-section-index"><span>03</span><i></i><span>THE BALLS</span></div>
        <div class="bm-balls-heading bm-reveal"><div><p class="bm-kicker">EVERY BALL CHANGES THE RULE / 特殊能力</p><h2 id="bm-balls-title">${html("balls.title", copy("同一座迷宫，<br /><em>不同的解法。</em>", "One maze.<br /><em>Twenty ways to play.</em>", "一つの迷路。<br /><em>二十の解き方。</em>"))}</h2></div><p>${text("balls.intro", copy("完成挑战可以解锁拥有特殊能力的个性小球。它们不是换皮，而是让你重新理解坡度、碰撞、路线和风险。", "Complete challenges to unlock balls with distinct abilities. They are not cosmetic swaps—they make you rethink slope, collision, routes, and risk.", "挑戦を達成すると、固有能力を持つボールが解放されます。見た目違いではなく、傾斜、衝突、ルート、リスクの読み方を変えます。"))}</p></div>
        <p class="bm-model-help bm-reveal" id="bm-model-help">${text("viewer.help", copy("鼠标在格子外，小球跟随鼠标转向。移入任意画布，左键拖动旋转；移出后，从当前角度继续跟随。也可用键盘方向键旋转。", "Outside a canvas, the balls look toward your pointer. Enter any canvas and drag to rotate; leave to resume following from that angle. Arrow keys also rotate.", "キャンバスの外では、ボールがポインターを追います。中に入るとドラッグで回転し、離れるとその角度から追従を再開。矢印キーでも回転できます。"))}</p>
        <div class="bm-ball-grid">${balls.map(ballCard).join("")}</div>
      </section>

      <section class="bm-section bm-modes-section" id="modes" aria-labelledby="bm-modes-title">
        <div class="bm-section-index"><span>04</span><i></i><span>THE MODES</span></div>
        <div class="bm-modes-heading bm-reveal"><p class="bm-kicker">SOLO &amp; CO-OP / 单人与协作</p><h2 id="bm-modes-title">${html("modes.title", copy("一个迷宫，<br /><em>独自挑战，一起闯关。</em>", "One maze.<br /><em>Play solo. Play together.</em>", "一つの迷路。<br /><em>一人でも、みんなでも。</em>"))}</h2></div>
        <div class="bm-mode-grid">
          <article class="bm-mode-card bm-reveal"><span>01 / SOLO</span><h3>${text("mode.solo.title", copy("单人挑战", "Solo challenge", "ソロチャレンジ"))}</h3><p>${text("mode.solo.copy", copy("在主题世界中逐关前进，完成挑战、收集星星，解锁新的球与路线。", "Move through themed worlds, complete challenges, collect stars, and unlock new balls and routes.", "テーマ世界を進み、挑戦を達成し、星を集め、新しいボールとルートを解放します。"))}</p><div class="bm-mode-footage bm-video-frame">${video("solo", "单人挑战真实游戏录屏", true)}</div></article>
          <article class="bm-mode-card bm-reveal"><span>02 / CO-OP</span><h3>${text("mode.coop.title", copy("同屏协作", "Same-screen co-op", "同画面協力"))}</h3><p>${text("mode.coop.copy", copy("多个玩家分别控制迷宫的不同部分。只有精准沟通，才能把同一颗球送到终点。", "Players control different parts of one maze. Precise communication is the only way to deliver one ball to the goal.", "複数のプレイヤーが一つの迷路の別々の部分を担当。正確な会話で一つのボールをゴールへ運びます。"))}</p><div class="bm-mode-footage bm-video-frame bm-mode-footage-pending"><p>${text("mode.coop.recording.pending", copy("多人协作实机录屏待提供", "Co-op gameplay recording pending", "協力プレイの実機録画は準備中"))}</p></div></article>
        </div>
      </section>

      <section class="bm-section bm-build-section" id="build" aria-labelledby="bm-build-title">
        <div class="bm-section-index"><span>05</span><i></i><span>THE EDITOR</span></div>
        <div class="bm-build-layout">
          <div class="bm-build-copy bm-reveal"><p class="bm-kicker">BUILD · TEST · SHARE / 迷宫编辑器</p><h2 id="bm-build-title">把你的<br /><em>奇思妙想搭出来。</em></h2><p>${text("build.copy", copy("从轨道模块开始，自由移动、连接和旋转，搭建一座属于自己的迷宫。完成搭建后直接进入试玩，用每一次尝试继续打磨路线。", "Start with rail modules. Move, connect, and rotate them to build your own maze, then jump into a playtest and refine the route with each attempt.", "レールモジュールを動かし、つなぎ、回転させて自分の迷路を制作。すぐにテストプレイへ進み、試すたびにルートを磨きます。"))}</p><ul><li>${text("build.item1", copy("轨道模块", "Rail modules", "レールモジュール"))}</li><li>${text("build.item2", copy("自由移动与旋转", "Move and rotate freely", "自由移動と回転"))}</li><li>${text("build.item3", copy("搭建后直接试玩", "Build, then playtest", "制作後すぐにテスト"))}</li></ul><a class="bm-inline-link" href="https://steamcommunity.com/app/3678730/workshop/" target="_blank" rel="noopener noreferrer">${text("build.cta", copy("在创意工坊查看社区迷宫", "VIEW COMMUNITY MAZES IN THE WORKSHOP", "ワークショップでコミュニティの迷路を見る"))}<span>↗</span></a></div>
          <div class="bm-editor-card bm-video-frame bm-reveal">${video("editor", "关卡编辑器真实游戏录屏", true)}</div>
        </div>
      </section>

      <section class="bm-section bm-record-section" id="records" aria-labelledby="bm-record-title">
        <div class="bm-section-index"><span>06</span><i></i><span>THE RECORD</span></div>
        <div class="bm-record-layout">
          <div class="bm-record-heading bm-reveal"><p class="bm-kicker">CHALLENGE / 记录</p><h2 id="bm-record-title">${text("records.title.first", copy("每一条路线，", "Every route", "どのルートも、"))}<em>${text("records.title.second", copy("都可以更好。", "can be better.", "もっと良くできる。"))}</em></h2><p>${text("records.copy", copy("挑战完成数、过关用时与小球掉落次数，都会显示在游戏的真实结算界面。对照你的记录与最佳记录，找到下一次可以突破的目标。", "The game's result screen shows completed challenges, finish time, and ball falls. Compare your record with your best and find the next target to beat.", "ゲームの結果画面に挑戦達成数、クリアタイム、落下回数を表示。今回とベストの記録を比べ、次に越える目標を見つけます。"))}</p></div>
          <div class="bm-record-footage bm-video-frame bm-reveal">${video("records", "游戏成绩与最佳记录真实录屏", true)}</div>
        </div>
      </section>

      <section class="bm-final-section" id="steam" aria-labelledby="bm-final-title">
        <div class="bm-final-background" style="background-image:url('${escapeHtml(visual("latest/black-hole.webp"))}')" aria-hidden="true"></div>
        <div class="bm-final-copy bm-reveal"><p class="bm-kicker">BALL MAZE / FRESHLi4</p><h2 id="bm-final-title">现在，<br /><em>轮到你来转。</em></h2><a class="bm-button bm-button-primary" href="https://store.steampowered.com/app/3678730/_/?l=schinese" target="_blank" rel="noopener noreferrer">${text("final.cta", copy("前往 Steam", "VISIT STEAM", "Steamへ"))}<span>↗</span></a></div>
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
  document.querySelectorAll<HTMLElement>("[data-bm-nav]").forEach((element) => {
    element.setAttribute("aria-label", `${element.querySelector("b")?.textContent} ${translations[element.dataset.bmNav!][lang]}`);
  });
  const select = document.querySelector<HTMLSelectElement>("#bm-language-select");
  if (select) select.value = lang;
  localStorage.setItem("freshli4-language", lang);
  document.dispatchEvent(new CustomEvent("ball-maze-language", { detail: lang }));
};

const setupBallMazeInteractions = () => {
  const select = document.querySelector<HTMLSelectElement>("#bm-language-select");
  const savedLanguage = localStorage.getItem("freshli4-language") as Lang | null;
  setLanguage(savedLanguage === "en" || savedLanguage === "ja" || savedLanguage === "zh" ? savedLanguage : "zh");
  select?.addEventListener("change", () => setLanguage(select.value as Lang));

  setupBallMazeGallery(savedLanguage === "en" || savedLanguage === "ja" ? savedLanguage : "zh");
  const worldVideoCleanup = setupBallMazeWorldVideos();
  import.meta.hot?.dispose(worldVideoCleanup);
  const heroCarousel = document.querySelector<HTMLElement>("[data-bm-hero-carousel]");
  if (heroCarousel) {
    const cleanup = setupMediaCarousel(heroCarousel);
    import.meta.hot?.dispose(cleanup);
  }
  const sectionCleanup = setupBallMazeSections();
  import.meta.hot?.dispose(sectionCleanup);

  const mediaObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) void video.play().catch(() => {});
      } else video.pause();
    }
  }, { threshold: 0.25 });
  document.querySelectorAll<HTMLVideoElement>("[data-bm-video]").forEach((video) => mediaObserver.observe(video));

  const sections = [...document.querySelectorAll<HTMLElement>(".bm-hero, .bm-section, .bm-final-section")];
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
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
  document.body.dataset.bmSection = initialBallMazeSection(window.location.hash);
  document.body.classList.add("is-ball-maze-page");
  document.querySelector<HTMLElement>("#top")!.innerHTML = renderBallMazePage();
  document.querySelector(".site-header")?.classList.add("is-hidden-on-ball-maze");
  document.querySelector("#mobile-menu")?.remove();
  document.querySelector(".video-modal")?.remove();
  setupBallMazeInteractions();
  return true;
};
