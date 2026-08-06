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
  assert.match(source, /class="games-showcase"/);
  assert.match(source, /data-project-tab/);
  assert.doesNotMatch(source, /data-project-direction/);
  assert.match(source, /projectAutoplayDelay = 6000/);
  assert.match(source, /projectVisibilityObserver/);
  assert.doesNotMatch(source, /animateScrollTo|snapToNearestProject|projectSwitchThreshold/);

  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /height:100svh/);
  assert.doesNotMatch(styles, /is-project-snapping/);
  assert.match(styles, /opacity:1; visibility:visible; pointer-events:none;/);
  assert.match(styles, /backface-visibility:hidden/);
});

test("source exposes the investigation rulebook as a second-level page", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  const rules = await readFile(new URL("../src/rules.ts", import.meta.url), "utf8");
  assert.match(source, /\/games\/investigation-delve\/rules\//);
  assert.match(source, /阅读规则书/);
  assert.match(rules, /bootRulesPage/);
  assert.match(rules, /规则指引书 v1\.1/);
  assert.match(rules, /调查附录/);
  assert.match(rules, /FAQ/);
});
