import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { transpileModule, ModuleKind, ScriptTarget } from "typescript";

const root = new URL("../", import.meta.url);
const heroSource = await readFile(new URL("src/ball-maze-hero.ts", root), "utf8");
const code = transpileModule(heroSource, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { ballMazeHero, renderBallMazeHeroSlide } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const home = await readFile(new URL("src/main.ts", root), "utf8");
const detail = await readFile(new URL("src/ball-maze.ts", root), "utf8");

test("studio-home Ball Maze and its landing hero share the same localized headline, introduction and logo", async () => {
  assert.deepEqual(ballMazeHero.title, {
    zh: "旋转世界，<br /><em>让重力带路。</em>",
    en: "Turn the world.<br /><em>Let gravity lead.</em>",
    ja: "世界を回して、<br /><em>重力に導かれる。</em>",
  });
  assert.equal(ballMazeHero.description.zh, "你不直接控制小球。你旋转整座三维迷宫，让重力与惯性替你寻找下一条路。");
  for (const language of ["zh", "en", "ja"]) {
    assert.ok(ballMazeHero.description[language].length > 30);
    assert.ok(ballMazeHero.autoplay[language]);
  }
  await access(new URL(`asset/ball-maze/brand/${ballMazeHero.logo}`, root));
  for (const page of [home, detail]) {
    assert.match(page, /from "\.\/ball-maze-hero"/);
    assert.match(page, /ballMazeHero\.title/);
    assert.match(page, /ballMazeHero\.description/);
    assert.match(page, /ballMazeHero\.logo/);
    assert.match(page, /ballMazeHero\.kicker/);
  }
  assert.doesNotMatch(home, /Rotate the entire maze and guide the ball along its track to the goal/);
});

test("the studio-home feature uses exactly the landing hero's three complete, real tutorial slides", async () => {
  assert.deepEqual(ballMazeHero.clips.map((clip) => clip.id), ["editor", "tracks", "abilities"]);
  for (const [index, clip] of ballMazeHero.clips.entries()) {
    const slide = renderBallMazeHeroSlide(clip, index, (file) => `/asset/ball-maze/visual-content/${file}`);
    assert.match(slide, new RegExp(`data-clip="${clip.id}"`));
    assert.match(slide, new RegExp(`src="/asset/ball-maze/visual-content/latest/${clip.id}\\.mp4"`));
    assert.match(slide, new RegExp(`poster="/asset/ball-maze/visual-content/latest/${clip.id}\\.webp"`));
    assert.match(slide, /muted playsinline controls/);
    assert.match(slide, new RegExp(`preload="${index === 0 ? "metadata" : "none"}"`));
    assert.equal(slide.includes('class="media-slide active"'), index === 0);
    assert.doesNotMatch(slide, /<img|\bloop\b|\bautoplay\b/);
    for (const extension of ["mp4", "webp"]) await access(new URL(`asset/ball-maze/visual-content/latest/${clip.id}.${extension}`, root));
  }
  assert.match(home, /renderBallMazeHeroSlide\(clip, index, ballMazeVisual\)/);
  assert.match(home, /const media = isBallMaze \? \[\] : collectMedia\(game\)/);
  assert.match(home, /const mediaStage = isBallMaze \? renderBallMazeHomeMedia\(game\)/);
  const player = home.split("const renderBallMazeHomeMedia =")[1].split("const renderGame =")[0];
  assert.match(player, /class="ball-maze-home-stack"[\s\S]*class="media-shadow" aria-hidden="true"[\s\S]*class="media-frame tilt-card"/);
  assert.match(player, /class="media-topbar"[\s\S]*class="media-expand"/);
  assert.match(player, /class="floating-note note-a">\$\{game\.noteA\}/);
  assert.match(player, /class="floating-note note-b">\$\{game\.noteB\}/);
  assert.doesNotMatch(player, /bm-video-frame|renderMedia\(game/);
  assert.match(player, /<\/div>\s*<div class="bm-hero-media-controls">/, "topic and autoplay controls stay outside the layered video stack");
  assert.match(home, /setupMediaCarousel\(stage, \(\) => updateMediaLabel\(stage\)\)/);
});

test("home language changes update hero copy and topic controls without replacing the headline with the game name", () => {
  assert.match(home, /class="game-title ball-maze-home-title" data-game-i18n-html=/);
  assert.match(home, /\[data-game-i18n-html\][\s\S]*element\.innerHTML = value/);
  assert.match(home, /translations\[`game\.ball-maze\.clip\.\$\{clip\.id\}`\] = clip\.label/);
  assert.match(home, /translations\["game\.ball-maze\.autoplay"\] = ballMazeHero\.autoplay/);
  assert.match(home, /data-carousel-toggle aria-pressed="true"/);
  assert.match(home, /href="\/ball-maze"/);
  assert.match(home, /https:\/\/store\.steampowered\.com\/app\/3678730\//);
  assert.match(home, /data-project-tab-title/, "canonical game names remain available in project navigation");
});

test("Ball Maze's home player restores the studio's layered card styling without cropping new 4:3 tutorials", async () => {
  const styles = await readFile(new URL("src/styles.css", root), "utf8");
  assert.match(styles, /#ball-maze \.ball-maze-home-stack\s*\{[^}]*position:relative;[^}]*perspective:1400px;[^}]*padding:18px 24px 30px 0/);
  assert.match(styles, /#ball-maze \.ball-maze-home-stack \.floating-note\s*\{ pointer-events:none;/, "decorative notes cannot block player controls");
  assert.match(styles, /#ball-maze \.media-frame, #ball-maze \.media-shadow\s*\{ aspect-ratio:4\/3;/);
  assert.match(styles, /\.media-shadow\s*\{[^}]*background:var\(--accent\);[^}]*transform:rotate\(2\.3deg\)/);
  assert.match(styles, /\.media-frame\s*\{[^}]*border-radius:8px;[^}]*box-shadow:0 38px 100px/);
  assert.doesNotMatch(styles, /#ball-maze \.ball-maze-home-media\s*\{[^}]*perspective:none/);
  assert.doesNotMatch(styles, /#ball-maze \.media-frame\s*\{[^}]*(?:border-radius:0|box-shadow:none|transform:none)/);
  assert.match(styles, /#ball-maze \.media-slide video\s*\{ object-fit:contain;/);
  assert.match(styles, /#ball-maze \.ball-maze-home-logo\s*\{[^}]*height:auto;[^}]*object-fit:contain/);
  assert.match(styles, /#ball-maze \.ball-maze-home-title em\s*\{[^}]*font-size:1em/);
  assert.match(styles, /#ball-maze \.bm-hero-media-controls \{ flex-wrap:wrap/);
});
