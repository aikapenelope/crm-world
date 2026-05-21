import { z } from 'zod'

const TIME_REGEX = /^\d{2}:\d{2}$/

export const createSessionSchema = z.object({
  group_id: z.string().uuid(),
  session_number: z.coerce.number().int().min(1),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(TIME_REGEX),
  end_time: z.string().regex(TIME_REGEX),
  topic: z.string().max(255).optional().nullable(),
  session_type: z.enum(['theory', 'practice', 'exam', 'orientation', 'makeup']).default('theory'),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  instructor_notes: z.string().max(2000).optional().nullable(),
}).passthrough()

export const updateSessionSchema = createSessionSchema.partial()
