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

test("rulebook teaching text keeps canonical wording and font roles", async () => {
  const rules = await readFile(new URL("../src/rules.ts", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const rulesStyles = await readFile(new URL("../src/rules.css", import.meta.url), "utf8");
  assert.match(rules, /即使你已经玩过很多次《调查 : 深入》/);
  assert.match(rules, /「操作阶段」分为以下3个步骤/);
  assert.match(rules, /其他队伍的所有「调查员」都「陷入疯狂」时/);
  assert.match(rules, /class="rules-original"/);
  assert.match(styles, /SourceHanSansSC-Regular\.otf/);
  assert.match(styles, /SourceHanSerifSC-Regular\.otf/);
  assert.match(styles, /--font-rules-display: "Times New Roman"/);
  assert.match(rulesStyles, /\.rules-page \.rules-original \{ font-family: var\(--font-rules-original\); \}/);
  assert.match(rulesStyles, /\.rules-page \.rules-content h2, \.rules-page \.rules-content h3 \{ font-family: var\(--font-rules-display\); \}/);
});
