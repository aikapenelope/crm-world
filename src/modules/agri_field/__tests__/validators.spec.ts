/**
 * Unit tests — agri_field validators
 *
 * Cubre los schemas Zod para las operaciones de campo agrícola:
 * parcelas, ciclos de cultivo y actividades agrícolas.
 *
 * Contexto venezolano:
 *   - Cultivos principales para producción de alimento animal:
 *     maíz (60 % de la fórmula), soya (proteína), sorgo (alternativa al maíz).
 *   - irrigation_system 'rainfed': siembra de secano, frecuente en los
 *     Llanos venezolanos donde el riego artificial es escaso.
 *   - destination 'own_feed': la cosecha va directo a la planta de
 *     elaboración de alimento balanceado (integración vertical).
 *   - status 'failed': ciclo perdido (helada, plaga, sequía extrema).
 *   - cropActivity 'herbicide'/'pesticide': con inputs_used para trazabilidad
 *     de agroquímicos (regulado por INSAI).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  fieldPlotCreateSchema,
  fieldPlotUpdateSchema,
  cropCycleCreateSchema,
  cropCycleUpdateSchema,
  cropActivityCreateSchema,
  cropActivityUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validPlot = () => ({
  name:          'Parcela Norte — La Finca',
  area_hectares: '25.5',
})

const validCycle = () => ({
  field_plot_id: UUID,
  crop_type:     'maize' as const,
  planting_date: new Date('2026-01-10'),
})

const validActivity = () => ({
  crop_cycle_id: UUID,
  activity_type: 'planting' as const,
  activity_date: new Date('2026-01-10'),
})

// ---------------------------------------------------------------------------
// fieldPlotCreateSchema
// ---------------------------------------------------------------------------

describe('fieldPlotCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid plot with defaults', () => {
      const result = fieldPlotCreateSchema.safeParse(validPlot())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validPlot()
      expect(fieldPlotCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when area_hectares is missing', () => {
      const { area_hectares: _omit, ...rest } = validPlot()
      expect(fieldPlotCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('irrigation_system enum', () => {
    const systems = ['drip', 'sprinkler', 'flood', 'rainfed'] as const

    test.each(systems)('accepts irrigation_system "%s"', (irrigation_system) => {
      expect(fieldPlotCreateSchema.safeParse({ ...validPlot(), irrigation_system }).success).toBe(true)
    })

    it('rejects invalid irrigation_system', () => {
      expect(fieldPlotCreateSchema.safeParse({ ...validPlot(), irrigation_system: 'pivot' }).success).toBe(false)
    })

    it('accepts null irrigation_system (sin sistema de riego definido)', () => {
      expect(fieldPlotCreateSchema.safeParse({ ...validPlot(), irrigation_system: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'fallow', 'maintenance'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(fieldPlotCreateSchema.safeParse({ ...validPlot(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(fieldPlotCreateSchema.safeParse({ ...validPlot(), status: 'sold' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// fieldPlotUpdateSchema
// ---------------------------------------------------------------------------

describe('fieldPlotUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(fieldPlotUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates status enum on partial update', () => {
    expect(fieldPlotUpdateSchema.safeParse({ status: 'sold' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// cropCycleCreateSchema
// ---------------------------------------------------------------------------

describe('cropCycleCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid cycle with defaults', () => {
      const result = cropCycleCreateSchema.safeParse(validCycle())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('planned')
      }
    })

    const required = ['field_plot_id', 'crop_type', 'planting_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validCycle() }
      delete (p as Record<string, unknown>)[field]
      expect(cropCycleCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID field_plot_id', () => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), field_plot_id: 'bad' }).success).toBe(false)
    })
  })

  describe('crop_type enum — cultivos venezolanos para alimento animal', () => {
    const types = ['maize', 'soybean', 'sorghum', 'sunflower', 'other'] as const

    test.each(types)('accepts crop_type "%s"', (crop_type) => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), crop_type }).success).toBe(true)
    })

    it('rejects invalid crop_type', () => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), crop_type: 'wheat' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['planned', 'active', 'harvested', 'failed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('destination enum', () => {
    const destinations = ['own_feed', 'sale', 'storage'] as const

    test.each(destinations)('accepts destination "%s"', (destination) => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), destination }).success).toBe(true)
    })

    it('rejects invalid destination', () => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), destination: 'export' }).success).toBe(false)
    })

    it('accepts null destination (not yet decided)', () => {
      expect(cropCycleCreateSchema.safeParse({ ...validCycle(), destination: null }).success).toBe(true)
    })
  })

  describe('yield tracking fields', () => {
    it('accepts expected and actual yield data at harvest', () => {
      expect(cropCycleCreateSchema.safeParse({
        ...validCycle(),
        expected_yield_tons_ha: '5.5',
        actual_yield_tons_ha: '5.2',
        actual_yield_tons: '132.6',
        cost_per_ton_usd: '180.00',
        status: 'harvested',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// cropCycleUpdateSchema
// ---------------------------------------------------------------------------

describe('cropCycleUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(cropCycleUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change to failed (pérdida del ciclo)', () => {
    expect(cropCycleUpdateSchema.safeParse({ status: 'failed', notes: 'Helada — pérdida total' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// cropActivityCreateSchema
// ---------------------------------------------------------------------------

describe('cropActivityCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid activity', () => {
      expect(cropActivityCreateSchema.safeParse(validActivity()).success).toBe(true)
    })

    const required = ['crop_cycle_id', 'activity_type', 'activity_date'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validActivity() }
      delete (p as Record<string, unknown>)[field]
      expect(cropActivityCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('activity_type enum', () => {
    const types = ['land_prep', 'planting', 'fertilization', 'herbicide',
      'pesticide', 'irrigation', 'harvesting', 'other'] as const

    test.each(types)('accepts activity_type "%s"', (activity_type) => {
      expect(cropActivityCreateSchema.safeParse({ ...validActivity(), activity_type }).success).toBe(true)
    })

    it('rejects invalid activity_type', () => {
      expect(cropActivityCreateSchema.safeParse({ ...validActivity(), activity_type: 'pruning' }).success).toBe(false)
    })
  })

  describe('cost tracking', () => {
    it('accepts cost fields for pesticide application', () => {
      expect(cropActivityCreateSchema.safeParse({
        ...validActivity(),
        activity_type: 'pesticide',
        inputs_used: [
          { name: 'Cipermetrina 250 CE', quantity: 2, unit: 'liters', cost_usd: 18 },
        ],
        equipment_used: 'Mochila fumigadora',
        labor_hours: '4.0',
        labor_cost_usd: '8.00',
        inputs_cost_usd: '36.00',
        total_cost_usd: '44.00',
      }).success).toBe(true)
    })

    it('rejects input with non-positive quantity', () => {
      expect(cropActivityCreateSchema.safeParse({
        ...validActivity(),
        inputs_used: [{ name: 'Urea', quantity: 0, unit: 'kg' }],
      }).success).toBe(false)
    })

    it('rejects input with negative cost', () => {
      expect(cropActivityCreateSchema.safeParse({
        ...validActivity(),
        inputs_used: [{ name: 'Urea', quantity: 50, unit: 'kg', cost_usd: -10 }],
      }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// cropActivityUpdateSchema
// ---------------------------------------------------------------------------

describe('cropActivityUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(cropActivityUpdateSchema.safeParse({}).success).toBe(true)
  })
})
