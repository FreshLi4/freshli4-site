import { termTranslations } from "./generated/investigation-wiki";

export type WikiLanguage = "zh" | "en" | "ja";
type WikiTranslationBundle = { term: Record<string, string>; text: Record<string, string> };

const translations = termTranslations as unknown as Record<WikiLanguage, WikiTranslationBundle>;

const orderedEntries = (language: WikiLanguage, bucket: "term" | "text") => Object.entries(translations[language]?.[bucket] ?? {})
  .filter(([source, target]) => source && target && source !== target)
  .sort(([left], [right]) => right.length - left.length);

const replaceTerms = (value: string, language: WikiLanguage) => orderedEntries(language, "term")
  .reduce((result, [source, target]) => result.split(source).join(target), value);

export const localizeWikiText = (value: string, language: WikiLanguage) => {
  if (language === "zh") return value;
  const sentence = translations[language]?.text?.[value];
  return replaceTerms(sentence ?? value, language);
};

/**
 * Localizes only text nodes so translated terms cannot change anchors, ids, or
 * other HTML attributes generated from the Markdown source.
 */
export const localizeWikiHtml = (html: string, language: WikiLanguage) => {
  if (language === "zh") return html;
  return html.replace(/>([^<>]+)</g, (_match, text: string) => `>${localizeWikiText(text, language)}<`);
};
