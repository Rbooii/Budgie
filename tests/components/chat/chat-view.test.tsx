import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockUseChat } = vi.hoisted(() => ({
  mockUseChat: {
    useChat: vi.fn(),
  },
}));

vi.mock("@ai-sdk/react", () => ({
  useChat: mockUseChat.useChat,
}));

import { ChatView } from "@/components/chat/chat-view";
import { loadChatDraft, loadChatMessages } from "@/lib/chat-storage";

const USER_ID = "user-1";
const PRIMARY_MODEL = "gemini-2.5-flash";
const LITE_MODEL = "gemini-3.5-flash-lite";

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
  render(<ChatView userId={USER_ID} userName="Raka" />);
  return mock;
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
});

afterEach(() => {
  window.localStorage.clear();
});

describe("ChatView", () => {
  it("shows the empty state with a greeting and suggestions", () => {
    renderChat();
    expect(screen.getByText(/hi raka/i)).toBeInTheDocument();
    expect(screen.getByText(/net worth right now/i)).toBeInTheDocument();
    expect(screen.getByText(/add a rp 45.000 lunch expense/i)).toBeInTheDocument();
  });

  it("shows the active model in the composer chip and the disclaimer caption", () => {
    renderChat();
    expect(screen.getByLabelText(/select model/i)).toHaveTextContent(
      "Gemini 2.5 Flash",
    );
    expect(
      screen.getByText(/budgie can make mistakes/i),
    ).toBeInTheDocument();
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
    expect(screen.queryByText(/switched to a lighter model/i)).toBeNull();

    const input = screen.getByPlaceholderText(/write a message/i);
    await userEvent.type(input, "hello{enter}");
    expect(defaultChat.sendMessage).toHaveBeenCalledWith(
      { text: "hello" },
      { body: { model: LITE_MODEL } },
    );
  });

  it("sends the suggestion text with the current model when a chip is clicked", async () => {
    renderChat();
    await userEvent.click(screen.getByText(/net worth right now/i));
    expect(defaultChat.sendMessage).toHaveBeenCalledWith(
      { text: "What's my net worth right now?" },
      { body: { model: PRIMARY_MODEL } },
    );
  });

  it("renders user and assistant messages with thinking, tool result and text", () => {
    renderChat({ messages: assistantMessages() });

    expect(screen.getByText("How much do I have?")).toBeInTheDocument();
    expect(screen.getByText("Thought for a moment")).toBeInTheDocument();
    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Mandiri")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 1.500.000.00").length).toBeGreaterThan(0);
    expect(screen.getByText("You have Rp 1.500.000.00 in total.")).toBeInTheDocument();
  });

  it("expands the reasoning text when the thinking toggle is clicked", async () => {
    renderChat({ messages: assistantMessages() });
    expect(screen.queryByText("I should check their accounts.")).not.toBeInTheDocument();

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

  it("shows the typing indicator while submitted", () => {
    renderChat({
      status: "submitted",
      messages: [
        { id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
      ],
    });
    expect(screen.getByRole("status", { name: /typing/i })).toBeInTheDocument();
  });

  it("shows a stop button instead of the send button while streaming", () => {
    renderChat({ status: "streaming" });
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
  });

  it("sends a typed message on Enter with the current model and clears the input", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/write a message/i);

    await userEvent.type(input, "hello budgie{enter}");

    expect(defaultChat.sendMessage).toHaveBeenCalledWith(
      { text: "hello budgie" },
      { body: { model: PRIMARY_MODEL } },
    );
    expect(input).toHaveValue("");
  });

  it("does not send empty input", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/write a message/i);
    await userEvent.type(input, "   {enter}");
    expect(defaultChat.sendMessage).not.toHaveBeenCalled();
  });

  it("renders an error callout and regenerates on retry", async () => {
    renderChat({ error: new Error("boom") });
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(defaultChat.regenerate).toHaveBeenCalledWith({
      body: { model: PRIMARY_MODEL },
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
    expect(screen.getByText("Couldn't add the transaction")).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
  });

  it("disables the input while the chat is in error state", () => {
    renderChat({ error: new Error("boom"), status: "error" });
    expect(screen.getByPlaceholderText(/write a message/i)).toBeDisabled();
  });

  it("restores saved messages and draft from localStorage on mount", async () => {
    const saved = assistantMessages();
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.messages`,
      JSON.stringify(saved),
    );
    window.localStorage.setItem(`budgie.chat.${USER_ID}.draft`, "half typed");

    const { setMessages } = renderChat();
    await waitFor(() => expect(setMessages).toHaveBeenCalledWith(saved));
    expect(screen.getByPlaceholderText(/write a message/i)).toHaveValue(
      "half typed",
    );
  });

  it("persists messages to localStorage once hydrated", async () => {
    renderChat({ messages: assistantMessages() });

    await waitFor(() => {
      expect(
        window.localStorage.getItem(`budgie.chat.${USER_ID}.messages`),
      ).not.toBeNull();
    });
    const stored = JSON.parse(
      window.localStorage.getItem(`budgie.chat.${USER_ID}.messages`) ?? "[]",
    );
    expect(stored.map((m: { id: string }) => m.id)).toEqual(["u1", "a1"]);
  });

  it("persists the input draft as the user types", async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/write a message/i);

    await userEvent.type(input, "spending");
    await waitFor(() => {
      expect(window.localStorage.getItem(`budgie.chat.${USER_ID}.draft`)).toBe(
        "spending",
      );
    });
  });

  it("clears messages and storage when the clear button is clicked", async () => {
    const { setMessages } = renderChat({ messages: assistantMessages() });
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.draft`,
      "typed draft",
    );

    await userEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(setMessages).toHaveBeenCalledWith([]);
    expect(window.localStorage.getItem(`budgie.chat.${USER_ID}.messages`)).toBeNull();
    expect(loadChatDraft(USER_ID)).toBe("");
    expect(loadChatMessages(USER_ID)).toEqual([]);
  });

  it("hides the clear button when there are no messages", () => {
    renderChat();
    expect(screen.queryByRole("button", { name: /clear chat/i })).toBeNull();
  });

  it("auto-downgrades to the lite model and regenerates on a quota error", async () => {
    renderChat({
      status: "error",
      error: new Error("Quota exceeded for metric generate_content_free_tier_requests"),
    });

    await waitFor(() => {
      expect(defaultChat.regenerate).toHaveBeenCalledWith({
        body: { model: LITE_MODEL },
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

  it("restores a previously saved lite model and shows the notice", async () => {
    window.localStorage.setItem(
      `budgie.chat.${USER_ID}.model`,
      JSON.stringify({ model: LITE_MODEL, savedAt: Date.now() }),
    );

    renderChat();
    await waitFor(() => {
      expect(screen.getByText(/switched to a lighter model/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/select model/i)).toHaveTextContent(
      "Gemini 3.5 Flash Lite",
    );

    const input = screen.getByPlaceholderText(/write a message/i);
    await userEvent.type(input, "hello{enter}");
    expect(defaultChat.sendMessage).toHaveBeenCalledWith(
      { text: "hello" },
      { body: { model: LITE_MODEL } },
    );
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
      expect(screen.getByText(/switched to a lighter model/i)).toBeInTheDocument();
    });
    expect(defaultChat.regenerate).not.toHaveBeenCalled();
  });
});