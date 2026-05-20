import { z } from 'zod'

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  announcement_type: z.enum(['circular', 'notice', 'reminder', 'emergency']),
  target_audience: z.enum(['all', 'grade_specific', 'section_specific']).default('all'),
  target_grades: z.array(z.string()).optional().nullable(),
  target_sections: z.array(z.string()).optional().nullable(),
  expires_at: z.string().optional().nullable(),
})

export const updateAnnouncementSchema = createAnnouncementSchema.partial()
