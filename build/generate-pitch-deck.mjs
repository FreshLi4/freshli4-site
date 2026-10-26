import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { projects } from "../src/data/pitch-deck.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public", "pitch-deck");
const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const number = value => String(value + 1).padStart(2, "0");
const url = project => `/pitch-deck/${project.slug}`;
const image = project => `/pitch-deck/media/${project.slug}.webp`;
const contact = "taobe.gong@freshli4.com";
const brand = `<a class="brand" href="/pitch-deck" aria-label="FreshLi4 项目导览"><span class="brand-mark" aria-hidden="true">F<span>4</span></span><span>新鲜李四<small>FRESHLI4 GAME STUDIO</small></span></a>`;
const footer = `<footer class="site-footer"><span>© 2026 FRESHLI4 · 新鲜李四</span><a href="mailto:${contact}">${contact} <span aria-hidden="true">↗</span></a></footer>`;

function document(title, description, path, body, accent = "#f3ff59") {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${accent}"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="description" content="${escape(description)}"><title>${escape(title)} · FreshLi4</title><link rel="canonical" href="https://www.freshli4.com${path}"><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/pitch-deck/pitch-deck.css"></head><body data-pitch-deck data-pagefind-ignore="all"><a class="skip-link" href="#main">跳到主要内容</a>${body}${footer}</body></html>`;
}

function card(project, index) {
  return `<a class="project-card" href="${url(project)}" style="--accent:${project.accent};--tint:${project.tint}"><div class="card-art"><img src="${image(project)}" width="1536" height="1024" alt="${escape(project.imageAlt)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"><span class="art-label">概念视觉</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-meta"><span>${number(index)} / ${escape(project.category)}</span><span class="stage"><i aria-hidden="true"></i>${escape(project.stage)}</span></div><h2>${escape(project.title)}</h2><p>${escape(project.short)}</p><span class="card-link">进入项目 <span aria-hidden="true">→</span></span></a>`;
}

function overview() {
  const body = `<header class="site-header">${brand}<span class="header-note">PROJECT PORTFOLIO <span class="header-year">/ 2026</span></span></header><main id="main"><section class="overview-hero wrap"><div class="eyebrow"><span class="fresh-dot" aria-hidden="true"></span> FRESH IDEAS, TAKING SHAPE.</div><div class="overview-intro"><h1>新鲜想法，<br><span>正在成形。</span></h1><div class="intro-copy"><span class="edition">PITCH DECK · OCTOBER 2026</span><p>九个项目，九种走进游戏的方式。<br>从共用一个身体，到交换两个年代的证言；<br class="desktop-break">让清楚的点子，长出自己的玩法。</p><a class="browse-link" href="#projects">浏览全部项目 <span aria-hidden="true">↓</span></a></div></div><div class="catalog-heading" id="projects"><h2>规划中的游戏</h2><span>${String(projects.length).padStart(2, "0")} PROJECTS <span aria-hidden="true">↙</span></span></div></section><section class="projects-grid wrap" aria-label="游戏项目">${projects.map(card).join("")}</section><section class="closing wrap"><div><span class="eyebrow">LET’S MAKE SOMETHING FRESH.</span><h2>从一个好点子，<br>到一次想玩的体验。</h2></div><div class="closing-copy"><p>这里呈现的是正在探索和制作的游戏方向。<br>所有插画均为概念视觉，用于说明主题与玩法。</p><a class="contact-link" href="mailto:${contact}">聊聊合作 <span aria-hidden="true">↗</span></a></div></section></main>`;
  return document("规划游戏提案", "FreshLi4 九款规划游戏：人模人样、孤堡惊情、铁甲钢拳、SLAM DRUNK、二重证言、Fog Bound、买定离手、开箱肉鸽与跃入迷城。", "/pitch-deck", body);
}

function detail(project, index) {
  const next = projects[(index + 1) % projects.length];
  const body = `<div class="project-page" style="--accent:${project.accent};--tint:${project.tint}"><header class="site-header">${brand}<a class="back-link" href="/pitch-deck"><span aria-hidden="true">←</span> 返回项目导览</a></header><main id="main"><section class="project-hero wrap"><div class="project-topline"><span class="eyebrow">PROJECT ${number(index)} <span class="subtle">/ ${String(projects.length).padStart(2, "0")}</span></span><span class="stage"><i aria-hidden="true"></i>${escape(project.stage)}</span></div><div class="project-heading"><div><p class="eyebrow">${escape(project.category)}</p><h1 class="${project.slug === "slam-drunk" ? "latin-title" : ""}">${escape(project.title)}</h1>${project.title.toUpperCase() !== project.english ? `<p class="english-title">${escape(project.english)}</p>` : ""}</div><p class="hero-hook">${project.hook.map(line => escape(line)).join("<br>")}</p></div><figure class="hero-art"><img src="${image(project)}" width="1536" height="1024" alt="${escape(project.imageAlt)}" fetchpriority="high" decoding="async"><figcaption><span>${escape(project.english)} / CONCEPT STUDY</span><span>概念视觉 · 非实机画面</span></figcaption></figure><div class="project-summary"><p>${escape(project.pitch)}</p><a class="browse-link" href="#experience">了解玩法 <span aria-hidden="true">↓</span></a></div><dl class="project-facts">${project.facts.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl></section><section class="experience-section wrap" id="experience"><div class="section-label"><span class="eyebrow">01 / THE EXPERIENCE</span><h2>玩起来，<br>是什么感觉。</h2></div><div class="experience-copy"><h3>${escape(project.experience)}</h3><p>${escape(project.description)}</p></div></section><section class="features-section wrap"><div class="section-row"><h2>三个值得记住的点</h2><span class="eyebrow">WHAT MAKES IT FRESH</span></div><div class="features-grid">${project.features.map(([title, copy], i) => `<article class="feature"><span class="feature-number">${number(i)}</span><h3>${escape(title)}</h3><p>${escape(copy)}</p></article>`).join("")}</div></section><section class="loop-section wrap"><div class="section-label"><span class="eyebrow">02 / THE PLAY LOOP</span><h2>一段游玩，<br>怎样展开。</h2></div><ol class="play-loop">${project.loop.map(([title, copy], i) => `<li><span class="step-number">${number(i)}</span><div><h3>${escape(title)}</h3><p>${escape(copy)}</p></div></li>`).join("")}</ol></section><section class="visual-section wrap"><div class="section-label"><span class="eyebrow">03 / ART DIRECTION</span><h2>它的样子。</h2></div><div class="visual-copy"><span class="visual-chip">${escape(project.visualLabel ?? "LOW POLY / TOON SHADING")}</span><p>${escape(project.visual)}</p></div></section><aside class="status-note wrap" aria-label="项目状态"><span class="eyebrow">PROJECT STATUS</span><p>${escape(project.status)}</p></aside><nav class="next-project wrap" aria-label="继续浏览项目"><a class="next-link" href="${url(next)}"><div><span class="eyebrow">UP NEXT / ${number((index + 1) % projects.length)}</span><span class="next-title">${escape(next.title)}</span><span class="next-copy">${escape(next.category)}</span></div><img src="${image(next)}" width="1536" height="1024" alt="" loading="lazy" decoding="async"><span class="next-arrow" aria-hidden="true">↗</span></a></nav></main></div>`;
  return document(project.title, project.short, url(project), body, project.accent);
}

if (projects.length !== 9 || new Set(projects.map(p => p.slug)).size !== projects.length) throw new Error("Pitch deck must contain nine unique projects.");
await mkdir(output, { recursive: true });
await writeFile(join(output, "index.html"), overview(), "utf8");
for (const [index, project] of projects.entries()) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) throw new Error(`Invalid project slug: ${project.slug}`);
  await mkdir(join(output, project.slug), { recursive: true });
  await writeFile(join(output, project.slug, "index.html"), detail(project, index), "utf8");
}
console.log(`Generated pitch deck: 1 overview + ${projects.length} project pages.`);
