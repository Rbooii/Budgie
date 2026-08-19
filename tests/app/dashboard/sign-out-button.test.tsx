import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signOutMock = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOutMock(...args),
  },
}));

import { SignOutButton } from "@/app/dashboard/sign-out-button";

beforeEach(() => {
  vi.clearAllMocks();
  signOutMock.mockResolvedValue({});
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true,
  });
});

describe("SignOutButton", () => {
  it("renders a button with 'Sign out' text", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls authClient.signOut when clicked", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
  });

  it("redirects to '/' after sign out", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => expect(window.location.href).toBe("/"));
  });
});
