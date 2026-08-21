import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const wikiRoot = join(projectRoot, "asset", "dive-up", "wiki");
const translationRoot = join(projectRoot, "asset", "dive-up", "translation");

const entries = async (directory) => readdir(directory, { withFileTypes: true });
const fileNames = async (directory) => (await entries(directory))
  .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "zh-CN"));
const directoryNames = async (directory) => (await entries(directory))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "zh-CN"));

const csvRows = (source) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
};

test("Wiki Markdown folders and CSV index stay structurally aligned", async () => {
  const ruleFiles = await fileNames(join(wikiRoot, "rule"));
  assert.deepEqual(ruleFiles, ["调查附录.md", "规则指引书.md", "判例.md"]);

  const expectedCategories = {
    调查员: { count: 20, files: ["卡面.md", "角色故事.md", "创作背景.md"] },
    策略卡牌: { count: 39, files: ["卡面.md", "创作故事.md"] },
    环境卡牌: { count: 21, files: ["卡面.md", "创作故事.md"] },
    情报卡牌: { count: 5, files: ["卡面.md", "创作故事.md"] },
    辅助卡牌: { count: 8, files: ["卡面.md", "创作故事.md"] },
  };

  for (const [category, expectation] of Object.entries(expectedCategories)) {
    const directory = join(wikiRoot, "card", category);
    const cards = await directoryNames(directory);
    assert.equal(cards.length, expectation.count, `${category} card count`);
    for (const card of cards) {
      assert.deepEqual(await fileNames(join(directory, card)), [...expectation.files].sort((left, right) => left.localeCompare(right, "zh-CN")), `${category}/${card}`);
    }
  }

  const index = csvRows(await readFile(join(wikiRoot, "index.csv"), "utf8"));
  assert.equal(index.length - 1, 93);
  const headers = index[0];
  const pathIndex = headers.indexOf("Wiki相对目录");
  const faceIndex = headers.indexOf("卡面");
  assert.notEqual(pathIndex, -1);
  assert.notEqual(faceIndex, -1);
  for (const row of index.slice(1)) {
    assert.ok(row[pathIndex], `missing wiki path for ${row[2]}`);
    assert.ok(row[faceIndex], `missing card face for ${row[2]}`);
    await access(join(wikiRoot, ...row[faceIndex].split("/")));
  }

  for (const categoryFile of ["调查员.csv", "策略卡牌.csv", "环境卡牌.csv", "情报卡牌.csv", "辅助卡牌.csv"]) {
    const rows = csvRows(await readFile(join(wikiRoot, categoryFile), "utf8"));
    assert.ok(rows[0].includes("Wiki相对目录"), `${categoryFile} has a wiki path column`);
    assert.ok(rows.slice(1).every((row) => row.at(-1)), `${categoryFile} has complete wiki paths`);
  }
});

test("deployment inputs include PO translations and Pagefind records", async () => {
  for (const language of ["zh", "en", "ja"]) {
    const source = await readFile(join(translationRoot, `${language}.po`), "utf8");
    assert.match(source, /Language:/);
    assert.match(source, /msgctxt "term"/);
    assert.match(source, /msgctxt "text"/);
    assert.match(source, /msgid "调查深入"/);
  }

  const publicSearch = await fileNames(join(projectRoot, "public", "_wiki-search"));
  assert.equal(publicSearch.length, 96);
  const generated = await readFile(join(projectRoot, "src", "generated", "investigation-wiki.ts"), "utf8");
  assert.match(generated, /WikiTranslations/);
  assert.match(generated, /Ask anything to get a rule answer/);

  await access(join(projectRoot, "dist", "pagefind", "pagefind.js"));
  const distSearch = await fileNames(join(projectRoot, "dist", "_wiki-search"));
  assert.equal(distSearch.length, 96);
  const firstSearchRecord = await readFile(join(projectRoot, "dist", "_wiki-search", distSearch[0]), "utf8");
  assert.match(firstSearchRecord, /data-pagefind-body/);
  assert.match(firstSearchRecord, /data-pagefind-meta="id:/);
  for (const root of ["public", "dist"]) {
    const meowSearchRecord = await readFile(join(projectRoot, root, "_wiki-search", "investigator-meow-19.html"), "utf8");
    assert.match(meowSearchRecord, /职业：猫？/);
    assert.match(meowSearchRecord, /随心所欲/);
    assert.doesNotMatch(meowSearchRecord, /card\/调查员\/猫|这里保留创作资料入口/);
  }
});

test("English and Japanese PO drafts cover the rendered Wiki and rules text", async () => {
  const sources = {};
  for (const language of ["zh", "en", "ja"]) {
    sources[language] = await readFile(join(translationRoot, `${language}.po`), "utf8");
  }
  const fragmentBlocks = (source) => source.split(/\n\n+/u).filter((block) => block.includes('msgctxt "fragment"'));
  const counts = Object.fromEntries(Object.entries(sources).map(([language, source]) => [language, fragmentBlocks(source).length]));
  assert.ok(counts.en >= 850, `expected a full English draft, got ${counts.en} fragments`);
  assert.equal(counts.en, counts.ja);
  assert.equal(counts.en, counts.zh);
  for (const language of ["en", "ja"]) {
    assert.ok(fragmentBlocks(sources[language]).every((block) => /(?:^|\n)msgstr "(?:\\.|[^"\\])+"/u.test(block)), `${language} has an empty fragment translation`);
  }
  assert.match(sources.en, /Giant's Shoulders/);
  assert.match(sources.en, /msgid "个体机制"\nmsgstr "Deferred Strategy"/);
  assert.match(sources.en, /msgid "即时行动"\nmsgstr "Instant Strategy"/);
  assert.match(sources.en, /msgid "所有卡牌，"\nmsgstr "All Cards,"/);
  assert.match(sources.en, /msgid "规则 \/ 百科"\nmsgstr "RULE \/ WIKI"/);
  assert.match(sources.en, /msgid "窥探"\nmsgstr "Pry"/);
  assert.match(sources.en, /msgid "盲从"\nmsgstr "Conform"/);
  assert.match(sources.ja, /巨人の肩/);
  const generated = await readFile(join(projectRoot, "src", "generated", "investigation-wiki.ts"), "utf8");
  const i18n = await readFile(join(projectRoot, "src", "wiki-i18n.ts"), "utf8");
  const rules = await readFile(join(projectRoot, "src", "rules.ts"), "utf8");
  assert.match(generated, /fragment/);
  assert.match(i18n, /localizeWikiTree/);
  assert.match(rules, /localizeWikiTree\(rulesPage, language\)/);
});

test("card details omit generated face duplication and empty story placeholders", async () => {
  const generatedSource = await readFile(join(projectRoot, "src", "generated", "investigation-wiki.ts"), "utf8");
  const payload = generatedSource.match(/export const wikiData = ([\s\S]*?) as const;/u);
  assert.ok(payload, "generated Wiki payload");
  const wikiData = JSON.parse(payload[1]);
  const cardDocuments = wikiData.wikiDocuments.filter((document) => document.kind === "card");
  assert.equal(cardDocuments.length, 93);
  assert.ok(cardDocuments.every((document) => !document.html.includes("卡面")));
  assert.ok(cardDocuments.every((document) => !document.html.includes("这里保留创作资料入口")));

  const generator = await readFile(join(projectRoot, "build", "generate-investigation-wiki.mjs"), "utf8");
  const rules = await readFile(join(projectRoot, "src", "rules.ts"), "utf8");
  const styles = await readFile(join(projectRoot, "src", "rules.css"), "utf8");
  assert.match(generator, /isCardFace/);
  assert.match(generator, /isPlaceholder/);
  assert.match(rules, /<aside class="wiki-card-meta-callout"><div class="wiki-card-meta">\$\{meta\}<\/div><\/aside>\$\{abilities\}\$\{supplementalContent\}/);
  assert.match(styles, /\.wiki-card-meta-callout \{[^}]*border-left: 2px solid var\(--rules-brass\);[^}]*background: rgba\(255, 255, 255, \.035\);/);
  assert.match(styles, /\.wiki-card-meta b \{[^}]*overflow-wrap: anywhere;/);
  assert.match(rules, /localizeWikiText\(searchableText, "en"\)/);
  assert.match(rules, /localizeWikiText\(searchableText, "ja"\)/);
  assert.match(rules, /规则 \/ 百科/);
  assert.match(styles, /wiki-card-strategy \.wiki-card-index/);
  assert.match(styles, /wiki-card-environment \.wiki-card-index/);
  assert.match(styles, /wiki-card-support \.wiki-card-index/);
  assert.match(styles, /@media \(max-width: 980px\)[\s\S]*\.operation-grid \{ grid-template-columns: 1fr; \}/);
});

test("search fallback has an explicit relevance decision", async () => {
  const search = await readFile(join(projectRoot, "src", "wiki-search.ts"), "utf8");
  const client = await readFile(join(projectRoot, "src", "rules.ts"), "utf8");
  const server = await readFile(join(projectRoot, "server", "rules-ai.ts"), "utf8");
  assert.match(search, /TRADITIONAL_SEARCH_SCORE_THRESHOLD/);
  assert.match(search, /TRADITIONAL_SEARCH_STRONG_HIT_COUNT/);
  assert.match(search, /exactTag/);
  assert.match(client, /shouldRouteToAi\(question, localHits\)/);
  assert.match(client, /pagefindHits\(question, localHits\)\)\.slice\(0, 1\)/);
  assert.match(client, /rules-link-icon/);
  assert.match(client, /hit\.route/);
  assert.match(client, /pagefindPath = "\/pagefind\/pagefind\.js"/);
  assert.match(server, /const hits = searchWikiDocuments\(question, 5\)/);
  assert.match(server, /buildRetrievedContext\(hits\)/);
  assert.match(server, /buildAnswerSources\(hits\)/);
  assert.doesNotMatch(server, /KNOWLEDGE_FILES/);
});
