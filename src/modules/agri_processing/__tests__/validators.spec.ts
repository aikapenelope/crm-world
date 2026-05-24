/**
 * Unit tests — agri_processing validators
 *
 * Cubre los schemas Zod para la planta de beneficio avícola:
 * lotes de sacrificio, fórmulas de procesamiento y lotes de producto terminado.
 *
 * Contexto venezolano:
 *   - El módulo bloquea el beneficio si hay un período de retiro activo
 *     (agri_vet) — verificado por el worker de despacho_sanitario_v1.
 *   - microbiological_result: análisis microbiológico post-procesamiento.
 *     Obligatorio antes de despachar según normativa SASA.
 *   - product_type 'embutido': chorizos, mortadelas; requiere aditivos y
 *     proceso de curado diferente al corte fresco.
 *   - status 'recalled': lote retirado del mercado por problemas de inocuidad.
 *   - condemned_count: decomisos del INSAI en la planta (aves no aptas).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  slaughterBatchCreateSchema,
  slaughterBatchUpdateSchema,
  processingFormulaCreateSchema,
  processingFormulaUpdateSchema,
  processingLotCreateSchema,
  processingLotUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validBatch = () => ({
  batch_number:    'BENEF-2026-001',
  flock_id:        UUID,
  slaughter_date:  new Date('2026-01-20'),
  birds_in:        17400,
  live_weight_kg:  '40890.000',
  birds_processed: 17200,
})

const validFormula = () => ({
  name:               'Pollo entero fresco calibre 2.0-2.3 kg',
  product_type:       'whole_carcass' as const,
  expected_yield_pct: '75.00',
})

const validLot = () => ({
  lot_number:         'PROD-2026-001',
  slaughter_batch_id: UUID,
  formula_id:         UUID2,
  processing_date:    new Date('2026-01-20'),
  quantity_kg:        '30667.500',
})

// ---------------------------------------------------------------------------
// slaughterBatchCreateSchema
// ---------------------------------------------------------------------------

describe('slaughterBatchCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid batch with defaults', () => {
      const result = slaughterBatchCreateSchema.safeParse(validBatch())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.condemned_count).toBe(0)
        expect(result.data.microbiological_result).toBe('pending')
        expect(result.data.status).toBe('receiving')
      }
    })

    const required = ['batch_number', 'flock_id', 'slaughter_date',
      'birds_in', 'live_weight_kg', 'birds_processed'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validBatch() }
      delete (p as Record<string, unknown>)[field]
      expect(slaughterBatchCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID flock_id', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), flock_id: 'bad' }).success).toBe(false)
    })
  })

  describe('microbiological_result enum', () => {
    const results = ['pending', 'approved', 'rejected'] as const

    test.each(results)('accepts microbiological_result "%s"', (microbiological_result) => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), microbiological_result }).success).toBe(true)
    })

    it('rejects invalid microbiological_result', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), microbiological_result: 'conditional' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['receiving', 'processing', 'chilling', 'pending_qc', 'approved', 'dispatched'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('bird counts', () => {
    it('rejects birds_in = 0', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), birds_in: 0 }).success).toBe(false)
    })

    it('rejects birds_processed = 0', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), birds_processed: 0 }).success).toBe(false)
    })

    it('accepts condemned_count = 0 (ningún decomiso)', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), condemned_count: 0 }).success).toBe(true)
    })

    it('rejects negative condemned_count', () => {
      expect(slaughterBatchCreateSchema.safeParse({ ...validBatch(), condemned_count: -1 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// slaughterBatchUpdateSchema
// ---------------------------------------------------------------------------

describe('slaughterBatchUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(slaughterBatchUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates microbiological_result enum on partial update', () => {
    expect(slaughterBatchUpdateSchema.safeParse({ microbiological_result: 'conditional' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// processingFormulaCreateSchema
// ---------------------------------------------------------------------------

describe('processingFormulaCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid formula with defaults', () => {
      const result = processingFormulaCreateSchema.safeParse(validFormula())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
        expect(result.data.parts_used).toEqual([])
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validFormula()
      expect(processingFormulaCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when product_type is missing', () => {
      const { product_type: _omit, ...rest } = validFormula()
      expect(processingFormulaCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when expected_yield_pct is missing', () => {
      const { expected_yield_pct: _omit, ...rest } = validFormula()
      expect(processingFormulaCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('product_type enum', () => {
    const types = ['whole_carcass', 'cuts', 'processed', 'embutido'] as const

    test.each(types)('accepts product_type "%s"', (product_type) => {
      expect(processingFormulaCreateSchema.safeParse({ ...validFormula(), product_type }).success).toBe(true)
    })

    it('rejects invalid product_type', () => {
      expect(processingFormulaCreateSchema.safeParse({ ...validFormula(), product_type: 'offal' }).success).toBe(false)
    })
  })

  describe('additives array', () => {
    it('accepts additives for embutidos (curing agents, preservatives)', () => {
      const result = processingFormulaCreateSchema.safeParse({
        ...validFormula(),
        product_type: 'embutido',
        additives: [
          { name: 'Sal nitro', percentage: 0.25 },
          { name: 'Ácido ascórbico', percentage: 0.05 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative additive percentage', () => {
      expect(processingFormulaCreateSchema.safeParse({
        ...validFormula(),
        additives: [{ name: 'Sal', percentage: -1 }],
      }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// processingFormulaUpdateSchema
// ---------------------------------------------------------------------------

describe('processingFormulaUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(processingFormulaUpdateSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// processingLotCreateSchema
// ---------------------------------------------------------------------------

describe('processingLotCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid lot with defaults', () => {
      const result = processingLotCreateSchema.safeParse(validLot())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('in_stock')
      }
    })

    const required = ['lot_number', 'slaughter_batch_id', 'formula_id',
      'processing_date', 'quantity_kg'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validLot() }
      delete (p as Record<string, unknown>)[field]
      expect(processingLotCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['in_stock', 'partially_dispatched', 'fully_dispatched', 'recalled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(processingLotCreateSchema.safeParse({ ...validLot(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(processingLotCreateSchema.safeParse({ ...validLot(), status: 'consumed' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts packaging fields for retail lots', () => {
      expect(processingLotCreateSchema.safeParse({
        ...validLot(),
        unit_count: 1500,
        package_weight_g: 2100,
        barcode: '7591234567890',
        expiry_date: new Date('2026-01-24'),
      }).success).toBe(true)
    })

    it('rejects non-positive unit_count', () => {
      expect(processingLotCreateSchema.safeParse({ ...validLot(), unit_count: 0 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// processingLotUpdateSchema
// ---------------------------------------------------------------------------

describe('processingLotUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(processingLotUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status change to recalled (inocuidad)', () => {
    expect(processingLotUpdateSchema.safeParse({ status: 'recalled' }).success).toBe(true)
  })
})
