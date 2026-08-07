import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("build emits the native Vite site", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /FreshLi4/);
  assert.match(html, /<script type="module"/);
  await access(new URL("../dist/assets/", import.meta.url));
});

test("source keeps the dynamic visual-content convention", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.match(source, /import\.meta\.glob\("\/asset\/\*\/visual-content\/\*"/);
  assert.match(source, /videoExtensions/);
  assert.match(source, /setTimeout\(\(\) => show\(current \+ 1\), 3000\)/);
  assert.match(source, /class="games-flow"/);
  assert.match(source, /class="game-section/);
  assert.match(source, /data-site-nav="studio"/);
  assert.match(source, /data-project-tab/);
  assert.match(source, /aria-orientation="vertical"/);
  assert.doesNotMatch(source, /data-project-direction/);
  assert.doesNotMatch(source, /projectAutoplayDelay|projectVisibilityObserver|data-game-slide/);

  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.game-section \{ min-height:100svh/);
  assert.match(styles, /position:fixed; z-index:50; top:50%; left:var\(--page-pad\)/);
  assert.match(styles, /flex-direction:column; justify-content:flex-start; align-items:flex-start/);
  assert.doesNotMatch(styles, /games-showcase|games-sticky|games-slides|game-slide|is-project-snapping/);
});

test("source exposes the investigation rulebook as a second-level page", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  const rules = await readFile(new URL("../src/rules.ts", import.meta.url), "utf8");
  assert.match(source, /\/investigation-delve-boardgame/);
  assert.match(source, /project-rules-link.*href="\/investigation-delve-boardgame"/);
  assert.match(source, /了解详情/);
  assert.match(rules, /class="rules-brand" href="\/investigation-delve-boardgame"/);
  assert.match(rules, /bootRulesPage/);
  assert.match(rules, /规则指引书 v1\.1/);
  assert.match(rules, /调查附录/);
  assert.match(rules, /FAQ/);
});
