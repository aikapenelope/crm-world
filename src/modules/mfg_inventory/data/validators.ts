import { z } from 'zod'

export const warehouseLocationCreateSchema = z.object({
  code:               z.string().min(1).max(30),
  name:               z.string().min(1).max(255),
  warehouse_type:     z.enum(['raw_material', 'packaging', 'wip', 'finished_goods', 'spare_parts', 'quarantine', 'rejected']).default('raw_material'),
  storage_conditions: z.enum(['ambient', 'refrigerated', 'frozen', 'controlled_humidity']).default('ambient'),
  capacity_kg:        z.string().optional().nullable(),
  is_active:          z.boolean().default(true),
  notes:              z.string().optional().nullable(),
})
export const warehouseLocationUpdateSchema = warehouseLocationCreateSchema.partial()

export const stockLotCreateSchema = z.object({
  material_id:           z.string().uuid(),
  material_code:         z.string().min(1).max(100),
  material_name:         z.string().min(1).max(255),
  material_type:         z.enum(['raw_material', 'packaging', 'wip', 'finished_goods']).default('raw_material'),
  lot_number:            z.string().min(1).max(50),
  supplier_lot_number:   z.string().max(100).optional().nullable(),
  location_id:           z.string().uuid().optional().nullable(),
  quantity:              z.string(),
  uom:                   z.string().max(20),
  unit_cost_usd:         z.string().optional().nullable(),
  status:                z.enum(['quarantine', 'available', 'reserved', 'consumed', 'expired', 'rejected']).default('quarantine'),
  expiry_date:           z.coerce.date().optional().nullable(),
  entry_date:            z.coerce.date(),
  qc_inspection_id:      z.string().uuid().optional().nullable(),
  production_order_id:   z.string().uuid().optional().nullable(),
  notes:                 z.string().optional().nullable(),
})
export const stockLotUpdateSchema = stockLotCreateSchema.partial()

export const stockMovementCreateSchema = z.object({
  lot_id:          z.string().uuid(),
  movement_type:   z.enum(['GR_purchase', 'GR_production', 'GI_production', 'GI_scrap', 'transfer', 'adjustment', 'count_adjustment', 'quarantine_hold', 'quarantine_release', 'expired_writeoff']),
  quantity:        z.string(),
  from_location_id: z.string().uuid().optional().nullable(),
  to_location_id:  z.string().uuid().optional().nullable(),
  reference_type:  z.enum(['production_order', 'purchase_order', 'quality_inspection', 'cycle_count', 'manual']).optional().nullable(),
  reference_id:    z.string().uuid().optional().nullable(),
  reason:          z.string().optional().nullable(),
})

export const cycleCountCreateSchema = z.object({
  count_number:         z.string().min(1).max(50),
  location_id:          z.string().uuid().optional().nullable(),
  material_type_filter: z.string().optional().nullable(),
  scheduled_date:       z.coerce.date(),
  status:               z.enum(['planned', 'in_progress', 'pending_approval', 'approved', 'cancelled']).default('planned'),
  notes:                z.string().optional().nullable(),
})
export const cycleCountUpdateSchema = cycleCountCreateSchema.partial()
