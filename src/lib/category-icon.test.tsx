import { describe, it, expect } from "vitest";
import {
  UtensilsCrossed,
  Home,
  Film,
  Car,
  ShoppingBag,
  Zap,
  HeartPulse,
  GraduationCap,
  Plane,
  MoreHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Gift,
  Briefcase,
  PiggyBank,
  RefreshCw,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { categoryIcon, TYPE_ICON } from "@/lib/category-icon";
import { ALL_CATEGORIES } from "@/lib/categories";

function iconType(icon: React.ReactElement): LucideIcon {
  return icon.type as LucideIcon;
}

function iconProps(icon: React.ReactElement): Record<string, unknown> {
  return (icon.props ?? {}) as Record<string, unknown>;
}

describe("categoryIcon", () => {
  it("maps every income category to its icon", () => {
    expect(iconType(categoryIcon("Salary"))).toBe(Briefcase);
    expect(iconType(categoryIcon("Bonus"))).toBe(Gift);
    expect(iconType(categoryIcon("Freelance"))).toBe(Briefcase);
    expect(iconType(categoryIcon("Investment"))).toBe(PiggyBank);
    expect(iconType(categoryIcon("Gift"))).toBe(Gift);
    expect(iconType(categoryIcon("Refund"))).toBe(RefreshCw);
    expect(iconType(categoryIcon("OtherIncome"))).toBe(MoreHorizontal);
  });

  it("maps every expense category to its icon", () => {
    expect(iconType(categoryIcon("FoodAndDrink"))).toBe(UtensilsCrossed);
    expect(iconType(categoryIcon("Rent"))).toBe(Home);
    expect(iconType(categoryIcon("Entertainment"))).toBe(Film);
    expect(iconType(categoryIcon("Transportation"))).toBe(Car);
    expect(iconType(categoryIcon("Shopping"))).toBe(ShoppingBag);
    expect(iconType(categoryIcon("Utilities"))).toBe(Zap);
    expect(iconType(categoryIcon("Healthcare"))).toBe(HeartPulse);
    expect(iconType(categoryIcon("Education"))).toBe(GraduationCap);
    expect(iconType(categoryIcon("Travel"))).toBe(Plane);
    expect(iconType(categoryIcon("OtherExpense"))).toBe(MoreHorizontal);
  });

  it("maps every transfer category to its icon", () => {
    expect(iconType(categoryIcon("AccountTransfer"))).toBe(ArrowLeftRight);
    expect(iconType(categoryIcon("Savings"))).toBe(PiggyBank);
    expect(iconType(categoryIcon("LoanPayment"))).toBe(CreditCard);
    expect(iconType(categoryIcon("OtherTransfer"))).toBe(MoreHorizontal);
  });

  it("has a non-fallback icon for every premade category (except the 'Other' catch-alls)", () => {
    const fallback = MoreHorizontal;
    const intentionalFallbacks = ["OtherIncome", "OtherExpense", "OtherTransfer"];
    for (const c of ALL_CATEGORIES) {
      if (intentionalFallbacks.includes(c)) continue;
      expect(iconType(categoryIcon(c))).not.toBe(fallback);
    }
  });

  it("maps the 'Other' catch-all categories to MoreHorizontal on purpose", () => {
    expect(iconType(categoryIcon("OtherIncome"))).toBe(MoreHorizontal);
    expect(iconType(categoryIcon("OtherExpense"))).toBe(MoreHorizontal);
    expect(iconType(categoryIcon("OtherTransfer"))).toBe(MoreHorizontal);
  });

  it("falls back to MoreHorizontal for an unknown category", () => {
    expect(iconType(categoryIcon("UnknownCategory"))).toBe(MoreHorizontal);
    expect(iconType(categoryIcon(""))).toBe(MoreHorizontal);
  });

  it("passes the className through to the rendered icon", () => {
    const props = iconProps(categoryIcon("Salary", "w-5 h-5 text-red-500"));
    expect(props.className).toBe("w-5 h-5 text-red-500");
  });

  it("renders without a className when omitted", () => {
    const props = iconProps(categoryIcon("Salary"));
    expect(props.className).toBeUndefined();
  });
});

describe("TYPE_ICON", () => {
  it("maps income to ArrowDownLeft", () => {
    expect(TYPE_ICON.income).toBe(ArrowDownLeft);
  });

  it("maps expense to ArrowUpRight", () => {
    expect(TYPE_ICON.expense).toBe(ArrowUpRight);
  });

  it("maps transfer to ArrowLeftRight", () => {
    expect(TYPE_ICON.transfer).toBe(ArrowLeftRight);
  });

  it("has exactly the three transaction-type keys", () => {
    expect(Object.keys(TYPE_ICON).sort()).toEqual(["expense", "income", "transfer"]);
  });
});
