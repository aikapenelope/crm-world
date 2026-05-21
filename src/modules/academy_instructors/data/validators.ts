import { z } from 'zod'

export const createInstructorSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  specialty: z.string().max(255).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  hourly_rate_usd: z.coerce.number().min(0).optional().nullable(),
  modalities: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().default(true),
}).passthrough()

export const updateInstructorSchema = createInstructorSchema.partial()
