/**
 * Unit tests — mfg_costs validators
 *
 * Covers the Zod schemas for cost centers, standard costs, and cost variances
 * used in the Manufacturing Costs vertical.
 *
 * Venezuelan manufacturing cost context:
 *   - All costs stored in USD (bcv_rate_used records exchange rate at time of calc)
 *   - raw_material_cost_usd vs local_material_cost_usd: imported vs domestic inputs
 *   - Standard cost lifecycle: draft → active → superseded (FIFO cost layer model)
 *   - costVarianceUpdateSchema is a PATCH-only schema (variances are system-generated)
 *   - cost centers split into production, support, admin for overhead allocation
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  costCenterCreateSchema,
  costCenterUpdateSchema,
  standardCostCreateSchema,
  standardCostUpdateSchema,
  costVarianceUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid cost center payload. */
const validCostCenter = () => ({
  code: 'CC-PROD-01',
  name: 'Centro de Costo Producción 1',
})

/** Minimal valid standard cost payload. */
const validStandardCost = () => ({
  product_id: UUID,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  uom: 'CAJA',
  valid_from: new Date('2026-01-01'),
})

// ---------------------------------------------------------------------------
// costCenterCreateSchema
// ---------------------------------------------------------------------------

describe('costCenterCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid cost center with defaults', () => {
      const result = costCenterCreateSchema.safeParse(validCostCenter())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('production')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validCostCenter()
      expect(costCenterCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validCostCenter()
      expect(costCenterCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects code longer than 30 chars', () => {
      expect(
        costCenterCreateSchema.safeParse({ ...validCostCenter(), code: 'X'.repeat(31) }).success
      ).toBe(false)
    })
  })

  describe('type enum', () => {
    const types = ['production', 'support', 'admin'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(costCenterCreateSchema.safeParse({ ...validCostCenter(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(costCenterCreateSchema.safeParse({ ...validCostCenter(), type: 'warehouse' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// costCenterUpdateSchema
// ---------------------------------------------------------------------------

describe('costCenterUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(costCenterUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating a cost center)', () => {
    expect(costCenterUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid type in partial update', () => {
    expect(costCenterUpdateSchema.safeParse({ type: 'warehouse' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// standardCostCreateSchema
// ---------------------------------------------------------------------------

describe('standardCostCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid standard cost with defaults', () => {
      const result = standardCostCreateSchema.safeParse(validStandardCost())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.raw_material_cost_usd).toBe('0')
        expect(result.data.local_material_cost_usd).toBe('0')
        expect(result.data.labor_cost_usd).toBe('0')
        expect(result.data.overhead_cost_usd).toBe('0')
        expect(result.data.total_standard_cost_usd).toBe('0')
      }
    })

    it('rejects when product_id is not a UUID', () => {
      expect(
        standardCostCreateSchema.safeParse({ ...validStandardCost(), product_id: 'bad' }).success
      ).toBe(false)
    })

    it('rejects when product_code is missing', () => {
      const { product_code: _omit, ...rest } = validStandardCost()
      expect(standardCostCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts valid_from as ISO string (coerced to Date)', () => {
      const result = standardCostCreateSchema.safeParse({
        ...validStandardCost(),
        valid_from: '2026-01-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.valid_from).toBeInstanceOf(Date)
      }
    })

    it('accepts valid_until as null (open-ended validity)', () => {
      expect(
        standardCostCreateSchema.safeParse({ ...validStandardCost(), valid_until: null }).success
      ).toBe(true)
    })

    it('accepts bcv_rate_used as null (USD-only environment)', () => {
      expect(
        standardCostCreateSchema.safeParse({ ...validStandardCost(), bcv_rate_used: null }).success
      ).toBe(true)
    })

    it('accepts all cost components set', () => {
      const result = standardCostCreateSchema.safeParse({
        ...validStandardCost(),
        raw_material_cost_usd: '3.50',
        local_material_cost_usd: '1.20',
        labor_cost_usd: '0.80',
        overhead_cost_usd: '0.50',
        total_standard_cost_usd: '6.00',
        bcv_rate_used: '36.50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.total_standard_cost_usd).toBe('6.00')
        expect(result.data.bcv_rate_used).toBe('36.50')
      }
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'active', 'superseded'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(standardCostCreateSchema.safeParse({ ...validStandardCost(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(
        standardCostCreateSchema.safeParse({ ...validStandardCost(), status: 'archived' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// standardCostUpdateSchema
// ---------------------------------------------------------------------------

describe('standardCostUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(standardCostUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (draft → active)', () => {
    expect(standardCostUpdateSchema.safeParse({ status: 'active' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(standardCostUpdateSchema.safeParse({ status: 'archived' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// costVarianceUpdateSchema — system-generated variances, PATCH only
// ---------------------------------------------------------------------------

describe('costVarianceUpdateSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(costVarianceUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(costVarianceUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('accepts notes-only update', () => {
    expect(costVarianceUpdateSchema.safeParse({ notes: 'Varianza aprobada por gerencia' }).success).toBe(true)
  })

  it('accepts notes as null', () => {
    expect(costVarianceUpdateSchema.safeParse({ notes: null }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['pending', 'calculated', 'approved'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(costVarianceUpdateSchema.safeParse({ status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(costVarianceUpdateSchema.safeParse({ status: 'rejected' }).success).toBe(false)
    })
  })
})
