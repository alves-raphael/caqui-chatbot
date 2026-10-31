import { z } from 'zod';

export const clientIdSchema = z.enum(['C-0001', 'C-0002', 'C-0003', 'C-0007']);
export const modelSchema = z.enum(['luna', 'terra']);
export const sessionRequestSchema = z
  .object({
    role: z.enum(['client', 'agent']),
    clientId: clientIdSchema,
  })
  .strict();
export const sessionResponseSchema = sessionRequestSchema.extend({
  token: z.string(),
  expiresAt: z.number(),
});
export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1000),
    model: modelSchema.default('luna'),
  })
  .strict();
export const chatResponseSchema = z.object({
  text: z.string(),
  sources: z.array(z.string()),
  mode: z.enum(['model', 'fallback', 'rule']),
  model: z.string().nullable(),
  notice: z.string(),
  costUsd: z.number().nonnegative(),
  handoff: z.enum(['support', 'specialist']).optional(),
});
export const statusSchema = z.object({
  enabled: z.boolean(),
  localOnly: z.boolean(),
  reservedUsd: z.number(),
  actualUsd: z.number(),
  calls: z.number(),
  budgetUsd: z.number(),
});
export type DemoIdentity = z.infer<typeof sessionRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
