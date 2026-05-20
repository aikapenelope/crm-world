import { z } from 'zod'

export const createServiceOrderSchema = z.object({
  vehicle_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  order_number: z.string().min(1).max(30),
  km_at_entry: z.coerce.number().min(0).default(0),
  customer_complaint: z.string().max(2000).optional().nullable(),
  assigned_technician_id: z.string().uuid().optional().nullable(),
  estimated_completion: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  currency: z.string().max(10).default('USD'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateServiceOrderSchema = z.object({
  status: z.enum(['received', 'diagnosis', 'estimate_sent', 'approved', 'in_repair', 'quality_check', 'ready', 'delivered', 'cancelled']).optional(),
  diagnosis_notes: z.string().max(5000).optional().nullable(),
  assigned_technician_id: z.string().uuid().optional().nullable(),
  estimated_completion: z.string().optional().nullable(),
  actual_completion: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  total_labor: z.string().optional(),
  total_parts: z.string().optional(),
  total_amount: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
})

export const createOrderItemSchema = z.object({
  service_order_id: z.string().uuid(),
  type: z.enum(['labor', 'part']),
  description: z.string().min(1).max(255),
  quantity: z.coerce.number().min(1).default(1),
  unit_price: z.string().min(1),
  total_price: z.string().min(1),
  part_id: z.string().uuid().optional().nullable(),
  is_approved: z.boolean().default(true),
  technician_notes: z.string().max(500).optional().nullable(),
})

export const updateOrderItemSchema = createOrderItemSchema.partial()

export const listOrdersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  vehicle_id: z.string().uuid().optional(),
  priority: z.string().optional(),
}).passthrough()

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>
