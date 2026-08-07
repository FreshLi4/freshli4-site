import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRulesAiRequest } from "../server/rules-ai.js";

export const config = { maxDuration: 60 };

const requestHeaders = (request: IncomingMessage) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }
  return headers;
};

const readBody = async (request: IncomingMessage) => {
  const parsedBody = (request as IncomingMessage & { body?: unknown }).body;
  if (parsedBody !== undefined) return typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody);
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString("utf8");
};

const writeResponse = async (response: ServerResponse, result: Response) => {
  response.statusCode = result.status;
  result.headers.forEach((value, key) => response.setHeader(key, value));
  if (!result.body) {
    response.end(await result.text());
    return;
  }
  const reader = result.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    response.write(Buffer.from(value));
  }
  response.end();
};

export default async function rulesAi(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readBody(request);
  const url = `https://${request.headers.host ?? "localhost"}${request.url ?? "/api/rules-ai"}`;
  const result = await handleRulesAiRequest(new Request(url, {
    method: request.method ?? "POST",
    headers: requestHeaders(request),
    body: body || undefined,
  }));
  await writeResponse(response, result);
}
