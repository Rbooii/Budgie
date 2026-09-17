import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FindCard } from "@/components/landing/find-card";

describe("FindCard — the search panel", () => {
  it("shows the three most recent transactions by default", () => {
    render(<FindCard />);
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Move to Savings")).toBeInTheDocument();
    expect(screen.queryByText("Ride to Office")).not.toBeInTheDocument();
  });

  it("uses the ledger anatomy: caption row + summary footer", () => {
    render(<FindCard />);
    expect(screen.getByText("All transactions")).toBeInTheDocument();
    expect(screen.getByText("Filters as you type")).toBeInTheDocument();
    expect(screen.getByText("Showing")).toBeInTheDocument();
    expect(screen.getByText("3 of 4")).toBeInTheDocument();
  });

  it("filters live as the user types a name", () => {
    render(<FindCard />);
    const input = screen.getByRole("searchbox", { name: "Search transactions" });
    fireEvent.change(input, { target: { value: "salary" } });
    expect(screen.getByText("Monthly Salary")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
  });

  it("matches categories too", () => {
    render(<FindCard />);
    const input = screen.getByRole("searchbox", { name: "Search transactions" });
    fireEvent.change(input, { target: { value: "transport" } });
    expect(screen.getByText("Ride to Office")).toBeInTheDocument();
  });

  it("shows a quiet no-results message for a miss", () => {
    render(<FindCard />);
    const input = screen.getByRole("searchbox", { name: "Search transactions" });
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    expect(screen.getByText("0 of 0")).toBeInTheDocument();
  });

  it("clearing the query restores the recent list", () => {
    render(<FindCard />);
    const input = screen.getByRole("searchbox", { name: "Search transactions" });
    fireEvent.change(input, { target: { value: "salary" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });
});
