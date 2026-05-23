import { z } from 'zod'
export const energyConsumptionCreateSchema = z.object({
  work_center_id:       z.string().uuid().optional().nullable(),
  work_center_code:     z.string().min(1).max(30),
  work_center_name:     z.string().min(1).max(255),
  production_order_id:  z.string().uuid().optional().nullable(),
  record_date:          z.coerce.date(),
  shift_type:           z.enum(['morning', 'afternoon', 'night']),
  kwh_consumed:         z.string(),
  kwh_planned:          z.string().optional().nullable(),
  duration_hrs:         z.string().default('8.00'),
  cost_per_kwh_usd:     z.string().optional().nullable(),
  total_energy_cost_usd: z.string().optional().nullable(),
  energy_source:        z.enum(['grid', 'generator', 'mixed']).default('grid'),
  generator_hrs:        z.string().default('0.00'),
  generator_fuel_cost_usd: z.string().optional().nullable(),
  notes:                z.string().optional().nullable(),
})
export const powerOutageCreateSchema = z.object({
  started_at:           z.coerce.date(),
  ended_at:             z.coerce.date().optional().nullable(),
  outage_type:          z.enum(['scheduled_restriction', 'unscheduled_cut', 'voltage_fluctuation', 'complete_blackout']).default('unscheduled_cut'),
  zone:                 z.string().max(100).optional().nullable(),
  impact_production_hrs_lost: z.string().optional().nullable(),
  products_affected:    z.string().optional().nullable(),
  used_generator:       z.boolean().default(false),
  generator_fuel_liters: z.string().optional().nullable(),
  fuel_cost_usd:        z.string().optional().nullable(),
  notes:                z.string().optional().nullable(),
})
export const powerOutageUpdateSchema = powerOutageCreateSchema.partial()
