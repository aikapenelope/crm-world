import { z } from 'zod'
export const costCenterCreateSchema = z.object({
  code: z.string().min(1).max(30), name: z.string().min(1).max(255),
  type: z.enum(['production', 'support', 'admin']).default('production'), is_active: z.boolean().default(true),
})
export const costCenterUpdateSchema = costCenterCreateSchema.partial()

export const standardCostCreateSchema = z.object({
  product_id: z.string().uuid(), product_code: z.string().min(1).max(100), product_name: z.string().min(1).max(255),
  uom: z.string().max(20), valid_from: z.coerce.date(), valid_until: z.coerce.date().optional().nullable(),
  status: z.enum(['draft', 'active', 'superseded']).default('draft'),
  raw_material_cost_usd: z.string().default('0'), local_material_cost_usd: z.string().default('0'),
  labor_cost_usd: z.string().default('0'), overhead_cost_usd: z.string().default('0'),
  total_standard_cost_usd: z.string().default('0'), bcv_rate_used: z.string().optional().nullable(), notes: z.string().optional().nullable(),
})
export const standardCostUpdateSchema = standardCostCreateSchema.partial()

export const costVarianceUpdateSchema = z.object({
  status: z.enum(['pending', 'calculated', 'approved']).optional(), notes: z.string().optional().nullable(),
})
