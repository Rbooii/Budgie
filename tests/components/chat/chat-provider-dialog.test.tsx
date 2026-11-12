import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    "chat-provider": {
      $get: vi.fn(),
      $put: vi.fn(),
      $delete: vi.fn(),
      test: { $post: vi.fn() },
    },
  },
}));

vi.mock("@/lib/api-client", () => ({ api: mockApi }));

import { ChatProviderDialog } from "@/components/chat/chat-provider-dialog";

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi["chat-provider"].$get.mockImplementation(() =>
    jsonResponse({
      configured: true,
      baseUrl: "https://api.example.com/v1",
      model: "my-model",
      label: "My model",
      hasKey: true,
    }),
  );
  mockApi["chat-provider"].$put.mockImplementation(() =>
    jsonResponse({
      configured: true,
      baseUrl: "https://api.example.com/v1",
      model: "gpt-4o-mini",
      label: "Work",
      hasKey: true,
    }),
  );
  mockApi["chat-provider"].$delete.mockImplementation(() =>
    Promise.resolve(new Response(null, { status: 204 })),
  );
  mockApi["chat-provider"].test.$post.mockImplementation(() =>
    jsonResponse({ ok: true }),
  );
});

describe("ChatProviderDialog", () => {
  it("loads the saved config and saves without re-entering the key", async () => {
    const onOpenChange = vi.fn();
    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatProviderDialog
        open
        onOpenChange={onOpenChange}
        onChanged={onChanged}
      />,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("https://api.openai.com/v1")).toHaveValue(
        "https://api.example.com/v1",
      ),
    );
    expect(
      screen.getByPlaceholderText("Saved. Leave blank to keep it"),
    ).toHaveValue("");

    const modelInput = screen.getByPlaceholderText("gpt-4o-mini");
    await user.clear(modelInput);
    await user.type(modelInput, "gpt-4o-mini");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockApi["chat-provider"].$put).toHaveBeenCalledWith({
        json: {
          baseUrl: "https://api.example.com/v1",
          model: "gpt-4o-mini",
          label: "My model",
          apiKey: undefined,
        },
      });
    });
    expect(onChanged).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows the server error and stays open", async () => {
    mockApi["chat-provider"].$put.mockImplementation(() =>
      jsonResponse({ error: "Endpoint must use https" }, 400),
    );
    const onOpenChange = vi.fn();

    render(
      <ChatProviderDialog
        open
        onOpenChange={onOpenChange}
        onChanged={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("https://api.openai.com/v1"),
      ).toHaveValue("https://api.example.com/v1"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Endpoint must use https"),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("tests the connection", async () => {
    render(
      <ChatProviderDialog
        open
        onOpenChange={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("https://api.openai.com/v1"),
      ).toHaveValue("https://api.example.com/v1"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Test" }));

    expect(await screen.findByText("Connection works.")).toBeInTheDocument();
    expect(mockApi["chat-provider"].test.$post).toHaveBeenCalled();
  });

  it("disconnects after confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const onChanged = vi.fn();

    render(
      <ChatProviderDialog
        open
        onOpenChange={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("https://api.openai.com/v1"),
      ).toHaveValue("https://api.example.com/v1"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      expect(mockApi["chat-provider"].$delete).toHaveBeenCalled();
    });
    expect(onChanged).toHaveBeenCalled();
  });
});
