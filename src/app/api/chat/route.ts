import { headers } from "next/headers";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { resolveModel, thinkingConfigFor } from "@/lib/chat-models";
import { createChatTools } from "@/server/chat/tools";
import { buildSystemPrompt } from "@/server/chat/system";
import { prepareMessagesForApi } from "@/server/chat/prepare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type ChatRequestBody = { messages?: unknown[]; model?: unknown };

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ChatRequestBody | null;
  if (!body || !Array.isArray(body.messages)) {
    return new Response("Bad request", { status: 400 });
  }

  const model = resolveModel(body.model);
  const messages = prepareMessagesForApi(body.messages as UIMessage[]);

  const result = streamText({
    model: google(model),
    instructions: buildSystemPrompt({
      userName: session.user.name ?? "there",
      now: new Date(),
    }),
    messages: await convertToModelMessages(messages),
    tools: createChatTools(session.user.id),
    stopWhen: stepCountIs(3),
    maxOutputTokens: 640,
    providerOptions: {
      google: {
        thinkingConfig: thinkingConfigFor(model),
      },
    },
    experimental_transform: smoothStream({ chunking: "word", delayInMs: 8 }),
  });

  return result.toUIMessageStreamResponse();
}