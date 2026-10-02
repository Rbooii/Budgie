import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>bank</Badge>);
    expect(screen.getByText("bank")).toBeInTheDocument();
  });

  it("applies the default variant class", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default").className.includes("bg-white"));
  });

  it("applies the success variant class", () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText("Active").className.includes("bg-brand"));
  });

  it("applies the soft variant class", () => {
    render(<Badge variant="soft">Soft</Badge>);
    expect(screen.getByText("Soft").className.includes("bg-income-tint"));
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">X</Badge>);
    expect(screen.getByText("X").className.includes("custom-class"));
  });
});
