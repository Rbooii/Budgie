import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SpendingStreamsChart } from "@/components/spending-streams-chart";

const data = [
  { category: "FoodAndDrink", spent: 300000 },
  { category: "Shopping", spent: 150000 },
  { category: "Rent", spent: 0 }, // filtered out
  { category: "Transportation", spent: 50000 },
];

const budgets = [
  { category: "FoodAndDrink", amount: 500000 },
  { category: "Shopping", amount: 100000 }, // over
];

describe("SpendingStreamsChart — empty state", () => {
  it("shows the empty state and Rp 0.00 when there is no spend", () => {
    render(<SpendingStreamsChart data={[]} budgets={[]} monthLabel="Aug 2026" />);
    expect(screen.getByText("Spending Streams")).toBeInTheDocument();
    expect(screen.getByText("Rp 0.00")).toBeInTheDocument();
    expect(
      screen.getByText(/No spending this month yet/),
    ).toBeInTheDocument();
  });

  it("renders the month label in the empty state", () => {
    render(
      <SpendingStreamsChart
        data={[]}
        budgets={[]}
        monthLabel="August 2026"
      />,
    );
    expect(screen.getByText("August 2026")).toBeInTheDocument();
  });

  it("treats all-zero data as empty", () => {
    render(
      <SpendingStreamsChart
        data={[
          { category: "FoodAndDrink", spent: 0 },
          { category: "Rent", spent: 0 },
        ]}
        budgets={[]}
        monthLabel="Aug 2026"
      />,
    );
    expect(screen.getByText(/No spending this month yet/)).toBeInTheDocument();
  });
});

describe("SpendingStreamsChart — rows", () => {
  it("shows the total spent as the sum of all rows with spend", () => {
    render(<SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />);
    expect(screen.getByText("Rp 500.000.00")).toBeInTheDocument();
  });

  it("sorts rows by spend descending", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const labels = Array.from(container.querySelectorAll(".w-24.shrink-0.truncate")).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(["Food & Drink", "Shopping", "Transportation"]);
  });

  it("excludes zero-spend categories from the rows", () => {
    render(<SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />);
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("shows the amount next to each category", () => {
    render(<SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />);
    expect(screen.getByText("Rp 300.000.00")).toBeInTheDocument();
    expect(screen.getByText("Rp 150.000.00")).toBeInTheDocument();
  });

  it("enforces a minimum bar width of 1.5%", () => {
    const { container } = render(
      <SpendingStreamsChart
        data={[
          { category: "FoodAndDrink", spent: 1 },
          { category: "Rent", spent: 1000000 },
        ]}
        budgets={[]}
        monthLabel="Aug 2026"
      />,
    );
    const bars = container.querySelectorAll(".h-3 > div.h-full");
    const widths = Array.from(bars).map((b) => (b as HTMLElement).style.width);
    expect(widths).toContain("1.5%");
  });
});

describe("SpendingStreamsChart — budget markers", () => {
  it("renders a budget marker only for categories that have a budget", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    expect(screen.getAllByLabelText("Budget limit")).toHaveLength(2);
    expect(container.querySelectorAll('[style*="left"]')).toHaveLength(2);
  });

  it("renders no markers when no budgets exist", () => {
    render(<SpendingStreamsChart data={data} budgets={[]} monthLabel="Aug 2026" />);
    expect(screen.queryAllByLabelText("Budget limit")).toHaveLength(0);
  });

  it("ignores budgets with zero amount", () => {
    render(
      <SpendingStreamsChart
        data={[{ category: "FoodAndDrink", spent: 100 }]}
        budgets={[{ category: "FoodAndDrink", amount: 0 }]}
        monthLabel="Aug 2026"
      />,
    );
    expect(screen.queryAllByLabelText("Budget limit")).toHaveLength(0);
  });

  it("clamps the marker position to 99.5% when the budget exceeds the chart max", () => {
    const { container } = render(
      <SpendingStreamsChart
        data={[{ category: "FoodAndDrink", spent: 100 }]}
        budgets={[{ category: "FoodAndDrink", amount: 1000000 }]}
        monthLabel="Aug 2026"
      />,
    );
    const marker = container.querySelector('[aria-label="Budget limit"]') as HTMLElement;
    expect(marker.style.left).toBe("99.5%");
  });

  it("colors a row red when spent exceeds its budget", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const bars = container.querySelectorAll(".h-3 > div.h-full");
    const classes = Array.from(bars).map((b) => b.className);
    expect(classes.some((c) => c.includes("bg-[#D8000C]"))).toBe(true);
    expect(classes.some((c) => c.includes("bg-[#FFBABA]"))).toBe(true);
  });
});

describe("SpendingStreamsChart — tooltip", () => {
  it("shows the tooltip on hover with amount and budget info", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const row = Array.from(container.querySelectorAll(".relative")).find((el) =>
      el.textContent?.includes("Food & Drink"),
    ) as HTMLElement;
    fireEvent.mouseEnter(row);
    expect(screen.getAllByText("Rp 300.000.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Budget Rp 500.000.00/)).toBeInTheDocument();
    expect(screen.getByText(/Rp 200.000.00 left/)).toBeInTheDocument();
  });

  it("shows 'over' in the tooltip when spent exceeds the budget", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const row = Array.from(container.querySelectorAll(".relative")).find((el) =>
      el.textContent?.includes("Shopping"),
    ) as HTMLElement;
    fireEvent.mouseEnter(row);
    expect(screen.getByText(/· over/)).toBeInTheDocument();
  });

  it("hides the tooltip on mouse leave", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const row = Array.from(container.querySelectorAll(".relative")).find((el) =>
      el.textContent?.includes("Food & Drink"),
    ) as HTMLElement;
    fireEvent.mouseEnter(row);
    fireEvent.mouseLeave(row);
    expect(screen.queryByText(/Budget Rp/)).not.toBeInTheDocument();
  });

  it("toggles the tooltip on click", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const row = Array.from(container.querySelectorAll(".relative")).find((el) =>
      el.textContent?.includes("Food & Drink"),
    ) as HTMLElement;
    fireEvent.click(row);
    expect(screen.getByText(/Budget Rp 500.000.00/)).toBeInTheDocument();
    fireEvent.click(row);
    expect(screen.queryByText(/Budget Rp 500.000.00/)).not.toBeInTheDocument();
  });

  it("shows the tooltip without budget info for categories without a budget", () => {
    const { container } = render(
      <SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />,
    );
    const row = Array.from(container.querySelectorAll(".relative")).find((el) =>
      el.textContent?.includes("Transportation"),
    ) as HTMLElement;
    fireEvent.mouseEnter(row);
    expect(screen.queryByText(/Budget Rp/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Rp 50.000.00").length).toBeGreaterThanOrEqual(2);
  });
});

describe("SpendingStreamsChart — legend", () => {
  it("renders the Spent, Over budget and Budget limit legend items", () => {
    render(<SpendingStreamsChart data={data} budgets={budgets} monthLabel="Aug 2026" />);
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("Over budget")).toBeInTheDocument();
    expect(screen.getByText("Budget limit")).toBeInTheDocument();
  });

  it("shows the legend even when there is no spend data", () => {
    render(<SpendingStreamsChart data={[]} budgets={[]} monthLabel="Aug 2026" />);
    expect(screen.queryByText("Spent")).not.toBeInTheDocument();
  });
});
