import { z } from 'zod';

export const clientIdSchema = z.enum(['C-0001', 'C-0002', 'C-0003', 'C-0007']);
export const modelSchema = z.enum(['luna', 'terra']);
export const quickActionSchema = z.enum(['investments', 'redemption', 'documents', 'transfer']);
const operationIdSchema = z.string().regex(/^OP-\d+$/);
export const quickReplySchema = z.object({
  action: quickActionSchema,
  label: z.string().min(1).max(100),
  operationId: operationIdSchema.optional(),
});
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
    action: quickActionSchema.optional(),
    operationId: operationIdSchema.optional(),
    caseContext: z
      .object({
        protocol: z.string().max(80),
        messages: z
          .array(
            z
              .object({ role: z.enum(['user', 'assistant', 'human', 'system']), text: z.string().max(1000) })
              .strict(),
          )
          .max(12),
        research: z.array(z.string().max(1000)).max(5),
        pending: z.string().max(1000),
      })
      .strict()
      .optional(),
  })
  .strict();
export const chatResponseSchema = z.object({
  resolution: z.enum(['answered', 'clarification', 'handoff']).optional(),
  resolutionTopic: z
    .string()
    .regex(/^KB-\d{3}$/)
    .optional(),
  handoffReason: z
    .enum([
      'unverified_source',
      'missing_operation',
      'no_coverage',
      'security_risk',
      'human_requested',
      'no_progress_limit',
    ])
    .optional(),
  text: z.string(),
  sources: z.array(z.string()),
  mode: z.enum(['model', 'fallback', 'rule']),
  model: z.string().nullable(),
  notice: z.string(),
  costUsd: z.number().nonnegative(),
  handoff: z.enum(['support', 'specialist', 'security']).optional(),
  quickReplies: z.array(quickReplySchema).max(6).optional(),
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
export type QuickReply = z.infer<typeof quickReplySchema>;

export const flowStateSchema = z.enum(['bot', 'helpOptional', 'queued', 'human', 'closed']);
export const flowRequestSchema = z
  .object({
    event: z.enum(['queue', 'security', 'assume', 'close']),
    clientSession: z.string().max(64).optional(),
  })
  .strict();
export const availabilitySchema = z.object({
  calendarKnown: z.boolean(),
  holiday: z.string().nullable(),
  available: z.boolean(),
  nextWindow: z.string().nullable(),
  checkedAt: z.string(),
  timezone: z.literal('America/Sao_Paulo'),
  message: z.string(),
});
export const flowResponseSchema = z.object({ state: flowStateSchema, availability: availabilitySchema });
