import { z } from 'zod'

export const createOrderSchema = z.object({
  project_id: z.string().uuid(),
  supplier_name: z.string().min(1).max(255),
  supplier_rif: z.string().max(20).optional().nullable(),
  status: z.enum(['draft', 'sent', 'confirmed', 'partial_received', 'received', 'cancelled']).default('draft'),
  order_date: z.string(),
  expected_delivery: z.string().optional().nullable(),
  total_amount: z.string().default('0.00'),
  currency: z.string().max(10).default('USD'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateOrderSchema = createOrderSchema.partial()

export const createOrderLineSchema = z.object({
  order_id: z.string().uuid(),
  budget_item_id: z.string().uuid().optional().nullable(),
  material_name: z.string().min(1).max(500),
  unit: z.string().min(1).max(20),
  ordered_quantity: z.string(),
  unit_price: z.string(),
  total_price: z.string(),
})

export const receiveSchema = z.object({
  order_id: z.string().uuid(),
  items: z.array(z.object({
    line_id: z.string().uuid(),
    received_quantity: z.string(),
  })),
})
