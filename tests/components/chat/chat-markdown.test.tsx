import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMarkdown } from "@/components/chat/chat-markdown";

describe("ChatMarkdown", () => {
  it("renders bold, lists and links", () => {
    render(
      <ChatMarkdown text={"**Food** was first.\n\n- Coffee\n- Lunch\n\n[Open](https://example.com)"} />,
    );

    expect(screen.getByText("Food").tagName).toBe("STRONG");
    expect(screen.getByText("Coffee").tagName).toBe("LI");
    expect(screen.getByText("Lunch").tagName).toBe("LI");
    const link = screen.getByRole("link", { name: "Open" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders inline code and code blocks", () => {
    const { container } = render(
      <ChatMarkdown text={"Use `formatRupiah`.\n\n```ts\nconst x = 1;\n```"} />,
    );
    expect(screen.getByText("formatRupiah").tagName).toBe("CODE");
    expect(container.querySelector("pre")).not.toBeNull();
  });

  it("keeps plain text and the caret while streaming", () => {
    const { container } = render(
      <ChatMarkdown text={"**not yet** markdown"} streaming />,
    );
    expect(screen.getByText("**not yet** markdown")).toBeInTheDocument();
    expect(container.querySelector(".chat-caret")).not.toBeNull();
    expect(screen.queryByText("not yet")).toBeNull();
  });
});
