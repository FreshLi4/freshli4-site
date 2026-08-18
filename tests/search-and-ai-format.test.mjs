import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const loadTypeScriptModule = async (url) => {
  const source = await readFile(url, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
};

const generatedWikiData = async () => {
  const source = await readFile(new URL("../src/generated/investigation-wiki.ts", import.meta.url), "utf8");
  const payload = source.match(/export const wikiData = ([\s\S]*?) as const;/u);
  assert.ok(payload, "generated Wiki payload");
  return JSON.parse(payload[1]);
};

test("traditional search excerpts select the matching rule or card passage", async () => {
  const { bestSearchPassage, normalizeSearchText } = await loadTypeScriptModule(new URL("../src/wiki-search-utils.ts", import.meta.url));
  const wikiData = await generatedWikiData();
  const rulebook = wikiData.wikiDocuments.find((document) => document.id === "rulebook");
  const meow = wikiData.wikiDocuments.find((document) => document.id === "investigator-meow-19");
  assert.ok(rulebook);
  assert.ok(meow);
  assert.equal(normalizeSearchText("猫？"), "猫");

  const playerCount = bestSearchPassage(rulebook.markdown, rulebook.plainText, "游戏支持几个人？");
  assert.equal(playerCount.heading, "游戏准备");
  assert.match(playerCount.excerpt, /游戏支持 2—6 名玩家/);
  assert.doesNotMatch(playerCount.excerpt, /快速游玩流程/);

  const cat = bestSearchPassage(meow.markdown, meow.plainText, "猫");
  assert.equal(cat.heading, "Meow");
  assert.match(cat.excerpt, /职业：猫？/);
  assert.doesNotMatch(cat.excerpt, /card\/调查员|创作资料入口/);
});

test("AI formatting preserves sentences and recognizes common link variants", async () => {
  const { formatAiContent, parseAiContent, stripAiLinks } = await loadTypeScriptModule(new URL("../src/rules-ai-format.ts", import.meta.url));
  const longAnswer = "Meow 是《调查：深入》中的一名调查员，职业为“猫？”，SAN 为 3，包含于 Vol.3 版本。其清醒技能包括“随心所欲”和“九条命”，疯狂技能为“禁忌知识”和“疯狂蔓延 · 猫？”。";
  assert.equal(formatAiContent(longAnswer), longAnswer);
  assert.doesNotMatch(formatAiContent(longAnswer), /\n/u);

  const href = "/investigation-delve-boardgame/rules#quick-start";
  for (const markup of [`[快速游玩流程](${href})`, `[快速游玩流程] (${href})`, `【快速游玩流程】(${href})`, `【快速游玩流程】 (${href})`]) {
    assert.deepEqual(parseAiContent(markup), [{ type: "link", label: "快速游玩流程", href }]);
    assert.equal(stripAiLinks(markup), "快速游玩流程");
  }
  assert.deepEqual(parseAiContent("调查到【禁忌真相】 (1) 次。"), [{ type: "text", text: "调查到【禁忌真相】 (1) 次。" }]);
  assert.equal(stripAiLinks("调查到【禁忌真相】 (1) 次。"), "调查到【禁忌真相】 (1) 次。");
});
