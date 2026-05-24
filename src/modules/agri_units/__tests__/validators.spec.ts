/**
 * Unit tests — agri_units validators
 *
 * Cubre los schemas Zod para unidades productivas (galpones/fincas),
 * lotes de aves y registros semanales de producción.
 *
 * Contexto venezolano — KPIs avícolas:
 *   - FCA (Factor de Conversión Alimenticia): kg alimento / kg peso ganado.
 *     Meta broiler en Venezuela: < 1.90. Se registra semanalmente.
 *   - IEP (Índice de Eficiencia Productiva): indicador compuesto de viabilidad,
 *     peso, FCA y días al sacrificio. Meta: > 250.
 *   - mortality_threshold_pct default '0.20': 20 % de mortalidad acumulada es
 *     el umbral de alerta. En Venezuela con cortes de luz puede ser mayor.
 *   - week_number 1-52: un registro por semana del ciclo (ciclo broiler ≈ 6 semanas).
 *   - ownership_type 'integrated': el galpón pertenece a un productor externo
 *     (integrado) que recibe liquidación al completar el ciclo.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  farmUnitCreateSchema,
  farmUnitUpdateSchema,
  flockCreateSchema,
  flockUpdateSchema,
  flockWeeklyRecordCreateSchema,
  flockWeeklyRecordUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validFarmUnit = () => ({
  name:      'Galpón 1 — La Esperanza',
  unit_type: 'poultry' as const,
})

const validFlock = () => ({
  flock_number:  'L-2026-001',
  farm_unit_id:  UUID,
  species:       'broiler' as const,
  start_date:    new Date('2026-01-10'),
  initial_count: 18000,
})

const validWeeklyRecord = () => ({
  flock_id:             UUID,
  week_number:          3,
  record_date:          new Date('2026-01-31'),
  live_count:           17650,
  weekly_mortality:     120,
  cumulative_mortality: 350,
  avg_body_weight_g:    850,
  weekly_feed_kg:       '12500.000',
  cumulative_feed_kg:   '35000.000',
})

// ---------------------------------------------------------------------------
// farmUnitCreateSchema
// ---------------------------------------------------------------------------

describe('farmUnitCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid farm unit with defaults', () => {
      const result = farmUnitCreateSchema.safeParse(validFarmUnit())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ownership_type).toBe('own')
        expect(result.data.status).toBe('active')
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validFarmUnit()
      expect(farmUnitCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when unit_type is missing', () => {
      const { unit_type: _omit, ...rest } = validFarmUnit()
      expect(farmUnitCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('unit_type enum', () => {
    const types = ['poultry', 'swine', 'bovine', 'agricultural', 'mixed'] as const

    test.each(types)('accepts unit_type "%s"', (unit_type) => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), unit_type }).success).toBe(true)
    })

    it('rejects invalid unit_type', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), unit_type: 'fish' }).success).toBe(false)
    })
  })

  describe('ownership_type enum', () => {
    it('accepts "own" (galpón propio)', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), ownership_type: 'own' }).success).toBe(true)
    })

    it('accepts "integrated" (productor integrado recibe liquidación)', () => {
      const result = farmUnitCreateSchema.safeParse({
        ...validFarmUnit(),
        ownership_type: 'integrated',
        owner_producer_id: UUID,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.ownership_type).toBe('integrated')
    })

    it('rejects invalid ownership_type', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), ownership_type: 'rented' }).success).toBe(false)
    })

    it('rejects non-UUID owner_producer_id', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), ownership_type: 'integrated', owner_producer_id: 'bad' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'inactive', 'maintenance'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), status: 'demolished' }).success).toBe(false)
    })
  })

  describe('area_unit enum', () => {
    it('accepts "hectares"', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), area_value: '2.5', area_unit: 'hectares' }).success).toBe(true)
    })

    it('accepts "sqm"', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), area_value: '2500', area_unit: 'sqm' }).success).toBe(true)
    })

    it('rejects invalid area_unit', () => {
      expect(farmUnitCreateSchema.safeParse({ ...validFarmUnit(), area_unit: 'acres' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// farmUnitUpdateSchema
// ---------------------------------------------------------------------------

describe('farmUnitUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(farmUnitUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates unit_type enum on partial update', () => {
    expect(farmUnitUpdateSchema.safeParse({ unit_type: 'fish' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// flockCreateSchema
// ---------------------------------------------------------------------------

describe('flockCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid flock with defaults', () => {
      const result = flockCreateSchema.safeParse(validFlock())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
        expect(result.data.mortality_threshold_pct).toBe('0.20')
      }
    })

    const required = ['flock_number', 'farm_unit_id', 'species', 'start_date', 'initial_count'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validFlock() }
      delete (p as Record<string, unknown>)[field]
      expect(flockCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID farm_unit_id', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), farm_unit_id: 'bad' }).success).toBe(false)
    })
  })

  describe('species enum', () => {
    const species = ['broiler', 'layer', 'turkey', 'swine', 'bovine'] as const

    test.each(species)('accepts species "%s"', (s) => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), species: s }).success).toBe(true)
    })

    it('rejects invalid species', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), species: 'rabbit' }).success).toBe(false)
    })
  })

  describe('initial_count business rules', () => {
    it('accepts typical broiler batch size (18000 aves)', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), initial_count: 18000 }).success).toBe(true)
    })

    it('rejects initial_count = 0', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), initial_count: 0 }).success).toBe(false)
    })

    it('rejects negative initial_count', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), initial_count: -1 }).success).toBe(false)
    })

    it('rejects fractional initial_count', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), initial_count: 100.5 }).success).toBe(false)
    })
  })

  describe('mortality_threshold_pct (umbral de alerta)', () => {
    it('accepts custom threshold', () => {
      const result = flockCreateSchema.safeParse({ ...validFlock(), mortality_threshold_pct: '0.15' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.mortality_threshold_pct).toBe('0.15')
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['active', 'completed', 'terminated_early'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(flockCreateSchema.safeParse({ ...validFlock(), status: 'closed' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// flockUpdateSchema
// ---------------------------------------------------------------------------

describe('flockUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(flockUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change to completed', () => {
    expect(flockUpdateSchema.safeParse({ status: 'completed' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// flockWeeklyRecordCreateSchema — registros KPI
// ---------------------------------------------------------------------------

describe('flockWeeklyRecordCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid weekly record', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse(validWeeklyRecord()).success).toBe(true)
    })

    const required = ['flock_id', 'week_number', 'record_date', 'live_count',
      'weekly_mortality', 'cumulative_mortality', 'avg_body_weight_g',
      'weekly_feed_kg', 'cumulative_feed_kg'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validWeeklyRecord() }
      delete (p as Record<string, unknown>)[field]
      expect(flockWeeklyRecordCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('week_number 1-52', () => {
    it('accepts week 1', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), week_number: 1 }).success).toBe(true)
    })

    it('accepts week 52', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), week_number: 52 }).success).toBe(true)
    })

    it('rejects week 0', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), week_number: 0 }).success).toBe(false)
    })

    it('rejects week 53', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), week_number: 53 }).success).toBe(false)
    })
  })

  describe('KPI fields (FCA / IEP)', () => {
    it('accepts fca_accumulated string (ej: "1.85")', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), fca_accumulated: '1.85' }).success).toBe(true)
    })

    it('accepts iep string (ej: "270.50")', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), iep: '270.50' }).success).toBe(true)
    })

    it('accepts null KPI fields when not yet calculated', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({
        ...validWeeklyRecord(), fca_accumulated: null, iep: null,
      }).success).toBe(true)
    })
  })

  describe('count fields non-negative', () => {
    it('rejects negative live_count', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), live_count: -1 }).success).toBe(false)
    })

    it('accepts 0 weekly_mortality (semana sin bajas)', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), weekly_mortality: 0 }).success).toBe(true)
    })

    it('rejects non-positive avg_body_weight_g', () => {
      expect(flockWeeklyRecordCreateSchema.safeParse({ ...validWeeklyRecord(), avg_body_weight_g: 0 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// flockWeeklyRecordUpdateSchema
// ---------------------------------------------------------------------------

describe('flockWeeklyRecordUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(flockWeeklyRecordUpdateSchema.safeParse({}).success).toBe(true)
  })
})
