import { z } from "zod";
import { UserUncheckedUpdateInputObjectZodSchema } from "@/server/schemas/generated/schemas/objects";

export const UpdateUserSchema = UserUncheckedUpdateInputObjectZodSchema.pick({
  plus: true,
}).extend({
  plus: z.boolean(),
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
