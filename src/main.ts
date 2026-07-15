import "./styles.css";

type Lang = "zh" | "ja" | "en";
type Copy = Record<Lang, string>;
type MediaItem = { name: string; url: string | null; kind: "image" | "video" | "placeholder" };

const mediaFiles = import.meta.glob("/asset/*/visual-content/*", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]);
const videoExtensions = new Set(["mp4", "webm", "mov", "m4v"]);

const copy = (zh: string, en: string, ja = en): Copy => ({ zh, en, ja });
const gameText: Record<string, Record<string, Copy>> = {};

interface GameConfig {
  slug: string;
  aliases: string[];
  theme: "investigation" | "ballmaze" | "diveup" | "studio";
  fontClass: string;
  order: number;
  title: Copy;
  englishTitle: string;
  status: Copy;
  category: Copy;
  description: Copy;
  tags: Copy[];
  cta: Copy;
  noteA: string;
  noteB: string;
  link?: string;
}

const knownGames: GameConfig[] = [
  {
    slug: "investigation-delve", aliases: ["investigation-delve", "investigation", "调查深入", "调查：深入"], theme: "investigation", fontClass: "investigation-font", order: 1,
    title: copy("调查深入", "Investigation : Delve", "調査：深入"), englishTitle: "Investigation : Delve", status: copy("现已发售", "AVAILABLE NOW", "発売中"), category: copy("卡牌 · 调查 · 策略", "CARD GAME · INVESTIGATION · STRATEGY", "カード · 調査 · 戦略"),
    description: copy("一款支持 2–6 人游玩的非直接对战美式桌游。你将扮演“指挥者”，操控调查员，在调查中规避禁忌真相，利用策略牌、角色技能与行动顺位保护己方，并诱导对手比你更早陷入疯狂。", "A non-direct-conflict American-style tabletop game for 2–6 players. As the commander, guide your investigators, avoid forbidden truths during the investigation, use strategy cards, abilities, and turn order to protect your side, and push your rivals into madness first.", "2〜6人向けの非直接対戦型アメリカンテーブルトップゲーム。指揮官として調査員を操り、調査の中で禁忌の真実を避け、味方を守りながら相手を先に狂気へ追い込みます。"),
    tags: [copy("美式桌游", "AMERICAN TABLETOP", "アメリカンテーブルトップ"), copy("策略卡牌", "STRATEGY CARD GAME", "戦略カード"), copy("2–6 人", "2–6 PLAYERS", "2〜6人")], cta: copy("购买", "BUY", "購入"), noteA: "INVESTIGATION<br />GUILD", noteB: "ANOMALY", link: "https://xhslink.com/m/lDaRjSilOC",
  },
  {
    slug: "ball-maze", aliases: ["ball-maze", "maze", "迷宫球"], theme: "ballmaze", fontClass: "maze-font", order: 2,
    title: copy("迷宫球", "Ball Maze", "迷宮ボール"), englishTitle: "Ball Maze", status: copy("即将发售", "COMING SOON", "発売予定"), category: copy("物理 · 解谜 · 创作", "PHYSICS · PUZZLE · CREATION", "物理 · パズル · クリエイション"),
    description: copy("旋转整座迷宫，让小球沿着轨道抵达终点。每一种球都有自己的脾气；每一条轨道，都可以被重新组合成属于你的机关。", "Rotate the entire maze and guide the ball along its track to the goal. Every ball has its own temperament, and every track can be recombined into a mechanism of your own.", "迷路全体を回転させ、ボールをゴールへ導きます。ボールには個性があり、レールは自由に組み替えられます。"),
    tags: [copy("Steam", "STEAM"), copy("物理解谜", "PHYSICS PUZZLE", "物理パズル"), copy("关卡编辑器", "LEVEL EDITOR", "レベルエディター")], cta: copy("加入愿望单", "WISHLIST", "ウィッシュリストに追加"), noteA: "TURN<br />THE WORLD", noteB: "360°", link: "https://store.steampowered.com/app/3678730/_/?l=schinese",
  },
  {
    slug: "dive-up", aliases: ["dive-up", "diveup", "跃入迷城"], theme: "diveup", fontClass: "dive-font", order: 3,
    title: copy("跃入迷城", "Dive Up", "躍入迷城"), englishTitle: "Dive Up", status: copy("开发中", "IN DEVELOPMENT", "開発中"), category: copy("3D 轴测 · Roguelike ARPG", "3D ISOMETRIC · ROGUELIKE ARPG", "3D アイソメトリック · ROGUELIKE ARPG"),
    description: copy("2085 年，在复兴城，作为不断复生的 Drifter 潜入城市深处。构建义体、改造武器，在一次次死亡留下的记忆中追踪“永生计划”。", "In 2085, descend into Revival City as a repeatedly resurrected Drifter. Rebuild cyberware and weapons while following the traces of an immortality project left across memories of death.", "2085年の復興城。何度も蘇るDrifterとして都市の深部へ潜入し、「不死計画」を追います。"),
    tags: [copy("Steam", "STEAM"), copy("Roguelike ARPG", "ROGUELIKE ARPG"), copy("赛博朋克", "CYBERPUNK")], cta: copy("敬请期待", "COMING SOON", "続報をお待ちください"), noteA: "MEMORY<br />STACK", noteB: "2085",
  },
];

const translations: Record<string, Copy> = {
  "nav.studio": copy("工作室", "Studio", "スタジオ"), "nav.games": copy("游戏", "Games", "ゲーム"), "nav.contact": copy("联系", "Contact", "連絡"),
  "hero.eyebrow": copy("INDEPENDENT GAME STUDIO · SHANGHAI", "INDEPENDENT GAME STUDIO · SHANGHAI"), "hero.studioName": copy("新鲜李四游戏工作室", "FreshLi4 Game Studio", "FreshLi4 ゲームスタジオ"), "hero.copy": copy("做新鲜、有手感、<br />让人记住的独立游戏。", "Independent games that feel fresh,<br />play well, and stay with you.", "新鮮で、手触りがよく、<br />記憶に残るインディーゲームを。"),
  "studio.kicker": copy("ABOUT / 关于我们", "ABOUT / THE STUDIO", "ABOUT / スタジオについて"), "studio.title": copy("我们不生产<br />标准答案。", "We do not make<br />standard answers.", "私たちは、<br />定番解を作らない。"), "studio.p1": copy("新鲜李四是一家位于上海的独立游戏工作室。我们喜欢清楚的规则、扎实的操作，以及那些第一次看到就会让人想伸手试试的点子。", "FreshLi4 is an independent game studio based in Shanghai. We value clear rules, tactile play, and ideas that make you want to reach out and try them the moment you see them.", "FreshLi4は上海を拠点とするインディーゲームスタジオです。明快なルール、確かな操作感、触ってみたくなるアイデアを大切にしています。"), "studio.p2": copy("从调查叙事、物理迷宫，到赛博朋克动作游戏——我们用小团队的方式，把每个项目做出自己的气味。", "From investigative narratives and physical mazes to cyberpunk action games, our small team gives every project a character of its own.", "調査物語、物理迷路、サイバーパンクアクションまで。小さなチームだからこそ、各作品に独自の匂いを持たせます。"), "studio.founded": copy("创立于", "FOUNDED", "設立"), "studio.location": copy("上海", "SHANGHAI", "上海"), "studio.based": copy("位于", "BASED IN", "拠点"), "studio.ideas": copy("奇怪点子", "ODD IDEAS", "奇妙なアイデア"),
  "contact.kicker": copy("CONTACT / 找我们玩", "CONTACT / SAY HELLO", "CONTACT / お問い合わせ"), "contact.title": copy("一起做点<br /><span>新鲜的。</span>", "Let’s make<br /><span>something fresh.</span>", "一緒に、<br /><span>新しいものを。</span>"), "contact.collaboration": copy("合作", "Collaboration", "協業"), "contact.publishing": copy("发行", "Publishing", "パブリッシング"), "contact.press": copy("媒体", "Press", "メディア"), "contact.jobs": copy("招聘", "Jobs", "採用"), "contact.backTop": copy("返回顶部 ↑", "BACK TO TOP ↑", "ページ上部へ ↑"), "modal.title": copy("视频占位", "VIDEO PLACEHOLDER", "VIDEO PLACEHOLDER"), "modal.copy": copy("替换为你的 MP4 / Vimeo / Bilibili 嵌入内容", "Replace with an MP4, Vimeo, or Bilibili embed", "MP4 / Vimeo / Bilibili の埋め込みに置き換えてください"),
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
const gameForFolder = (folder: string): GameConfig => {
  const normalized = folder.toLowerCase();
  return knownGames.find((game) => game.aliases.some((alias) => normalized === alias.toLowerCase() || slugify(normalized) === slugify(alias))) ?? {
    slug: slugify(folder), aliases: [folder], theme: "studio", fontClass: "studio-font", order: 1000, title: copy(folder, folder, folder), englishTitle: folder, status: copy("开发中", "IN DEVELOPMENT", "開発中"), category: copy("原创 IP · 实验项目", "ORIGINAL IP · PROTOTYPE", "オリジナル IP · プロトタイプ"), description: copy("这里会展示一款新鲜李四正在探索中的游戏。", "A new FreshLi4 project currently taking shape.", "FreshLi4が探究中の新しいプロジェクトです。"), tags: [copy("原创 IP", "ORIGINAL IP"), copy("实验项目", "PROTOTYPE"), copy("开发中", "IN DEVELOPMENT")], cta: copy("敬请期待", "COMING SOON", "続報をお待ちください"), noteA: "NEW<br />SIGNAL", noteB: "LAB",
  };
};

const collectMedia = (game: GameConfig): MediaItem[] => {
  const items = Object.entries(mediaFiles).filter(([path]) => {
    const match = path.match(/^\/asset\/([^/]+)\/visual-content\/([^/]+)$/);
    return match && game.aliases.some((alias) => slugify(match[1]) === slugify(alias));
  }).map(([path, url]) => {
    const name = path.split("/").pop() ?? "";
    const extension = name.split(".").pop()?.toLowerCase() ?? "";
    return { name, url, kind: videoExtensions.has(extension) ? "video" as const : "image" as const };
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return items.length ? items : [0, 1, 2].map((index) => ({ name: `placeholder-${index + 1}`, url: null, kind: "placeholder" as const }));
};

const folders = [...new Set(Object.keys(mediaFiles).map((path) => path.match(/^\/asset\/([^/]+)\//)?.[1]).filter(Boolean) as string[])];
const games = [...knownGames, ...folders.map(gameForFolder).filter((game) => !knownGames.some((known) => known.slug === game.slug))].sort((a, b) => a.order - b.order);

const textKey = (game: GameConfig, field: string) => `game.${game.slug}.${field}`;
for (const game of games) {
  gameText[game.slug] = { status: game.status, category: game.category, description: game.description, cta: game.cta, ...Object.fromEntries(game.tags.map((tag, index) => [`tag${index}`, tag])) };
}

const renderMedia = (game: GameConfig, item: MediaItem, index: number) => {
  const content = item.kind === "video" ? `<video src="${escapeHtml(item.url ?? "")}" muted playsinline preload="metadata" data-media-video></video>` : item.kind === "image" ? `<img src="${escapeHtml(item.url ?? "")}" alt="${escapeHtml(game.title.en)} visual ${index + 1}" />` : `<div class="media-placeholder"><span>VISUAL CONTENT</span><strong>0${index + 1}</strong></div>`;
  const play = item.kind === "placeholder" ? `<button class="play-button" type="button" data-preview-trigger aria-label="播放概念视频"><span>PLAY</span><i></i></button>` : "";
  return `<div class="media-slide${index === 0 ? " active" : ""}" data-slide="${index}" data-kind="${item.kind}">${content}${play}</div>`;
};

const renderGame = (game: GameConfig, index: number) => {
  const media = collectMedia(game);
  const tags = game.tags.map((_, tagIndex) => `<span data-game-i18n="${escapeHtml(textKey(game, `tag${tagIndex}`))}"></span>`).join("");
  const titleKey = `game.${game.slug}.title`;
  translations[titleKey] = game.title;
  translations[textKey(game, "status")] = game.status; translations[textKey(game, "category")] = game.category; translations[textKey(game, "description")] = game.description; translations[textKey(game, "cta")] = game.cta;
  for (const [tagIndex, tag] of game.tags.entries()) translations[textKey(game, `tag${tagIndex}`)] = tag;
  return `<section class="game-section${index % 2 === 1 ? " game-section-alt" : ""} theme-trigger ${game.fontClass}" id="${escapeHtml(game.slug)}" data-theme="${game.theme}" aria-labelledby="${escapeHtml(game.slug)}-title"><div class="game-layout"><article class="game-copy-panel reveal"><div class="game-meta"><span>0${index + 1}</span><span data-game-i18n="${textKey(game, "status")}"></span></div><div class="game-copy-main"><p class="game-category" data-game-i18n="${textKey(game, "category")}"></p><h2 id="${escapeHtml(game.slug)}-title" class="game-title" data-game-title="${escapeHtml(game.slug)}"></h2><p class="game-description" data-game-i18n="${textKey(game, "description")}"></p></div><div class="game-footer"><div class="tags">${tags}</div>${game.link ? `<a class="text-link project-cta" href="${escapeHtml(game.link)}" target="_blank" rel="noopener noreferrer"><span data-game-i18n="${textKey(game, "cta")}"></span><span aria-hidden="true">↗</span></a>` : `<span class="text-link project-cta is-disabled"><span data-game-i18n="${textKey(game, "cta")}"></span></span>`}</div></article><div class="media-stage reveal" data-game="${escapeHtml(game.slug)}"><div class="media-shadow" aria-hidden="true"></div><div class="media-frame tilt-card"><div class="media-topbar"><div class="media-dots"><i></i><i></i><i></i></div><div class="media-label"></div><button class="media-expand" type="button" aria-label="切换媒体">↗</button></div><div class="media-viewport">${media.map((item, mediaIndex) => renderMedia(game, item, mediaIndex)).join("")}</div><div class="media-pagination">${media.map((_, mediaIndex) => `<button class="${mediaIndex === 0 ? "active" : ""}" type="button" data-target="${mediaIndex}">0${mediaIndex + 1}</button>`).join("")}</div></div><div class="floating-note note-a">${game.noteA}</div><div class="floating-note note-b">${game.noteB}</div></div></div></section>`;
};

document.querySelector("#games-mount")!.innerHTML = games.map(renderGame).join("");
document.querySelector(".brand-logo")?.setAttribute("src", "/brand-logo.png");

const languageSelect = document.querySelector<HTMLSelectElement>("#language-select");
const body = document.body;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeColors: Record<string, string> = { studio: "#F3FF59", investigation: "#000000", ballmaze: "#45AEA4", diveup: "#000000" };
const languageNames: Record<Lang, string> = { zh: "中文", ja: "日本語", en: "English" };
const getLanguage = (): Lang => (localStorage.getItem("freshli4-language") as Lang) || "zh";

const applyLanguage = (language: Lang) => {
  const lang = translations["nav.studio"][language] ? language : "zh";
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  body.dataset.lang = lang;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => { const value = translations[element.dataset.i18n ?? ""]?.[lang]; if (value !== undefined) element.textContent = value; });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((element) => { const value = translations[element.dataset.i18nHtml ?? ""]?.[lang]; if (value !== undefined) element.innerHTML = value; });
  document.querySelectorAll<HTMLElement>("[data-game-i18n]").forEach((element) => { const value = translations[element.dataset.gameI18n ?? ""]?.[lang]; if (value !== undefined) element.textContent = value; });
  document.querySelectorAll<HTMLElement>("[data-game-title]").forEach((element) => { const game = games.find((item) => item.slug === element.dataset.gameTitle); if (!game) return; element.innerHTML = lang === "en" ? `<em>${escapeHtml(game.englishTitle)}</em>` : `<span>${escapeHtml(game.title[lang])}</span><em>${escapeHtml(game.englishTitle)}</em>`; });
  if (languageSelect) { languageSelect.value = lang; languageSelect.title = languageNames[lang]; }
  document.querySelectorAll<HTMLElement>(".media-stage").forEach((stage) => updateMediaLabel(stage));
  localStorage.setItem("freshli4-language", lang);
};

const updateMediaLabel = (stage: Element) => { const active = stage.querySelector<HTMLElement>(".media-slide.active"); const label = stage.querySelector<HTMLElement>(".media-label"); if (label) label.textContent = `${(stage as HTMLElement).dataset.game?.toUpperCase()} // PREVIEW_0${Number(active?.dataset.slide ?? 0) + 1}`; };
applyLanguage(getLanguage());
languageSelect?.addEventListener("change", () => applyLanguage(languageSelect.value as Lang));

const mobileMenu = document.querySelector<HTMLElement>("#mobile-menu");
if (mobileMenu) { mobileMenu.innerHTML = [{ href: "#studio", key: "nav.studio" }, ...games.map((game) => ({ href: `#${game.slug}`, key: `game.${game.slug}.title` })), { href: "#contact", key: "nav.contact" }].map((item) => `<a href="${item.href}" data-menu-key="${item.key}"></a>`).join(""); }
const updateMobileMenu = () => mobileMenu?.querySelectorAll<HTMLElement>("[data-menu-key]").forEach((item) => { const key = item.dataset.menuKey ?? ""; const game = games.find((candidate) => key === `game.${candidate.slug}.title`); item.textContent = game ? `${game.title[getLanguage()]} / ${game.englishTitle}` : translations[key]?.[getLanguage()] ?? key; });
updateMobileMenu();
languageSelect?.addEventListener("change", updateMobileMenu);

const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); } }), { threshold: 0.1 });
document.querySelectorAll<HTMLElement>(".reveal").forEach((element, index) => { element.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`; revealObserver.observe(element); });
const themeObserver = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) { const theme = (visible.target as HTMLElement).dataset.theme ?? "studio"; body.dataset.theme = theme; if (themeMeta && themeColors[theme]) themeMeta.setAttribute("content", themeColors[theme]); } }, { threshold: [0.1, 0.25, 0.45, 0.65, 0.85], rootMargin: "-18% 0px -18% 0px" });
document.querySelectorAll<HTMLElement>(".theme-trigger").forEach((section) => themeObserver.observe(section));

document.querySelectorAll<HTMLElement>(".media-stage").forEach((stage) => {
  const slides = [...stage.querySelectorAll<HTMLElement>(".media-slide")]; const buttons = [...stage.querySelectorAll<HTMLButtonElement>(".media-pagination button")]; let current = 0; let timer: number | undefined;
  const show = (index: number) => { window.clearTimeout(timer); current = (index + slides.length) % slides.length; slides.forEach((slide, i) => { slide.classList.toggle("active", i === current); slide.querySelectorAll<HTMLVideoElement>("video").forEach((video) => { if (i === current) void video.play().catch(() => undefined); else { video.pause(); video.currentTime = 0; } }); }); buttons.forEach((button, i) => button.classList.toggle("active", i === current)); updateMediaLabel(stage); const active = slides[current]; const video = active.querySelector<HTMLVideoElement>("video"); if (video) { video.onended = () => show(current + 1); video.onerror = () => { timer = window.setTimeout(() => show(current + 1), 3000); }; } else timer = window.setTimeout(() => show(current + 1), 3000); };
  buttons.forEach((button) => button.addEventListener("click", () => show(Number(button.dataset.target)))); stage.querySelector<HTMLButtonElement>(".media-expand")?.addEventListener("click", () => show(current + 1)); stage.querySelectorAll<HTMLButtonElement>("[data-preview-trigger]").forEach((button) => button.addEventListener("click", () => document.querySelector(".video-modal")?.classList.add("open"))); show(0);
});

const closeMenu = () => { document.querySelector(".menu-button")?.setAttribute("aria-expanded", "false"); mobileMenu?.setAttribute("aria-hidden", "true"); mobileMenu?.classList.remove("open"); body.style.overflow = ""; };
document.querySelector<HTMLButtonElement>(".menu-button")?.addEventListener("click", () => { const button = document.querySelector<HTMLButtonElement>(".menu-button")!; const open = button.getAttribute("aria-expanded") === "true"; button.setAttribute("aria-expanded", String(!open)); mobileMenu?.setAttribute("aria-hidden", String(open)); mobileMenu?.classList.toggle("open", !open); body.style.overflow = open ? "" : "hidden"; });
mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.querySelector(".video-close")?.addEventListener("click", () => document.querySelector(".video-modal")?.classList.remove("open"));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeMenu(); document.querySelector(".video-modal")?.classList.remove("open"); } });
if (matchMedia("(pointer:fine)").matches) { document.querySelectorAll<HTMLElement>(".tilt-card").forEach((card) => { card.addEventListener("mousemove", (event) => { const rect = card.getBoundingClientRect(); const x = (event as MouseEvent).clientX - rect.left; const y = (event as MouseEvent).clientY - rect.top; card.style.transform = `rotateY(${(x / rect.width - .5) * 3.5}deg) rotateX(${(y / rect.height - .5) * -3.5}deg)`; }); card.addEventListener("mouseleave", () => { card.style.transform = ""; }); }); }
