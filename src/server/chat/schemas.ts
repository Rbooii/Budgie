import { z } from "zod";
import {
  ALL_CATEGORIES,
  CATEGORIES_BY_TYPE,
  EXPENSE_CATEGORIES,
} from "@/lib/categories";

const dateOnly = (label: string) =>
  z.string().describe(`Inclusive ${label} date as YYYY-MM-DD`);

export const GetTransactionsToolSchema = z
  .object({
    type: z
      .enum(["income", "expense", "transfer"])
      .optional()
      .describe("Filter by transaction type"),
    category: z
      .enum(ALL_CATEGORIES)
      .optional()
      .describe("Filter by category (e.g. FoodAndDrink, Transport)"),
    query: z
      .string()
      .optional()
      .describe("Keyword to match against the transaction name or category label"),
    from: dateOnly("start").optional(),
    to: dateOnly("end").optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe("Maximum number of rows to return (default 10)"),
  })
  .strict();

export const GetCashflowTrendToolSchema = z
  .object({
    months: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe("Rolling window in months (default 6)"),
  })
  .strict();

export const GetSpendingBreakdownToolSchema = z
  .object({
    from: dateOnly("start").optional(),
    to: dateOnly("end").optional(),
    groupBy: z
      .enum(["category", "merchant"])
      .optional()
      .describe("Group expenses by category (default) or by transaction name"),
    limit: z.number().int().min(1).max(20).optional(),
  })
  .strict();

export const GetNetWorthHistoryToolSchema = z
  .object({
    months: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe("Rolling window in months (default 12)"),
  })
  .strict();

export const GetUpcomingBillsToolSchema = z
  .object({
    days: z
      .number()
      .int()
      .min(1)
      .max(90)
      .optional()
      .describe("Look-ahead window in days (default 30)"),
  })
  .strict();

export const GetLargestTransactionsToolSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]).optional(),
    from: dateOnly("start").optional(),
    to: dateOnly("end").optional(),
    limit: z.number().int().min(1).max(20).optional(),
  })
  .strict();

export const CreateBudgetToolSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES),
    amount: z.number().positive().describe("Budget limit in Rupiah"),
    periodDays: z
      .number()
      .int()
      .positive()
      .describe("Budget window: 1 daily, 7 weekly, 30 monthly, 365 yearly"),
  })
  .strict();

export const UpdateBudgetToolSchema = z
  .object({
    budgetId: z.string().min(1).describe("Id from get_budgets/get_budget_status"),
    amount: z.number().positive().optional(),
    periodDays: z.number().int().positive().optional(),
  })
  .strict()
  .refine((value) => value.amount !== undefined || value.periodDays !== undefined, {
    message: "Provide at least one field to update",
  });

export const CreateSubscriptionToolSchema = z
  .object({
    name: z.string().min(1),
    amount: z.number().positive().describe("Charge amount in Rupiah"),
    category: z.enum(EXPENSE_CATEGORIES),
    periodDays: z
      .number()
      .int()
      .positive()
      .describe("Billing cycle: 7 weekly, 30 monthly, 365 yearly"),
    startDate: dateOnly("start").optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const UpdateSubscriptionToolSchema = z
  .object({
    subscriptionId: z.string().min(1),
    name: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    periodDays: z.number().int().positive().optional(),
    startDate: dateOnly("start").optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== "subscriptionId"),
    { message: "Provide at least one field to update" },
  );

export const CreateTransactionToolSchema = z
  .object({
    name: z.string().min(1).describe("Short description, e.g. 'Lunch at Warung'"),
    amount: z
      .number()
      .positive()
      .describe("Amount in Rupiah without currency symbol or separators, e.g. 45000"),
    type: z.enum(["income", "expense", "transfer"]),
    category: z
      .enum(ALL_CATEGORIES)
      .describe("Must belong to the allowed categories for the given type"),
    date: z.string().optional().describe("ISO datetime or YYYY-MM-DD; defaults to now"),
    adminFee: z
      .number()
      .min(0)
      .optional()
      .describe("Transfer admin fee (default 0)"),
    adminFeeBearer: z
      .enum(["source", "destination"])
      .optional()
      .describe(
        'Which account bears the transfer admin fee: "source" (default) or "destination"',
      ),
    balanceAccountId: z
      .string()
      .min(1)
      .describe("Source account id — obtain it from get_balance_accounts"),
    toBalanceAccountId: z
      .string()
      .optional()
      .describe("Required when type is transfer — destination account id"),
  })
  .strict()
  .refine(
    (v) =>
      v.type !== "transfer" ||
      (!!v.toBalanceAccountId && v.toBalanceAccountId !== v.balanceAccountId),
    { message: "Transfers require a distinct destination account" },
  )
  .refine(
    (v) => CATEGORIES_BY_TYPE[v.type].includes(v.category),
    { message: "Category does not match the transaction type" },
  )
  .refine(
    (v) =>
      v.type !== "transfer" ||
      v.adminFeeBearer !== "destination" ||
      (v.adminFee ?? 0) <= v.amount,
    {
      message:
        "Admin fee cannot exceed the transfer amount when charged to the destination",
    },
  );

export type CreateTransactionToolInput = z.infer<typeof CreateTransactionToolSchema>;
