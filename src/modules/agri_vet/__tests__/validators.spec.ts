/**
 * Unit tests — agri_vet validators
 *
 * Cubre los schemas Zod para sanidad avícola: programas de vacunación,
 * registros individuales de vacunación, tratamientos medicamentosos y
 * mortalidad diaria.
 *
 * Contexto venezolano — INOCUIDAD / PERÍODO DE RETIRO:
 *   - withdrawal_days: los días que deben pasar desde el último tratamiento
 *     hasta el beneficio de las aves. Es CRÍTICO para la inocuidad alimentaria.
 *     El módulo agri_processing BLOQUEA el despacho si hay retiro activo.
 *   - administration_route 'drinking_water': vía dominante en Venezuela por
 *     facilidad de aplicación masiva en galpones de 15k-20k aves.
 *   - VaccinationProgram: calendario de vacunaciones por especie/etapa.
 *     Se aplica automáticamente al iniciar un nuevo flock.
 *   - MortalityRecord: causa 'heat_stress' frecuente en Venezuela por los
 *     cortes de luz que apagan los extractores/ventiladores del galpón.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  vaccinationProgramCreateSchema,
  vaccinationProgramUpdateSchema,
  vaccinationRecordCreateSchema,
  vaccinationRecordUpdateSchema,
  medicationRecordCreateSchema,
  medicationRecordUpdateSchema,
  mortalityRecordCreateSchema,
  mortalityRecordUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validVaccinationEntry = () => ({
  vaccine_name: 'Newcastle B1',
  age_days: 7,
})

const validProgram = () => ({
  name: 'Programa Broiler Estándar Venezuela 2026',
})

const validVaccinationRecord = () => ({
  flock_id:       UUID,
  vaccine_name:   'Newcastle B1',
  scheduled_date: new Date('2026-01-17'),
})

const validMedication = () => ({
  flock_id:                UUID,
  diagnosis:               'Coccidiosis detectada — conteo ooquistes elevado',
  medication_name:         'Amprolium 20 %',
  treatment_start_date:    new Date('2026-01-20'),
  treatment_duration_days: 5,
  treatment_end_date:      new Date('2026-01-25'),
  withdrawal_end_date:     new Date('2026-02-04'),
})

const validMortality = () => ({
  flock_id:    UUID,
  record_date: new Date('2026-01-15'),
  count:       15,
})

// ---------------------------------------------------------------------------
// vaccinationProgramCreateSchema
// ---------------------------------------------------------------------------

describe('vaccinationProgramCreateSchema', () => {
  it('accepts a minimal valid program with defaults', () => {
    const result = vaccinationProgramCreateSchema.safeParse(validProgram())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.species).toBe('broiler')
      expect(result.data.is_active).toBe(true)
      expect(result.data.vaccinations).toEqual([])
    }
  })

  it('rejects when name is missing', () => {
    expect(vaccinationProgramCreateSchema.safeParse({}).success).toBe(false)
  })

  describe('species enum', () => {
    const species = ['broiler', 'layer', 'turkey', 'swine', 'bovine', 'all'] as const

    test.each(species)('accepts species "%s"', (s) => {
      expect(vaccinationProgramCreateSchema.safeParse({ ...validProgram(), species: s }).success).toBe(true)
    })

    it('rejects invalid species', () => {
      expect(vaccinationProgramCreateSchema.safeParse({ ...validProgram(), species: 'fish' }).success).toBe(false)
    })
  })

  describe('vaccinations array entries', () => {
    it('accepts a full vaccination schedule (Newcastle + Gumboro + Bronquitis)', () => {
      const result = vaccinationProgramCreateSchema.safeParse({
        ...validProgram(),
        vaccinations: [
          { vaccine_name: 'Newcastle B1',  age_days: 7,  route: 'drinking_water', withdrawal_days: 0 },
          { vaccine_name: 'Gumboro IBD',   age_days: 14, route: 'drinking_water', withdrawal_days: 0 },
          { vaccine_name: 'Bronquitis IB', age_days: 21, route: 'spray',          withdrawal_days: 0 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects vaccination entry with negative age_days', () => {
      expect(vaccinationProgramCreateSchema.safeParse({
        ...validProgram(),
        vaccinations: [{ ...validVaccinationEntry(), age_days: -1 }],
      }).success).toBe(false)
    })

    it('rejects vaccination entry with invalid route', () => {
      expect(vaccinationProgramCreateSchema.safeParse({
        ...validProgram(),
        vaccinations: [{ ...validVaccinationEntry(), route: 'nasal' }],
      }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// vaccinationProgramUpdateSchema
// ---------------------------------------------------------------------------

describe('vaccinationProgramUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(vaccinationProgramUpdateSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// vaccinationRecordCreateSchema
// ---------------------------------------------------------------------------

describe('vaccinationRecordCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid vaccination record with defaults', () => {
      const result = vaccinationRecordCreateSchema.safeParse(validVaccinationRecord())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.administration_route).toBe('drinking_water')
        expect(result.data.status).toBe('scheduled')
        expect(result.data.withdrawal_days).toBe(0)
      }
    })

    it('rejects when flock_id is missing', () => {
      const { flock_id: _omit, ...rest } = validVaccinationRecord()
      expect(vaccinationRecordCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when vaccine_name is missing', () => {
      const { vaccine_name: _omit, ...rest } = validVaccinationRecord()
      expect(vaccinationRecordCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when scheduled_date is missing', () => {
      const { scheduled_date: _omit, ...rest } = validVaccinationRecord()
      expect(vaccinationRecordCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('administration_route enum', () => {
    const routes = ['drinking_water', 'ocular', 'injectable', 'spray', 'subcutaneous', 'oral'] as const

    test.each(routes)('accepts route "%s"', (administration_route) => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), administration_route }).success).toBe(true)
    })

    it('rejects invalid route', () => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), administration_route: 'nasal' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['scheduled', 'applied', 'missed', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), status: 'pending' }).success).toBe(false)
    })
  })

  describe('withdrawal_days — período de retiro', () => {
    it('accepts withdrawal_days = 0 (vacuna sin retiro)', () => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), withdrawal_days: 0 }).success).toBe(true)
    })

    it('accepts withdrawal_days > 0 with withdrawal_end_date', () => {
      expect(vaccinationRecordCreateSchema.safeParse({
        ...validVaccinationRecord(),
        withdrawal_days: 14,
        withdrawal_end_date: new Date('2026-02-01'),
      }).success).toBe(true)
    })

    it('rejects negative withdrawal_days', () => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), withdrawal_days: -1 }).success).toBe(false)
    })
  })

  describe('dose_unit enum', () => {
    const units = ['ml', 'doses', 'mg'] as const

    test.each(units)('accepts dose_unit "%s"', (dose_unit) => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), dose_unit }).success).toBe(true)
    })

    it('rejects invalid dose_unit', () => {
      expect(vaccinationRecordCreateSchema.safeParse({ ...validVaccinationRecord(), dose_unit: 'cc' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// vaccinationRecordUpdateSchema
// ---------------------------------------------------------------------------

describe('vaccinationRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(vaccinationRecordUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change to applied', () => {
    expect(vaccinationRecordUpdateSchema.safeParse({ status: 'applied', applied_date: new Date() }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// medicationRecordCreateSchema
// ---------------------------------------------------------------------------

describe('medicationRecordCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid medication record with defaults', () => {
      const result = medicationRecordCreateSchema.safeParse(validMedication())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.administration_route).toBe('drinking_water')
        expect(result.data.withdrawal_days).toBe(0)
        expect(result.data.resolved).toBe(false)
      }
    })

    const required = ['flock_id', 'diagnosis', 'medication_name',
      'treatment_start_date', 'treatment_duration_days',
      'treatment_end_date', 'withdrawal_end_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validMedication() }
      delete (p as Record<string, unknown>)[field]
      expect(medicationRecordCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('administration_route for medication', () => {
    const routes = ['drinking_water', 'injectable', 'oral', 'topical', 'other'] as const

    test.each(routes)('accepts route "%s"', (administration_route) => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), administration_route }).success).toBe(true)
    })

    it('rejects route "spray" (not valid for medications, only vaccines)', () => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), administration_route: 'spray' }).success).toBe(false)
    })
  })

  describe('treatment_duration_days', () => {
    it('accepts positive treatment_duration_days', () => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), treatment_duration_days: 3 }).success).toBe(true)
    })

    it('rejects treatment_duration_days = 0', () => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), treatment_duration_days: 0 }).success).toBe(false)
    })

    it('rejects negative treatment_duration_days', () => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), treatment_duration_days: -1 }).success).toBe(false)
    })
  })

  describe('diagnosis is required', () => {
    it('rejects empty diagnosis string', () => {
      expect(medicationRecordCreateSchema.safeParse({ ...validMedication(), diagnosis: '' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// medicationRecordUpdateSchema
// ---------------------------------------------------------------------------

describe('medicationRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(medicationRecordUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts resolved = true when treatment concludes', () => {
    expect(medicationRecordUpdateSchema.safeParse({ resolved: true }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// mortalityRecordCreateSchema
// ---------------------------------------------------------------------------

describe('mortalityRecordCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid mortality record with defaults', () => {
      const result = mortalityRecordCreateSchema.safeParse(validMortality())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cause).toBe('other')
      }
    })

    const required = ['flock_id', 'record_date', 'count'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validMortality() }
      delete (p as Record<string, unknown>)[field]
      expect(mortalityRecordCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('cause enum — causas venezolanas', () => {
    const causes = ['sanitary', 'heat_stress', 'crushing', 'low_weight_selection', 'other'] as const

    test.each(causes)('accepts cause "%s"', (cause) => {
      expect(mortalityRecordCreateSchema.safeParse({ ...validMortality(), cause }).success).toBe(true)
    })

    it('accepts "heat_stress" (corte CORPOELEC apaga extractores → golpe de calor)', () => {
      const result = mortalityRecordCreateSchema.safeParse({
        ...validMortality(),
        cause: 'heat_stress',
        cause_detail: 'Corte eléctrico 4h — temperatura galpón 38°C',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid cause', () => {
      expect(mortalityRecordCreateSchema.safeParse({ ...validMortality(), cause: 'unknown' }).success).toBe(false)
    })
  })

  describe('count validation', () => {
    it('rejects count = 0', () => {
      expect(mortalityRecordCreateSchema.safeParse({ ...validMortality(), count: 0 }).success).toBe(false)
    })

    it('rejects negative count', () => {
      expect(mortalityRecordCreateSchema.safeParse({ ...validMortality(), count: -1 }).success).toBe(false)
    })

    it('rejects fractional count', () => {
      expect(mortalityRecordCreateSchema.safeParse({ ...validMortality(), count: 2.5 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// mortalityRecordUpdateSchema
// ---------------------------------------------------------------------------

describe('mortalityRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(mortalityRecordUpdateSchema.safeParse({}).success).toBe(true)
  })
})
