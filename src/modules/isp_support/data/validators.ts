import { z } from 'zod'

const TICKET_TYPES   = ['fault', 'inquiry', 'plan_change', 'move', 'new_service', 'complaint'] as const
const TICKET_STATUS  = ['open', 'assigned', 'in_progress', 'pending_client', 'resolved', 'closed'] as const
const TICKET_ORIGINS = ['manual', 'whatsapp', 'phone', 'portal', 'automatic_monitoring'] as const
const PRIORITIES     = ['low', 'normal', 'high', 'critical'] as const
const OUTAGE_CAUSES  = ['power_outage', 'fiber_cut', 'equipment_failure', 'maintenance', 'weather', 'theft', 'unknown'] as const

export const createTicketSchema = z.object({
  subscriber_id: z.string().uuid().nullable().optional(),
  node_id: z.string().uuid().nullable().optional(),
  outage_id: z.string().uuid().nullable().optional(),
  type: z.enum(TICKET_TYPES),
  origin: z.enum(TICKET_ORIGINS).default('manual'),
  priority: z.enum(PRIORITIES).default('normal'),
  subject: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  sla_hours: z.number().int().min(1).nullable().optional(),
})

export const updateTicketSchema = createTicketSchema.partial()

export const assignTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  technician_id: z.string().uuid(),
})

export const resolveTicketSchema = z.object({
  ticket_id: z.string().uuid(),
  solution: z.string().min(1),
})

export const addCommentSchema = z.object({
  ticket_id: z.string().uuid(),
  comment: z.string().min(1),
  is_internal: z.boolean().default(true),
})

export const createOutageSchema = z.object({
  node_id: z.string().uuid(),
  cause: z.enum(OUTAGE_CAUSES),
  affected_subscribers: z.number().int().min(0).default(0),
})

export const resolveOutageSchema = z.object({
  outage_id: z.string().uuid(),
  resolution_notes: z.string().min(1),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
