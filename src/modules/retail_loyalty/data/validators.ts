import { z } from 'zod'

export const createProgramSchema = z.object({
  name: z.string().min(1).max(100),
  points_per_usd: z.string().default('10.00'),
  points_currency: z.string().max(10).default('USD'),
  min_redemption_points: z.number().int().min(1).default(100),
  point_value_usd: z.string().default('0.0100'),
  expiration_days: z.number().int().min(1).nullable().optional(),
})

export const updateProgramSchema = createProgramSchema.partial()

export const createTierSchema = z.object({
  program_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  min_points_lifetime: z.number().int().min(0),
  discount_percent: z.string().default('0.00'),
  multiplier: z.string().default('1.00'),
  benefits: z.record(z.unknown()).nullable().optional(),
  sort_order: z.number().int().default(0),
})

export const listAccountsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  customer_id: z.string().uuid().optional(),
  tier_id: z.string().uuid().optional(),
}).passthrough()

export const earnPointsSchema = z.object({
  customer_id: z.string().uuid(),
  amount_usd: z.number().min(0.01),
  reference_type: z.enum(['sale', 'manual', 'campaign']).default('sale'),
  reference_id: z.string().uuid().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
})

export const redeemPointsSchema = z.object({
  customer_id: z.string().uuid(),
  points: z.number().int().min(1),
  reference_type: z.enum(['sale', 'manual']).default('sale'),
  reference_id: z.string().uuid().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
})

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['points_multiplier', 'bonus_points', 'discount', 'whatsapp_blast']),
  target_segment: z.enum(['all', 'tier', 'inactive', 'birthday', 'custom']).default('all'),
  target_tier_id: z.string().uuid().nullable().optional(),
  target_days_inactive: z.number().int().min(1).nullable().optional(),
  config: z.record(z.unknown()).nullable().optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().nullable().optional(),
})

export const listCampaignsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['draft', 'scheduled', 'active', 'completed', 'cancelled']).optional(),
}).passthrough()
