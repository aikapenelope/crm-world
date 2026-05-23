import { z } from 'zod'

export const fieldPlotCreateSchema = z.object({
  name:             z.string().min(1).max(255),
  area_hectares:    z.string(),
  soil_type:        z.string().max(50).optional().nullable(),
  irrigation_system: z.enum(['drip', 'sprinkler', 'flood', 'rainfed']).optional().nullable(),
  location_gps:     z.string().max(60).optional().nullable(),
  farm_unit_id:     z.string().uuid().optional().nullable(),
  status:           z.enum(['active', 'fallow', 'maintenance']).default('active'),
  notes:            z.string().optional().nullable(),
})
export const fieldPlotUpdateSchema = fieldPlotCreateSchema.partial()

export const cropCycleCreateSchema = z.object({
  field_plot_id:           z.string().uuid(),
  crop_type:               z.enum(['maize', 'soybean', 'sorghum', 'sunflower', 'other']),
  crop_variety:            z.string().max(100).optional().nullable(),
  planting_density:        z.string().optional().nullable(),
  planting_date:           z.coerce.date(),
  expected_harvest_date:   z.coerce.date().optional().nullable(),
  status:                  z.enum(['planned', 'active', 'harvested', 'failed']).default('planned'),
  expected_yield_tons_ha:  z.string().optional().nullable(),
  actual_yield_tons_ha:    z.string().optional().nullable(),
  actual_yield_tons:       z.string().optional().nullable(),
  cost_per_ton_usd:        z.string().optional().nullable(),
  destination:             z.enum(['own_feed', 'sale', 'storage']).optional().nullable(),
  notes:                   z.string().optional().nullable(),
})
export const cropCycleUpdateSchema = cropCycleCreateSchema.partial()

const inputUsedSchema = z.object({
  name: z.string(), quantity: z.number().positive(), unit: z.string(), cost_usd: z.number().nonnegative().optional(),
})

export const cropActivityCreateSchema = z.object({
  crop_cycle_id:  z.string().uuid(),
  activity_type:  z.enum(['land_prep', 'planting', 'fertilization', 'herbicide', 'pesticide', 'irrigation', 'harvesting', 'other']),
  activity_date:  z.coerce.date(),
  inputs_used:    z.array(inputUsedSchema).optional().nullable(),
  equipment_used: z.string().max(255).optional().nullable(),
  labor_hours:    z.string().optional().nullable(),
  labor_cost_usd: z.string().optional().nullable(),
  inputs_cost_usd: z.string().optional().nullable(),
  total_cost_usd: z.string().optional().nullable(),
  notes:          z.string().optional().nullable(),
})
export const cropActivityUpdateSchema = cropActivityCreateSchema.partial()
