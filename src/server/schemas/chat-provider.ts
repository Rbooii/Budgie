import { z } from "zod";

const providerFields = {
  baseUrl: z.string().trim().min(1).max(500),
  model: z.string().trim().min(1).max(200),
  label: z.string().trim().max(80).optional(),
};

export const SaveChatProviderSchema = z
  .object({
    ...providerFields,
    /** Empty/omitted while editing keeps the already stored key. */
    apiKey: z.string().trim().max(500).optional(),
  })
  .strict();

export const TestChatProviderSchema = z
  .object({
    ...providerFields,
    apiKey: z.string().trim().max(500).optional(),
  })
  .strict();

export type SaveChatProvider = z.infer<typeof SaveChatProviderSchema>;
export type TestChatProvider = z.infer<typeof TestChatProviderSchema>;
