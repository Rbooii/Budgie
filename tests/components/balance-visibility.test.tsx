import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function importComponents() {
  const mod = await import("@/components/balance-visibility");
  return mod;
}

function makeProbe(mod: Awaited<ReturnType<typeof importComponents>>) {
  return function ProbeComponent() {
    const { hidden, toggle, toggleCount } = mod.useBalanceVisibility();
    return (
      <div>
        <span data-testid="hidden">{String(hidden)}</span>
        <span data-testid="toggleCount">{toggleCount}</span>
        <button data-testid="toggleBtn" onClick={toggle}>
          Toggle
        </button>
        <mod.MaskedBalance value={1500000} />
      </div>
    );
  };
}

describe("BalanceVisibilityProvider", () => {
  it("defaults to hidden = true on first render", async () => {
    const mod = await importComponents();
    const Probe = makeProbe(mod);
    render(
      <mod.BalanceVisibilityProvider>
        <Probe />
      </mod.BalanceVisibilityProvider>,
    );
    expect(screen.getByTestId("hidden").textContent).toBe("true");
  });

  it("toggles the hidden value when the toggle button is clicked", async () => {
    const mod = await importComponents();
    const Probe = makeProbe(mod);
    const user = userEvent.setup();
    render(
      <mod.BalanceVisibilityProvider>
        <Probe />
      </mod.BalanceVisibilityProvider>,
    );
    expect(screen.getByTestId("hidden").textContent).toBe("true");
    await user.click(screen.getByTestId("toggleBtn"));
    expect(screen.getByTestId("hidden").textContent).toBe("false");
  });

  it("increments toggleCount on each toggle", async () => {
    const mod = await importComponents();
    const Probe = makeProbe(mod);
    const user = userEvent.setup();
    render(
      <mod.BalanceVisibilityProvider>
        <Probe />
      </mod.BalanceVisibilityProvider>,
    );
    expect(screen.getByTestId("toggleCount").textContent).toBe("0");
    await user.click(screen.getByTestId("toggleBtn"));
    expect(screen.getByTestId("toggleCount").textContent).toBe("1");
    await user.click(screen.getByTestId("toggleBtn"));
    expect(screen.getByTestId("toggleCount").textContent).toBe("2");
  });

  it("persists the hidden state to localStorage", async () => {
    const mod = await importComponents();
    const Probe = makeProbe(mod);
    const user = userEvent.setup();
    render(
      <mod.BalanceVisibilityProvider>
        <Probe />
      </mod.BalanceVisibilityProvider>,
    );
    await user.click(screen.getByTestId("toggleBtn"));
    expect(localStorage.getItem("budgie:hideBalance")).toBe("false");
  });
});

describe("MaskedBalance", () => {
  it("renders bullet characters when hidden (default)", async () => {
    const mod = await importComponents();
    const { container } = render(
      <mod.BalanceVisibilityProvider>
        <mod.MaskedBalance value={1500000} />
      </mod.BalanceVisibilityProvider>,
    );
    expect(container.textContent).toContain("•");
  });

  it("renders a long mask when mask='long'", async () => {
    const mod = await importComponents();
    const { container } = render(
      <mod.BalanceVisibilityProvider>
        <mod.MaskedBalance value={1000} mask="long" />
      </mod.BalanceVisibilityProvider>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("•");
    expect((text.match(/•/g) ?? []).length).toBeGreaterThanOrEqual(6);
  });

  it("renders a short mask when mask='short'", async () => {
    const mod = await importComponents();
    const { container } = render(
      <mod.BalanceVisibilityProvider>
        <mod.MaskedBalance value={1000} mask="short" />
      </mod.BalanceVisibilityProvider>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("•");
  });

  it("renders the formatted value when toggled to visible", async () => {
    const mod = await importComponents();
    const Probe = makeProbe(mod);
    const user = userEvent.setup();
    const { container } = render(
      <mod.BalanceVisibilityProvider>
        <Probe />
      </mod.BalanceVisibilityProvider>,
    );
    await user.click(screen.getByTestId("toggleBtn"));
    expect(container.textContent).toContain("1.500.000");
  });
});
