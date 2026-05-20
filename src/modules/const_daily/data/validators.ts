import { z } from 'zod'

export const createDailyReportSchema = z.object({
  project_id: z.string().uuid(),
  report_date: z.string(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'windy', 'foggy']).default('sunny'),
  temperature_high: z.coerce.number().optional().nullable(),
  temperature_low: z.coerce.number().optional().nullable(),
  work_hours: z.string().default('8.0'),
  status: z.enum(['draft', 'submitted', 'approved']).default('draft'),
  overall_notes: z.string().max(2000).optional().nullable(),
  safety_incidents: z.coerce.number().min(0).default(0),
  safety_notes: z.string().max(2000).optional().nullable(),
  submitted_by: z.string().max(255).optional().nullable(),
})

export const updateDailyReportSchema = createDailyReportSchema.partial()

export const createLaborSchema = z.object({
  report_id: z.string().uuid(),
  trade: z.string().min(1).max(100),
  headcount: z.coerce.number().min(1),
  hours_worked: z.string(),
  contractor_name: z.string().max(255).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const createActivitySchema = z.object({
  report_id: z.string().uuid(),
  task_id: z.string().uuid().optional().nullable(),
  area: z.string().min(1).max(255),
  description: z.string().min(1),
  quantity: z.string().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  percent_complete: z.string().optional().nullable(),
})
