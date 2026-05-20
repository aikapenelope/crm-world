import { z } from 'zod'

export const createCircularSchema = z.object({
  building_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.enum(['general', 'maintenance', 'security', 'assembly', 'payment', 'rules', 'emergency']),
  priority: z.enum(['normal', 'important', 'urgent']),
  expires_at: z.string().optional().nullable(),
  send_whatsapp: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'expired']).default('draft'),
})

export const updateCircularSchema = createCircularSchema.partial()

export const createVoteSchema = z.object({
  building_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  vote_type: z.enum(['yes_no', 'multiple_choice', 'ranking']),
  options: z.array(z.string()).min(2),
  requires_quorum: z.boolean().default(true),
  quorum_percent: z.string().default('50.00'),
  opens_at: z.string(),
  closes_at: z.string(),
  status: z.enum(['draft', 'open', 'closed', 'cancelled']).default('draft'),
})

export const updateVoteSchema = createVoteSchema.partial()

export const castVoteSchema = z.object({
  vote_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  choice: z.string().min(1),
})

export const createAssemblySchema = z.object({
  building_id: z.string().uuid(),
  assembly_type: z.enum(['ordinary', 'extraordinary']),
  title: z.string().min(1).max(255),
  date: z.string(),
  start_time: z.string().max(10).optional().nullable(),
  end_time: z.string().max(10).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  quorum_present: z.string().optional().nullable(),
  attendees_count: z.coerce.number().min(0).default(0),
  agenda: z.array(z.string()).optional().nullable(),
  minutes: z.string().optional().nullable(),
  decisions: z.array(z.string()).optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
})

export const updateAssemblySchema = createAssemblySchema.partial()

export type CreateCircularInput = z.infer<typeof createCircularSchema>
export type CreateVoteInput = z.infer<typeof createVoteSchema>
export type CastVoteInput = z.infer<typeof castVoteSchema>
export type CreateAssemblyInput = z.infer<typeof createAssemblySchema>
