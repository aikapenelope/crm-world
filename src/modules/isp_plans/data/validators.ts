import { z } from 'zod'

const TECHNOLOGIES = ['fiber', 'wireless', 'cable', 'dedicated'] as const
const SEGMENTS = ['residential', 'pyme', 'corporate', 'wholesale'] as const

export const createServicePlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  technology: z.enum(TECHNOLOGIES),
  download_mbps: z.number().int().min(1).max(100000),
  upload_mbps: z.number().int().min(1).max(100000),
  is_symmetric: z.boolean().default(false),
  monthly_price_usd: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  installation_fee_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
  target_segment: z.enum(SEGMENTS).default('residential'),
  radius_profile: z.string().max(100).nullable().optional(),
  olt_profile: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true),
  is_promotional: z.boolean().default(false),
  promotional_until: z.string().date().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
})

export const updateServicePlanSchema = createServicePlanSchema.partial()

export const createPlanAddonSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  monthly_price_usd: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  is_active: z.boolean().default(true),
})

export const updatePlanAddonSchema = createPlanAddonSchema.partial()

export type CreateServicePlanInput = z.infer<typeof createServicePlanSchema>
export type UpdateServicePlanInput = z.infer<typeof updateServicePlanSchema>
export type CreatePlanAddonInput = z.infer<typeof createPlanAddonSchema>
