import { wikiDocuments, type WikiDocument } from "./generated/investigation-wiki.js";
import { bestSearchPassage, normalizeSearchText, tokenizeSearchQuery } from "./wiki-search-utils.js";

export type WikiSearchHit = {
  document: WikiDocument;
  score: number;
  coverage: number;
  exactTitle: boolean;
  exactTag: boolean;
  excerpt: string;
  route: string;
  section: string;
};

// A direct title hit is enough; otherwise the fallback needs either a
// sufficiently relevant result or two strong documents to establish context.
export const TRADITIONAL_SEARCH_SCORE_THRESHOLD = 0.35;
export const TRADITIONAL_SEARCH_STRONG_HIT_COUNT = 2;

const rulebookSectionRoutes: Record<string, string> = {
  快速游玩流程: "quick-start",
  任务简报: "briefing",
  游戏准备: "setup",
  一轮游戏: "round",
  操作阶段: "operation",
  "SAN 与疯狂": "san",
  胜负判定: "victory",
};

const routeForSection = (document: WikiDocument, section: string) => {
  if (document.id !== "rulebook") return document.route;
  const anchor = rulebookSectionRoutes[section];
  return anchor ? `${document.route}#${anchor}` : document.route;
};

export const searchWikiDocuments = (query: string, limit = 8): WikiSearchHit[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const terms = tokenizeSearchQuery(query);
  return wikiDocuments.map((document) => {
    const title = normalizeSearchText(document.title);
    const body = normalizeSearchText(`${document.title} ${document.category} ${document.tags.join(" ")} ${document.plainText}`);
    const titleTerms = terms.filter((term) => title.includes(term));
    const matchedTerms = terms.filter((term) => body.includes(term));
    const coverage = terms.length ? matchedTerms.length / terms.length : 0;
    const titleCoverage = terms.length ? titleTerms.length / terms.length : 0;
    const exactTitle = title === normalizedQuery || title.includes(normalizedQuery);
    const exactTag = document.tags.some((tag) => normalizeSearchText(tag) === normalizedQuery);
    const exactPhrase = body.includes(normalizedQuery);
    const score = Math.min(1, coverage * 0.55 + titleCoverage * 0.2 + (exactTitle ? 0.2 : 0) + (exactPhrase ? 0.05 : 0));
    const passage = bestSearchPassage(document.markdown, document.plainText, query);
    return {
      document,
      score,
      coverage,
      exactTitle,
      exactTag,
      excerpt: passage.excerpt,
      route: routeForSection(document, passage.heading),
      section: passage.heading,
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
