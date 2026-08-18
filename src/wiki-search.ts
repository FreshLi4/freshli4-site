import { wikiDocuments, type WikiDocument } from "./generated/investigation-wiki.js";

export type WikiSearchHit = {
  document: WikiDocument;
  score: number;
  coverage: number;
  exactTitle: boolean;
  exactTag: boolean;
  excerpt: string;
};

// A direct title hit is enough; otherwise the fallback needs either a
// sufficiently relevant result or two strong documents to establish context.
export const TRADITIONAL_SEARCH_SCORE_THRESHOLD = 0.35;
export const TRADITIONAL_SEARCH_STRONG_HIT_COUNT = 2;

const normalize = (value: string) => value
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[「」【】《》“”‘’、，。！？：；（）()［］[\]「」·…—–-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const tokenize = (value: string) => {
  const tokens = new Set<string>();
  const normalized = normalize(value);
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
  return [...tokens].filter((token) => token.length > 0);
};

const excerptFor = (document: WikiDocument, query: string) => {
  const text = document.plainText.replace(/\s+/g, " ").trim();
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const index = normalizedQuery ? normalizedText.indexOf(normalizedQuery) : -1;
  if (index < 0) return text.slice(0, 220) + (text.length > 220 ? "…" : "");
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + Math.max(120, normalizedQuery.length + 100));
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
};

export const searchWikiDocuments = (query: string, limit = 8): WikiSearchHit[] => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const terms = tokenize(query);
  return wikiDocuments.map((document) => {
    const title = normalize(document.title);
    const body = normalize(`${document.title} ${document.category} ${document.tags.join(" ")} ${document.plainText}`);
    const titleTerms = terms.filter((term) => title.includes(term));
    const matchedTerms = terms.filter((term) => body.includes(term));
    const coverage = terms.length ? matchedTerms.length / terms.length : 0;
    const titleCoverage = terms.length ? titleTerms.length / terms.length : 0;
    const exactTitle = title === normalizedQuery || title.includes(normalizedQuery);
    const exactTag = document.tags.some((tag) => normalize(tag) === normalizedQuery);
    const exactPhrase = body.includes(normalizedQuery);
    const score = Math.min(1, coverage * 0.55 + titleCoverage * 0.2 + (exactTitle ? 0.2 : 0) + (exactPhrase ? 0.05 : 0));
    return {
      document,
      score,
      coverage,
      exactTitle,
      exactTag,
      excerpt: excerptFor(document, query),
    };
  })
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score || Number(right.exactTitle) - Number(left.exactTitle) || left.document.title.localeCompare(right.document.title, "zh-CN"))
    .slice(0, limit);
};

export const isQuestionLike = (query: string) => /[?？]|^(怎么|如何|为什么|为何|能否|是否|可以|可不可以|哪些|多少|什么时候|怎么办|该不该|能不能)/.test(query.trim());

export const shouldRouteToAi = (query: string, hits: WikiSearchHit[]) => {
  if (!hits.length) return true;
  if (isQuestionLike(query)) return true;
  const strongHits = hits.filter((hit) => hit.score >= TRADITIONAL_SEARCH_SCORE_THRESHOLD);
  const topHit = hits[0];
  if (topHit.exactTitle || topHit.exactTag || topHit.score >= 0.65) return false;
  return topHit.score < TRADITIONAL_SEARCH_SCORE_THRESHOLD || strongHits.length < TRADITIONAL_SEARCH_STRONG_HIT_COUNT;
};
