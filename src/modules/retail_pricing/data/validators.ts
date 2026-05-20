import { z } from 'zod'

export const createPricingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  category_id: z.string().uuid().nullable().optional(),
  min_margin_percent: z.string(),
  target_margin_percent: z.string().nullable().optional(),
  channel: z.enum(['store', 'online', 'wholesale']).nullable().optional(),
  max_regulated_price: z.string().nullable().optional(),
  currency: z.string().max(10).default('USD'),
  priority: z.number().int().default(0),
})

export const updatePricingRuleSchema = createPricingRuleSchema.partial()

export const listPricingRulesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  category_id: z.string().uuid().optional(),
  channel: z.enum(['store', 'online', 'wholesale']).optional(),
}).passthrough()

export const bulkUpdateSchema = z.object({
  update_type: z.enum(['exchange_rate', 'percentage', 'fixed']),
  old_exchange_rate: z.string().nullable().optional(),
  new_exchange_rate: z.string().nullable().optional(),
  percentage_change: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  channel: z.enum(['store', 'online', 'wholesale']).nullable().optional(),
})

export const listAlertsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  alert_type: z.enum(['below_cost', 'below_margin', 'above_regulated', 'exchange_rate_drift']).optional(),
  status: z.enum(['active', 'acknowledged', 'resolved']).optional(),
}).passthrough()

export const acknowledgeAlertSchema = z.object({
  alert_id: z.string().uuid(),
})
