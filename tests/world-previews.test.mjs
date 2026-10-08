import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/ball-maze-world-videos.ts", root), "utf8");
const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { setupBallMazeWorldVideos } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const expected = {
  city: ["自动电梯.mp4", "摩天轮.mp4"],
  mine: ["矿车.mp4", "水龙头.mp4", "闸门.mp4"],
  island: ["海洋.mp4", "浮木.mp4", "间歇泉.mp4"],
  valley: ["风.mp4", "固定轨道.mp4", "吊桥.mp4"],
  "black-hole": ["黑洞.mp4", "传送门.mp4", "磁力轨道.mp4"],
};

test("five world videos combine only their matching real mechanism and special-rail tutorials", async () => {
  const manifest = JSON.parse(await readFile(new URL("asset/ball-maze/world-recordings.json", root), "utf8"));
  assert.match(manifest.source_root, /\/ball-maze\/in-game-asset\/tutorial$/);
  assert.deepEqual(manifest.recordings.map((clip) => clip.world_id), Object.keys(expected));
  for (const clip of manifest.recordings) {
    assert.equal(clip.asset_id, `world-${clip.world_id}`);
    assert.deepEqual(clip.segments.map((segment) => segment.source), expected[clip.world_id]);
    let total = 0;
    for (const segment of clip.segments) {
      assert.ok(segment.start_seconds >= 0);
      assert.ok(segment.end_seconds > segment.start_seconds);
      assert.ok(segment.end_seconds <= segment.source_duration);
      total += segment.end_seconds - segment.start_seconds;
    }
    assert.ok(Math.abs(total - clip.duration) < .15, "assembled duration matches its recorded source intervals");
    for (const extension of ["mp4", "webp"]) {
      const bytes = await readFile(new URL(`asset/ball-maze/visual-content/latest/${clip.asset_id}.${extension}`, root));
      assert.ok(bytes.length > 10000);
      if (extension === "mp4") assert.equal(bytes.toString("ascii", 4, 8), "ftyp");
      else assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    }
  }
  const wind = manifest.recordings.find((clip) => clip.world_id === "valley").segments[0];
  assert.equal(wind.start_seconds, 5.6, "use the later wind gameplay, not the failed first attempt's menu");
  assert.equal(manifest.pending_worlds[0].id, "darkroom");
});

test("world cards use hover-only looping videos, their actual posters and the common fine outline", async () => {
  const page = await readFile(new URL("src/ball-maze.ts", root), "utf8");
  const cards = page.split("const worldCard =")[1].split("const ballCard =")[0];
  assert.match(cards, /data-bm-world-video="\$\{world\.id\}" muted loop playsinline preload="none"/);
  assert.match(cards, /latest\/world-\$\{world\.id\}\.webp/);
  assert.match(cards, /latest\/world-\$\{world\.id\}\.mp4/);
  assert.match(cards, /world\.id !== "darkroom"/);
  assert.match(cards, /bm-darkroom-art/);
  assert.match(cards, /bm-video-frame/);
  assert.match(cards, /tabindex="0"/);
  assert.doesNotMatch(cards, /<img|data-bm-video\b|\bautoplay\b|\bcontrols\b/);
  assert.match(page, /const worldVideoCleanup = setupBallMazeWorldVideos\(\)/, "initialization runs in production as well as development");
  const styles = await readFile(new URL("src/ball-maze.css", root), "utf8");
  assert.match(styles, /\.bm-world-card video\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*0/);
  assert.match(styles, /\.bm-world-card > :not\(video\):not\(\.bm-darkroom-art\)/, "titles and gradient stay above the video");
});

class Card extends EventTarget {
  hovered = false;
  focused = false;
  matches(selector) { return selector === ":hover" ? this.hovered : this.focused; }
}
class Video extends EventTarget {
  card = new Card();
  paused = true;
  currentTime = 0;
  closest() { return this.card; }
  play() { this.paused = false; this.dispatchEvent(new Event("play")); return Promise.resolve(); }
  pause() { this.paused = true; }
}
const fixture = (reduced = false) => {
  const originals = Object.fromEntries(["window", "document", "IntersectionObserver"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const videos = Object.keys(expected).map(() => new Video());
  const doc = new EventTarget(); doc.hidden = false;
  doc.querySelectorAll = () => videos;
  const motion = new EventTarget(); motion.matches = reduced;
  let callback;
  globalThis.document = doc;
  globalThis.window = { matchMedia: (query) => query.includes("reduced-motion") ? motion : { matches: true } };
  globalThis.IntersectionObserver = class { constructor(handler) { callback = handler; } observe() {} disconnect() {} };
  const destroy = setupBallMazeWorldVideos();
  const visible = (index, visible) => callback([{ target: videos[index].card, isIntersecting: visible }]);
  const pointer = (index, inside, type = "mouse") => {
    videos[index].card.hovered = inside;
    const event = new Event(inside ? "pointerenter" : "pointerleave");
    event.pointerType = type;
    videos[index].card.dispatchEvent(event);
  };
  return { videos, doc, motion, visible, pointer, destroy, restore() {
    destroy();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  } };
};

test("viewport visibility alone never plays a world video; hover starts only that card and leave pauses", () => {
  const f = fixture();
  try {
    f.videos.forEach((_, i) => f.visible(i, true));
    assert.ok(f.videos.every((video) => video.paused));
    f.pointer(1, true);
    assert.deepEqual(f.videos.map((video) => video.paused), [true, false, true, true, true]);
    f.videos[1].currentTime = 3;
    f.pointer(1, false);
    assert.ok(f.videos.every((video) => video.paused));
    assert.equal(f.videos[1].currentTime, 3);
    f.pointer(1, true);
    assert.equal(f.videos[1].paused, false);
    assert.equal(f.videos[1].currentTime, 3);
  } finally { f.restore(); }
});

test("offscreen and hidden-page world previews pause without resetting playback", () => {
  const f = fixture();
  try {
    f.visible(0, true); f.pointer(0, true);
    f.videos[0].currentTime = 5;
    f.doc.hidden = true; f.doc.dispatchEvent(new Event("visibilitychange"));
    assert.equal(f.videos[0].paused, true);
    f.doc.hidden = false; f.doc.dispatchEvent(new Event("visibilitychange"));
    assert.equal(f.videos[0].paused, false);
    assert.equal(f.videos[0].currentTime, 5);
    f.visible(0, false);
    assert.equal(f.videos[0].paused, true);
  } finally { f.restore(); }
});

test("keyboard focus provides the hover equivalent and blur stops the world preview", () => {
  const f = fixture();
  try {
    f.visible(2, true);
    f.videos[2].card.focused = true; f.videos[2].card.dispatchEvent(new Event("focusin"));
    assert.equal(f.videos[2].paused, false);
    f.videos[2].card.focused = false; f.videos[2].card.dispatchEvent(new Event("focusout"));
    assert.equal(f.videos[2].paused, true);
  } finally { f.restore(); }
});

test("touch entry does not autoplay and reduced motion disables hover previews", () => {
  const f = fixture(true);
  try {
    f.visible(0, true); f.pointer(0, true);
    assert.equal(f.videos[0].paused, true);
    f.motion.matches = false; f.motion.dispatchEvent(new Event("change"));
    assert.equal(f.videos[0].paused, false);
    f.pointer(0, false);
    f.pointer(0, true, "touch");
    assert.equal(f.videos[0].paused, true);
  } finally { f.restore(); }
});

test("delayed play outside hover is stopped and cleanup removes hover listeners", () => {
  const f = fixture();
  try {
    f.visible(0, true);
    void f.videos[0].play();
    assert.equal(f.videos[0].paused, true);
    f.destroy();
    f.pointer(0, true);
    assert.equal(f.videos[0].paused, true);
  } finally { f.restore(); }
});
