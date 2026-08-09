import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("build emits the native Vite site", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /FreshLi4/);
  assert.match(html, /<script type="module"/);
  await access(new URL("../dist/assets/", import.meta.url));
});

test("source keeps the dynamic visual-content convention", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.match(source, /import\.meta\.glob\("\/asset\/\*\/visual-content\/\*"/);
  assert.match(source, /videoExtensions/);
  assert.match(source, /setTimeout\(\(\) => show\(current \+ 1\), 3000\)/);
  assert.match(source, /class="games-flow"/);
  assert.match(source, /class="game-section/);
  assert.match(source, /data-site-nav="studio"/);
  assert.match(source, /data-project-tab/);
  assert.match(source, /aria-orientation="vertical"/);
  assert.doesNotMatch(source, /data-project-direction/);
  assert.doesNotMatch(source, /projectAutoplayDelay|projectVisibilityObserver|data-game-slide/);

  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.game-section \{ min-height:100svh/);
  assert.match(styles, /position:fixed; z-index:50; top:50%; left:var\(--page-pad\)/);
  assert.match(styles, /will-change:opacity; transition:opacity \.55s ease/);
  assert.match(styles, /\.games-controls\.is-idle \{ opacity:0; \}/);
  assert.match(styles, /flex-direction:column; justify-content:flex-start; align-items:flex-start/);
  assert.match(source, /navigationIdleTimer = window\.setTimeout\([\s\S]*?, 1000\);/);
  assert.match(source, /navigationHoverTarget\?\.addEventListener\("mouseenter", pauseNavigationIdleTimer\)/);
  assert.match(source, /navigationHoverTarget\?\.addEventListener\("mouseleave", keepNavigationVisible\)/);
  assert.doesNotMatch(styles, /games-showcase|games-sticky|games-slides|game-slide|is-project-snapping/);
});

test("source exposes the investigation rulebook as a second-level page", async () => {
  const source = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  const rules = await readFile(new URL("../src/rules.ts", import.meta.url), "utf8");
  const rulesStyles = await readFile(new URL("../src/rules.css", import.meta.url), "utf8");
  const aiServer = await readFile(new URL("../server/rules-ai.ts", import.meta.url), "utf8");
  assert.match(source, /\/investigation-delve-boardgame/);
  assert.match(source, /project-rules-link.*href="\/investigation-delve-boardgame"/);
  assert.match(source, /了解详情/);
  assert.match(rules, /class="rules-brand" href="\/investigation-delve-boardgame"/);
  assert.match(rules, /bootRulesPage/);
  assert.match(rules, /规则指引书 v1\.1/);
  assert.match(rules, /调查附录/);
  assert.match(rules, /FAQ/);
  assert.match(rules, /一款支持 2–6 人游玩的非直接对战美式桌游/);
  assert.match(rules, /问你想问的，<br \/>「调查工会」总有答案/);
  assert.match(rulesStyles, /\.rules-ai h2 \{ white-space: nowrap; \}/);
  assert.match(rulesStyles, /@media \(max-width: 640px\) \{ \.rules-ai h2 \{ font-size: clamp\(34px, 9vw, 55px\); \} \}/);
  assert.match(aiServer, /const OPENCODE_URL = "https:\/\/opencode\.ai\/zen\/v1\/chat\/completions"/);
  assert.match(aiServer, /const OPENCODE_MODEL = "deepseek-v4-pro"/);
  assert.match(aiServer, /const OPENROUTER_URL = "https:\/\/openrouter\.ai\/api\/v1\/chat\/completions"/);
  assert.match(aiServer, /const OPENROUTER_MODEL = "nvidia\/nemotron-3-super-120b-a12b:free"/);
  assert.match(aiServer, /process\.env\.OPENCODE_API_KEY/);
  assert.match(aiServer, /process\.env\.OPENROUTER_API_KEY/);
  assert.match(aiServer, /const OPENCODE_TIMEOUT_MS = 20_000/);
  assert.match(aiServer, /falling back to OpenRouter/);
  assert.match(aiServer, /最终输出只能是对用户当前问题的直接回答/);
  assert.match(aiServer, /最终输出永远只使用用户输入的语言/);
  assert.doesNotMatch(rules, /开始提问/);
  assert.match(rules, /THE ANOMALY/);
  assert.match(rules, /调查异常环境，<br \/><em>谨慎追寻真相。<\/em>/);
});
