import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { PageShell } from "@/components/page-shell";

describe("PageShell", () => {
  it("renders the sidebar and the children", () => {
    render(
      <PageShell>
        <h1>Page content</h1>
      </PageShell>,
    );
    expect(screen.getByText("Budgie")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders nested children", () => {
    render(
      <PageShell>
        <div>
          <span>nested</span>
        </div>
      </PageShell>,
    );
    expect(screen.getByText("nested")).toBeInTheDocument();
  });

  it("renders the sidebar even without children", () => {
    render(<PageShell>{null}</PageShell>);
    expect(screen.getByText("Budgie")).toBeInTheDocument();
  });
});
