import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/ball-maze-sections.ts", root), "utf8");
const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { ballMazeSectionColors, initialBallMazeSection, currentBallMazeSection, setupBallMazeSections } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const section = (id, top, bottom) => ({ id, bounds: { top, bottom }, getBoundingClientRect() { return this.bounds; } });

test("all eight section palettes use the game theme and retain valid deep links", () => {
  assert.deepEqual(ballMazeSectionColors, {
    "ball-maze-hero": "#45aea4", play: "#073f42", worlds: "#32958d", balls: "#f7f0d8",
    modes: "#073f42", build: "#f6e775", records: "#052d30", steam: "#45aea4",
  });
  for (const id of Object.keys(ballMazeSectionColors)) assert.equal(initialBallMazeSection(`#${id}`), id);
  for (const hash of ["", "#top", "#missing", "#toString"]) assert.equal(initialBallMazeSection(hash), "ball-maze-hero");
});

const luminance = (hex) => {
  const [r, g, b] = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
};

test("every adjacent section has a visibly different settled background", () => {
  const palettes = Object.entries(ballMazeSectionColors);
  for (let index = 1; index < palettes.length; index++) {
    const [previous, before] = palettes[index - 1], [current, after] = palettes[index];
    assert.ok(contrast(before, after) >= 3, `${previous} to ${current} needs at least 3:1 background contrast`);
  }
});

test("world navigation and the dark mode cards keep readable text contrast", async () => {
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.ok(contrast("#061c1d", ballMazeSectionColors.worlds) >= 4.5);
  assert.ok(contrast("#f7f0d8", ballMazeSectionColors.modes) >= 4.5);
  assert.match(styles, /body\.is-ball-maze-page\[data-bm-section="worlds"\]\s*\{[^}]*--bm-page-bg:\s*var\(--bm-world-teal\);[^}]*--bm-page-accent:\s*var\(--bm-ink\)/);
  assert.match(styles, /\.bm-side-tabs:is\(:hover, :focus-within\) a\s*\{[^}]*opacity:\s*1/);
  assert.match(styles, /\.bm-mode-card > span\s*\{[^}]*color:\s*var\(--bm-yellow\)/);
  assert.doesNotMatch(styles, /#(?:c4b6a4|d7ccbb)\b/i);
});

test("the viewport centre selects adjacent sections in either scroll direction", () => {
  const play = section("play", -200, 480), worlds = section("worlds", 480, 2400);
  assert.equal(currentBallMazeSection([play, worlds], 1000), worlds);
  play.bounds.bottom = worlds.bounds.top = 520;
  assert.equal(currentBallMazeSection([play, worlds], 1000), play);
  play.bounds.bottom = worlds.bounds.top = 500;
  assert.equal(currentBallMazeSection([play, worlds], 1000), worlds);
});

test("the tall gallery remains active through its content and short viewports use their own centre", () => {
  const worlds = section("worlds", -1800, -20), balls = section("balls", -20, 3200), modes = section("modes", 3200, 4100);
  assert.equal(currentBallMazeSection([worlds, balls, modes], 954), balls);
  assert.equal(currentBallMazeSection([worlds, balls, modes], 300), balls);
  balls.bounds = { top: -3100, bottom: 180 }; modes.bounds.top = 180;
  assert.equal(currentBallMazeSection([balls, modes], 300), balls);
  assert.equal(currentBallMazeSection([balls, modes], 720), modes);
});

test("document edges and footer retain the closest section instead of clearing the palette", () => {
  const hero = section("ball-maze-hero", 600, 1500), steam = section("steam", -650, -10);
  assert.equal(currentBallMazeSection([hero], 720), hero);
  assert.equal(currentBallMazeSection([steam], 720), steam);
  assert.equal(currentBallMazeSection([], 720), undefined);
});

const fixture = () => {
  const originals = Object.fromEntries(["window", "document", "ResizeObserver"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const frames = new Map(); let nextFrame = 0; let resize;
  const win = new EventTarget(); win.innerHeight = 1000; win.location = { hash: "#play" };
  win.requestAnimationFrame = (fn) => { frames.set(++nextFrame, fn); return nextFrame; };
  win.cancelAnimationFrame = (id) => frames.delete(id);
  const body = { dataset: {}, hasAttribute: () => body.dataset.bmThemeReady !== undefined, removeAttribute() { delete this.dataset.bmThemeReady; } };
  const nav = { dataset: {} }, meta = { setAttribute(_, value) { this.content = value; } };
  const sections = [section("play", -200, 700), section("worlds", 700, 2300)];
  const links = sections.map(({ id }) => ({ hash: `#${id}`, current: false, attrs: {},
    classList: { toggle(_, active) { links.find((link) => link.hash === `#${id}`).current = active; } },
    setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; },
  }));
  globalThis.window = win;
  globalThis.document = { body, querySelector: (selector) => selector === ".bm-side-nav" ? nav : meta,
    querySelectorAll: (selector) => selector === ".bm-side-nav a" ? links : sections };
  const watched = [];
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe(element) { watched.push(element); }
    disconnect() { watched.length = 0; }
  };
  const cleanup = setupBallMazeSections();
  return { body, nav, meta, win, sections, links, frames, watched, resize: () => resize(), cleanup,
    paint() { const pending = [...frames]; frames.clear(); pending.forEach(([, fn]) => fn()); },
    restore() { cleanup(); for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    } },
  };
};

test("one controller keeps colour, accessible navigation and browser tint in sync without scroll snapping", () => {
  const f = fixture();
  try {
    assert.equal(f.body.dataset.bmSection, "play");
    assert.equal(f.body.dataset.bmThemeReady, undefined);
    assert.equal(f.meta.content, "#073f42");
    f.paint(); f.paint();
    assert.equal(f.body.dataset.bmThemeReady, "true");
    f.sections[0].bounds.bottom = f.sections[1].bounds.top = 400;
    for (let i = 0; i < 8; i++) f.win.dispatchEvent(new Event("scroll"));
    assert.equal(f.frames.size, 1, "scroll work is batched once per frame");
    assert.equal(f.body.dataset.bmSection, "play");
    f.paint();
    assert.equal(f.body.dataset.bmSection, "worlds");
    assert.equal(f.nav.dataset.section, "worlds");
    assert.equal(f.meta.content, "#32958d");
    assert.deepEqual(f.links.map((link) => link.current), [false, true]);
    assert.equal(f.links[1].attrs["aria-current"], "location");
    assert.equal(f.links[0].attrs["aria-current"], undefined);
    assert.doesNotMatch(source, /scrollIntoView|scrollTo\(|preventDefault|scroll-snap/);
  } finally { f.restore(); }
});

test("layout changes and restored navigation remeasure, and cleanup cancels listeners and frames", () => {
  const f = fixture();
  try {
    f.paint(); f.paint();
    assert.equal(f.watched.length, 2);
    f.sections[0].bounds.bottom = f.sections[1].bounds.top = 200;
    f.resize(); f.paint();
    assert.equal(f.body.dataset.bmSection, "worlds");
    f.sections[0].bounds.bottom = f.sections[1].bounds.top = 800;
    for (const event of ["pageshow", "hashchange", "load", "resize"]) f.win.dispatchEvent(new Event(event));
    assert.equal(f.frames.size, 1);
    f.paint();
    assert.equal(f.body.dataset.bmSection, "play");
    f.win.dispatchEvent(new Event("scroll"));
    f.cleanup();
    assert.equal(f.frames.size, 0);
    assert.equal(f.watched.length, 0);
    f.win.dispatchEvent(new Event("scroll"));
    assert.equal(f.frames.size, 0);
  } finally { f.restore(); }
});

test("sections share home colour easing, transparent backgrounds and theme-aware text; reduced motion stays instant", async () => {
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  const homeStyles = await readFile(new URL("src/styles.css", root), "utf8");
  assert.match(homeStyles, /body\s*\{[^}]*transition:\s*background-color \.78s var\(--ease\), color \.78s var\(--ease\)/);
  assert.match(styles, /body\.is-ball-maze-page\s*\{[^}]*background:\s*var\(--bm-page-bg\);[^}]*color:\s*var\(--bm-page-ink\)/);
  assert.match(styles, /\.ball-maze-page :is\(\.bm-hero, \.bm-section, \.bm-final-section\)\s*\{[^}]*background:\s*transparent;[^}]*color:\s*var\(--bm-page-ink\);[^}]*transition:\s*color \.78s var\(--ease\)/);
  assert.doesNotMatch(styles, /\.bm-(?:hero|play-section|worlds-section|balls-section|modes-section|build-section|record-section|final-section|footer)\s*\{[^}]*background:\s*(?:#|var\(|rgb|linear-gradient)/);
  assert.match(styles, /\.bm-hero-background\s*\{[^}]*mask-image:\s*linear-gradient/);
  assert.match(styles, /\.bm-final-section::after\s*\{[^}]*mask-image:\s*linear-gradient/);
  assert.match(styles, /body\.is-ball-maze-page:not\(\[data-bm-theme-ready\]\)\s*\{\s*transition:\s*none/);
  assert.match(homeStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\.01ms !important/);
  assert.match(styles, /\.bm-mode-card\s*\{[^}]*color:\s*var\(--bm-cream\)/);
  assert.match(styles, /\.bm-ball-card\s*\{[^}]*color:\s*var\(--bm-ink\)/);
});
