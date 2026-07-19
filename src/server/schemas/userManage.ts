import z from "zod";
import { UserUncheckedUpdateInputObjectZodSchema } from "./generated/schemas";

export const UpdatePlusSchema = UserUncheckedUpdateInputObjectZodSchema
    .pick({
        plus: true
    })
export type UpdatePlus = z.infer<typeof UpdatePlusSchema>;