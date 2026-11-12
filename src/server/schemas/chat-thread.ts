import { z } from "zod";
import { MAX_THREAD_MESSAGES } from "@/lib/chat-history";

export const CreateChatThreadSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    model: z.string().trim().max(120).optional(),
  })
  .strict();

export const UpdateChatThreadSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    messages: z.array(z.unknown()).max(MAX_THREAD_MESSAGES).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.messages !== undefined, {
    message: "Nothing to update",
  });

export type CreateChatThread = z.infer<typeof CreateChatThreadSchema>;
export type UpdateChatThread = z.infer<typeof UpdateChatThreadSchema>;
