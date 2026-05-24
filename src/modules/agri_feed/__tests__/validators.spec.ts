/**
 * Unit tests — agri_feed validators
 *
 * Cubre los schemas Zod para fórmulas de alimento, lotes de fabricación
 * y asignaciones a lotes de aves.
 *
 * Contexto venezolano:
 *   - formula_type: starter/grower/finisher son las etapas del ciclo broiler.
 *     Cada etapa tiene diferente composición proteica y energética.
 *   - ingredients: porcentajes deben sumar ~100 %. Las categorías incluyen
 *     'grain' (maíz, sorgo venezolano), 'protein' (soya), 'mineral', 'additive'.
 *   - aflatoxin_ppb: análisis obligatorio en Venezuela por el clima húmedo
 *     (hongos en el maíz). Límite SASA/INN: 20 ppb. Lotes > 20 ppb se rechazan.
 *   - status 'pending_analysis': lote en espera de resultado del laboratorio.
 *   - source_type 'own_production': fórmula mezclada en la planta propia;
 *     'purchased': alimento balanceado comprado a un proveedor.
 *   - cost_per_ton_usd: el costo se registra en USD (referencia BCV).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  feedFormulaCreateSchema,
  feedFormulaUpdateSchema,
  feedBatchCreateSchema,
  feedBatchUpdateSchema,
  feedAllocationCreateSchema,
  feedAllocationUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'

const validFormula = () => ({
  name:         'Iniciador Broiler 2026',
  formula_type: 'starter' as const,
})

const validBatch = () => ({
  batch_number:   'LOTE-2026-001',
  formula_id:     UUID,
  batch_date:     new Date('2026-01-15'),
  quantity_tons:  '5.000',
})

const validAllocation = () => ({
  flock_id:       UUID,
  feed_batch_id:  UUID,
  allocated_date: new Date('2026-01-16'),
  quantity_kg:    '1250.000',
})

// ---------------------------------------------------------------------------
// feedFormulaCreateSchema
// ---------------------------------------------------------------------------

describe('feedFormulaCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid formula with defaults', () => {
      const result = feedFormulaCreateSchema.safeParse(validFormula())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.species).toBe('broiler')
        expect(result.data.is_active).toBe(true)
        expect(result.data.ingredients).toEqual([])
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validFormula()
      expect(feedFormulaCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when formula_type is missing', () => {
      const { formula_type: _omit, ...rest } = validFormula()
      expect(feedFormulaCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('formula_type enum — etapas del ciclo broiler', () => {
    const types = ['starter', 'grower', 'finisher', 'layer', 'breeding', 'other'] as const

    test.each(types)('accepts formula_type "%s"', (formula_type) => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), formula_type }).success).toBe(true)
    })

    it('rejects invalid formula_type', () => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), formula_type: 'maintenance' }).success).toBe(false)
    })
  })

  describe('species enum', () => {
    const species = ['broiler', 'layer', 'turkey', 'swine', 'bovine', 'all'] as const

    test.each(species)('accepts species "%s"', (s) => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), species: s }).success).toBe(true)
    })

    it('rejects invalid species', () => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), species: 'fish' }).success).toBe(false)
    })
  })

  describe('ingredients array', () => {
    it('accepts a valid ingredient list (maíz + soya venezolana)', () => {
      const result = feedFormulaCreateSchema.safeParse({
        ...validFormula(),
        ingredients: [
          { name: 'Maíz amarillo', percentage: 60, category: 'grain', price_usd_per_ton: 320 },
          { name: 'Torta de soya', percentage: 28, category: 'protein', price_usd_per_ton: 550 },
          { name: 'Fosfato bicálcico', percentage: 10, category: 'mineral' },
          { name: 'Lisina', percentage: 2, category: 'additive' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects ingredient percentage > 100', () => {
      expect(feedFormulaCreateSchema.safeParse({
        ...validFormula(),
        ingredients: [{ name: 'Maíz', percentage: 101, category: 'grain' }],
      }).success).toBe(false)
    })

    it('rejects ingredient percentage < 0', () => {
      expect(feedFormulaCreateSchema.safeParse({
        ...validFormula(),
        ingredients: [{ name: 'Maíz', percentage: -1, category: 'grain' }],
      }).success).toBe(false)
    })

    it('rejects negative price_usd_per_ton', () => {
      expect(feedFormulaCreateSchema.safeParse({
        ...validFormula(),
        ingredients: [{ name: 'Maíz', percentage: 60, category: 'grain', price_usd_per_ton: -10 }],
      }).success).toBe(false)
    })

    it('accepts empty ingredients array', () => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), ingredients: [] }).success).toBe(true)
    })
  })

  describe('nutritional analysis fields', () => {
    it('accepts protein_pct and energy for QC tracking', () => {
      const result = feedFormulaCreateSchema.safeParse({
        ...validFormula(),
        protein_pct: '22.50',
        energy_kcal_kg: 3100,
        lysine_pct: '1.20',
        moisture_pct: '12.00',
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-positive energy_kcal_kg', () => {
      expect(feedFormulaCreateSchema.safeParse({ ...validFormula(), energy_kcal_kg: 0 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// feedFormulaUpdateSchema
// ---------------------------------------------------------------------------

describe('feedFormulaUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(feedFormulaUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates formula_type enum on partial update', () => {
    expect(feedFormulaUpdateSchema.safeParse({ formula_type: 'maintenance' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// feedBatchCreateSchema
// ---------------------------------------------------------------------------

describe('feedBatchCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid batch with defaults', () => {
      const result = feedBatchCreateSchema.safeParse(validBatch())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source_type).toBe('purchased')
        expect(result.data.status).toBe('pending_analysis')
      }
    })

    const required = ['batch_number', 'formula_id', 'batch_date', 'quantity_tons'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validBatch() }
      delete (p as Record<string, unknown>)[field]
      expect(feedBatchCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID formula_id', () => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), formula_id: 'bad' }).success).toBe(false)
    })
  })

  describe('source_type enum', () => {
    it('accepts "own_production" (mezclado en planta propia)', () => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), source_type: 'own_production' }).success).toBe(true)
    })

    it('accepts "purchased" (alimento balanceado comprado)', () => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), source_type: 'purchased' }).success).toBe(true)
    })

    it('rejects invalid source_type', () => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), source_type: 'donated' }).success).toBe(false)
    })
  })

  describe('status lifecycle QC', () => {
    const statuses = ['pending_analysis', 'approved', 'rejected', 'consumed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(feedBatchCreateSchema.safeParse({ ...validBatch(), status: 'quarantine' }).success).toBe(false)
    })
  })

  describe('Venezuelan QC analysis fields', () => {
    it('accepts aflatoxin_ppb for mycotoxin control (límite SASA: 20 ppb)', () => {
      const result = feedBatchCreateSchema.safeParse({
        ...validBatch(),
        aflatoxin_ppb: '8.5',
        protein_result_pct: '22.3',
        moisture_result_pct: '11.8',
        status: 'approved',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null QC fields when analysis is pending', () => {
      expect(feedBatchCreateSchema.safeParse({
        ...validBatch(),
        aflatoxin_ppb: null,
        protein_result_pct: null,
        status: 'pending_analysis',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// feedBatchUpdateSchema
// ---------------------------------------------------------------------------

describe('feedBatchUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(feedBatchUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change after lab approval', () => {
    expect(feedBatchUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// feedAllocationCreateSchema
// ---------------------------------------------------------------------------

describe('feedAllocationCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid allocation', () => {
      expect(feedAllocationCreateSchema.safeParse(validAllocation()).success).toBe(true)
    })

    const required = ['flock_id', 'feed_batch_id', 'allocated_date', 'quantity_kg'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validAllocation() }
      delete (p as Record<string, unknown>)[field]
      expect(feedAllocationCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID flock_id', () => {
      expect(feedAllocationCreateSchema.safeParse({ ...validAllocation(), flock_id: 'bad' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// feedAllocationUpdateSchema
// ---------------------------------------------------------------------------

describe('feedAllocationUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(feedAllocationUpdateSchema.safeParse({}).success).toBe(true)
  })
})
