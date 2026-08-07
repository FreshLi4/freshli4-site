import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";
import { handleRulesAiRequest } from "./server/rules-ai.js";

const rulesAiDevApi = () => ({
  name: "rules-ai-dev-api",
  configureServer(server: { middlewares: { use: (path: string, handler: (request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse, next: (error?: Error) => void) => void) => void } }) {
    server.middlewares.use("/api/rules-ai", (request, response, next) => {
      if (request.method !== "POST") {
        next();
        return;
      }
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
      request.on("error", next);
      request.on("end", () => {
        void (async () => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === "string") headers.set(key, value);
          }
          const url = `http://${request.headers.host ?? "localhost"}/api/rules-ai`;
          const upstream = await handleRulesAiRequest(new Request(url, {
            method: "POST",
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }));
          response.statusCode = upstream.status;
          upstream.headers.forEach((value, key) => response.setHeader(key, value));
          if (!upstream.body) {
            response.end(await upstream.text());
            return;
          }
          const reader = upstream.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            response.write(Buffer.from(value));
          }
          response.end();
        })().catch((error: unknown) => {
          if (!response.headersSent) response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "AI 服务暂时不可用。" }));
        });
      });
    });
  },
});

export default defineConfig({
  plugins: [sites(), rulesAiDevApi()],
});
