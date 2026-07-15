import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies the success variant class", () => {
    render(<Button variant="success">Save</Button>);
    expect(screen.getByRole("button").className.includes("bg-[#00C610]")).toBe(true);
  });

  it("applies the outline variant class", () => {
    render(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole("button").className.includes("border")).toBe(true);
  });

  it("applies size lg class", () => {
    render(<Button size="lg">Big</Button>);
    expect(screen.getByRole("button").className.includes("h-11")).toBe(true);
  });

  it("applies size md class", () => {
    render(<Button size="md">Med</Button>);
    expect(screen.getByRole("button").className.includes("text-sm")).toBe(true);
  });

  it("shows a spinner and is disabled when loading", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("is disabled when the disabled prop is true", () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies w-full when fullWidth is true", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole("button").className.includes("w-full")).toBe(true);
  });

  it("renders a leading icon when provided", () => {
    render(
      <Button leadingIcon={<span data-testid="lead">+</span>}>Add</Button>,
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
  });

  it("renders a trailing icon when provided", () => {
    render(
      <Button trailingIcon={<span data-testid="trail">→</span>}>Go</Button>,
    );
    expect(screen.getByTestId("trail")).toBeInTheDocument();
  });

  it("does not apply size class for icon variant", () => {
    render(<Button variant="icon">X</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className.includes("h-11")).toBe(false);
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
