import intelCsv from "./data/investigation/情报卡牌.csv?raw";
import environmentCsv from "./data/investigation/环境卡牌.csv?raw";
import strategyCsv from "./data/investigation/策略卡牌.csv?raw";
import investigatorCsv from "./data/investigation/调查员.csv?raw";
import supportCsv from "./data/investigation/辅助卡牌.csv?raw";

export type CardCategory = "investigator" | "strategy" | "environment" | "intel" | "support";

export type InvestigationCard = {
  id: string;
  category: CardCategory;
  categoryLabel: string;
  name: string;
  type: string;
  cost: string;
  quantity: string;
  edition: string;
  update: string;
  effect: string;
  style: string;
  san: string;
  awake: string;
  madness: string;
};

export const cardCategoryMeta: Record<CardCategory, { label: string; english: string; accent: string }> = {
  investigator: { label: "调查员", english: "INVESTIGATORS", accent: "red" },
  strategy: { label: "策略", english: "STRATEGY", accent: "brass" },
  environment: { label: "环境", english: "ENVIRONMENT", accent: "ink" },
  intel: { label: "情报", english: "INTEL", accent: "red" },
  support: { label: "辅助", english: "SUPPORT", accent: "brass" },
};

const slugify = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");

const parseCsv = (source: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
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

const textAt = (row: string[], index: number) => row[index] ?? "";

const records = (category: CardCategory, source: string): InvestigationCard[] => {
  const rows = parseCsv(source).slice(1);
  const categoryLabel = cardCategoryMeta[category].label;
  return rows.map((row, index) => {
    const name = textAt(row, 0) || `${categoryLabel} ${index + 1}`;
    if (category === "investigator") {
      return {
        id: `${category}-${slugify(name)}-${index + 1}`,
        category, categoryLabel, name,
        type: textAt(row, 1), style: textAt(row, 2), san: textAt(row, 3),
        edition: textAt(row, 4), update: textAt(row, 5),
        awake: textAt(row, 6), madness: textAt(row, 7),
        cost: "", quantity: "", effect: "",
      };
    }
    if (category === "strategy") {
      return {
        id: `${category}-${slugify(name)}-${index + 1}`,
        category, categoryLabel, name,
        type: textAt(row, 1), cost: textAt(row, 2), quantity: textAt(row, 3),
        edition: textAt(row, 4), update: textAt(row, 5), effect: textAt(row, 6),
        style: "", san: "", awake: "", madness: "",
      };
    }
    if (category === "intel") {
      return {
        id: `${category}-${slugify(name)}-${index + 1}`,
        category, categoryLabel, name,
        cost: textAt(row, 1), quantity: textAt(row, 2), edition: textAt(row, 3),
        update: textAt(row, 4), effect: textAt(row, 5),
        type: "", style: "", san: "", awake: "", madness: "",
      };
    }
    if (category === "support") {
      return {
        id: `${category}-${slugify(name)}-${index + 1}`,
        category, categoryLabel, name,
        type: textAt(row, 1), cost: textAt(row, 2), quantity: textAt(row, 3),
        edition: textAt(row, 4), update: textAt(row, 5), effect: textAt(row, 6),
        style: "", san: "", awake: "", madness: "",
      };
    }
    return {
      id: `${category}-${slugify(name)}-${index + 1}`,
      category, categoryLabel, name,
      edition: textAt(row, 1), update: textAt(row, 2), effect: textAt(row, 3),
      type: "", cost: "", quantity: "", style: "", san: "", awake: "", madness: "",
    };
  });
};

export const cardSets: Record<CardCategory, InvestigationCard[]> = {
  investigator: records("investigator", investigatorCsv),
  strategy: records("strategy", strategyCsv),
  environment: records("environment", environmentCsv),
  intel: records("intel", intelCsv),
  support: records("support", supportCsv),
};

export const allInvestigationCards = Object.values(cardSets).flat();

