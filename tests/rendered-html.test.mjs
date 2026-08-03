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
  assert.match(source, /data-project-direction/);
  assert.match(source, /data-project-tab/);
  assert.match(source, /updateProjectPosition\(progress \* games\.length\)/);
  assert.match(source, /target \/ games\.length/);
  assert.match(source, /snapToNearestProject/);
  assert.match(source, /projectSwitchThreshold = 0\.3/);
  assert.match(source, /scrollDirection/);
  assert.match(source, /touchstart/);

  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /height:calc\(100svh \* \(var\(--game-count\) \+ 1\)\)/);
  assert.match(styles, /html\.is-project-snapping \{ scroll-behavior: auto; \}/);
});
