import { z } from "zod";
import {
  TransactionUncheckedCreateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects/TransactionUncheckedCreateInput.schema";
import { ALL_CATEGORIES, CATEGORIES_BY_TYPE } from "@/lib/categories";
import { MAX_TRANSACTION_LIMIT } from "@/lib/limits";

export const ADMIN_FEE_BEARERS = ["source", "destination"] as const;

export const CreateTransactionSchema =
  TransactionUncheckedCreateInputObjectZodSchema.pick({
    name: true,
    amount: true,
    type: true,
    category: true,
    date: true,
    adminFee: true,
    adminFeeBearer: true,
    balanceAccountId: true,
    toBalanceAccountId: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number(),
    type: z.enum(["income", "expense", "transfer"]),
    category: z.enum(ALL_CATEGORIES),
    date: z.coerce.date(),
    adminFee: z.number().min(0).default(0),
    adminFeeBearer: z.enum(ADMIN_FEE_BEARERS).default("source"),
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
  ).refine(
    (v) => v.type === "transfer" || v.adminFeeBearer === "source",
    { message: "Admin fee bearer only applies to transfers" },
  ).refine(
    (v) =>
      v.type !== "transfer" ||
      v.adminFeeBearer !== "destination" ||
      v.adminFee <= v.amount,
    {
      message:
        "Admin fee cannot exceed the transfer amount when charged to the destination",
    },
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
