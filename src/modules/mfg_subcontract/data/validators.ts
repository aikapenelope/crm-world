import { z } from 'zod'
export const subcontractOrderCreateSchema = z.object({
  order_number:        z.string().min(1).max(50),
  subcontractor_id:    z.string().uuid().optional().nullable(),
  subcontractor_name:  z.string().min(1).max(255),
  product_id:          z.string().uuid(),
  product_code:        z.string().min(1).max(100),
  product_name:        z.string().min(1).max(255),
  quantity_ordered:    z.string(),
  uom:                 z.string().max(20),
  price_per_unit_usd:  z.string(),
  status:              z.enum(['draft', 'materials_sent', 'in_production', 'completed', 'cancelled']).default('draft'),
  scheduled_delivery:  z.coerce.date().optional().nullable(),
  standard_scrap_pct:  z.string().default('0.00'),
  notes:               z.string().optional().nullable(),
})
export const subcontractOrderUpdateSchema = subcontractOrderCreateSchema.partial()
export const subcontractMaterialCreateSchema = z.object({
  subcontract_order_id: z.string().uuid(),
  material_id:          z.string().uuid(),
  material_code:        z.string().min(1).max(100),
  material_name:        z.string().min(1).max(255),
  quantity_sent:        z.string(),
  uom:                  z.string().max(20),
  unit_cost_usd:        z.string().optional().nullable(),
  quantity_expected_back: z.string().optional().nullable(),
  lot_id:               z.string().uuid().optional().nullable(),
  lot_number:           z.string().max(50).optional().nullable(),
  sent_date:            z.coerce.date().optional().nullable(),
})
export const subcontractMaterialUpdateSchema = subcontractMaterialCreateSchema.partial()
