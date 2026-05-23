import { z } from 'zod'
export const workerCreateSchema = z.object({
  employee_code:         z.string().min(1).max(30),
  full_name:             z.string().min(1).max(255),
  cedula:                z.string().max(15).optional().nullable(),
  work_center_id:        z.string().uuid().optional().nullable(),
  work_center_name:      z.string().max(255).optional().nullable(),
  shift_type:            z.enum(['morning', 'afternoon', 'night', 'rotating']).default('morning'),
  qualified_operations:  z.array(z.string()).optional().nullable(),
  is_active:             z.boolean().default(true),
  hire_date:             z.coerce.date().optional().nullable(),
  hourly_rate_bs:        z.string().optional().nullable(),
  notes:                 z.string().optional().nullable(),
})
export const workerUpdateSchema = workerCreateSchema.partial()

export const shiftCreateSchema = z.object({
  shift_date:       z.coerce.date(),
  shift_type:       z.enum(['morning', 'afternoon', 'night']),
  work_center_id:   z.string().uuid().optional().nullable(),
  work_center_name: z.string().max(255).optional().nullable(),
  workers_count:    z.number().int().nonnegative().default(0),
  planned_production: z.string().optional().nullable(),
  actual_production:  z.string().optional().nullable(),
  production_uom:   z.string().max(20).optional().nullable(),
  status:           z.enum(['planned', 'active', 'completed']).default('planned'),
  notes:            z.string().optional().nullable(),
})
export const shiftUpdateSchema = shiftCreateSchema.partial()

export const laborTrackingCreateSchema = z.object({
  worker_id:            z.string().uuid(),
  worker_name:          z.string().min(1).max(255),
  production_order_id:  z.string().uuid(),
  order_number:         z.string().min(1).max(50),
  operation_id:         z.string().uuid().optional().nullable(),
  operation_name:       z.string().max(255).optional().nullable(),
  work_date:            z.coerce.date(),
  shift_type:           z.enum(['morning', 'afternoon', 'night']),
  hours_worked:         z.string(),
  is_overtime:          z.boolean().default(false),
  is_night_shift:       z.boolean().default(false),
  hourly_rate_bs:       z.string().optional().nullable(),
  total_wages_bs:       z.string().optional().nullable(),
  notes:                z.string().optional().nullable(),
})

export const productionBonusCreateSchema = z.object({
  bonus_number:         z.string().min(1).max(50),
  production_order_id:  z.string().uuid().optional().nullable(),
  order_number:         z.string().max(50).optional().nullable(),
  work_center_id:       z.string().uuid().optional().nullable(),
  work_center_name:     z.string().max(255).optional().nullable(),
  period_start:         z.coerce.date(),
  period_end:           z.coerce.date(),
  shift_type:           z.enum(['morning', 'afternoon', 'night']).optional().nullable(),
  planned_quantity:     z.string(),
  actual_quantity:      z.string(),
  uom:                  z.string().max(20).optional().nullable(),
  achievement_pct:      z.string(),
  bonus_amount_bs:      z.string(),
  workers_count:        z.number().int().positive().default(1),
  bonus_per_worker_bs:  z.string(),
  status:               z.enum(['calculated', 'approved', 'paid']).default('calculated'),
  notes:                z.string().optional().nullable(),
})
export const productionBonusUpdateSchema = productionBonusCreateSchema.partial()
