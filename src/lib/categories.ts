export type TransactionType = "income" | "expense" | "transfer";

export const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investment",
  "Gift",
  "Refund",
  "OtherIncome",
] as const;

export const EXPENSE_CATEGORIES = [
  "FoodAndDrink",
  "Rent",
  "Entertainment",
  "Transportation",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "OtherExpense",
] as const;

export const TRANSFER_CATEGORIES = [
  "AccountTransfer",
  "Savings",
  "LoanPayment",
  "OtherTransfer",
] as const;

export const CATEGORIES_BY_TYPE: Record<TransactionType, readonly string[]> = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
  transfer: TRANSFER_CATEGORIES,
};

export const ALL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
  ...TRANSFER_CATEGORIES,
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  Salary: "Salary",
  Bonus: "Bonus",
  Freelance: "Freelance",
  Investment: "Investment",
  Gift: "Gift",
  Refund: "Refund",
  OtherIncome: "Other Income",

  FoodAndDrink: "Food & Drink",
  Rent: "Rent",
  Entertainment: "Entertainment",
  Transportation: "Transportation",
  Shopping: "Shopping",
  Utilities: "Utilities",
  Healthcare: "Healthcare",
  Education: "Education",
  Travel: "Travel",
  OtherExpense: "Other Expense",

  AccountTransfer: "Account Transfer",
  Savings: "Savings",
  LoanPayment: "Loan Payment",
  OtherTransfer: "Other Transfer",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as Category] ?? category;
}
