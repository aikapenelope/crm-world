import { z } from 'zod'
export const masterScheduleCreateSchema = z.object({
  schedule_number: z.string().min(1).max(50),
  week_start:      z.coerce.date(),
  week_end:        z.coerce.date(),
  product_id:      z.string().uuid(),
  product_code:    z.string().min(1).max(100),
  product_name:    z.string().min(1).max(255),
  work_center_id:  z.string().uuid().optional().nullable(),
  work_center_name: z.string().max(255).optional().nullable(),
  planned_quantity: z.string(),
  uom:             z.string().max(20),
  planned_start:   z.coerce.date().optional().nullable(),
  planned_end:     z.coerce.date().optional().nullable(),
  status:          z.enum(['planned', 'confirmed', 'in_progress', 'completed']).default('planned'),
  priority:        z.number().int().min(1).max(100).default(50),
  notes:           z.string().optional().nullable(),
})
export const masterScheduleUpdateSchema = masterScheduleCreateSchema.partial()

export const energyWindowCreateSchema = z.object({
  zone:             z.string().min(1).max(100),
  day_of_week:      z.number().int().min(0).max(6),
  hour_start:       z.number().int().min(0).max(23),
  hour_end:         z.number().int().min(0).max(23),
  restriction_type: z.enum(['restriction', 'reliable', 'unstable']).default('restriction'),
  reliability_pct:  z.string().default('80.00'),
  is_active:        z.boolean().default(true),
  valid_from:       z.coerce.date().optional().nullable(),
  valid_until:      z.coerce.date().optional().nullable(),
  notes:            z.string().optional().nullable(),
})
export const energyWindowUpdateSchema = energyWindowCreateSchema.partial()
