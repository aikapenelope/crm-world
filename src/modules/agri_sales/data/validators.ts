import { z } from 'zod'

const saleItemSchema = z.object({
  lot_id:         z.string().uuid().optional(),
  lot_number:     z.string().optional(),
  product_name:   z.string(),
  quantity_kg:    z.number().positive(),
  unit_price_usd: z.number().positive(),
})

export const saleOrderCreateSchema = z.object({
  order_number:            z.string().min(1).max(50),
  customer_id:             z.string().uuid(),
  order_date:              z.coerce.date(),
  requested_delivery_date: z.coerce.date().optional().nullable(),
  items:                   z.array(saleItemSchema).min(1),
  subtotal_usd:            z.string(),
  discount_usd:            z.string().optional(),
  iva_rate:                z.string().optional(),
  iva_amount_ves:          z.string().optional().nullable(),
  bcv_rate:                z.string().optional().nullable(),
  total_usd:               z.string(),
  total_ves:               z.string().optional().nullable(),
  status:                  z.enum(['draft', 'confirmed', 'partially_dispatched', 'fully_dispatched', 'invoiced', 'paid', 'cancelled']).default('draft'),
  payment_terms:           z.string().max(50).optional().nullable(),
  required_transport_temp: z.string().max(30).optional().nullable(),
  notes:                   z.string().optional().nullable(),
})
export const saleOrderUpdateSchema = saleOrderCreateSchema.partial()

const dispatchItemSchema = z.object({
  lot_id:      z.string().uuid().optional(),
  lot_number:  z.string().optional(),
  quantity_kg: z.number().positive(),
})

export const saleDispatchCreateSchema = z.object({
  dispatch_number:  z.string().min(1).max(50),
  sale_order_id:    z.string().uuid(),
  dispatch_date:    z.coerce.date(),
  vehicle_plate:    z.string().max(20).optional().nullable(),
  driver_name:      z.string().max(255).optional().nullable(),
  loading_temp_c:   z.string().optional().nullable(),
  delivery_temp_c:  z.string().optional().nullable(),
  items:            z.array(dispatchItemSchema).min(1),
  total_weight_kg:  z.string(),
  status:           z.enum(['pending', 'in_transit', 'delivered', 'temperature_incident']).default('pending'),
  notes:            z.string().optional().nullable(),
})
export const saleDispatchUpdateSchema = saleDispatchCreateSchema.partial()

export const saleInvoiceCreateSchema = z.object({
  invoice_number:  z.string().min(1).max(30),
  control_number:  z.string().max(30).optional().nullable(),
  sale_order_id:   z.string().uuid(),
  customer_id:     z.string().uuid(),
  issue_date:      z.coerce.date(),
  due_date:        z.coerce.date(),
  subtotal_usd:    z.string(),
  iva_rate:        z.string().optional(),
  iva_amount_ves:  z.string().optional().nullable(),
  bcv_rate:        z.string().optional().nullable(),
  total_usd:       z.string(),
  igtf_amount_usd: z.string().optional(),
  status:          z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']).default('pending'),
  notes:           z.string().optional().nullable(),
})
export const saleInvoiceUpdateSchema = saleInvoiceCreateSchema.partial()
