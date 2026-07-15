import { z } from "zod";
import {
  BalanceAccountUncheckedCreateInputObjectZodSchema,
  BalanceAccountUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";

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

export type CreateBalanceAccount = z.infer<typeof CreateBalanceAccountSchema>;
export type UpdateBalanceAccount = z.infer<typeof UpdateBalanceAccountSchema>;