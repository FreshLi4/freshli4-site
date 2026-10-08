import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

const source = await readFile(new URL("../src/media-carousel.ts", import.meta.url), "utf8");
const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { setupMediaCarousel } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

class Element extends EventTarget {
  attrs = new Map();
  classes = new Set();
  dataset = {};
  style = { setProperty() {} };
  classList = { toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
  setAttribute(name, value) { this.attrs.set(name, value); }
  removeAttribute(name) { this.attrs.delete(name); }
  querySelector() { return null; }
}
class Video extends Element {
  currentTime = 0;
  duration = 14;
  paused = true;
  loop = true;
  play() { this.paused = false; this.dispatchEvent(new Event("play")); return Promise.resolve(); }
  pause() { if (!this.paused) { this.paused = true; this.dispatchEvent(new Event("pause")); } }
}
const fixture = (reduced = false, hasVideos = true) => {
  const originals = Object.fromEntries(["window", "document", "IntersectionObserver"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const videos = [new Video(), new Video(), new Video()];
  const slides = videos.map((video) => { const slide = new Element(); slide.querySelector = () => hasVideos ? video : null; return slide; });
  const buttons = videos.map((_, i) => { const button = new Element(); button.dataset.target = String(i); return button; });
  const toggle = new Element();
  const media = new Element(); media.matches = reduced;
  const doc = new Element(); doc.hidden = false;
  const stage = new Element();
  stage.querySelectorAll = (selector) => selector === ".media-slide" ? slides : buttons;
  stage.querySelector = (selector) => selector === "[data-carousel-toggle]" ? toggle : null;
  let observer;
  let timerId = 0;
  const timers = new Map();
  globalThis.window = { matchMedia: () => media, clearTimeout: (id) => timers.delete(id), cancelAnimationFrame() {}, requestAnimationFrame: () => 1,
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; } };
  globalThis.document = doc;
  globalThis.IntersectionObserver = class { constructor(callback) { observer = callback; } observe() {} disconnect() {} };
  const destroy = setupMediaCarousel(stage);
  const visibility = (visible) => observer([{ target: stage, isIntersecting: visible }]);
  return { videos, slides, buttons, toggle, doc, media, timers, visibility, destroy, restore() {
    destroy();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  } };
};

test("three videos advance at their real ends and wrap to the first, without self-looping", () => {
  const f = fixture();
  try {
    assert.ok(f.videos.every((video) => video.paused));
    f.visibility(true);
    assert.deepEqual(f.videos.map((video) => video.paused), [false, true, true]);
    for (const next of [1, 2, 0]) {
      f.videos.find((video) => !video.paused).dispatchEvent(new Event("ended"));
      assert.deepEqual(f.slides.map((slide) => slide.classes.has("active")), [0, 1, 2].map((i) => i === next));
      assert.deepEqual(f.videos.map((video) => video.paused), [0, 1, 2].map((i) => i !== next));
      assert.equal(f.buttons[next].attrs.get("aria-current"), "true");
      assert.ok(f.slides.every((slide, i) => slide.inert === (i !== next)));
    }
    assert.ok(f.videos.every((video) => !video.loop));
  } finally { f.restore(); }
});

test("home images keep three-second paging and stop their clocks outside the viewport", () => {
  const f = fixture(false, false);
  try {
    assert.equal(f.timers.size, 0);
    f.visibility(true);
    for (const next of [1, 2, 0]) {
      assert.equal(f.timers.size, 1);
      const [id, timer] = [...f.timers][0];
      assert.equal(timer.delay, 3000);
      f.timers.delete(id); timer.callback();
      assert.equal(f.slides[next].classes.has("active"), true);
    }
    f.visibility(false);
    assert.equal(f.timers.size, 0);
    f.visibility(true);
    assert.equal(f.timers.size, 1);
  } finally { f.restore(); }
});

test("offscreen and hidden-page pauses preserve the active video's position", () => {
  const f = fixture();
  try {
    f.visibility(true);
    f.videos[0].currentTime = 6;
    f.visibility(false);
    assert.ok(f.videos.every((video) => video.paused));
    assert.equal(f.videos[0].currentTime, 6);
    f.visibility(true);
    assert.equal(f.videos[0].paused, false);
    assert.equal(f.videos[0].currentTime, 6);
    f.doc.hidden = true; f.doc.dispatchEvent(new Event("visibilitychange"));
    assert.ok(f.videos.every((video) => video.paused));
    f.doc.hidden = false; f.doc.dispatchEvent(new Event("visibilitychange"));
    assert.equal(f.videos[0].paused, false);
    assert.equal(f.videos[0].currentTime, 6);
  } finally { f.restore(); }
});

test("direct paging selects only one video and user pause disables automatic advancement", () => {
  const f = fixture();
  try {
    f.visibility(true);
    f.buttons[2].dispatchEvent(new Event("click"));
    assert.equal(f.videos[2].paused, false);
    f.toggle.dispatchEvent(new Event("click"));
    assert.equal(f.toggle.attrs.get("aria-pressed"), "false");
    assert.ok(f.videos.every((video) => video.paused));
    f.videos[2].dispatchEvent(new Event("ended"));
    assert.equal(f.slides[2].classes.has("active"), true);
    f.buttons[1].dispatchEvent(new Event("click"));
    assert.equal(f.slides[1].classes.has("active"), true);
    assert.ok(f.videos.every((video) => video.paused));
    f.toggle.dispatchEvent(new Event("click"));
    assert.equal(f.videos[1].paused, false);
  } finally { f.restore(); }
});

test("reduced motion starts paused, permits explicit playback and cleans up listeners", () => {
  const f = fixture(true);
  try {
    f.visibility(true);
    assert.ok(f.videos.every((video) => video.paused));
    assert.equal(f.toggle.attrs.get("aria-pressed"), "false");
    f.toggle.dispatchEvent(new Event("click"));
    assert.equal(f.videos[0].paused, false);
    f.media.dispatchEvent(new Event("change"));
    assert.equal(f.videos[0].paused, true);
    f.destroy();
    f.buttons[2].dispatchEvent(new Event("click"));
    assert.equal(f.slides[0].classes.has("active"), true);
  } finally { f.restore(); }
});
