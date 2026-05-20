import { z } from 'zod'

export const createRuleSchema = z.object({
  seller_id: z.string().uuid().optional().nullable(),
  type: z.enum(['sale', 'collection', 'goal_bonus']),
  rate: z.string().min(1),
  min_amount: z.string().default('0.00'),
  goal_amount: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  description: z.string().max(500).optional().nullable(),
})

export const updateRuleSchema = createRuleSchema.partial()

export const createRecordSchema = z.object({
  seller_id: z.string().uuid(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(['sale', 'collection', 'goal_bonus']),
  reference_type: z.string().max(30).optional().nullable(),
  reference_id: z.string().uuid().optional().nullable(),
  base_amount: z.string().min(1),
  rate_applied: z.string().min(1),
  commission_amount: z.string().min(1),
  status: z.enum(['pending', 'approved', 'paid']).default('pending'),
})

export const updateRecordSchema = z.object({
  status: z.enum(['pending', 'approved', 'paid']).optional(),
})

export const listRulesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  type: z.string().optional(),
}).passthrough()

export const listRecordsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  seller_id: z.string().uuid().optional(),
  period_month: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type CreateRecordInput = z.infer<typeof createRecordSchema>
