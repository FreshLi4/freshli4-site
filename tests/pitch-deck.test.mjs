import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { projects } from "../src/data/pitch-deck.mjs";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("public/pitch-deck/pitch-deck.js", root), "utf8");

const preview = (scrollY = 0, innerHeight = 1000) => {
  const frames = new Map(), timers = new Map(), listeners = new Map();
  let frameId = 0, timerId = 0;
  const listen = (event, callback) => listeners.set(event, [...(listeners.get(event) ?? []), callback]);
  const window = {
    scrollY, innerHeight,
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    addEventListener: listen,
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  };
  const body = { dataset: { overviewTheme: "studio" }, style: {} };
  const meta = { content: "#f3ff59", setAttribute(name, value) { this[name] = value; } };
  const palettes = { studio: "#f3ff59", friends: "#f4f3ed", immersive: "#000000", free: "#45aea4" };
  const sections = [[0, "studio", "top"], [800, "friends", "fun-with-friends"], [3600, "immersive", "immerse-yourself"], [6900, "free", "free-to-play"], [9000, "studio", "contact"]]
    .map(([top, theme, id]) => ({ id, dataset: { overviewSection: theme }, getBoundingClientRect() { return { top: top - window.scrollY }; } }));
  const menuButton = {
    expanded: "false", setAttribute(name, value) { this.expanded = value; }, getAttribute() { return this.expanded; },
    addEventListener(event, callback) { listen(`menu:${event}`, callback); },
  };
  const menu = { inert: true, classList: { toggle() {} }, setAttribute() {}, querySelectorAll() { return []; } };
  const tocSections = sections.map(section => ({
    dataset: { tocSection: section.id }, attributes: {}, classList: { toggle() {} },
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
  }));
  const navigationState = { hovered: false, focused: false, idle: false };
  const tabs = { addEventListener(event, callback) { listen(`tabs:${event}`, callback); } };
  const navigation = {
    classList: { add() { navigationState.idle = true; }, remove() { navigationState.idle = false; } },
    matches() { return navigationState.hovered || navigationState.focused; },
    contains(target) { return target === tabs; }, querySelector() { return tabs; },
    addEventListener(event, callback) { listen(`navigation:${event}`, callback); },
  };
  const document = {
    body,
    querySelectorAll(selector) { return selector === ".reveal" ? [] : selector === "[data-toc-section]" ? tocSections : sections; },
    querySelector(selector) { return selector === ".menu-button" ? menuButton : selector === "#pitch-menu" ? menu : selector === ".pitch-contents" ? navigation : meta; },
    addEventListener: listen,
  };
  runInNewContext(source, {
    window, document, IntersectionObserver: class { observe() {} unobserve() {} },
    getComputedStyle() { return { getPropertyValue() { return palettes[body.dataset.overviewTheme]; } }; },
  });
  const paint = () => { for (const [id, callback] of frames) { frames.delete(id); callback(); } };
  const expireIdle = () => { for (const [id, callback] of timers) { timers.delete(id); callback(); } };
  return { window, body, meta, menu, menuButton, tocSections, navigationState, frames, paint, expireIdle, emit: (event, payload) => (listeners.get(event) ?? []).forEach(callback => callback(payload)) };
};

test("overview groups include each project once and place both requested games with friends", async () => {
  const html = await readFile(new URL("public/pitch-deck/index.html", root), "utf8");
  const groups = [...html.matchAll(/<section class="project-group wrap"[^>]*id="([^"]+)"[\s\S]*?<\/section>/g)]
    .map(match => ({ id: match[1], slugs: [...match[0].matchAll(/class="project-card" href="\/pitch-deck\/([^"]+)"/g)].map(card => card[1]) }));
  assert.deepEqual(groups.map(group => [group.id, group.slugs.length]), [["fun-with-friends", 5], ["immerse-yourself", 5], ["free-to-play", 2]]);
  const slugs = groups.flatMap(group => group.slugs);
  assert.equal(new Set(slugs).size, projects.length);
  assert.deepEqual(new Set(slugs), new Set(projects.map(project => project.slug)));
  for (const slug of ["haunted-castle", "steel-fists"]) assert.ok(groups[0].slugs.includes(slug));
  assert.match(html, /src="\/pitch-deck\/pitch-deck.js"/);
  assert.match(html, /class="overview-background"/);
  assert.match(html, /class="hero studio-font"/);
  assert.match(html, /class="contact-section studio-font"/);
  assert.match(html, /href="\/pitch-deck\/studio-shell.css"/);
  const toc = html.match(/<nav class="games-controls pitch-contents"[\s\S]*?<\/nav>/)[0];
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  const targets = [...toc.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  assert.equal(targets.length, 17);
  for (const id of targets) assert.ok(ids.has(id), `missing directory target: ${id}`);
});

test("all project details use split layouts without concept art and retain their content and navigation", async () => {
  for (const [index, project] of projects.entries()) {
    const html = await readFile(new URL(`public/pitch-deck/${project.slug}/index.html`, root), "utf8");
    assert.match(html, /href="\/pitch-deck\/studio-shell.css"/);
    assert.match(html, /src="\/pitch-deck\/pitch-deck.js"/);
    assert.match(html, /class="hero detail-hero studio-font"/);
    assert.match(html, /class="detail-hero-layout"/);
    assert.match(html, /class="detail-hero-intro reveal"/);
    assert.match(html, /class="detail-heading reveal"/);
    assert.match(html, /class="project-facts"/);
    assert.match(html, /class="contact-section studio-font"/);
    assert.match(html, /class="overview-background"/);
    assert.ok(html.includes(project.status), project.slug);
    assert.ok(html.includes(project.pitch), project.slug);
    assert.doesNotMatch(html, /\/pitch-deck\/media\//, project.slug);
    for (const [key, value] of project.facts) {
      assert.ok(html.includes(key), `${project.slug}: ${key}`);
      assert.ok(html.includes(value), `${project.slug}: ${value}`);
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `duplicate IDs on ${project.slug}`);
    const toc = html.match(/<nav class="games-controls pitch-contents"[\s\S]*?<\/nav>/)[0];
    const targets = [...toc.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(targets, ["top", "concept", "experience", "features", "loop", "visual", "status", "next", "contact"]);
    for (const id of targets) assert.ok(ids.includes(id), `${project.slug}: ${id}`);
    assert.match(html, /href="\/pitch-deck"/);
    assert.ok(html.includes(`class="next-link" href="/pitch-deck/${projects[(index + 1) % projects.length].slug}"`));
  }
});

test("the floating directory tracks distinct sections even when they share a background", () => {
  const page = preview();
  page.paint();
  assert.equal(page.tocSections.find(link => link.attributes["aria-current"]).dataset.tocSection, "top");
  for (const [offset, section] of [[8500, "contact"], [6500, "free-to-play"], [3400, "immerse-yourself"], [1000, "fun-with-friends"], [0, "top"]]) {
    page.window.scrollY = offset;
    page.emit("scroll");
    page.paint();
    assert.deepEqual(page.tocSections.filter(link => link.attributes["aria-current"] === "location").map(link => link.dataset.tocSection), [section]);
  }
});

test("the homepage-style mobile menu opens accessibly and Escape restores scrolling", () => {
  const page = preview();
  page.emit("menu:click");
  assert.equal(page.menuButton.expanded, "true");
  assert.equal(page.menu.inert, false);
  assert.equal(page.body.style.overflow, "hidden");
  page.emit("keydown", { key: "Escape" });
  assert.equal(page.menuButton.expanded, "false");
  assert.equal(page.menu.inert, true);
  assert.equal(page.body.style.overflow, "");
});

test("scrolling keeps long grids in their theme and crosses boundaries in both directions", () => {
  const page = preview();
  page.paint();
  assert.equal(page.body.dataset.overviewTheme, "studio");
  for (const [offset, expected] of [[300, "friends"], [3099, "friends"], [3100, "immersive"], [6399, "immersive"], [6400, "free"], [8500, "studio"], [6400, "free"], [3100, "immersive"], [3099, "friends"], [0, "studio"]]) {
    page.window.scrollY = offset;
    page.emit("scroll");
    page.paint();
    assert.equal(page.body.dataset.overviewTheme, expected, `scroll offset ${offset}`);
  }
  assert.equal(page.meta.content, "#f3ff59");
});

test("restored positions, resize and hash navigation update the viewport theme", () => {
  const page = preview(3400, 200);
  page.paint();
  assert.equal(page.body.dataset.overviewTheme, "friends");
  page.window.innerHeight = 1000;
  page.emit("resize");
  page.emit("scroll");
  assert.equal(page.frames.size, 1);
  page.paint();
  assert.equal(page.body.dataset.overviewTheme, "immersive");
  assert.equal(page.meta.content, "#000000");
  page.window.scrollY = 6500;
  page.emit("hashchange");
  page.paint();
  assert.equal(page.body.dataset.overviewTheme, "free");
  page.window.scrollY = 0;
  page.emit("pageshow");
  page.paint();
  assert.equal(page.body.dataset.overviewTheme, "studio");
});

test("the homepage-style floating directory fades when idle and stays visible on hover or focus", () => {
  const page = preview();
  page.expireIdle();
  assert.equal(page.navigationState.idle, true);
  page.emit("scroll");
  assert.equal(page.navigationState.idle, false);
  page.navigationState.hovered = true;
  page.emit("tabs:mouseenter");
  page.expireIdle();
  assert.equal(page.navigationState.idle, false);
  page.navigationState.hovered = false;
  page.emit("tabs:mouseleave");
  page.expireIdle();
  assert.equal(page.navigationState.idle, true);
  page.navigationState.focused = true;
  page.emit("navigation:focusin");
  page.expireIdle();
  assert.equal(page.navigationState.idle, false);
  page.navigationState.focused = false;
  page.emit("navigation:focusout", { relatedTarget: null });
  page.expireIdle();
  assert.equal(page.navigationState.idle, true);
});
