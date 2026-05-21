import { z } from 'zod'

const MODALITIES = ['in_person', 'online', 'hybrid'] as const

export const createCourseSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().min(1).max(100),
  level: z.string().min(1).max(50),
  duration_hours: z.coerce.number().min(1).max(9999),
  price_usd: z.coerce.number().min(0),
  currency: z.string().max(10).default('USD'),
  modality: z.enum(MODALITIES),
  max_students: z.coerce.number().int().min(1).max(1000).default(20),
  prerequisites: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
}).passthrough()

export const updateCourseSchema = createCourseSchema.partial()
