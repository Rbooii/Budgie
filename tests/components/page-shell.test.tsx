import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { PageShell } from "@/components/page-shell";

function renderShell(children: React.ReactNode) {
  return render(<ThemeProvider>{children}</ThemeProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PageShell", () => {
  it("renders the sidebar and the children", () => {
    renderShell(
      <PageShell>
        <h1>Page content</h1>
      </PageShell>,
    );
    expect(screen.getByText("Budgie")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders nested children", () => {
    renderShell(
      <PageShell>
        <div>
          <span>nested</span>
        </div>
      </PageShell>,
    );
    expect(screen.getByText("nested")).toBeInTheDocument();
  });

  it("renders the sidebar even without children", () => {
    renderShell(<PageShell>{null}</PageShell>);
    expect(screen.getByText("Budgie")).toBeInTheDocument();
  });
});
