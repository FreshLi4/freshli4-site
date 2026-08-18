export type SearchPassageMatch = {
  excerpt: string;
  heading: string;
  score: number;
};

export const normalizeSearchText = (value: string) => value
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[「」【】《》“”‘’、，。！？：；（）()［］[\]?!:;,.'"·…—–-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const tokenizeSearchQuery = (value: string) => {
  const tokens = new Set<string>();
  const normalized = normalizeSearchText(value);
  for (const chunk of normalized.match(/[a-z0-9]+|[\u4e00-\u9fff]+/gi) ?? []) {
    if (/^[a-z0-9]+$/i.test(chunk)) {
      tokens.add(chunk);
      continue;
    }
    if (chunk.length <= 3) {
      tokens.add(chunk);
    } else {
      tokens.add(chunk);
      for (let index = 0; index < chunk.length - 1; index += 1) tokens.add(chunk.slice(index, index + 2));
    }
  }
  return [...tokens].filter(Boolean);
};

type SearchPassage = { heading: string; text: string };

const cleanMarkdown = (value: string) => value
  .replace(/^>\s*/u, "")
  .replace(/^[-*+]\s+/u, "")
  .replace(/^\d+[.)、]\s*/u, "")
  .replace(/!\[([^\]]*)\]\([^)]+\)/gu, "$1")
  .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
  .replace(/[*_`~]/gu, "")
  .replace(/\s+/gu, " ")
  .trim();

const markdownPassages = (markdown: string) => {
  const passages: SearchPassage[] = [];
  let heading = "";
  let paragraph: string[] = [];
  const addPassage = (text: string) => {
    const cleaned = cleanMarkdown(text);
    if (!cleaned || cleaned.includes("这里保留创作资料入口，内容待补充")) return;
    passages.push({ heading, text: cleaned });
  };
  const flushParagraph = () => {
    if (paragraph.length) addPassage(paragraph.join(" "));
    paragraph = [];
  };

  for (const rawLine of markdown.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/u);
    if (headingMatch) {
      flushParagraph();
      heading = cleanMarkdown(headingMatch[1]);
      continue;
    }
    if (!line) {
      flushParagraph();
      continue;
    }
    if (/^(?:[-*+]\s+|\d+[.)、]\s*)/u.test(line)) {
      flushParagraph();
      addPassage(line);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return passages;
};

const clipPassage = (text: string, terms: string[], limit = 220) => {
  if (text.length <= limit) return text;
  const searchable = text.normalize("NFKC").toLocaleLowerCase();
  const anchorTerm = [...terms]
    .sort((left, right) => right.length - left.length)
    .find((term) => searchable.includes(term));
  const anchor = anchorTerm ? searchable.indexOf(anchorTerm) : 0;
  const start = Math.max(0, Math.min(text.length - limit, anchor - 70));
  const end = Math.min(text.length, start + limit);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
};

export const bestSearchPassage = (markdown: string, plainText: string, query: string): SearchPassageMatch => {
  const terms = tokenizeSearchQuery(query);
  const normalizedQuery = normalizeSearchText(query);
  const passages = markdownPassages(markdown);
  let best: SearchPassage | undefined;
  let bestScore = 0;

  for (const passage of passages) {
    const normalizedText = normalizeSearchText(passage.text);
    const normalizedHeading = normalizeSearchText(passage.heading);
    const searchable = `${normalizedHeading} ${normalizedText}`.trim();
    const matchedTerms = terms.filter((term) => searchable.includes(term));
    const termScore = matchedTerms.reduce((total, term) => total + Math.min(term.length, 6), 0);
    const score = termScore
      + (normalizedQuery && normalizedText.includes(normalizedQuery) ? 12 : 0)
      + (normalizedQuery && normalizedHeading.includes(normalizedQuery) ? 8 : 0);
    if (score > bestScore) {
      best = passage;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) {
    return { excerpt: clipPassage(best.text, terms), heading: best.heading, score: bestScore };
  }
  const fallback = plainText.replace(/\s+/gu, " ").trim();
  return {
    excerpt: `${fallback.slice(0, 220)}${fallback.length > 220 ? "…" : ""}`,
    heading: "",
    score: 0,
  };
};
