import { z } from 'zod'

const WO_TYPES     = ['installation', 'repair', 'equipment_swap', 'uninstall', 'verification'] as const
const WO_STATUS    = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'] as const
const WO_PRIORITY  = ['low', 'normal', 'high', 'urgent'] as const
const TECH_STATUS  = ['available', 'on_route', 'on_site', 'off_duty'] as const

export const createTechnicianSchema = z.object({
  staff_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  phone: z.string().min(7).max(30),
  status: z.enum(TECH_STATUS).default('available'),
  coverage_zone: z.string().max(100).nullable().optional(),
  vehicle_plate: z.string().max(10).nullable().optional(),
  fuel_allowance_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  commission_per_install: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  notes: z.string().nullable().optional(),
})
export const updateTechnicianSchema = createTechnicianSchema.partial()

export const createWorkOrderSchema = z.object({
  type: z.enum(WO_TYPES),
  priority: z.enum(WO_PRIORITY).default('normal'),
  subscriber_id: z.string().uuid().nullable().optional(),
  ticket_id: z.string().uuid().nullable().optional(),
  technician_id: z.string().uuid().nullable().optional(),
  scheduled_date: z.string().date().nullable().optional(),
  scheduled_time: z.string().max(10).nullable().optional(),
  address: z.string().min(1),
  coordinates_lat: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  coordinates_lng: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  instructions: z.string().nullable().optional(),
  cpe_to_install_id: z.string().uuid().nullable().optional(),
})
export const updateWorkOrderSchema = createWorkOrderSchema.partial()

export const completeWorkOrderSchema = z.object({
  work_order_id: z.string().uuid(),
  completion_notes: z.string().min(1),
  km_traveled: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  cpe_installed_id: z.string().uuid().nullable().optional(),
})

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>
export type CreateWorkOrderInput  = z.infer<typeof createWorkOrderSchema>
