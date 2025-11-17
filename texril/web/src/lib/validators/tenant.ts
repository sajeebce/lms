import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and dashes allowed"),
  planId: z.string().cuid(),
  primaryDomain: z
    .string()
    .optional()
    .refine((value) => !value || /^[a-z0-9.-]+$/i.test(value), "Invalid domain"),
  primaryEmail: z.string().email(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
