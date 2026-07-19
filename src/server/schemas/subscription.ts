import { z } from "zod";
import {
  SubscriptionUncheckedCreateInputObjectZodSchema,
  SubscriptionUncheckedUpdateInputObjectZodSchema,
} from "@/server/schemas/generated/schemas/objects";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const CreateSubscriptionSchema =
  SubscriptionUncheckedCreateInputObjectZodSchema.pick({
    name: true,
    amount: true,
    currency: true,
    category: true,
    periodDays: true,
    startDate: true,
    active: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default("IDR"),
    category: z.enum(EXPENSE_CATEGORIES),
    periodDays: z.number().int().positive(),
    startDate: z.coerce.date(),
    active: z.boolean().default(true),
  });

export const UpdateSubscriptionSchema =
  SubscriptionUncheckedUpdateInputObjectZodSchema.pick({
    name: true,
    amount: true,
    currency: true,
    category: true,
    periodDays: true,
    startDate: true,
    active: true,
  }).extend({
    name: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string(),
    category: z.enum(EXPENSE_CATEGORIES),
    periodDays: z.number().int().positive(),
    startDate: z.coerce.date(),
    active: z.boolean(),
  });

export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;
