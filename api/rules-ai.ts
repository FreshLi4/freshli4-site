import { handleRulesAiRequest } from "../server/rules-ai";

export const config = { maxDuration: 60 };

export default function rulesAi(request: Request): Promise<Response> {
  return handleRulesAiRequest(request);
}
