import { termTranslations } from "./generated/investigation-wiki";

export type WikiLanguage = "zh" | "en" | "ja";
type WikiTranslationBundle = { term: Record<string, string>; text: Record<string, string>; fragment: Record<string, string> };

const translations = termTranslations as unknown as Record<WikiLanguage, WikiTranslationBundle>;

const orderedEntries = (language: WikiLanguage, bucket: "term" | "text") => Object.entries(translations[language]?.[bucket] ?? {})
  .filter(([source, target]) => source && target && source !== target)
  .sort(([left], [right]) => right.length - left.length);

const orderedFragments = (language: WikiLanguage) => Object.entries(translations[language]?.fragment ?? {})
  .filter(([source, target]) => source && target && source !== target)
  .sort(([left], [right]) => right.length - left.length);

const replaceFragments = (value: string, language: WikiLanguage) => orderedFragments(language)
  .reduce((result, [source, target]) => result.split(source).join(target), value);

const replaceTerms = (value: string, language: WikiLanguage) => orderedEntries(language, "term")
  .reduce((result, [source, target]) => result.split(source).join(target), value);

export const localizeWikiText = (value: string, language: WikiLanguage) => {
  if (language === "zh") return value;
  const leading = value.match(/^\s*/u)?.[0] ?? "";
  const trailing = value.match(/\s*$/u)?.[0] ?? "";
  const source = value.slice(leading.length, value.length - trailing.length || undefined);
  const sentence = translations[language]?.text?.[source];
  const localized = sentence ?? replaceFragments(source, language);
  return `${leading}${replaceTerms(localized || source, language)}${trailing}`;
};

/**
 * Localizes only text nodes so translated terms cannot change anchors, ids, or
 * other HTML attributes generated from the Markdown source.
 */
export const localizeWikiHtml = (html: string, language: WikiLanguage) => {
  if (language === "zh") return html;
  return html.replace(/>([^<>]+)</g, (_match, text: string) => `>${localizeWikiText(text, language)}<`);
};

const textSources = new WeakMap<Text, string>();
const attributeSources = new WeakMap<HTMLElement, Record<string, string>>();
const localizableAttributes = ["aria-label", "alt", "placeholder", "title"];

/** Localizes the live rules page without rebuilding its interactive DOM. */
export const localizeWikiTree = (root: HTMLElement, language: WikiLanguage) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const source = textSources.get(textNode) ?? textNode.data;
    textSources.set(textNode, source);
    textNode.data = localizeWikiText(source, language);
    node = walker.nextNode();
  }
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const sources = attributeSources.get(element) ?? {};
    for (const attribute of localizableAttributes) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;
      const source = sources[attribute] ?? value;
      sources[attribute] = source;
      element.setAttribute(attribute, localizeWikiText(source, language));
    }
    attributeSources.set(element, sources);
  });
};
