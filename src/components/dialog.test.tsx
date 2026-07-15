import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@/components/dialog";

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Dialog", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <Dialog open={false} onOpenChange={() => {}}>
        <p>Hidden content</p>
      </Dialog>,
    );
    expect(container.querySelector(".fixed.inset-0")).toBeNull();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("renders children when open is true", () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <p>Visible content</p>
      </Dialog>,
    );
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <p>Content</p>
      </Dialog>,
    );
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <p>Content</p>
      </Dialog>,
    );
    const backdrop = container.querySelector(".fixed.inset-0") as HTMLElement;
    await user.click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not close when the inner content is clicked (stopPropagation)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <p>Inner</p>
      </Dialog>,
    );
    await user.click(screen.getByText("Inner"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("sets body overflow to hidden when open", () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("renders a Close button with aria-label", () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the Close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <p>Content</p>
      </Dialog>,
    );
    await user.click(screen.getByLabelText("Close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
