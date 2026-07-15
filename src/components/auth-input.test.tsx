import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthInput } from "@/components/auth-input";

describe("AuthInput", () => {
  it("renders an input element", () => {
    render(<AuthInput type="email" placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
  });

  it("passes type attribute to the input", () => {
    render(<AuthInput type="password" placeholder="pw" />);
    expect(screen.getByPlaceholderText("pw")).toHaveAttribute("type", "password");
  });

  it("fires onChange with the entered value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AuthInput type="text" placeholder="name" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("name"), "A");
    expect(onChange).toHaveBeenCalled();
  });

  it("merges custom className with the default classes", () => {
    render(<AuthInput type="text" placeholder="x" className="my-class" />);
    const input = screen.getByPlaceholderText("x");
    expect(input.className.includes("my-class")).true;
    expect(input.className.includes("rounded-[20px]")).true;
  });

  it("forwards the value prop", () => {
    render(<AuthInput type="text" placeholder="x" value="hello" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("x")).toHaveValue("hello");
  });

  it("is disabled when the disabled prop is set", () => {
    render(<AuthInput type="text" placeholder="x" disabled />);
    expect(screen.getByPlaceholderText("x")).toBeDisabled();
  });
});
