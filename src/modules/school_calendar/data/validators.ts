import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  event_type: z.enum(['class_day', 'holiday', 'exam_period', 'meeting', 'event', 'administrative', 'graduation']),
  start_date: z.string(),
  end_date: z.string(),
  applies_to_grades: z.array(z.string()).optional().nullable(),
  is_all_day: z.boolean().default(true),
})

export const updateEventSchema = createEventSchema.partial()
