import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { projects } from "../src/data/pitch-deck.mjs";
import { generatePitchDeckShell } from "./generate-pitch-deck-shell.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public", "pitch-deck");
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const number = value => String(value + 1).padStart(2, "0");
const url = project => `/pitch-deck/${project.slug}`;
const image = project => `/pitch-deck/media/${project.slug}.webp`;
const contact = "taobe.gong@freshli4.com";

function document(title, description, path, body) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f3ff59"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="description" content="${escape(description)}"><title>${escape(title)} · FreshLi4</title><link rel="canonical" href="https://www.freshli4.com${path}"><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/pitch-deck/studio-shell.css"><link rel="stylesheet" href="/pitch-deck/pitch-deck.css"></head><body data-pitch-deck data-pagefind-ignore="all" data-overview-theme="studio"><a class="skip-link" href="#main">跳到主要内容</a>${body}<script type="module" src="/pitch-deck/pitch-deck.js"></script></body></html>`;
}

function card(project, index) {
  return `<a class="project-card" href="${url(project)}" id="project-${project.slug}" style="--accent:${project.accent};--tint:${project.tint}"><div class="card-art"><img src="${image(project)}" width="1536" height="1024" alt="${escape(project.imageAlt)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"><span class="art-label">概念视觉</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-meta"><span>${number(index)} / ${escape(project.category)}</span><span class="stage"><i aria-hidden="true"></i>${escape(project.stage)}</span></div><h2>${escape(project.title)}</h2><p>${escape(project.short)}</p><span class="card-link">进入项目 <span aria-hidden="true">→</span></span></a>`;
}

const overviewGroups = [
  {
    id: "fun-with-friends",
    theme: "friends",
    title: "Fun with friends",
    chineseTitle: "和朋友一起玩",
    description: "以合作、派对和轻松对抗，分享一局游戏。",
    label: "CASUAL · CO-OP · PARTY",
    projectSlugs: ["must-be-human", "haunted-castle", "steel-fists", "slam-drunk", "bid-or-bust"]
  },
  {
    id: "immerse-yourself",
    theme: "immersive",
    title: "Immerse yourself",
    chineseTitle: "沉浸其中",
    description: "踏进各自的世界，在故事、战斗与探索中投入其中。",
    label: "IMMERSIVE · STORY · ACTION",
    projectSlugs: ["double-deposition", "fog-bound", "unboxing-roguelike", "dive-up", "lebab"]
  },
  {
    id: "free-to-play",
    theme: "free",
    title: "Free to play",
    chineseTitle: "免费开玩",
    description: "面向免费游玩的低门槛体验，覆盖卡牌对局与信息检索推理。",
    label: "BROWSER · PICK UP AND PLAY",
    projectSlugs: ["roshambo", "case-pending-guanlan"]
  }
];
const indexedProjects = new Map(projects.map((project, index) => [project.slug, { project, index }]));
const groupedProjectSlugs = overviewGroups.flatMap(group => group.projectSlugs);
if (groupedProjectSlugs.length !== projects.length || new Set(groupedProjectSlugs).size !== projects.length || groupedProjectSlugs.some(slug => !indexedProjects.has(slug))) {
  throw new Error("Pitch deck overview groups must contain every project exactly once.");
}

function projectGroup(group, index) {
  const cards = group.projectSlugs.map(slug => {
    const entry = indexedProjects.get(slug);
    return card(entry.project, entry.index);
  }).join("");
  return `<section class="project-group wrap" data-overview-section="${group.theme}" id="${group.id}" aria-labelledby="${group.id}-title"><header class="project-group-heading"><div><span class="eyebrow">0${index + 1} / ${escape(group.label)}</span><h2 id="${group.id}-title">${escape(group.title)}</h2><span class="group-translation">${escape(group.chineseTitle)}</span></div><p>${escape(group.description)}</p></header><div class="projects-grid" aria-label="${escape(group.chineseTitle)}项目">${cards}</div></section>`;
}

function contentsFrame(items) {
  return `<nav class="games-controls pitch-contents" aria-label="提案目录"><div class="project-tabs">${items}</div></nav>`;
}

function studioHeader(links, brandHref) {
  const navigation = links.map(link => `<a href="${escape(link.href)}">${escape(link.label)}</a>`).join("");
  return `<div class="overview-background" aria-hidden="true"></div><div class="noise" aria-hidden="true"></div>
<header class="site-header"><a class="brand" href="${brandHref}" aria-label="FreshLi4 游戏项目提案"><img class="brand-logo" src="/brand-logo.png" alt=""><span class="brand-name">新鲜李四 <span lang="en">FreshLi4</span></span></a><div class="header-actions"><nav class="main-nav" aria-label="页面导航">${navigation}</nav><button class="menu-button" type="button" aria-expanded="false" aria-controls="pitch-menu"><span></span><span></span><span class="sr-only">打开菜单</span></button></div></header>
<nav class="mobile-menu" id="pitch-menu" aria-label="移动端页面导航" aria-hidden="true" inert>${navigation}</nav>`;
}

function contactSection() {
  return `<section class="contact-section studio-font" id="contact" data-overview-section="studio" aria-labelledby="contact-title">
    <p class="section-kicker reveal">CONTACT / 让想法发生</p><h2 id="contact-title" class="contact-title reveal">一起做点<br><span>新鲜游戏。</span></h2>
    <div class="contact-row reveal"><a class="contact-email" href="mailto:${contact}">${contact} <span aria-hidden="true">↗</span></a><div class="contact-services" aria-label="合作范围"><span class="service-primary">项目合作</span><span class="service-en">Collaboration</span><span class="service-primary">发行合作</span><span class="service-en">Publishing</span><span class="service-primary">媒体交流</span><span class="service-en">Press</span><span class="service-primary">加入团队</span><span class="service-en">Jobs</span></div></div>
    <footer class="footer reveal"><span>© 2026 FreshLi4 GAME STUDIO</span><a href="#top">BACK TO TOP ↑</a></footer>
  </section>`;
}

function floatingContents() {
  const groups = overviewGroups.map((group, index) => {
    const items = group.projectSlugs.map(slug => {
      const { project } = indexedProjects.get(slug);
      return `<li><a class="project-tab toc-project" href="#project-${project.slug}">${escape(project.title)}</a></li>`;
    }).join("");
    return `<div class="toc-group"><a class="project-tab toc-section" href="#${group.id}" data-toc-section="${group.id}"><span class="project-tab-number">${number(index)}</span>${escape(group.title)}</a><ul>${items}</ul></div>`;
  }).join("");
  return contentsFrame(`<a class="project-tab toc-section" href="#top" data-toc-section="top"><span class="project-tab-number">00</span>开场</a>${groups}<a class="project-tab toc-section" href="#contact" data-toc-section="contact"><span class="project-tab-number">04</span>聊聊合作</a>`);
}

function overview() {
  const body = `
${studioHeader([{href:"#fun-with-friends",label:"朋友同玩"},{href:"#immerse-yourself",label:"沉浸探索"},{href:"#free-to-play",label:"免费开玩"},{href:"#contact",label:"合作"}], "#top")}
${floatingContents()}
<main id="main" class="overview-page">
  <section class="hero studio-font" id="top" data-overview-section="studio" aria-labelledby="pitch-title">
    <div class="hero-grid" aria-hidden="true"></div><p class="eyebrow reveal">FRESHLI4 / GAME PROJECT PORTFOLIO</p>
    <h1 id="pitch-title" class="hero-title" aria-label="Fresh ideas · 新鲜游戏提案"><span class="hero-line reveal">FRESH</span><span class="hero-line hero-line-accent reveal">IDEA<span>S</span></span></h1>
    <div class="hero-bottom reveal"><p class="hero-cn">游戏项目提案</p><p class="hero-copy">${projects.length} 个游戏，三种走进游戏的方式。<br>和朋友同玩，沉浸探索，或免费开始。</p><a class="round-link" href="#fun-with-friends" aria-label="浏览游戏项目"><span class="round-link-content"><span>EXPLORE</span><span aria-hidden="true">↓</span></span></a></div>
  </section>
  ${overviewGroups.map(projectGroup).join("")}
  ${contactSection()}
</main>`;
  return document("游戏项目提案", `FreshLi4 ${projects.length} 款游戏项目，分为朋友同玩、沉浸体验与 Free to play 三个展示分区。`, "/pitch-deck", body);
}

function detail(project, index) {
  const next = projects[(index + 1) % projects.length];
  const chapters = [
    { id: "top", label: "项目开场", theme: "studio", className: "hero detail-hero studio-font", content: `
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="detail-hero-layout">
        <div class="detail-heading reveal"><span class="stage"><i aria-hidden="true"></i>${escape(project.stage)}</span><h1 class="hero-title" id="project-title">${project.title.split("：").map(escape).join("：<br>")}</h1>${project.title.toUpperCase() !== project.english ? `<p class="english-title">${escape(project.english)}</p>` : ""}<p class="detail-introduction">${escape(project.short)}</p><a class="browse-link" href="#concept">了解项目 <span aria-hidden="true">↓</span></a></div>
        <div class="detail-hero-intro reveal"><p class="detail-hero-index">PROJECT ${number(index)} / ${String(projects.length).padStart(2, "0")} · ${escape(project.category)}</p><p class="detail-hook">${project.hook.map(escape).join("<br>")}</p><dl class="project-facts">${project.facts.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl></div>
      </div>` },
    { id: "concept", label: "项目概览", theme: "friends", className: "detail-section project-concept wrap", content: `
      <div class="section-label"><span class="eyebrow">01 / THE PROJECT</span><h2>项目概览。</h2></div>
      <div class="project-summary"><p>${escape(project.pitch)}</p><a class="browse-link" href="#experience">了解玩法 <span aria-hidden="true">↓</span></a></div>` },
    { id: "experience", label: "核心体验", theme: "immersive", className: "detail-section experience-section wrap", content: `<div class="section-label"><span class="eyebrow">02 / THE EXPERIENCE</span><h2>玩起来，<br>是什么感觉。</h2></div><div class="experience-copy"><h3>${escape(project.experience)}</h3><p>${escape(project.description)}</p></div>` },
    { id: "features", label: "三个卖点", theme: "friends", className: "detail-section features-section wrap", content: `<div class="section-label"><span class="eyebrow">WHAT MAKES IT FRESH</span><h2>三个值得<br>记住的点。</h2></div><div class="features-grid">${project.features.map(([title, copy], i) => `<article class="feature"><span class="feature-number">${number(i)}</span><h3>${escape(title)}</h3><p>${escape(copy)}</p></article>`).join("")}</div>` },
    { id: "loop", label: "游玩流程", theme: "free", className: "detail-section loop-section wrap", content: `<div class="section-label"><span class="eyebrow">03 / THE PLAY LOOP</span><h2>一段游玩，<br>怎样展开。</h2></div><ol class="play-loop">${project.loop.map(([title, copy], i) => `<li><span class="step-number">${number(i)}</span><div><h3>${escape(title)}</h3><p>${escape(copy)}</p></div></li>`).join("")}</ol>` },
    { id: "visual", label: "美术方向", theme: "immersive", className: "detail-section visual-section wrap", content: `<div class="section-label"><span class="eyebrow">04 / ART DIRECTION</span><h2>它的样子。</h2></div><div class="visual-copy"><span class="visual-chip">${escape(project.visualLabel ?? "LOW POLY / TOON SHADING")}</span><p>${escape(project.visual)}</p></div>` },
    { id: "status", label: "制作进度", theme: "friends", className: "detail-section status-note wrap", content: `<div class="section-label"><span class="eyebrow">05 / PROJECT STATUS</span><h2>制作进度。</h2></div><p>${escape(project.status)}</p>` },
    { id: "next", label: "继续浏览", theme: "friends", className: "detail-section detail-next wrap", content: `<nav class="next-project" aria-label="继续浏览项目"><a class="next-link" href="${url(next)}"><div><span class="eyebrow">UP NEXT / ${number((index + 1) % projects.length)}</span><span class="next-title">${escape(next.title)}</span><span class="next-copy">${escape(next.category)}</span></div><span class="next-arrow" aria-hidden="true">↗</span></a></nav>` }
  ];
  const contents = `<a class="project-tab toc-section" href="/pitch-deck"><span class="project-tab-number">↖</span>返回项目导览</a>` + [...chapters, {id:"contact",label:"聊聊合作"}].map((chapter, i) => `<a class="project-tab toc-section" href="#${chapter.id}" data-toc-section="${chapter.id}"><span class="project-tab-number">${String(i).padStart(2, "0")}</span>${chapter.label}</a>`).join("");
  const body = `${studioHeader([{href:"/pitch-deck",label:"返回导览"},{href:"#concept",label:"项目概览"},{href:"#experience",label:"核心体验"},{href:"#contact",label:"合作"}], "/pitch-deck")}${contentsFrame(contents)}<main id="main" class="project-page detail-page studio-font" style="--project-accent:${project.accent};--project-tint:${project.tint}">${chapters.map(chapter => `<section id="${chapter.id}" class="${chapter.className}" data-overview-section="${chapter.theme}" aria-label="${chapter.label}">${chapter.content}</section>`).join("")}${contactSection()}</main>`;
  return document(project.title, project.short, url(project), body);
}

if (projects.length !== 12 || new Set(projects.map(p => p.slug)).size !== projects.length) throw new Error("Pitch deck must contain twelve unique projects.");
await mkdir(output, { recursive: true });
await generatePitchDeckShell();
await writeFile(join(output, "index.html"), overview(), "utf8");
for (const [index, project] of projects.entries()) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) throw new Error(`Invalid project slug: ${project.slug}`);
  await mkdir(join(output, project.slug), { recursive: true });
  await writeFile(join(output, project.slug, "index.html"), detail(project, index), "utf8");
}
console.log(`Generated pitch deck: 1 overview + ${projects.length} project pages.`);
