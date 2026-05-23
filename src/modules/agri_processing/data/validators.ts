import { z } from 'zod'

export const slaughterBatchCreateSchema = z.object({
  batch_number:           z.string().min(1).max(50),
  flock_id:               z.string().uuid(),
  farm_unit_id:           z.string().uuid().optional().nullable(),
  slaughter_date:         z.coerce.date(),
  birds_in:               z.number().int().positive(),
  live_weight_kg:         z.string(),
  birds_processed:        z.number().int().positive(),
  carcass_weight_hot_kg:  z.string().optional().nullable(),
  carcass_weight_cold_kg: z.string().optional().nullable(),
  yield_pct:              z.string().optional().nullable(),
  condemned_count:        z.number().int().nonnegative().default(0),
  condemned_reason:       z.string().optional().nullable(),
  microbiological_result: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  microbiological_notes:  z.string().optional().nullable(),
  status:                 z.enum(['receiving', 'processing', 'chilling', 'pending_qc', 'approved', 'dispatched']).default('receiving'),
  notes:                  z.string().optional().nullable(),
})
export const slaughterBatchUpdateSchema = slaughterBatchCreateSchema.partial()

const partUsedSchema = z.object({
  part: z.string(), percentage: z.number().optional(), include: z.boolean().optional(),
})
const additiveSchema = z.object({ name: z.string(), percentage: z.number().nonnegative() })

export const processingFormulaCreateSchema = z.object({
  name:                       z.string().min(1).max(255),
  product_type:               z.enum(['whole_carcass', 'cuts', 'processed', 'embutido']),
  parts_used:                 z.array(partUsedSchema).default([]),
  additives:                  z.array(additiveSchema).optional().nullable(),
  expected_yield_pct:         z.string(),
  processing_cost_per_kg_usd: z.string().optional().nullable(),
  shelf_life_days:            z.number().int().positive().optional().nullable(),
  storage_temp_min:           z.string().optional().nullable(),
  storage_temp_max:           z.string().optional().nullable(),
  is_active:                  z.boolean().default(true),
  notes:                      z.string().optional().nullable(),
})
export const processingFormulaUpdateSchema = processingFormulaCreateSchema.partial()

export const processingLotCreateSchema = z.object({
  lot_number:          z.string().min(1).max(50),
  slaughter_batch_id:  z.string().uuid(),
  formula_id:          z.string().uuid(),
  processing_date:     z.coerce.date(),
  quantity_kg:         z.string(),
  unit_count:          z.number().int().positive().optional().nullable(),
  package_weight_g:    z.number().int().positive().optional().nullable(),
  barcode:             z.string().max(100).optional().nullable(),
  expiry_date:         z.coerce.date().optional().nullable(),
  status:              z.enum(['in_stock', 'partially_dispatched', 'fully_dispatched', 'recalled']).default('in_stock'),
  cold_storage_unit_id: z.string().uuid().optional().nullable(),
  notes:               z.string().optional().nullable(),
})
export const processingLotUpdateSchema = processingLotCreateSchema.partial()
