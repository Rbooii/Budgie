import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockUseChat, mockApi } = vi.hoisted(() => ({
  mockUseChat: {
    useChat: vi.fn(),
  },
  mockApi: {
    chat: {
      threads: {
        $get: vi.fn(),
        $post: vi.fn(),
        ":id": {
          $get: vi.fn(),
          $patch: vi.fn(),
          $delete: vi.fn(),
        },
      },
    },
    "chat-provider": {
      $get: vi.fn(),
      $put: vi.fn(),
      $delete: vi.fn(),
      test: { $post: vi.fn() },
    },
  },
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: mockUseChat.useChat,
}));

vi.mock("@/lib/api-client", () => ({ api: mockApi }));

import { ChatView } from "@/components/chat/chat-view";

const USER_ID = "user-1";
const PRIMARY_MODEL = "gemini-2.5-flash";
const LITE_MODEL = "gemini-3.5-flash-lite";

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function emptyResponse(status = 204) {
  return Promise.resolve(new Response(null, { status }));
}

function provider(configured: boolean, label: string | null = null) {
  return {
    configured,
    baseUrl: configured ? "https://api.example.com/v1" : null,
    model: configured ? "my-model" : null,
    label,
    hasKey: configured,
  };
}

function summary(
  id = "thread-1",
  title = "How much did I spend?",
) {
  const now = new Date().toISOString();
  return {
    id,
    title,
    model: PRIMARY_MODEL,
    messageCount: 2,
    createdAt: now,
    updatedAt: now,
  };
}

const defaultChat = {
  sendMessage: vi.fn(),
  status: "ready",
  stop: vi.fn(),
  error: undefined,
  regenerate: vi.fn(),
};

function mockChat(overrides: Record<string, unknown> = {}) {
  const messages = (overrides.messages ?? []) as Array<Record<string, unknown>>;
  const messagesRef = { current: messages };
  const setMessages = vi.fn((updater: unknown) => {
    messagesRef.current =
      typeof updater === "function" ? updater(messagesRef.current) : updater;
  });
  mockUseChat.useChat.mockReturnValue({
    ...defaultChat,
    ...overrides,
    messages: messagesRef.current,
    setMessages,
  });
  return { setMessages, messagesRef };
}

function renderChat(overrides: Record<string, unknown> = {}) {
  const mock = mockChat(overrides);
  const view = render(<ChatView userId={USER_ID} userName="Arco Kurniawan" />);
  return { ...mock, ...view };
}

const accountsOutput = {
  totalBalance: 1500000,
  currency: "IDR",
  accounts: [
    { id: "acc-1", name: "Mandiri", type: "bank", balance: 1500000 },
  ],
};

function assistantMessages() {
  return [
    {
      id: "u1",
      role: "user",
      parts: [{ type: "text", text: "How much do I have?" }],
    },
    {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "reasoning",
          text: "I should check their accounts.",
          state: "done",
        },
        {
          type: "tool-get_balance_accounts",
          toolCallId: "t1",
          state: "output-available",
          input: {},
          output: accountsOutput,
        },
        { type: "text", text: "You have Rp 1.500.000.00 in total." },
      ],
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState(null, "", "/chat");

  mockApi.chat.threads.$get.mockImplementation(() =>
    jsonResponse({ threads: [] }),
  );
  mockApi.chat.threads.$post.mockImplementation(() =>
    jsonResponse({ thread: summary("thread-1", "New chat") }, 201),
  );
  mockApi.chat.threads[":id"].$get.mockImplementation(() =>
    jsonResponse({ thread: { ...summary(), messages: [] } }),
  );
  mockApi.chat.threads[":id"].$patch.mockImplementation(() =>
    jsonResponse({ ok: true }),
  );
  mockApi.chat.threads[":id"].$delete.mockImplementation(() => emptyResponse());

  mockApi["chat-provider"].$get.mockImplementation(() =>
    jsonResponse(provider(false)),
  );
  mockApi["chat-provider"].$put.mockImplementation(() =>
    jsonResponse(provider(true, "My model")),
  );
  mockApi["chat-provider"].$delete.mockImplementation(() => emptyResponse());
  mockApi["chat-provider"].test.$post.mockImplementation(() =>
    jsonResponse({ ok: true }),
  );
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("ChatView", () => {
  it("shows the empty state with a greeting and all four suggestion tiles", () => {
    renderChat();
    expect(screen.getByText(/hi arco, how can i help/i)).toBeInTheDocument();
    expect(screen.getByText(/how much did i spend this month/i)).toBeInTheDocument();
    expect(screen.getByText(/what's my net worth/i)).toBeInTheDocument();
    expect(screen.getByText(/show my budgets/i)).toBeInTheDocument();
    expect(screen.getByText(/record that i bought coffee/i)).toBeInTheDocument();
  });

  it("renders exactly one New chat action and no redundant clear button", () => {
    renderChat({ messages: assistantMessages() });
    expect(
      screen.getAllByRole("button", { name: /new chat/i }),
    ).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /clear chat/i })).toBeNull();
  });

  it("pins the chat surface to the mobile viewport above the tab bar", () => {
    const { container } = renderChat();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain(
      "h-[calc(100dvh-var(--app-tabbar-h))]",
    );
    expect(root.className).toContain("md:h-[100dvh]");
  });

  it("opens the right-side history drawer", async () => {
    renderChat();
    await userEvent.click(
      screen.getByRole("button", { name: /open chat history/i }),
    );
    const dialog = screen.getByRole("dialog", { name: "Chat history" });
    expect(dialog.className).toContain("right-0");
    expect(
      screen.getAllByRole("button", { name: "New chat" }),
    ).toHaveLength(1);
  });

  it("shows the active model in the composer menu", async () => {
    renderChat();
    await waitFor(() => {
      expect(screen.getByLabelText(/select model/i)).toHaveTextContent(
        "Gemini 2.5 Flash",
      );
    });
  });

  it("creates a thread and sends the prompt with the current model", async () => {
    renderChat();
    await userEvent.click(screen.getByText(/what's my net worth/i));

    await waitFor(() => {
      expect(mockApi.chat.threads.$post).toHaveBeenCalledWith({
        json: { title: "What's my net worth?", model: PRIMARY_MODEL },
      });
    });
    await waitFor(() => {
      expect(defaultChat.sendMessage).toHaveBeenCalledWith(
        { text: "What's my net worth?" },
        { body: { model: PRIMARY_MODEL, threadId: "thread-1" } },
      );
    });
  });

  it("manually switches the model and persists it", async () => {
    renderChat();
    await userEvent.click(screen.getByLabelText(/select model/i));
    await userEvent.click(screen.getByText("Gemini 3.5 Flash Lite"));

    expect(
      JSON.parse(
        window.localStorage.getItem(`budgie.chat.${USER_ID}.model`) ?? "{}",
      ).model,
    ).toBe(LITE_MODEL);

    const input = screen.getByPlaceholderText(/ask budgie about your money/i);
    await userEvent.type(input, "hello{enter}");
    await waitFor(() => {
      expect(defaultChat.sendMessage).toHaveBeenCalledWith(
        { text: "hello" },
        { body: { model: LITE_MODEL, threadId: "thread-1" } },
      );
    });
  });

  it("renders user and assistant messages with thinking, tool result and text", () => {
    renderChat({ messages: assistantMessages() });

    expect(screen.getByText("How much do I have?")).toBeInTheDocument();
    expect(screen.getByText("Thought for a moment")).toBeInTheDocument();
    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Mandiri")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 1.500.000.00").length).toBeGreaterThan(0);
    expect(
      screen.getByText("You have Rp 1.500.000.00 in total."),
    ).toBeInTheDocument();
  });

  it("renders assistant markdown", () => {
    renderChat({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "**Food** was the biggest:\n\n- Coffee\n- Lunch",
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Food").tagName).toBe("STRONG");
    expect(screen.getByText("Coffee").tagName).toBe("LI");
    expect(screen.getByText("Lunch").tagName).toBe("LI");
  });

  it("copies the assistant message to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderChat({ messages: assistantMessages() });
    await userEvent.click(screen.getByRole("button", { name: /copy message/i }));

    expect(writeText).toHaveBeenCalledWith(
      "You have Rp 1.500.000.00 in total.",
    );
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("regenerates the last assistant message", async () => {
    renderChat({ messages: assistantMessages() });
    await userEvent.click(
      screen.getByRole("button", { name: /regenerate response/i }),
    );
    expect(defaultChat.regenerate).toHaveBeenCalledWith({
      body: { model: PRIMARY_MODEL, threadId: null },
    });
  });

  it("does not offer regenerate while streaming", () => {
    renderChat({ messages: assistantMessages(), status: "streaming" });
    expect(
      screen.queryByRole("button", { name: /regenerate response/i }),
    ).toBeNull();
  });

  it("shows a streaming caret on the last text part", () => {
    const { container } = renderChat({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: "Thinking out loud" }],
        },
      ],
      status: "streaming",
    });
    expect(container.querySelector(".chat-caret")).not.toBeNull();
  });

  it("shows a fallback and retry when the model stops without text", async () => {
    renderChat({
      messages: [
        {
          id: "a1",
          role: "assistant",
          parts: [
            {
              type: "reasoning",
              text: "I was still thinking.",
              state: "done",
            },
          ],
        },
      ],
    });

    expect(
      screen.getByText(/the model stopped before answering/i),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /retry response/i }),
    );
    expect(defaultChat.regenerate).toHaveBeenCalledWith({
      body: { model: PRIMARY_MODEL, threadId: null },
    });
  });

  it("expands the reasoning text when the thinking toggle is clicked", async () => {
    renderChat({ messages: assistantMessages() });
    expect(
      screen.queryByText("I should check their accounts."),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Thought for a moment"));
    expect(screen.getByText("I should check their accounts.")).toBeInTheDocument();
  });

  it("shows tool running status while a tool is pending", () => {
    const messages = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-get_balance_accounts",
            toolCallId: "t1",
            state: "input-available",
            input: {},
          },
        ],
      },
    ];
    renderChat({ messages });
    expect(screen.getByText("Looking up your accounts…")).toBeInTheDocument();
  });

  it("shows a static thinking indicator while submitted", () => {
    renderChat({
      status: "submitted",
      messages: [
        { id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
      ],
    });
    expect(screen.getByRole("status", { name: /thinking/i })).toHaveTextContent(
      "Thinking",
    );
  });

  it("shows a stop button instead of the send button while streaming", () => {
    renderChat({ status: "streaming" });
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
  });

  it("sends a typed message on Enter with the current model and clears the input", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/ask budgie about your money/i);

    await userEvent.type(input, "hello budgie{enter}");

    await waitFor(() => {
      expect(defaultChat.sendMessage).toHaveBeenCalledWith(
        { text: "hello budgie" },
        { body: { model: PRIMARY_MODEL, threadId: "thread-1" } },
      );
    });
    expect(input).toHaveValue("");
  });

  it("does not send empty input", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/ask budgie about your money/i);
    await userEvent.type(input, "   {enter}");
    expect(defaultChat.sendMessage).not.toHaveBeenCalled();
  });

  it("renders an error callout and regenerates on retry", async () => {
    renderChat({ error: new Error("boom"), messages: assistantMessages() });
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(defaultChat.regenerate).toHaveBeenCalledWith({
      body: { model: PRIMARY_MODEL, threadId: null },
    });
  });

  it("stops generation when the stop button is clicked", async () => {
    renderChat({ status: "streaming" });
    await userEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(defaultChat.stop).toHaveBeenCalled();
  });

  it("renders multiple tool result cards in one message", () => {
    const messages = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-get_insights",
            toolCallId: "t1",
            state: "output-available",
            input: {},
            output: {
              netWorth: 5000000,
              monthIncome: 3000000,
              monthExpense: 1200000,
              topCategories: [{ category: "FoodAndDrink", amount: 45000 }],
            },
          },
          {
            type: "tool-create_transaction",
            toolCallId: "t2",
            state: "output-available",
            input: {},
            output: {
              ok: false,
              error: "Insufficient balance",
            },
          },
        ],
      },
    ];
    renderChat({ messages });

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
  });

  it("disables the input while the chat is in error state", () => {
    renderChat({ error: new Error("boom"), status: "error" });
    expect(
      screen.getByPlaceholderText(/ask budgie about your money/i),
    ).toBeDisabled();
  });

  it("shows a jump-to-latest pill when the user scrolls away and hides it on click", async () => {
    const { container } = renderChat({ messages: assistantMessages() });
    const scroller = container.querySelector(".chat-scroll") as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 400,
    });
    scroller.scrollTop = 100;

    fireEvent.scroll(scroller);
    const pill = await screen.findByRole("button", { name: /latest/i });
    expect(pill).toBeInTheDocument();

    await userEvent.click(pill);
    scroller.scrollTop = 600;
    fireEvent.scroll(scroller);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /latest/i })).toBeNull(),
    );
  });

  it("resumes the active thread and renders its title", async () => {
    const saved = assistantMessages();
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.activeThread`,
      "thread-1",
    );
    mockApi.chat.threads.$get.mockImplementation(() =>
      jsonResponse({ threads: [summary("thread-1", "Saved chat")] }),
    );
    mockApi.chat.threads[":id"].$get.mockImplementation(() =>
      jsonResponse({
        thread: { ...summary("thread-1", "Saved chat"), messages: saved },
      }),
    );

    const { setMessages } = renderChat();
    await waitFor(() => expect(setMessages).toHaveBeenCalledWith(saved));
    expect(screen.getAllByText("Saved chat").length).toBeGreaterThan(0);
  });

  it("selects a thread from the history rail", async () => {
    mockApi.chat.threads.$get.mockImplementation(() =>
      jsonResponse({ threads: [summary("thread-2", "Older chat")] }),
    );
    const saved = assistantMessages();
    mockApi.chat.threads[":id"].$get.mockImplementation(() =>
      jsonResponse({
        thread: { ...summary("thread-2", "Older chat"), messages: saved },
      }),
    );

    const { setMessages } = renderChat();
    await screen.findByText("Older chat");
    await userEvent.click(screen.getByText("Older chat"));

    await waitFor(() => expect(setMessages).toHaveBeenCalledWith(saved));
  });

  it("deletes a thread from the history rail", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockApi.chat.threads.$get.mockImplementation(() =>
      jsonResponse({ threads: [summary("thread-2", "Older chat")] }),
    );

    renderChat();
    await screen.findByText("Older chat");
    await userEvent.click(
      screen.getByRole("button", { name: /delete older chat/i }),
    );

    await waitFor(() => {
      expect(mockApi.chat.threads[":id"].$delete).toHaveBeenCalledWith({
        param: { id: "thread-2" },
      });
    });
  });

  it("persists the input draft as the user types", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/ask budgie about your money/i);

    await userEvent.type(input, "spending");
    await waitFor(() => {
      expect(window.localStorage.getItem(`budgie.chat.${USER_ID}.draft`)).toBe(
        "spending",
      );
    });
  });

  it("clears the draft and active thread but keeps history on New chat", async () => {
    const { setMessages } = renderChat({ messages: assistantMessages() });
    window.localStorage.setItem(`budgie.chat.${USER_ID}.draft`, "typed draft");
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.activeThread`,
      "thread-1",
    );

    await userEvent.click(
      screen.getByRole("button", { name: /new chat/i }),
    );

    expect(setMessages).toHaveBeenCalledWith([]);
    expect(window.localStorage.getItem(`budgie.chat.${USER_ID}.draft`)).toBe("");
    expect(
      window.localStorage.getItem(`budgie.chat.${USER_ID}.activeThread`),
    ).toBeNull();
    expect(mockApi.chat.threads[":id"].$delete).not.toHaveBeenCalled();
  });

  it("auto-downgrades to the lite model and regenerates on a quota error", async () => {
    renderChat({
      status: "error",
      error: new Error("Quota exceeded for metric generate_content_free_tier_requests"),
    });

    await waitFor(() => {
      expect(defaultChat.regenerate).toHaveBeenCalledWith({
        body: { model: LITE_MODEL, threadId: null },
      });
    });
    expect(
      screen.getByText(/switched to a lighter model/i),
    ).toBeInTheDocument();
    expect(
      JSON.parse(
        window.localStorage.getItem(`budgie.chat.${USER_ID}.model`) ?? "{}",
      ).model,
    ).toBe(LITE_MODEL);
  });

  it("does not downgrade on a generic error", async () => {
    renderChat({ status: "error", error: new Error("boom") });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
    expect(defaultChat.regenerate).not.toHaveBeenCalled();
    expect(screen.queryByText(/switched to a lighter model/i)).toBeNull();
  });

  it("restores a previously saved lite model", async () => {
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.model`,
      JSON.stringify({ model: LITE_MODEL, savedAt: Date.now() }),
    );

    renderChat();
    await waitFor(() => {
      expect(screen.getByLabelText(/select model/i)).toHaveTextContent(
        "Gemini 3.5 Flash Lite",
      );
    });
  });

  it("does not downgrade past the last model in the chain", async () => {
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.model`,
      JSON.stringify({ model: LITE_MODEL, savedAt: Date.now() }),
    );

    renderChat({
      status: "error",
      error: new Error("429 quota exceeded"),
    });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
    expect(defaultChat.regenerate).not.toHaveBeenCalled();
  });

  it("opens the provider dialog from the model menu", async () => {
    renderChat();
    await waitFor(() =>
      expect(screen.getByLabelText(/select model/i)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByLabelText(/select model/i));
    await userEvent.click(screen.getByText("Connect a model"));

    expect(
      await screen.findByRole("heading", { name: "Your model" }),
    ).toBeInTheDocument();
  });

  it("lists the configured custom model", async () => {
    mockApi["chat-provider"].$get.mockImplementation(() =>
      jsonResponse(provider(true, "My model")),
    );
    renderChat();

    await waitFor(() =>
      expect(screen.getByLabelText(/select model/i)).toHaveTextContent(
        "Gemini 2.5 Flash",
      ),
    );
    await userEvent.click(screen.getByLabelText(/select model/i));
    expect(screen.getByText("My model")).toBeInTheDocument();
    expect(screen.getByText("Manage model")).toBeInTheDocument();
  });
});
