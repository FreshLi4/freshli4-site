import { fileURLToPath } from "node:url";
import { dirname, join, posix, relative, resolve } from "node:path";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wikiRoot = join(projectRoot, "asset", "dive-up", "wiki");
const sourceDataRoot = join(projectRoot, "src", "data", "investigation");
const translationRoot = join(projectRoot, "asset", "dive-up", "translation");
const generatedRoot = join(projectRoot, "src", "generated");
const publicSearchRoot = join(projectRoot, "public", "_wiki-search");

const categoryMeta = {
  investigator: { label: "调查员", english: "INVESTIGATORS", accent: "red", directory: "调查员", file: "调查员.csv" },
  strategy: { label: "策略", english: "STRATEGY", accent: "brass", directory: "策略卡牌", file: "策略卡牌.csv" },
  environment: { label: "环境", english: "ENVIRONMENT", accent: "ink", directory: "环境卡牌", file: "环境卡牌.csv" },
  intel: { label: "情报", english: "INTEL", accent: "red", directory: "情报卡牌", file: "情报卡牌.csv" },
  support: { label: "辅助", english: "SUPPORT", accent: "brass", directory: "辅助卡牌", file: "辅助卡牌.csv" },
};

const categoryOrder = ["investigator", "strategy", "environment", "intel", "support"];

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char] ?? char));

const escapeAttribute = (value) => escapeHtml(value).replace(/`/g, "&#96;");

const slugify = (value) => String(value ?? "")
  .toLocaleLowerCase()
  .replace(/\s*·\s*/g, "-")
  .replace(/[^a-z0-9\u4e00-\u9fff_-]+/g, "-")
  .replace(/^-+|-+$/g, "") || "document";

const safeSegment = (value) => String(value ?? "")
  .trim()
  .replace(/\s*·\s*/g, "-")
  .replace(/[\\/<>:"|?*]/g, "-")
  .replace(/\s+/g, " ")
  .replace(/-+/g, "-") || "未命名";

const parseCsv = (source) => {
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
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  return rows.map((values) => values.map((value) => value.replace(/^\uFEFF/, "").trim()));
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvString = (headers, rows) => [headers, ...rows]
  .map((row) => row.map(csvEscape).join(","))
  .join("\n") + "\n";

const frontMatter = (source) => {
  const normalized = source.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n")) return { meta: {}, body: normalized };
  const end = normalized.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: normalized };
  const meta = {};
  for (const line of normalized.slice(4, end).split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      meta[key] = rawValue.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
    } else {
      meta[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
  return { meta, body: normalized.slice(end + 4).replace(/^\r?\n/, "") };
};

const inlineMarkdown = (value) => {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(/_([^_]+)_/g, "<em>$1</em>");
  output = output.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_match, label, href) => {
    const safeHref = /^(?:https?:\/\/|mailto:|\/|#)/i.test(href) ? href : "#";
    return `<a href="${escapeAttribute(safeHref)}">${label}</a>`;
  });
  return output;
};

const headingId = (value) => slugify(value);

const markdownToHtml = (source) => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let paragraphLines = [];
  let listType = "";
  let listItems = [];
  let quoteLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    output.push(`<p>${inlineMarkdown(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };
  const flushList = () => {
    if (!listType) return;
    output.push(`<${listType}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = "";
    listItems = [];
  };
  const flushQuote = () => {
    if (!quoteLines.length) return;
    output.push(`<blockquote>${markdownToHtml(quoteLines.join("\n"))}</blockquote>`);
    quoteLines = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = Math.min(heading[1].length, 6);
      const title = heading[2].trim();
      output.push(`<h${level} id="${escapeAttribute(headingId(title))}">${inlineMarkdown(title)}</h${level}>`);
    } else if (unordered || ordered) {
      flushParagraph();
      flushQuote();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered ?? ordered)[1]);
    } else if (quote) {
      flushParagraph();
      flushList();
      quoteLines.push(quote[1]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
    } else {
      flushList();
      flushQuote();
      paragraphLines.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  flushQuote();
  return output.join("");
};

const markdownToText = (source) => source
  .replace(/^---[\s\S]*?---\s*/m, "")
  .replace(/^#{1,6}\s+/gm, "")
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[*_`>]/g, "")
  .replace(/^\s*[-*+]\s+/gm, "")
  .replace(/^\s*\d+[.)]\s+/gm, "")
  .replace(/\s+/g, " ")
  .trim();

const readMarkdown = async (filePath) => {
  const source = await readFile(filePath, "utf8");
  const { meta, body } = frontMatter(source);
  return {
    meta,
    body,
    html: markdownToHtml(body),
    plainText: markdownToText(body),
  };
};

const readDirectory = async (directory) => {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
};

const writeIfMissing = async (filePath, content) => {
  try {
    await stat(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
};

const writePlaceholder = async (filePath, content) => {
  try {
    const existing = await readFile(filePath, "utf8");
    if (existing.includes("> 这里保留创作资料入口，内容待补充。") && existing.includes("wiki_path: \n")) {
      await writeFile(filePath, content, "utf8");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
};

const getField = (row, headers, names) => {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return row[index] ?? "";
  }
  return "";
};

const cardFromRow = (category, row, headers, index) => {
  const meta = categoryMeta[category];
  const name = getField(row, headers, ["名称", "姓名"]) || `${meta.label} ${index + 1}`;
  const card = {
    id: `${category}-${slugify(name)}-${index + 1}`,
    category,
    categoryLabel: meta.label,
    name,
    type: "",
    cost: "",
    quantity: "",
    edition: "",
    update: "",
    effect: "",
    style: "",
    san: "",
    awake: "",
    madness: "",
  };
  if (category === "investigator") {
    card.type = getField(row, headers, ["职业"]);
    card.style = getField(row, headers, ["调查风格"]);
    card.san = getField(row, headers, ["「SAN」", "SAN"]);
    card.edition = getField(row, headers, ["包含版本"]);
    card.update = getField(row, headers, ["说明更新版本"]);
    card.awake = getField(row, headers, ["清醒技能"]);
    card.madness = getField(row, headers, ["疯狂技能"]);
  } else if (category === "strategy") {
    card.type = getField(row, headers, ["策略类型"]);
    card.cost = getField(row, headers, ["单张费用消耗"]);
    card.quantity = getField(row, headers, ["数量"]);
    card.edition = getField(row, headers, ["包含版本"]);
    card.update = getField(row, headers, ["说明更新版本"]);
    card.effect = getField(row, headers, ["卡牌效果"]);
  } else if (category === "intel") {
    card.cost = getField(row, headers, ["单张提供费用"]);
    card.quantity = getField(row, headers, ["数量"]);
    card.edition = getField(row, headers, ["包含版本"]);
    card.update = getField(row, headers, ["说明更新版本"]);
    card.effect = getField(row, headers, ["卡牌效果"]);
  } else if (category === "support") {
    card.type = getField(row, headers, ["卡牌实际类型"]);
    card.cost = getField(row, headers, ["单张费用消耗"]);
    card.quantity = getField(row, headers, ["数量"]);
    card.edition = getField(row, headers, ["包含版本"]);
    card.update = getField(row, headers, ["说明更新版本"]);
    card.effect = getField(row, headers, ["卡牌效果"]);
  } else {
    card.edition = getField(row, headers, ["包含版本"]);
    card.update = getField(row, headers, ["说明更新版本"]);
    card.effect = getField(row, headers, ["卡牌效果"]);
  }
  return card;
};

const investigatorDirectory = (card) => `${safeSegment(card.type)}_${safeSegment(card.name)}`;
const cardDirectory = (card) => safeSegment(card.name);

const cardFrontMatter = (card, relativeDirectory) => [
  "---",
  `id: ${card.id}`,
  `title: ${card.name}`,
  `type: card`,
  `category: ${card.categoryLabel}`,
  `source: ${categoryMeta[card.category].file}`,
  `wiki_path: ${relativeDirectory}`,
  "---",
].join("\n");

const cardFaceMarkdown = (card, relativeDirectory) => {
  const lines = [cardFrontMatter(card, relativeDirectory), "", `# ${card.name}`, ""];
  if (card.category === "investigator") {
    lines.push(`- 职业：${card.type || "待补充"}`);
    lines.push(`- 调查风格：${card.style || "待补充"}`);
    lines.push(`- SAN：${card.san || "待补充"}`);
    lines.push(`- 包含版本：${card.edition || "待补充"}`);
    lines.push(`- 说明更新版本：${card.update || "待补充"}`, "", "## 清醒技能", "", card.awake || "待补充", "", "## 疯狂技能", "", card.madness || "待补充");
  } else {
    if (card.type) lines.push(`- 类型：${card.type}`);
    if (card.cost) lines.push(`- 费用：${card.cost}`);
    if (card.quantity) lines.push(`- 数量：${card.quantity}`);
    if (card.edition) lines.push(`- 包含版本：${card.edition}`);
    if (card.update) lines.push(`- 说明更新版本：${card.update}`);
    lines.push("", "## 卡牌效果", "", card.effect || "待补充");
  }
  return `${lines.join("\n").trim()}\n`;
};

const placeholderMarkdown = (card, title, relativeDirectory) => `${cardFrontMatter(card, relativeDirectory)}\n\n# ${title}\n\n> 这里保留创作资料入口，内容待补充。\n`;

const migrateLegacyInvestigatorFolder = async (targetDirectory) => {
  const legacyDirectory = join(wikiRoot, "card", "调查员", "老侦探_");
  try {
    await stat(legacyDirectory);
    try {
      await stat(targetDirectory);
    } catch (error) {
      if (error?.code === "ENOENT") {
        await mkdir(dirname(targetDirectory), { recursive: true });
        await rename(legacyDirectory, targetDirectory);
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

const readCardSources = async () => {
  const cards = [];
  const normalizedCsv = [];
  for (const category of categoryOrder) {
    const meta = categoryMeta[category];
    const wikiCsvPath = join(wikiRoot, meta.file);
    const sourceCsvPath = join(sourceDataRoot, meta.file);
    let source;
    let wikiCsvExists = true;
    try {
      source = await readFile(wikiCsvPath, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      wikiCsvExists = false;
      source = await readFile(sourceCsvPath, "utf8");
    }
    const rows = parseCsv(source);
    const headers = rows.shift() ?? [];
    const records = rows
      .filter((row) => row.some((value) => value.trim() !== ""))
      .map((row, index) => cardFromRow(category, row, headers, index))
      .filter((card) => card.name.trim() !== "");
    const recordPaths = new Map();
    for (const card of records) {
      const folder = category === "investigator" ? investigatorDirectory(card) : cardDirectory(card);
      const relativeDirectory = posix.join("card", meta.directory, folder);
      const absoluteDirectory = join(wikiRoot, ...relativeDirectory.split("/"));
      if (category === "investigator") await migrateLegacyInvestigatorFolder(absoluteDirectory);
      await mkdir(absoluteDirectory, { recursive: true });
      await writeIfMissing(join(absoluteDirectory, "卡面.md"), cardFaceMarkdown(card, relativeDirectory));
      if (category === "investigator") {
        await writePlaceholder(join(absoluteDirectory, "角色故事.md"), placeholderMarkdown(card, "角色故事", relativeDirectory));
        await writePlaceholder(join(absoluteDirectory, "创作背景.md"), placeholderMarkdown(card, "创作背景", relativeDirectory));
      } else {
        await writePlaceholder(join(absoluteDirectory, "创作故事.md"), placeholderMarkdown(card, "创作故事", relativeDirectory));
      }
      recordPaths.set(card.name, relativeDirectory);
      cards.push({ ...card, wikiPath: relativeDirectory });
    }
    const baseHeaders = headers.filter((header) => header !== "Wiki相对目录");
    const outputHeaders = [...baseHeaders, "Wiki相对目录"];
    const outputRows = records.map((card) => {
      const original = rows.find((row) => getField(row, headers, ["名称", "姓名"]) === card.name) ?? [];
      const originalValues = baseHeaders.map((header) => getField(original, headers, [header]));
      return [...originalValues, recordPaths.get(card.name) ?? ""];
    });
    const existingNormalized = headers.includes("Wiki相对目录") && rows.length === outputRows.length && rows.every((row) => row.length === outputHeaders.length && row.at(-1));
    if (!wikiCsvExists || !existingNormalized) {
      await writeFile(wikiCsvPath, csvString(outputHeaders, outputRows), "utf8");
    }
    normalizedCsv.push({ file: meta.file, headers: outputHeaders, rows: outputRows });
  }
  return { cards, normalizedCsv };
};

const readRuleDocuments = async () => {
  const ruleDirectory = join(wikiRoot, "rule");
  const entries = (await readDirectory(ruleDirectory))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  const documents = [];
  for (const entry of entries) {
    const filePath = join(ruleDirectory, entry.name);
    const source = await readMarkdown(filePath);
    const id = source.meta.id || slugify(entry.name.replace(/\.md$/, ""));
    documents.push({
      id,
      kind: source.meta.type || "rule",
      category: source.meta.type || "rule",
      title: source.meta.title || entry.name.replace(/\.md$/, ""),
      route: source.meta.route || "/investigation-delve-boardgame/rules",
      relativePath: posix.join("rule", entry.name),
      relativeDirectory: "rule",
      sourcePath: posix.join("asset/dive-up/wiki/rule", entry.name),
      tags: Array.isArray(source.meta.tags) ? source.meta.tags : [],
      markdown: source.body,
      html: source.html,
      plainText: source.plainText,
      meta: source.meta,
    });
  }
  return documents;
};

const readCardDocuments = async (cards) => {
  const documents = [];
  for (const card of cards) {
    const directory = join(wikiRoot, ...card.wikiPath.split("/"));
    const entries = (await readDirectory(directory))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
    const parts = [];
    const htmlParts = [];
    const textParts = [];
    for (const entry of entries) {
      const document = await readMarkdown(join(directory, entry.name));
      parts.push(`## ${entry.name.replace(/\.md$/, "")}\n\n${document.body.trim()}`);
      htmlParts.push(`<section><h2>${escapeHtml(entry.name.replace(/\.md$/, ""))}</h2>${document.html}</section>`);
      textParts.push(`${entry.name.replace(/\.md$/, "")}：${document.plainText}`);
    }
    documents.push({
      id: card.id,
      kind: "card",
      category: card.categoryLabel,
      title: card.name,
      route: `/investigation-delve-boardgame/wiki#${card.id}`,
      relativePath: card.wikiPath,
      relativeDirectory: card.wikiPath,
      sourcePath: posix.join("asset/dive-up/wiki", card.wikiPath),
      tags: [card.categoryLabel, card.type, card.edition].filter(Boolean),
      markdown: parts.join("\n\n"),
      html: htmlParts.join(""),
      plainText: textParts.join(" "),
      meta: {
        category: card.categoryLabel,
        type: card.type,
        edition: card.edition,
        wiki_path: card.wikiPath,
      },
    });
  }
  return documents;
};

const parsePo = (source) => {
  const entries = { term: {}, text: {} };
  let context = "";
  let msgid = null;
  let msgstr = null;
  let active = null;
  const finish = () => {
    if (msgid && msgstr !== null && msgid !== "") {
      const bucket = context === "text" ? entries.text : entries.term;
      bucket[msgid] = msgstr || msgid;
    }
    context = "";
    msgid = null;
    msgstr = null;
    active = null;
  };
  for (const rawLine of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      finish();
      continue;
    }
    const quoted = line.match(/^"((?:\\.|[^"\\])*)"$/);
    const unescape = (value) => value.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    if (line.startsWith("msgctxt ")) {
      context = unescape(line.slice(8).trim().replace(/^"|"$/g, ""));
      active = "context";
    } else if (line.startsWith("msgid ")) {
      msgid = unescape(line.slice(6).trim().replace(/^"|"$/g, ""));
      active = "msgid";
    } else if (line.startsWith("msgstr ")) {
      msgstr = unescape(line.slice(7).trim().replace(/^"|"$/g, ""));
      active = "msgstr";
    } else if (quoted && active === "msgid") {
      msgid += unescape(quoted[1]);
    } else if (quoted && active === "msgstr") {
      msgstr += unescape(quoted[1]);
    }
  }
  finish();
  return entries;
};

const readTranslations = async () => {
  const result = {
    zh: { term: {}, text: {} },
    en: { term: {}, text: {} },
    ja: { term: {}, text: {} },
  };
  for (const language of ["zh", "en", "ja"]) {
    const filePath = join(translationRoot, `${language}.po`);
    try {
      result[language] = await readFile(filePath, "utf8").then(parsePo);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return result;
};

const searchHtml = (document) => {
  const fileName = `${slugify(document.id)}.html`;
  const route = document.route;
  const meta = [
    `id:${document.id}`,
    `route:${route}`,
    `kind:${document.kind}`,
    `category:${document.category}`,
  ];
  return {
    fileName,
    source: `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title></head><body><main data-pagefind-body><span hidden data-pagefind-meta="${escapeAttribute(meta[0])}"></span><span hidden data-pagefind-meta="${escapeAttribute(meta[1])}"></span><span hidden data-pagefind-meta="${escapeAttribute(meta[2])}"></span><span hidden data-pagefind-meta="${escapeAttribute(meta[3])}"></span><h1 data-pagefind-meta="title">${escapeHtml(document.title)}</h1><p>${escapeHtml(document.category)} · ${escapeHtml(document.relativePath)}</p>${document.html}</main></body></html>`,
  };
};

const writeGeneratedTypeScript = async ({ cards, documents, translations }) => {
  const cardSets = Object.fromEntries(categoryOrder.map((category) => [category, cards.filter((card) => card.category === category)]));
  const payload = {
    cardCategoryMeta: Object.fromEntries(categoryOrder.map((category) => {
      const { label, english, accent } = categoryMeta[category];
      return [category, { label, english, accent }];
    })),
    cardSets,
    allInvestigationCards: cards,
    wikiDocuments: documents,
    termTranslations: translations,
  };
  const source = `/* Generated by build/generate-investigation-wiki.mjs. Edit asset/dive-up/wiki instead. */\n\nexport type CardCategory = ${categoryOrder.map((category) => JSON.stringify(category)).join(" | ")};\n\nexport type InvestigationCard = ${JSON.stringify({
    id: "string",
    category: "CardCategory",
    categoryLabel: "string",
    name: "string",
    type: "string",
    cost: "string",
    quantity: "string",
    edition: "string",
    update: "string",
    effect: "string",
    style: "string",
    san: "string",
    awake: "string",
    madness: "string",
    wikiPath: "string",
  }).replace(/"([^\"]+)":\s*"([^"]+)"/g, "$1: $2")};\n\nexport type WikiDocument = { id: string; kind: string; category: string; title: string; route: string; relativePath: string; relativeDirectory: string; sourcePath: string; tags: string[]; markdown: string; html: string; plainText: string; meta: Record<string, string | string[]> };\n\nexport const wikiData = ${JSON.stringify(payload, null, 2)} as const;\nexport const cardCategoryMeta = wikiData.cardCategoryMeta as Record<CardCategory, { label: string; english: string; accent: string }>;\nexport const cardSets = wikiData.cardSets as unknown as Record<CardCategory, InvestigationCard[]>;\nexport const allInvestigationCards = wikiData.allInvestigationCards as unknown as InvestigationCard[];\nexport const wikiDocuments = wikiData.wikiDocuments as unknown as WikiDocument[];\nexport const wikiDocumentById = Object.fromEntries(wikiDocuments.map((document) => [document.id, document])) as Record<string, WikiDocument>;\nexport const termTranslations = wikiData.termTranslations as Record<"zh" | "en" | "ja", Record<string, string>>;\n`;
  await mkdir(generatedRoot, { recursive: true });
  const typedSource = source.replace(
    'export const termTranslations = wikiData.termTranslations as Record<"zh" | "en" | "ja", Record<string, string>>;',
    `export type WikiTranslations = { term: Record<string, string>; text: Record<string, string> };
export const termTranslations = wikiData.termTranslations as Record<"zh" | "en" | "ja", WikiTranslations>;`,
  );
  await writeFile(join(generatedRoot, "investigation-wiki.ts"), typedSource, "utf8");
};

const writeIndexCsv = async (cards) => {
  const headers = ["ID", "类别", "名称", "职业或类型", "包含版本", "说明更新版本", "Wiki相对目录", "卡面", "创作故事", "角色故事", "创作背景"];
  const rows = cards.map((card) => {
    const directory = card.wikiPath;
    return [
      card.id,
      card.categoryLabel,
      card.name,
      card.type,
      card.edition,
      card.update,
      directory,
      posix.join(directory, "卡面.md"),
      card.category === "investigator" ? "" : posix.join(directory, "创作故事.md"),
      card.category === "investigator" ? posix.join(directory, "角色故事.md") : "",
      card.category === "investigator" ? posix.join(directory, "创作背景.md") : "",
    ];
  });
  await writeFile(join(wikiRoot, "index.csv"), csvString(headers, rows), "utf8");
};

const main = async () => {
  await mkdir(wikiRoot, { recursive: true });
  await mkdir(join(wikiRoot, "rule"), { recursive: true });
  await mkdir(join(wikiRoot, "card"), { recursive: true });
  const { cards } = await readCardSources();
  await writeIndexCsv(cards);
  const ruleDocuments = await readRuleDocuments();
  const cardDocuments = await readCardDocuments(cards);
  const documents = [...ruleDocuments, ...cardDocuments];
  const translations = await readTranslations();
  await writeGeneratedTypeScript({ cards, documents, translations });
  await rm(publicSearchRoot, { recursive: true, force: true });
  await mkdir(publicSearchRoot, { recursive: true });
  for (const document of documents) {
    const output = searchHtml(document);
    await writeFile(join(publicSearchRoot, output.fileName), output.source, "utf8");
  }
  console.log(`Generated ${cards.length} cards, ${ruleDocuments.length} rule documents and ${documents.length} search documents.`);
};

await main();
