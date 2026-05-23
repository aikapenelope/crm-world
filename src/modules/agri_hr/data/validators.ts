import { z } from 'zod'

export const employeeCreateSchema = z.object({
  first_name:       z.string().min(1).max(150),
  last_name:        z.string().min(1).max(150),
  cedula:           z.string().max(20).optional().nullable(),
  employee_type:    z.enum(['fixed', 'jornalero', 'destajero']).default('fixed'),
  department:       z.string().max(100).optional().nullable(),
  position:         z.string().max(150).optional().nullable(),
  hire_date:        z.coerce.date(),
  salary_usd:       z.string().optional().nullable(),
  base_jornal_usd:  z.string().optional().nullable(),
  base_destajo_usd: z.string().optional().nullable(),
  destajo_unit:     z.enum(['ton', 'box', 'bird', 'hour', 'kg']).optional().nullable(),
  bank_name:        z.string().max(100).optional().nullable(),
  bank_account:     z.string().max(30).optional().nullable(),
  status:           z.enum(['active', 'inactive', 'terminated']).default('active'),
  notes:            z.string().optional().nullable(),
})
export const employeeUpdateSchema = employeeCreateSchema.partial()

export const jornaleroPayrollCreateSchema = z.object({
  employee_id:          z.string().uuid(),
  period_start:         z.coerce.date(),
  period_end:           z.coerce.date(),
  days_worked:          z.number().int().nonnegative().optional().nullable(),
  units_worked:         z.string().optional().nullable(),
  gross_usd:            z.string(),
  vacation_provision_usd: z.string().optional(),
  bonus_provision_usd:  z.string().optional(),
  severance_provision_usd: z.string().optional(),
  total_provisions_usd: z.string().optional(),
  net_usd:              z.string(),
  status:               z.enum(['draft', 'approved', 'paid']).default('draft'),
  payment_date:         z.coerce.date().optional().nullable(),
  notes:                z.string().optional().nullable(),
})
export const jornaleroPayrollUpdateSchema = jornaleroPayrollCreateSchema.partial()

export const producerSettlementCreateSchema = z.object({
  producer_id:          z.string().uuid(),
  farm_unit_id:         z.string().uuid(),
  flock_id:             z.string().uuid(),
  cycle_start_date:     z.coerce.date(),
  cycle_end_date:       z.coerce.date(),
  initial_birds:        z.number().int().positive(),
  final_birds:          z.number().int().nonnegative(),
  actual_fca:           z.string(),
  actual_avg_weight_kg: z.string(),
  actual_mortality_pct: z.string(),
  target_fca:           z.string(),
  target_weight_kg:     z.string(),
  price_per_kg_usd:     z.string(),
  base_payment_usd:     z.string(),
  fca_bonus_usd:        z.string().optional(),
  weight_bonus_usd:     z.string().optional(),
  fca_penalty_usd:      z.string().optional(),
  total_payment_usd:    z.string(),
  status:               z.enum(['calculated', 'approved', 'paid']).default('calculated'),
  notes:                z.string().optional().nullable(),
})
export const producerSettlementUpdateSchema = producerSettlementCreateSchema.partial()
