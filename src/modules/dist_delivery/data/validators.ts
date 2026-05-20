import { z } from 'zod'

export const createDeliveryOrderSchema = z.object({
  route_id: z.string().uuid().optional().nullable(),
  driver_id: z.string().uuid().optional().nullable(),
  vehicle_plate: z.string().max(20).optional().nullable(),
  dispatch_date: z.string().min(1),
  status: z.enum(['preparing', 'dispatched', 'in_transit', 'completed', 'partial']).default('preparing'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateDeliveryOrderSchema = createDeliveryOrderSchema.partial()

export const createDeliveryItemSchema = z.object({
  delivery_order_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity_dispatched: z.coerce.number().min(1),
  quantity_delivered: z.coerce.number().min(0).default(0),
  quantity_returned: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'delivered', 'partial', 'returned', 'rejected']).default('pending'),
  delivery_notes: z.string().max(500).optional().nullable(),
})

export const updateDeliveryItemSchema = z.object({
  quantity_delivered: z.coerce.number().min(0).optional(),
  quantity_returned: z.coerce.number().min(0).optional(),
  status: z.enum(['pending', 'delivered', 'partial', 'returned', 'rejected']).optional(),
  delivery_notes: z.string().max(500).optional().nullable(),
})

export const listDeliveryOrdersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(),
  dispatch_date: z.string().optional(),
}).passthrough()

export type CreateDeliveryOrderInput = z.infer<typeof createDeliveryOrderSchema>
export type CreateDeliveryItemInput = z.infer<typeof createDeliveryItemSchema>
