import { z } from 'zod'

export const createRequestSchema = z.object({
  building_id: z.string().uuid(),
  requested_by_unit_id: z.string().uuid().optional().nullable(),
  requested_by_name: z.string().min(1).max(255),
  requested_by_phone: z.string().max(50).optional().nullable(),
  category: z.enum(['plumbing', 'electrical', 'elevator', 'structural', 'cleaning', 'security', 'garden', 'pool', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'emergency']),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  location: z.string().max(255).optional().nullable(),
  status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'cancelled']).default('open'),
})

export const updateRequestSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: z.string().max(255).optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  estimated_cost: z.string().optional().nullable(),
  actual_cost: z.string().optional().nullable(),
  resolution_notes: z.string().max(2000).optional().nullable(),
}).passthrough()

export const createWorkOrderSchema = z.object({
  building_id: z.string().uuid(),
  request_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_name: z.string().min(1).max(255),
  description: z.string().min(1),
  scheduled_date: z.string().optional().nullable(),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).default('pending'),
  quoted_amount: z.string().optional().nullable(),
  approved_amount: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateWorkOrderSchema = createWorkOrderSchema.partial()

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  rif: z.string().max(20).optional().nullable(),
  specialty: z.enum(['plumbing', 'electrical', 'elevator', 'cleaning', 'security', 'garden', 'pool', 'general', 'other']),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
