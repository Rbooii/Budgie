import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { stubMatchMedia } from "@/test-utils/browser-mocks";
import {
  ThemeProvider,
  ThemeScript,
  useTheme,
} from "@/components/theme-provider";
import { ThemePicker } from "@/components/theme-picker";

function Probe() {
  const { theme, resolved } = useTheme();
  return (
    <span data-testid="probe">
      {theme}:{resolved}
    </span>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("defaults to system and follows the OS preference", async () => {
    const media = stubMatchMedia(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("probe")).toHaveTextContent("system:dark"),
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => media.change(false));
    await waitFor(() =>
      expect(screen.getByTestId("probe")).toHaveTextContent("system:light"),
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("restores a stored theme and pins it against OS changes", async () => {
    window.localStorage.setItem("budgie.theme", "dark");
    const media = stubMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("probe")).toHaveTextContent("dark:dark"),
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => media.change(true));
    expect(screen.getByTestId("probe")).toHaveTextContent("dark:dark");
  });
});

describe("ThemePicker", () => {
  it("renders System / Light / Dark with the stored choice checked", async () => {
    stubMatchMedia(false);
    window.localStorage.setItem("budgie.theme", "light");

    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /light/i })).toBeChecked(),
    );
    expect(screen.getByRole("radio", { name: /system/i })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /dark/i })).not.toBeChecked();
  });

  it("pins the chosen theme, persists it, and applies the class", async () => {
    stubMatchMedia(false);
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );

    await userEvent.click(screen.getByRole("radio", { name: /dark/i }));

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );
    expect(window.localStorage.getItem("budgie.theme")).toBe("dark");
    expect(screen.getByRole("radio", { name: /dark/i })).toBeChecked();
  });
});

describe("ThemeScript", () => {
  it("inlines the no-flash bootstrap for the storage key and OS query", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("budgie.theme");
    expect(script?.innerHTML).toContain("prefers-color-scheme: dark");
  });
});
