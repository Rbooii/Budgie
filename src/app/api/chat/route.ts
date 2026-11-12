import { headers } from "next/headers";
import {
  convertToModelMessages,
  generateId,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import {
  isCustomModel,
  resolveChatModel,
  thinkingConfigFor,
} from "@/lib/chat-models";
import { createChatTools } from "@/server/chat/tools";
import { buildSystemPrompt } from "@/server/chat/system";
import { prepareMessagesForApi } from "@/server/chat/prepare";
import {
  createCustomChatModel,
} from "@/server/chat/provider";
import { getChatProviderSecret } from "@/server/services/chat-provider";
import {
  getChatThread,
  saveChatThreadMessages,
} from "@/server/services/chat-threads";
import {
  formatFinancialSnapshot,
  getFinancialOverview,
} from "@/server/services/analytics";

// `cacheComponents` forbids the `runtime`/`dynamic` segment configs; Route
// Handlers stay dynamic and on the Node.js runtime by default.
export const maxDuration = 30;

type ChatRequestBody = {
  messages?: unknown[];
  model?: unknown;
  threadId?: unknown;
};

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ChatRequestBody | null;
  if (!body || !Array.isArray(body.messages)) {
    return new Response("Bad request", { status: 400 });
  }

  const userId = session.user.id;
  const uiMessages = body.messages as UIMessage[];
  const selection = resolveChatModel(body.model);
  const threadId =
    typeof body.threadId === "string" && body.threadId.length > 0
      ? body.threadId
      : null;

  if (threadId) {
    const thread = await getChatThread(userId, threadId);
    if (!thread) {
      return new Response("Chat thread not found", { status: 404 });
    }
  }

  let model;
  try {
    if (isCustomModel(selection)) {
      const provider = await getChatProviderSecret(userId);
      if (!provider) {
        return new Response("Custom model is not connected", { status: 400 });
      }
      model = createCustomChatModel(provider);
    } else {
      model = google(selection);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Custom model is unavailable";
    return new Response(message, { status: 400 });
  }

  const now = new Date();
  const overview = await getFinancialOverview(userId);
  const snapshot = formatFinancialSnapshot(overview);
  const messages = prepareMessagesForApi(uiMessages);

  const result = streamText({
    model,
    instructions: buildSystemPrompt({
      userName: session.user.name ?? "there",
      now,
      snapshot,
    }),
    messages: await convertToModelMessages(messages),
    tools: createChatTools(userId),
    stopWhen: stepCountIs(4),
    maxOutputTokens: 640,
    providerOptions: isCustomModel(selection)
      ? undefined
      : {
          google: {
            thinkingConfig: thinkingConfigFor(selection),
          },
        },
    experimental_transform: smoothStream({ chunking: "word", delayInMs: 8 }),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: uiMessages,
    generateMessageId: () => generateId(),
    onFinish: async ({ messages: finishedMessages }) => {
      if (!threadId) return;
      try {
        await saveChatThreadMessages(userId, threadId, finishedMessages);
      } catch (error) {
        console.error("[chat] failed to persist thread", error);
      }
    },
  });
}
