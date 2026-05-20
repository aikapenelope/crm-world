import { z } from 'zod'

export const createEstimateSchema = z.object({
  service_order_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  estimate_number: z.string().min(1).max(30),
  currency: z.string().max(10).default('USD'),
  valid_until: z.string().optional().nullable(),
})

export const updateEstimateSchema = z.object({
  status: z.enum(['draft', 'sent', 'partially_approved', 'approved', 'rejected', 'expired']).optional(),
  subtotal_labor: z.string().optional(),
  subtotal_parts: z.string().optional(),
  tax_amount: z.string().optional(),
  total_amount: z.string().optional(),
  customer_notes: z.string().max(2000).optional().nullable(),
})

export const createEstimateItemSchema = z.object({
  estimate_id: z.string().uuid(),
  type: z.enum(['labor', 'part']),
  description: z.string().min(1).max(255),
  quantity: z.coerce.number().min(1).default(1),
  unit_price: z.string().min(1),
  total_price: z.string().min(1),
  is_approved: z.boolean().default(false),
})

export const listEstimatesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  service_order_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>
