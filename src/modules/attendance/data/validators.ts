import { z } from 'zod'

export const createRecordSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused', 'half_day']),
  excuse_reason: z.string().optional().nullable(),
  excuse_attachment_id: z.string().uuid().optional().nullable(),
})

export const updateRecordSchema = createRecordSchema.partial().omit({ student_id: true, date: true })

export const bulkRecordSchema = z.object({
  date: z.string(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'excused', 'half_day']),
    excuse_reason: z.string().optional().nullable(),
  })),
})
