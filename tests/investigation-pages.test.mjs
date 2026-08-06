import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("investigation reference pages are source-driven and routed", async () => {
  const rules = await readFile(new URL("../src/rules.ts", import.meta.url), "utf8");
  const data = await readFile(new URL("../src/investigation-data.ts", import.meta.url), "utf8");
  const vercel = await readFile(new URL("../vercel.json", import.meta.url), "utf8");
  assert.match(rules, /renderInvestigationHome/);
  assert.match(rules, /renderAppendixPage/);
  assert.match(rules, /renderFaqPage/);
  assert.match(rules, /renderWikiPage/);
  assert.match(rules, /rules-ai-form/);
  assert.match(rules, /rules-portal-card/);
  assert.match(rules, /investigation-delve-boardgame\/rules/);
  assert.match(rules, /type RulesRoute = "home"/);
  assert.match(rules, /3-游戏配件-1\.png/);
  assert.match(rules, /13-游戏配件-11\.png/);
  assert.match(data, /parseCsv/);
  assert.match(data, /调查员\.csv\?raw/);
  assert.match(data, /辅助卡牌\.csv\?raw/);
  assert.match(rules, /allInvestigationCards/);
  assert.match(vercel, /investigation-delve-boardgame\/:path\*/);
});
