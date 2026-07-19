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
import type { Category } from "@/lib/categories";
import type { ReactElement } from "react";

const MAP: Record<Category, LucideIcon> = {
  Salary: Briefcase,
  Bonus: Gift,
  Freelance: Briefcase,
  Investment: PiggyBank,
  Gift: Gift,
  Refund: RefreshCw,
  OtherIncome: MoreHorizontal,

  FoodAndDrink: UtensilsCrossed,
  Rent: Home,
  Entertainment: Film,
  Transportation: Car,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Travel: Plane,
  OtherExpense: MoreHorizontal,

  AccountTransfer: ArrowLeftRight,
  Savings: PiggyBank,
  LoanPayment: CreditCard,
  OtherTransfer: MoreHorizontal,
};

export function categoryIcon(
  category: string,
  className?: string,
): ReactElement {
  const Icon = (MAP as Record<string, LucideIcon>)[category] ?? MoreHorizontal;
  return <Icon className={className} />;
}

export const TYPE_ICON = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
} as const;
