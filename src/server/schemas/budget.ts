import { z } from "zod";
import {
  BudgetUncheckedCreateInputObjectZodSchema,
  BudgetUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const CreateBudgetSchema = BudgetUncheckedCreateInputObjectZodSchema.pick({
  title: true,
  amount: true,
  category: true,
}).extend({
  category: z.enum(EXPENSE_CATEGORIES),
});

export const UpdateBudgetSchema = BudgetUncheckedUpdateInputObjectZodSchema.pick({
  title: true,
  amount: true,
  category: true,
}).extend({
  title: z.string(),
  amount: z.number(),
  category: z.enum(EXPENSE_CATEGORIES),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;