import { z } from 'zod'

export const saleOrderCreateSchema = z.object({
  order_number:            z.string().min(1).max(50),
  customer_id:             z.string().uuid().optional().nullable(),
  customer_name:           z.string().min(1).max(255),
  customer_rif:            z.string().max(20).optional().nullable(),
  status:                  z.enum(['draft', 'confirmed', 'in_preparation', 'dispatched', 'invoiced', 'cancelled']).default('draft'),
  currency:                z.string().max(10).default('USD'),
  subtotal_usd:            z.string().default('0.00'),
  iva_pct:                 z.string().default('16.00'),
  igtf_pct:                z.string().optional().nullable(),
  iva_amount_usd:          z.string().default('0.00'),
  igtf_amount_usd:         z.string().default('0.00'),
  total_usd:               z.string().default('0.00'),
  payment_method:          z.string().max(30).optional().nullable(),
  scheduled_dispatch_date: z.coerce.date().optional().nullable(),
  delivery_address:        z.string().optional().nullable(),
  requires_temperature_control: z.boolean().default(false),
  requires_coa:            z.boolean().default(false),
  notes:                   z.string().optional().nullable(),
})
export const saleOrderUpdateSchema = saleOrderCreateSchema.partial()

export const saleOrderLineCreateSchema = z.object({
  sale_order_id:      z.string().uuid(),
  line_number:        z.number().int().positive(),
  product_id:         z.string().uuid(),
  product_code:       z.string().min(1).max(100),
  product_name:       z.string().min(1).max(255),
  quantity:           z.string(),
  uom:                z.string().max(20),
  unit_price_usd:     z.string(),
  total_price_usd:    z.string(),
  lot_id:             z.string().uuid().optional().nullable(),
  lot_number:         z.string().max(50).optional().nullable(),
  production_order_id: z.string().uuid().optional().nullable(),
})
export const saleOrderLineUpdateSchema = saleOrderLineCreateSchema.partial()

export const dispatchOrderCreateSchema = z.object({
  dispatch_number:   z.string().min(1).max(50),
  sale_order_id:     z.string().uuid(),
  sale_order_number: z.string().min(1).max(50),
  customer_name:     z.string().min(1).max(255),
  status:            z.enum(['draft', 'loading', 'in_transit', 'delivered', 'returned']).default('draft'),
  carrier_name:      z.string().max(255).optional().nullable(),
  vehicle_plate:     z.string().max(20).optional().nullable(),
  driver_name:       z.string().max(255).optional().nullable(),
  requires_temperature_control: z.boolean().default(false),
  temperature_range: z.string().max(30).optional().nullable(),
  dispatch_date:     z.coerce.date().optional().nullable(),
  delivery_notes:    z.string().optional().nullable(),
})
export const dispatchOrderUpdateSchema = dispatchOrderCreateSchema.partial()

export const coaCreateSchema = z.object({
  coa_number:        z.string().min(1).max(50),
  lot_id:            z.string().uuid(),
  lot_number:        z.string().min(1).max(50),
  product_id:        z.string().uuid(),
  product_code:      z.string().min(1).max(100),
  product_name:      z.string().min(1).max(255),
  production_date:   z.coerce.date(),
  expiry_date:       z.coerce.date().optional().nullable(),
  quantity:          z.string(),
  uom:               z.string().max(20),
  dispatch_order_id: z.string().uuid().optional().nullable(),
  customer_name:     z.string().max(255).optional().nullable(),
  qa_results:        z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().nullable()),
  approved_by:       z.string().max(255).optional().nullable(),
  approved_at:       z.coerce.date().optional().nullable(),
  is_released:       z.boolean().default(false),
})
export const coaUpdateSchema = coaCreateSchema.partial()
