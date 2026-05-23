import { z } from 'zod'

// =============================================================================
// FeedFormula
// =============================================================================

const ingredientSchema = z.object({
  name:                z.string().min(1),
  percentage:          z.number().min(0).max(100),
  category:            z.enum(['grain', 'protein', 'mineral', 'additive', 'other']).default('other'),
  price_usd_per_ton:   z.number().nonnegative().nullable().optional(),
  price_ves_per_ton:   z.number().nonnegative().nullable().optional(),
})

export const feedFormulaCreateSchema = z.object({
  name:            z.string().min(1).max(255),
  formula_type:    z.enum(['starter', 'grower', 'finisher', 'layer', 'breeding', 'other']),
  species:         z.enum(['broiler', 'layer', 'turkey', 'swine', 'bovine', 'all']).default('broiler'),
  ingredients:     z.array(ingredientSchema).default([]),
  protein_pct:     z.string().optional().nullable(),
  energy_kcal_kg:  z.number().int().positive().optional().nullable(),
  lysine_pct:      z.string().optional().nullable(),
  moisture_pct:    z.string().optional().nullable(),
  cost_per_ton_usd: z.string().optional(),
  is_active:       z.boolean().default(true),
  notes:           z.string().optional().nullable(),
})

export const feedFormulaUpdateSchema = feedFormulaCreateSchema.partial()

// =============================================================================
// FeedBatch
// =============================================================================

const ingredientUsedSchema = z.object({
  ingredient:   z.string(),
  lot_number:   z.string().optional(),
  quantity_kg:  z.number().positive(),
  supplier:     z.string().optional(),
})

export const feedBatchCreateSchema = z.object({
  batch_number:         z.string().min(1).max(50),
  formula_id:           z.string().uuid(),
  batch_date:           z.coerce.date(),
  quantity_tons:        z.string(),
  source_type:          z.enum(['own_production', 'purchased']).default('purchased'),
  supplier_id:          z.string().uuid().optional().nullable(),
  supplier_invoice:     z.string().max(100).optional().nullable(),
  supplier_lot_number:  z.string().max(100).optional().nullable(),
  ingredients_used:     z.array(ingredientUsedSchema).optional().nullable(),
  protein_result_pct:   z.string().optional().nullable(),
  moisture_result_pct:  z.string().optional().nullable(),
  aflatoxin_ppb:        z.string().optional().nullable(),
  status:               z.enum(['pending_analysis', 'approved', 'rejected', 'consumed']).default('pending_analysis'),
  cost_per_ton_usd:     z.string().optional().nullable(),
  notes:                z.string().optional().nullable(),
})

export const feedBatchUpdateSchema = feedBatchCreateSchema.partial()

// =============================================================================
// FeedAllocation
// =============================================================================

export const feedAllocationCreateSchema = z.object({
  flock_id:       z.string().uuid(),
  feed_batch_id:  z.string().uuid(),
  allocated_date: z.coerce.date(),
  quantity_kg:    z.string(),
  notes:          z.string().optional().nullable(),
})

export const feedAllocationUpdateSchema = feedAllocationCreateSchema.partial()
