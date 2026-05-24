/**
 * Unit tests — mfg_mrp validators
 *
 * Covers Zod schemas for production plans, MRP requirement updates,
 * and purchase requisitions in the Manufacturing vertical.
 *
 * Venezuelan manufacturing context:
 *   - MRP lead times use 60-day import horizon (customs_days_estimate)
 *     because critical raw materials often arrive by sea from international
 *     suppliers with a 60-day buffer required by the local supply chain.
 *   - Bimoneda: unit costs are tracked in USD (official BCV rate context).
 *   - is_imported flag distinguishes domestic vs. imported material
 *     requirements for lead-time and customs planning.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  productionPlanCreateSchema,
  productionPlanUpdateSchema,
  mrpRequirementUpdateSchema,
  purchaseRequisitionCreateSchema,
  purchaseRequisitionUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid production plan payload. */
const validPlan = () => ({
  plan_number: 'MRP-2026-01',
  period_start: new Date('2026-02-01'),
  period_end: new Date('2026-02-28'),
})

/** Minimal valid purchase requisition payload. */
const validRequisition = () => ({
  requisition_number: 'REQ-2026-001',
  material_id: UUID,
  material_code: 'MP-HARINA',
  material_name: 'Harina de trigo',
  quantity: '5000',
  uom: 'KG',
  required_by_date: new Date('2026-03-15'),
  suggested_po_date: new Date('2026-02-10'),
})

// ---------------------------------------------------------------------------
// productionPlanCreateSchema
// ---------------------------------------------------------------------------

describe('productionPlanCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid production plan with defaults', () => {
      const result = productionPlanCreateSchema.safeParse(validPlan())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    it('rejects when plan_number is missing', () => {
      const { plan_number: _omit, ...rest } = validPlan()
      expect(productionPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when period_start is missing', () => {
      const { period_start: _omit, ...rest } = validPlan()
      expect(productionPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when period_end is missing', () => {
      const { period_end: _omit, ...rest } = validPlan()
      expect(productionPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when plan_number is empty', () => {
      expect(productionPlanCreateSchema.safeParse({ ...validPlan(), plan_number: '' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'running', 'completed', 'active'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(productionPlanCreateSchema.safeParse({ ...validPlan(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(productionPlanCreateSchema.safeParse({ ...validPlan(), status: 'pending' }).success).toBe(false)
    })
  })

  describe('date coercion', () => {
    it('accepts ISO date strings for period_start and period_end', () => {
      const result = productionPlanCreateSchema.safeParse({
        plan_number: 'MRP-2026-02',
        period_start: '2026-03-01',
        period_end: '2026-03-31',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period_start).toBeInstanceOf(Date)
        expect(result.data.period_end).toBeInstanceOf(Date)
      }
    })

    it('rejects a non-date string for period_start', () => {
      expect(
        productionPlanCreateSchema.safeParse({ ...validPlan(), period_start: 'not-a-date' }).success
      ).toBe(false)
    })
  })

  it('accepts an optional notes field', () => {
    expect(
      productionPlanCreateSchema.safeParse({ ...validPlan(), notes: 'Plan Q1 2026 manufactura' }).success
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// productionPlanUpdateSchema
// ---------------------------------------------------------------------------

describe('productionPlanUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(productionPlanUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(productionPlanUpdateSchema.safeParse({ status: 'running' }).success).toBe(true)
  })

  it('still validates status enum on partial update', () => {
    expect(productionPlanUpdateSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// mrpRequirementUpdateSchema — partial update only
// ---------------------------------------------------------------------------

describe('mrpRequirementUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(mrpRequirementUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(mrpRequirementUpdateSchema.safeParse({ status: 'covered' }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['pending', 'requisition_created', 'covered'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(mrpRequirementUpdateSchema.safeParse({ status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(mrpRequirementUpdateSchema.safeParse({ status: 'planned' }).success).toBe(false)
    })
  })

  it('accepts supplier_id as a UUID', () => {
    expect(mrpRequirementUpdateSchema.safeParse({ supplier_id: UUID }).success).toBe(true)
  })

  it('accepts supplier_id as null (no supplier assigned yet)', () => {
    expect(mrpRequirementUpdateSchema.safeParse({ supplier_id: null }).success).toBe(true)
  })

  it('rejects supplier_id that is not a UUID', () => {
    expect(mrpRequirementUpdateSchema.safeParse({ supplier_id: 'not-uuid' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// purchaseRequisitionCreateSchema — 60-day import horizon (Venezuelan MRP)
// ---------------------------------------------------------------------------

describe('purchaseRequisitionCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid requisition with defaults', () => {
      const result = purchaseRequisitionCreateSchema.safeParse(validRequisition())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
        expect(result.data.is_imported).toBe(false)
      }
    })

    it('rejects when requisition_number is missing', () => {
      const { requisition_number: _omit, ...rest } = validRequisition()
      expect(purchaseRequisitionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when material_id is not a UUID', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({ ...validRequisition(), material_id: 'bad' }).success
      ).toBe(false)
    })

    it('rejects when required_by_date is missing', () => {
      const { required_by_date: _omit, ...rest } = validRequisition()
      expect(purchaseRequisitionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when suggested_po_date is missing', () => {
      const { suggested_po_date: _omit, ...rest } = validRequisition()
      expect(purchaseRequisitionCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'approved', 'po_created', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(purchaseRequisitionCreateSchema.safeParse({ ...validRequisition(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({ ...validRequisition(), status: 'draft' }).success
      ).toBe(false)
    })
  })

  describe('Venezuelan import horizon (60-day customs)', () => {
    it('accepts is_imported=true for materials requiring customs clearance', () => {
      const result = purchaseRequisitionCreateSchema.safeParse({
        ...validRequisition(),
        is_imported: true,
        customs_days_estimate: 60,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customs_days_estimate).toBe(60)
      }
    })

    it('rejects negative customs_days_estimate', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          customs_days_estimate: -5,
        }).success
      ).toBe(false)
    })

    it('accepts customs_days_estimate = 0 (local supplier)', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          customs_days_estimate: 0,
        }).success
      ).toBe(true)
    })

    it('accepts customs_days_estimate as null (not specified)', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          customs_days_estimate: null,
        }).success
      ).toBe(true)
    })
  })

  describe('date coercion', () => {
    it('accepts ISO strings for required_by_date and suggested_po_date', () => {
      const result = purchaseRequisitionCreateSchema.safeParse({
        ...validRequisition(),
        required_by_date: '2026-03-15',
        suggested_po_date: '2026-02-10',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.required_by_date).toBeInstanceOf(Date)
        expect(result.data.suggested_po_date).toBeInstanceOf(Date)
      }
    })
  })

  describe('optional cost fields', () => {
    it('accepts unit_cost_usd and total_cost_usd as string decimals (BCV rate)', () => {
      const result = purchaseRequisitionCreateSchema.safeParse({
        ...validRequisition(),
        unit_cost_usd: '3.50',
        total_cost_usd: '17500.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts unit_cost_usd as null (cost not yet known)', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({ ...validRequisition(), unit_cost_usd: null }).success
      ).toBe(true)
    })

    it('accepts optional mrp_requirement_id as UUID', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          mrp_requirement_id: UUID2,
        }).success
      ).toBe(true)
    })

    it('accepts mrp_requirement_id as null (manual requisition)', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          mrp_requirement_id: null,
        }).success
      ).toBe(true)
    })
  })

  describe('string length limits', () => {
    it('rejects requisition_number longer than 50 chars', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({
          ...validRequisition(),
          requisition_number: 'R'.repeat(51),
        }).success
      ).toBe(false)
    })

    it('rejects uom longer than 20 chars', () => {
      expect(
        purchaseRequisitionCreateSchema.safeParse({ ...validRequisition(), uom: 'U'.repeat(21) }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// purchaseRequisitionUpdateSchema
// ---------------------------------------------------------------------------

describe('purchaseRequisitionUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(purchaseRequisitionUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(purchaseRequisitionUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('still validates status enum on partial update', () => {
    expect(purchaseRequisitionUpdateSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })
})
