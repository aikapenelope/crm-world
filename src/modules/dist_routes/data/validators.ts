import { z } from 'zod'

export const createRouteSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  zone: z.string().max(100).optional().nullable(),
  day_of_week: z.coerce.number().min(0).max(6).optional().nullable(),
  assigned_seller_id: z.string().uuid().optional().nullable(),
  assigned_driver_id: z.string().uuid().optional().nullable(),
  vehicle_plate: z.string().max(20).optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateRouteSchema = createRouteSchema.partial()

export const createStopSchema = z.object({
  route_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  sequence_order: z.coerce.number().min(0).default(0),
  address: z.string().max(500).optional().nullable(),
  contact_phone: z.string().max(30).optional().nullable(),
  delivery_notes: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateStopSchema = createStopSchema.partial()

export const createVisitSchema = z.object({
  route_id: z.string().uuid(),
  stop_id: z.string().uuid(),
  visit_date: z.string().min(1),
  status: z.enum(['planned', 'visited', 'skipped', 'order_taken', 'no_order']).default('planned'),
  order_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const updateVisitSchema = createVisitSchema.partial()

export const listRoutesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  day_of_week: z.coerce.number().optional(),
}).passthrough()

export type CreateRouteInput = z.infer<typeof createRouteSchema>
export type CreateStopInput = z.infer<typeof createStopSchema>
export type CreateVisitInput = z.infer<typeof createVisitSchema>
