import { z } from 'zod'
export const shiftReportCreateSchema = z.object({
  report_number:        z.string().min(1).max(50),
  shift_type:           z.enum(['morning', 'afternoon', 'night']),
  shift_date:           z.coerce.date(),
  work_center_id:       z.string().uuid().optional().nullable(),
  work_center_name:     z.string().max(255).optional().nullable(),
  shift_start:          z.coerce.date(),
  shift_end:            z.coerce.date().optional().nullable(),
  planned_production:   z.string().default('0.0000'),
  actual_production:    z.string().default('0.0000'),
  rejected_units:       z.string().default('0.0000'),
  production_uom:       z.string().max(20).optional().nullable(),
  total_downtime_hrs:   z.string().default('0.0000'),
  electrical_downtime_hrs: z.string().default('0.0000'),
  internal_downtime_hrs:   z.string().default('0.0000'),
  oee_total_pct:        z.string().optional().nullable(),
  oee_internal_pct:     z.string().optional().nullable(),
  observations:         z.string().optional().nullable(),
})
export const shiftReportUpdateSchema = shiftReportCreateSchema.partial()
