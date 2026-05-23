import { z } from 'zod'

// =============================================================================
// FarmUnit
// =============================================================================

export const farmUnitCreateSchema = z.object({
  name: z.string().min(1).max(255),
  unit_type: z.enum(['poultry', 'swine', 'bovine', 'agricultural', 'mixed']),
  location_address: z.string().max(500).optional().nullable(),
  location_gps: z.string().max(60).optional().nullable(),
  area_value: z.string().optional().nullable(),
  area_unit: z.enum(['hectares', 'sqm']).optional().nullable(),
  ownership_type: z.enum(['own', 'integrated']).default('own'),
  owner_producer_id: z.string().uuid().optional().nullable(),
  technical_manager: z.string().max(255).optional().nullable(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  capacity_heads: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const farmUnitUpdateSchema = farmUnitCreateSchema.partial()

// =============================================================================
// Flock
// =============================================================================

export const flockCreateSchema = z.object({
  flock_number: z.string().min(1).max(50),
  farm_unit_id: z.string().uuid(),
  species: z.enum(['broiler', 'layer', 'turkey', 'swine', 'bovine']),
  genetic_line: z.string().max(100).optional().nullable(),
  start_date: z.coerce.date(),
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_lot_number: z.string().max(100).optional().nullable(),
  initial_count: z.number().int().positive(),
  initial_avg_weight_g: z.number().int().positive().optional().nullable(),
  mortality_threshold_pct: z.string().optional().default('0.20'),
  planned_end_date: z.coerce.date().optional().nullable(),
  status: z.enum(['active', 'completed', 'terminated_early']).default('active'),
  notes: z.string().optional().nullable(),
})

export const flockUpdateSchema = flockCreateSchema.partial()

// =============================================================================
// FlockWeeklyRecord
// =============================================================================

export const flockWeeklyRecordCreateSchema = z.object({
  flock_id: z.string().uuid(),
  week_number: z.number().int().min(1).max(52),
  record_date: z.coerce.date(),
  live_count: z.number().int().nonnegative(),
  weekly_mortality: z.number().int().nonnegative(),
  cumulative_mortality: z.number().int().nonnegative(),
  avg_body_weight_g: z.number().int().positive(),
  weekly_feed_kg: z.string(),
  cumulative_feed_kg: z.string(),
  fca_accumulated: z.string().optional().nullable(),
  iep: z.string().optional().nullable(),
  house_temp_avg_c: z.string().optional().nullable(),
  house_humidity_avg_pct: z.string().optional().nullable(),
  water_consumption_liters: z.string().optional().nullable(),
  health_observations: z.string().optional().nullable(),
  recorded_by: z.string().uuid().optional().nullable(),
})

export const flockWeeklyRecordUpdateSchema = flockWeeklyRecordCreateSchema.partial()
