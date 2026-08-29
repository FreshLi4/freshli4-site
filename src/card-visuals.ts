import type { CardCategory, InvestigationCard } from "./investigation-data";

export type CardVisualAsset = {
  front: string;
  back: string;
  frontLabel: string;
  backLabel: string;
  isInvestigator: boolean;
};

const cardVisualFiles = import.meta.glob(
  [
    "/asset/investigation-delve/card/**/blank-card/**/*.png",
    "/asset/investigation-delve/card/**/blank-card/**/*.jpg",
    "/asset/investigation-delve/card/**/blank-card/**/*.jpeg",
    "/asset/investigation-delve/card/**/blank-card/**/*.svg",
  ],
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

const cardVisualUrl = (path: string) => cardVisualFiles[path] ?? "";
const cardAssetPath = (...segments: string[]) => `/asset/investigation-delve/card/${segments.join("/")}`;
const extensionCandidates = ["png", "jpg", "jpeg", "svg"];

const findAsset = (category: CardCategory, id: string, variant: "front" | "back" | "awake" | "madness") => {
  const candidates = variant === "back"
    ? extensionCandidates.map((extension) => cardAssetPath("card-back", "blank-card", `${category}.${extension}`))
    : category === "investigator"
      ? extensionCandidates.map((extension) => cardAssetPath(category, "blank-card", variant, `${id}.${extension}`))
      : extensionCandidates.map((extension) => cardAssetPath(category, "blank-card", `${id}.${extension}`));
  return candidates.map(cardVisualUrl).find(Boolean) ?? "";
};

export const cardVisualFor = (card: InvestigationCard): CardVisualAsset => {
  if (card.category === "investigator") {
    return {
      front: findAsset(card.category, card.id, "awake"),
      back: findAsset(card.category, card.id, "madness"),
      frontLabel: "清醒卡面",
      backLabel: "疯狂卡面",
      isInvestigator: true,
    };
  }
  return {
    front: findAsset(card.category, card.id, "front"),
    back: findAsset(card.category, card.id, "back"),
    frontLabel: "卡面",
    backLabel: "卡背",
    isInvestigator: false,
  };
};
