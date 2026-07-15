export type TransactionType = "income" | "expense" | "transfer";

export const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Freelance",
  "Investment",
  "Gift",
  "Refund",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Rent",
  "Entertainment",
  "Transportation",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other Expense",
] as const;

export const TRANSFER_CATEGORIES = [
  "Account Transfer",
  "Savings",
  "Loan Payment",
  "Other Transfer",
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
