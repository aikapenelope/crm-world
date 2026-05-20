import { z } from 'zod'

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(10),
  grade_levels: z.array(z.string()).optional().nullable(),
  is_qualitative: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
})
export const updateSubjectSchema = createSubjectSchema.partial()

export const createPeriodSchema = z.object({
  school_year: z.string().min(4).max(20),
  period_number: z.coerce.number().int().min(1).max(4),
  name: z.string().min(1).max(50),
  start_date: z.string(),
  end_date: z.string(),
  is_active: z.boolean().default(false),
})
export const updatePeriodSchema = createPeriodSchema.partial()

export const createGradeSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  period_id: z.string().uuid(),
  score: z.string().optional().nullable(),
  qualitative_score: z.string().max(5).optional().nullable(),
  observations: z.string().optional().nullable(),
})
export const updateGradeSchema = createGradeSchema.partial().omit({ student_id: true, subject_id: true, period_id: true })

export const createReportCardSchema = z.object({
  student_id: z.string().uuid(),
  period_id: z.string().uuid(),
  average_score: z.string().optional().nullable(),
  general_observations: z.string().optional().nullable(),
  teacher_name: z.string().max(100).optional().nullable(),
  status: z.enum(['draft', 'published', 'delivered']).default('draft'),
})
export const updateReportCardSchema = createReportCardSchema.partial().omit({ student_id: true, period_id: true })
