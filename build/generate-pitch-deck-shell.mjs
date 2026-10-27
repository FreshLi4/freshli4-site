import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postcss from "postcss";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scope = "body[data-overview-theme]";
const frameClasses = new Set([
  "studio-font", "noise", "site-header", "brand", "brand-mark", "brand-name", "brand-logo", "header-actions",
  "main-nav", "menu-button", "mobile-menu", "sr-only", "hero", "hero-grid", "eyebrow", "hero-title", "hero-line",
  "hero-line-accent", "hero-bottom", "hero-cn", "hero-copy", "round-link", "round-link-content", "section-kicker",
  "contact-section", "contact-title", "contact-row", "contact-email", "contact-services", "service-primary", "service-en",
  "footer", "reveal",
  "games-controls", "project-tabs", "project-tab", "project-tab-number",
]);
const variables = new Set(["--font-jetbrains", "--font-studio", "--page-pad", "--header-h", "--ease", "--studio-orange"]);
const fontFamilies = new Set(["FreshLi4 JetBrains", "FreshLi4 Studio Sans CJK", "FreshLi4 Maple"]);
const declaration = (node, property) => node.nodes.find(child => child.prop === property)?.value;
const family = node => declaration(node, "font-family")?.replace(/["']/g, "");
const fontKey = node => `${family(node)}:${declaration(node, "font-weight")?.replace(/\s/g, "")}`;

// Both pages use the homepage's owning stylesheet. The built variant reuses
// Vite's existing font assets rather than copying a second set of font files.
export async function generatePitchDeckShell({ built = false } = {}) {
  const source = postcss.parse(await readFile(join(root, "src/styles.css"), "utf8"));
  const builtFonts = new Map();
  if (built) {
    const home = await readFile(join(root, "dist/index.html"), "utf8");
    const stylesheets = [...home.matchAll(/href="([^"?]+\.css)"/g)].map(match => match[1]);
    for (const path of stylesheets) {
      const css = postcss.parse(await readFile(join(root, "dist", path.replace(/^\//, "")), "utf8"));
      css.walkAtRules("font-face", node => builtFonts.set(fontKey(node), declaration(node, "src")));
    }
  }

  const select = node => {
    if (node.type === "rule") {
      if (node.selector === ":root") {
        const declarations = node.nodes.filter(child => child.type === "decl" && variables.has(child.prop));
        return declarations.length ? node.clone({ selector: scope, nodes: declarations.map(child => child.clone()) }) : null;
      }
      const selectors = node.selectors.filter(selector => frameClasses.has(selector.match(/^\.([\w-]+)/)?.[1]) || selector === "main > section");
      return selectors.length ? node.clone({ selector: selectors.map(selector => `${scope} ${selector.startsWith(".eyebrow") ? ".hero " : ""}${selector}`).join(", ") }) : null;
    }
    if (node.type === "atrule" && node.name === "font-face" && fontFamilies.has(family(node))) {
      const font = node.clone();
      const src = font.nodes.find(child => child.prop === "src");
      if (built) {
        const value = builtFonts.get(fontKey(node));
        if (!value) throw new Error(`Built homepage font is missing: ${fontKey(node)}`);
        src.value = value;
      } else src.value = src.value.replaceAll("../asset/", "/asset/");
      return font;
    }
    if (node.type === "atrule" && ["media", "supports"].includes(node.name)) {
      const children = node.nodes.map(select).filter(Boolean);
      return children.length ? node.clone({ nodes: children }) : null;
    }
    return null;
  };

  const output = postcss.root({ nodes: source.nodes.map(select).filter(Boolean) });
  output.prepend(postcss.comment({ text: "Generated from src/styles.css; edit the homepage source instead." }));
  const directory = join(root, built ? "dist" : "public", "pitch-deck");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "studio-shell.css"), output.toString(), "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generatePitchDeckShell({ built: true });
}
