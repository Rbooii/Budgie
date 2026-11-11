import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/api-client", () => ({
  api: {
    "balance-accounts": {
      reorder: { $post: vi.fn() },
      ":id": {
        $patch: vi.fn(),
        $delete: vi.fn(),
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/balance-visibility", () => ({
  MaskedBalance: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { AccountGrid } from "@/components/account-grid";

const ACCOUNTS = [
  {
    id: "acc-1",
    name: "BCA Checking",
    balance: 1500000,
    currency: "IDR",
    type: "bank",
  },
  {
    id: "acc-2",
    name: "Cash",
    balance: 250000,
    currency: "IDR",
    type: "cash",
  },
];

describe("AccountGrid", () => {
  it("renders every account with a drag handle", () => {
    render(
      <AccountGrid
        accounts={ACCOUNTS}
        accountSeries={{}}
        accountTodayChanges={{}}
      />,
    );

    expect(screen.getByText("BCA Checking")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Reorder account" }),
    ).toHaveLength(2);
  });
});
