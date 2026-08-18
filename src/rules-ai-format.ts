export type RulesAiSource = { label: string; href: string };
export type RulesAiContentSegment = { type: "text"; text: string } | { type: "link"; label: string; href: string };

const inlineLinkPattern = /(?:\[([^\]\n]+)\]|【([^】\n]+)】)\s*[（(]\s*((?:https?:\/\/|\/(?!\/)|#)[^\s)）]+)\s*[)）]/gu;

export const formatAiContent = (content: string) => content
  .replace(/\r\n?/gu, "\n")
  .replace(/\*\*/gu, "")
  .replace(/^\s*>\s?/gmu, "")
  .replace(/\n{3,}/gu, "\n\n")
  .trim();

export const parseAiContent = (content: string): RulesAiContentSegment[] => {
  const normalized = formatAiContent(content);
  const segments: RulesAiContentSegment[] = [];
  let cursor = 0;
  for (const match of normalized.matchAll(inlineLinkPattern)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > cursor) segments.push({ type: "text", text: normalized.slice(cursor, matchIndex) });
    segments.push({ type: "link", label: match[1] ?? match[2] ?? "", href: match[3] });
    cursor = matchIndex + match[0].length;
  }
  if (cursor < normalized.length) segments.push({ type: "text", text: normalized.slice(cursor) });
  return segments;
};

export const stripAiLinks = (content: string) => content.replace(inlineLinkPattern, (_match, markdownLabel: string, chineseLabel: string) => markdownLabel ?? chineseLabel ?? "").trim();
