import { z } from "zod";
import {
  TransactionUncheckedCreateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects/TransactionUncheckedCreateInput.schema";
import { ALL_CATEGORIES, CATEGORIES_BY_TYPE } from "@/lib/categories";
import { MAX_TRANSACTION_LIMIT } from "@/lib/limits";

export const CreateTransactionSchema =
  TransactionUncheckedCreateInputObjectZodSchema.pick({
    name: true,
    amount: true,
    type: true,
    category: true,
    date: true,
    adminFee: true,
    balanceAccountId: true,
    toBalanceAccountId: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number(),
    type: z.enum(["income", "expense", "transfer"]),
    category: z.enum(ALL_CATEGORIES),
    date: z.coerce.date(),
    adminFee: z.number().min(0).default(0),
    balanceAccountId: z.string().min(1),
    toBalanceAccountId: z.string().nullable().optional(),
  }).refine(
    (v) =>
      v.type !== "transfer" ||
      (!!v.toBalanceAccountId &&
        !!v.balanceAccountId &&
        v.toBalanceAccountId !== v.balanceAccountId),
    { message: "Transfer requires distinct source and destination accounts" },
  ).refine(
    (v) => CATEGORIES_BY_TYPE[v.type].includes(v.category),
    { message: "Invalid category for this transaction type" },
  );

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;

/**
 * Optional pagination for `GET /api/transactions`. Omitting both keeps the
 * legacy "return everything as a bare array" contract for existing clients.
 */
export const ListTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_TRANSACTION_LIMIT).optional(),
  cursor: z.string().min(1).optional(),
});

export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
