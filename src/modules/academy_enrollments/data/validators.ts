import { z } from 'zod'

export const createEnrollmentSchema = z.object({
  group_id: z.string().uuid(),
  student_name: z.string().min(2).max(255),
  student_email: z.string().email().max(255).optional().nullable(),
  student_phone: z.string().max(50).optional().nullable(),
  enrollment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  price_agreed: z.coerce.number().min(0),
  currency: z.string().max(10).default('USD'),
  status: z.enum(['pending_payment', 'active', 'completed', 'withdrawn', 'failed']).default('pending_payment'),
  notes: z.string().max(1000).optional().nullable(),
}).passthrough()

export const updateEnrollmentSchema = createEnrollmentSchema.partial()
