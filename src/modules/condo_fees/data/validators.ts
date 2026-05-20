import { z } from 'zod'

// =============================================================================
// Fee Config validators
// =============================================================================

export const createFeeConfigSchema = z.object({
  building_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  fee_type: z.enum(['ordinary', 'extraordinary', 'special']),
  period_month: z.string().regex(/^\d{4}-\d{2}$/),
  base_amount: z.string(),
  currency: z.string().max(10).default('USD'),
  distribution_method: z.enum(['aliquot', 'equal', 'custom']),
  due_date: z.string(),
  late_fee_percent: z.string().default('0.00'),
  late_fee_days: z.coerce.number().min(0).default(15),
  approved_in_assembly: z.boolean().default(false),
  assembly_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'approved', 'generated', 'closed']).default('draft'),
})

export const updateFeeConfigSchema = createFeeConfigSchema.partial()

export const listFeeConfigsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

// =============================================================================
// Receipt validators
// =============================================================================

export const listReceiptsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  fee_config_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  status: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

export const generateReceiptsSchema = z.object({
  fee_config_id: z.string().uuid(),
})

export const payReceiptSchema = z.object({
  receipt_id: z.string().uuid(),
  paid_amount: z.string(),
  payment_method: z.string().max(50),
  payment_reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type CreateFeeConfigInput = z.infer<typeof createFeeConfigSchema>
export type PayReceiptInput = z.infer<typeof payReceiptSchema>
