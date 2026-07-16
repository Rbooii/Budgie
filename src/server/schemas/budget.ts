import { z } from "zod";
import {
  BudgetUncheckedCreateInputObjectZodSchema,
  BudgetUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const CreateBudgetSchema = BudgetUncheckedCreateInputObjectZodSchema.pick({
  category: true,
  amount: true,
  periodDays: true,
}).extend({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(),
  periodDays: z.number().int().positive(),
});

export const UpdateBudgetSchema = BudgetUncheckedUpdateInputObjectZodSchema.pick({
  category: true,
  amount: true,
  periodDays: true,
}).extend({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(),
  periodDays: z.number().int().positive(),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;
