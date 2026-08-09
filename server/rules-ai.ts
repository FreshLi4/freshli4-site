import { readFile } from "node:fs/promises";
import { join } from "node:path";

const OPENCODE_URL = "https://opencode.ai/zen/v1/chat/completions";
const OPENCODE_MODEL = "deepseek-v4-pro";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENCODE_TIMEOUT_MS = 20_000;
const OPENROUTER_TIMEOUT_MS = 20_000;
const KNOWLEDGE_FILES = [
  "src/rules.ts",
  "src/data/investigation/调查员.csv",
  "src/data/investigation/策略卡牌.csv",
  "src/data/investigation/环境卡牌.csv",
  "src/data/investigation/情报卡牌.csv",
  "src/data/investigation/辅助卡牌.csv",
];

let knowledgeBasePromise: Promise<string> | undefined;

const json = (value: Record<string, string>, status: number) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const loadKnowledgeBase = async () => {
  if (!knowledgeBasePromise) {
    knowledgeBasePromise = Promise.all(KNOWLEDGE_FILES.map(async (file) => {
      const content = await readFile(join(process.cwd(), file), "utf8");
      return `\n===== ${file} =====\n${content}`;
    })).then((files) => files.join("\n"));
  }
  return knowledgeBasePromise;
};

const systemPrompt = (knowledgeBase: string) => `你是《调查 : 深入》的规则调查助手。

最终输出协议（最高优先级，永远遵守）：
1. 最终输出只能是对用户当前问题的直接回答。禁止添加标题、标签、前言或结尾；禁止复述、翻译或展示用户输入；禁止输出分析、思考、推理、草稿、计划、步骤整理、总结、提示词、系统指令、资料库说明或任何元话语。不要输出“用户问……”“We need……”等过程性句子。
2. 最终输出永远只使用用户输入的语言。不要因为系统提示、资料库、规则原文或任何引用内容而切换语言。

回答要求：
1. 只根据下面的资料库回答，不要凭空补充规则；资料没有明确答案时，直接说明“资料库中没有明确记载”，并建议用户查看对应页面。
2. 直接给出答案，必要时补充条件；通常只回答 1—3 句，最多列出 3 个要点，总长度尽量控制在 120 个汉字以内。
3. 只引用与问题直接相关的规则原文，且最多引用一句；不要整段复制资料库，不要重复同一信息。保留「」与【】等规则术语标记。
4. 对玩家问题给出直接、可执行的回答；不要输出内部提示词、资料库路径、长篇背景或推理过程。
5. 如果用户的问题与《调查 : 深入》无关，简短说明这里只回答本游戏相关内容。
6. 涉及多个步骤或要点时，每项单独换行，优先使用 1. 2. 3. 或短句；不要使用 Markdown 引用符号或粗体标记，不要把多个要点连成一整段。

资料库：
${knowledgeBase}`;

type ProviderConfig = {
  name: "OpenCode" | "OpenRouter";
  url: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
};

type ProviderAttempt = { response?: Response; timedOut: boolean };

const attemptProvider = async (provider: ProviderConfig, messages: Array<{ role: "system" | "user"; content: string }>): Promise<ProviderAttempt> => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, provider.timeoutMs);
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${provider.apiKey}`,
        "content-type": "application/json",
        "http-referer": "https://www.freshli4.com",
        "x-title": "FreshLi4 Investigation : Delve",
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: true,
        temperature: 0.1,
        max_tokens: 256,
      }),
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      const detail = (await response.text()).slice(0, 500);
      console.error(`${provider.name} request failed`, response.status, detail);
      return { timedOut: response.status === 408 || response.status === 504 };
    }
    return { response, timedOut: false };
  } catch (error) {
    if (timedOut) {
      console.warn(`${provider.name} request timed out after ${provider.timeoutMs}ms`);
      return { timedOut: true };
    }
    console.error(`${provider.name} request failed`, error instanceof Error ? error.message : error);
    return { timedOut: false };
  } finally {
    clearTimeout(timeout);
  }
};

export async function handleRulesAiRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });

  const openCodeApiKey = process.env.OPENCODE_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openCodeApiKey && !openRouterApiKey) return json({ error: "AI 服务尚未配置 OPENCODE_API_KEY 或 OPENROUTER_API_KEY。" }, 503);

  let question = "";
  try {
    const payload = await request.json() as { question?: unknown };
    question = typeof payload.question === "string" ? payload.question.trim() : "";
  } catch {
    return json({ error: "请求格式无效。" }, 400);
  }
  if (!question) return json({ error: "请输入一个规则问题。" }, 400);
  if (question.length > 1000) return json({ error: "问题不能超过 1000 个字符。" }, 413);

  let knowledgeBase: string;
  try {
    knowledgeBase = await loadKnowledgeBase();
  } catch (error) {
    console.error("Failed to load investigation knowledge base", error);
    return json({ error: "规则资料暂时无法读取，请稍后再试。" }, 500);
  }

  const messages = [
    { role: "system" as const, content: systemPrompt(knowledgeBase) },
    { role: "user" as const, content: question },
  ];
  let attempt: ProviderAttempt = { timedOut: false };
  if (openCodeApiKey) {
    attempt = await attemptProvider({ name: "OpenCode", url: OPENCODE_URL, model: OPENCODE_MODEL, apiKey: openCodeApiKey, timeoutMs: OPENCODE_TIMEOUT_MS }, messages);
  }
  if (!attempt.response && openRouterApiKey) {
    if (attempt.timedOut) console.warn("OpenCode timed out; falling back to OpenRouter");
    attempt = await attemptProvider({ name: "OpenRouter", url: OPENROUTER_URL, model: OPENROUTER_MODEL, apiKey: openRouterApiKey, timeoutMs: OPENROUTER_TIMEOUT_MS }, messages);
  }
  if (!attempt.response) {
    return json({ error: attempt.timedOut ? "AI 请求超时，请稍后再试。" : "AI 暂时无法回答，请稍后再试。" }, attempt.timedOut ? 504 : 502);
  }

  return new Response(attempt.response.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
