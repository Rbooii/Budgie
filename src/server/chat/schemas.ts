import { z } from "zod";
import { ALL_CATEGORIES, CATEGORIES_BY_TYPE } from "@/lib/categories";

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
    from: z.string().optional().describe("Inclusive start date as YYYY-MM-DD"),
    to: z.string().optional().describe("Inclusive end date as YYYY-MM-DD"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe("Maximum number of rows to return (default 10)"),
  })
  .strict();

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
  );

export type CreateTransactionToolInput = z.infer<typeof CreateTransactionToolSchema>;