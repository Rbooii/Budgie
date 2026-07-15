import {z} from 'zod'
import { AccountCreateInputObjectZodSchema } from './generated/schemas'

export const createAccountSchema = AccountCreateInputObjectZodSchema;
export type CreateAccount = z.infer<typeof createAccountSchema>;