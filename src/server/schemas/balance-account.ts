import { z } from "zod";
import { BalanceAccountUncheckedCreateInputObjectZodSchema } from "@/server/schemas/generated/schemas/objects/BalanceAccountUncheckedCreateInput.schema";
import { BalanceAccountUncheckedUpdateInputObjectZodSchema } from "@/server/schemas/generated/schemas/objects/BalanceAccountUncheckedUpdateInput.schema";

export const CreateBalanceAccountSchema =
  BalanceAccountUncheckedCreateInputObjectZodSchema.pick({
    name: true,
    balance: true,
    currency: true,
    type: true,
  });

export const UpdateBalanceAccountSchema =
  BalanceAccountUncheckedUpdateInputObjectZodSchema.pick({
    name: true,
    balance: true,
    currency: true,
    type: true,
  }).extend({
    name: z.string(),
    balance: z.number(),
    currency: z.string(),
    type: z.string(),
  });

export const ReorderBalanceAccountsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type CreateBalanceAccount = z.infer<typeof CreateBalanceAccountSchema>;
export type UpdateBalanceAccount = z.infer<typeof UpdateBalanceAccountSchema>;
export type ReorderBalanceAccounts = z.infer<
  typeof ReorderBalanceAccountsSchema
>;