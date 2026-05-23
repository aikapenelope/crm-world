import { z } from 'zod'

// =============================================================================
// AgriInputItem
// =============================================================================

export const inputItemCreateSchema = z.object({
  name:               z.string().min(1).max(255),
  input_type:         z.enum(['medication', 'vaccine', 'feed', 'agrochemical', 'material']),
  category:           z.string().max(100).optional().nullable(),
  unit:               z.enum(['doses', 'ml', 'liters', 'kg', 'g', 'units']).default('units'),
  insai_registry:     z.string().max(100).optional().nullable(),
  active_ingredient:  z.string().max(255).optional().nullable(),
  manufacturer:       z.string().max(255).optional().nullable(),
  lot_number:         z.string().max(100).optional().nullable(),
  expiry_date:        z.coerce.date().optional().nullable(),
  storage_temp_min:   z.string().optional().nullable(),
  storage_temp_max:   z.string().optional().nullable(),
  quantity_available: z.string().default('0.000'),
  min_stock:          z.string().default('0.000'),
  reorder_quantity:   z.string().default('0.000'),
  unit_cost_usd:      z.string().optional().nullable(),
  is_active:          z.boolean().default(true),
  notes:              z.string().optional().nullable(),
})

export const inputItemUpdateSchema = inputItemCreateSchema.partial()

// =============================================================================
// AgriInputMovement
// =============================================================================

export const inputMovementCreateSchema = z.object({
  input_item_id:   z.string().uuid(),
  movement_type:   z.enum(['purchase_in', 'consumption', 'adjustment', 'expiry_write_off', 'transfer']),
  quantity:        z.string(),
  reference_type:  z.enum(['vaccination_record', 'medication_record', 'purchase_order', 'manual']).optional().nullable(),
  reference_id:    z.string().uuid().optional().nullable(),
  unit_cost_usd:   z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
})

export const inputMovementUpdateSchema = inputMovementCreateSchema.partial()
