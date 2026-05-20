import { z } from 'zod'

// =============================================================================
// Stock Count validators
// =============================================================================

export const createCountSchema = z.object({
  branch_id: z.string().uuid(),
  count_type: z.enum(['full', 'partial', 'spot_check']).default('full'),
  planned_date: z.string().min(1),
  notes: z.string().max(500).nullable().optional(),
})

export const updateCountSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
  performed_by: z.string().uuid().optional(),
  approved_by: z.string().uuid().optional(),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    id: z.string().uuid(),
    counted_quantity: z.number().int().min(0),
    notes: z.string().max(200).nullable().optional(),
  })).optional(),
})

export const listCountSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  branch_id: z.string().uuid().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
}).passthrough()

// =============================================================================
// Rotation query validators
// =============================================================================

export const listRotationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  branch_id: z.string().uuid().optional(),
  period_month: z.string().optional(),
  is_dead_stock: z.coerce.boolean().optional(),
}).passthrough()
