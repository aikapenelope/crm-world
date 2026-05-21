import { z } from 'zod'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const TIME_REGEX = /^\d{2}:\d{2}$/

export const createGroupSchema = z.object({
  group_code: z.string().min(1).max(100),
  course_id: z.string().uuid(),
  instructor_id: z.string().uuid().optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schedule_days: z.array(z.enum(DAYS)).min(1),
  schedule_time: z.string().regex(TIME_REGEX, 'Formato HH:MM'),
  session_duration_minutes: z.coerce.number().int().min(30).max(480).default(90),
  location: z.string().max(255).optional().nullable(),
  online_link: z.string().max(500).optional().nullable(),
  max_students: z.coerce.number().int().min(1).max(500).default(20),
  notes: z.string().max(1000).optional().nullable(),
}).passthrough()

export const updateGroupSchema = createGroupSchema.partial()

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
