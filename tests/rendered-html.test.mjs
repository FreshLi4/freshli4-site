import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("build emits the native Vite site", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  assert.match(html, /FreshLi4/);
  assert.match(html, /<script type="module"/);
  await access(new URL("../dist/client/assets/", import.meta.url));
});

test("source keeps the dynamic visual-content convention", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.match(source, /import\.meta\.glob\("\/asset\/\*\/visual-content\/\*"/);
  assert.match(source, /videoExtensions/);
  assert.match(source, /setTimeout\(\(\) => show\(current \+ 1\), 3000\)/);
});
