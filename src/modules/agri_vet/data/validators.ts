import { z } from 'zod'

// =============================================================================
// VaccinationProgram
// =============================================================================

const vaccinationEntrySchema = z.object({
  vaccine_name:        z.string().min(1),
  active_ingredient:   z.string().optional(),
  manufacturer:        z.string().optional(),
  route:               z.enum(['drinking_water', 'ocular', 'injectable', 'spray', 'subcutaneous', 'oral']).default('drinking_water'),
  age_days:            z.number().int().nonnegative(),
  dose_per_bird:       z.number().nonnegative().optional(),
  dose_unit:           z.enum(['ml', 'doses', 'mg']).optional(),
  withdrawal_days:     z.number().int().nonnegative().default(0),
  notes:               z.string().optional(),
})

export const vaccinationProgramCreateSchema = z.object({
  name:          z.string().min(1).max(255),
  species:       z.enum(['broiler', 'layer', 'turkey', 'swine', 'bovine', 'all']).default('broiler'),
  vaccinations:  z.array(vaccinationEntrySchema).default([]),
  is_active:     z.boolean().default(true),
  notes:         z.string().optional().nullable(),
})

export const vaccinationProgramUpdateSchema = vaccinationProgramCreateSchema.partial()

// =============================================================================
// VaccinationRecord
// =============================================================================

export const vaccinationRecordCreateSchema = z.object({
  flock_id:             z.string().uuid(),
  program_id:           z.string().uuid().optional().nullable(),
  vaccine_name:         z.string().min(1).max(255),
  active_ingredient:    z.string().max(255).optional().nullable(),
  manufacturer:         z.string().max(255).optional().nullable(),
  administration_route: z.enum(['drinking_water', 'ocular', 'injectable', 'spray', 'subcutaneous', 'oral']).default('drinking_water'),
  scheduled_date:       z.coerce.date(),
  applied_date:         z.coerce.date().optional().nullable(),
  status:               z.enum(['scheduled', 'applied', 'missed', 'cancelled']).default('scheduled'),
  birds_treated:        z.number().int().nonnegative().optional().nullable(),
  dose_applied:         z.string().optional().nullable(),
  dose_unit:            z.enum(['ml', 'doses', 'mg']).optional().nullable(),
  vaccine_lot_number:   z.string().max(100).optional().nullable(),
  vaccine_expiry_date:  z.coerce.date().optional().nullable(),
  withdrawal_days:      z.number().int().nonnegative().default(0),
  withdrawal_end_date:  z.coerce.date().optional().nullable(),
  notes:                z.string().optional().nullable(),
})

export const vaccinationRecordUpdateSchema = vaccinationRecordCreateSchema.partial()

// =============================================================================
// MedicationRecord
// =============================================================================

export const medicationRecordCreateSchema = z.object({
  flock_id:                z.string().uuid(),
  diagnosis:               z.string().min(1).max(500),
  medication_name:         z.string().min(1).max(255),
  active_ingredient:       z.string().max(255).optional().nullable(),
  manufacturer:            z.string().max(255).optional().nullable(),
  administration_route:    z.enum(['drinking_water', 'injectable', 'oral', 'topical', 'other']).default('drinking_water'),
  dose_description:        z.string().max(255).optional().nullable(),
  treatment_start_date:    z.coerce.date(),
  treatment_duration_days: z.number().int().positive(),
  treatment_end_date:      z.coerce.date(),
  veterinarian_name:       z.string().max(255).optional().nullable(),
  veterinarian_id:         z.string().uuid().optional().nullable(),
  medication_lot_number:   z.string().max(100).optional().nullable(),
  medication_expiry_date:  z.coerce.date().optional().nullable(),
  withdrawal_days:         z.number().int().nonnegative().default(0),
  withdrawal_end_date:     z.coerce.date(),
  resolved:                z.boolean().default(false),
  notes:                   z.string().optional().nullable(),
})

export const medicationRecordUpdateSchema = medicationRecordCreateSchema.partial()

// =============================================================================
// MortalityRecord
// =============================================================================

export const mortalityRecordCreateSchema = z.object({
  flock_id:     z.string().uuid(),
  record_date:  z.coerce.date(),
  count:        z.number().int().positive(),
  cause:        z.enum(['sanitary', 'heat_stress', 'crushing', 'low_weight_selection', 'other']).default('other'),
  cause_detail: z.string().max(500).optional().nullable(),
  notes:        z.string().optional().nullable(),
})

export const mortalityRecordUpdateSchema = mortalityRecordCreateSchema.partial()
