/**
 * Unit tests — mfg_quality validators
 *
 * Covers the Zod schemas for quality plans, inspections, and non-conformances
 * used in the Manufacturing Quality vertical.
 *
 * Venezuelan manufacturing quality context:
 *   - Critical Control Points (CCPs) required by SENCAMER/food safety norms
 *   - Non-conformances track cost_nc_usd for financial reporting in dual-currency
 *   - Lot numbers tied to traceability (SENASAG) — NC records link back to lots
 *   - CORPOELEC power cuts cause 'in_process' non-conformances (quality_hold)
 *   - is_critical_control_point flag triggers additional review steps
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  qualityPlanCreateSchema,
  qualityPlanUpdateSchema,
  inspectionCreateSchema,
  nonconformanceCreateSchema,
  nonconformanceUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid quality plan payload. */
const validPlan = () => ({
  product_id: UUID,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  parameter_name: 'Humedad (%)',
  parameter_unit: '%',
})

/** Minimal valid inspection payload. */
const validInspection = () => ({
  plan_id: UUID,
  measured_value: '12.5',
})

/** Minimal valid non-conformance payload. */
const validNC = () => ({
  nc_number: 'NC-2026-001',
  source: 'in_process' as const,
  description: 'Humedad fuera de especificación — corte CORPOELEC afectó secado',
})

// ---------------------------------------------------------------------------
// qualityPlanCreateSchema
// ---------------------------------------------------------------------------

describe('qualityPlanCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid quality plan with defaults', () => {
      const result = qualityPlanCreateSchema.safeParse(validPlan())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.control_point).toBe('in_process')
        expect(result.data.sampling_frequency).toBe('per_batch')
        expect(result.data.sample_size).toBe(5)
        expect(result.data.is_critical_control_point).toBe(false)
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when product_id is not a UUID', () => {
      expect(qualityPlanCreateSchema.safeParse({ ...validPlan(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects when parameter_name is missing', () => {
      const { parameter_name: _omit, ...rest } = validPlan()
      expect(qualityPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when parameter_unit is missing', () => {
      const { parameter_unit: _omit, ...rest } = validPlan()
      expect(qualityPlanCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects sample_size = 0 (min is 1)', () => {
      expect(qualityPlanCreateSchema.safeParse({ ...validPlan(), sample_size: 0 }).success).toBe(false)
    })

    it('rejects sample_size > 50 (max is 50)', () => {
      expect(qualityPlanCreateSchema.safeParse({ ...validPlan(), sample_size: 51 }).success).toBe(false)
    })

    it('accepts is_critical_control_point = true (CCP — SENCAMER)', () => {
      const result = qualityPlanCreateSchema.safeParse({
        ...validPlan(),
        is_critical_control_point: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_critical_control_point).toBe(true)
      }
    })

    it('accepts limit fields as null (no spec limits defined yet)', () => {
      expect(
        qualityPlanCreateSchema.safeParse({
          ...validPlan(),
          lsl: null,
          usl: null,
          lcl: null,
          ucl: null,
          target: null,
        }).success
      ).toBe(true)
    })
  })

  describe('control_point enum', () => {
    const points = ['receiving', 'in_process', 'finished', 'shipping'] as const

    test.each(points)('accepts control_point "%s"', (control_point) => {
      expect(qualityPlanCreateSchema.safeParse({ ...validPlan(), control_point }).success).toBe(true)
    })

    it('rejects an invalid control_point', () => {
      expect(qualityPlanCreateSchema.safeParse({ ...validPlan(), control_point: 'storage' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// qualityPlanUpdateSchema
// ---------------------------------------------------------------------------

describe('qualityPlanUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(qualityPlanUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating a plan)', () => {
    expect(qualityPlanUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid control_point in partial update', () => {
    expect(qualityPlanUpdateSchema.safeParse({ control_point: 'storage' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// inspectionCreateSchema
// ---------------------------------------------------------------------------

describe('inspectionCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid inspection with defaults', () => {
      const result = inspectionCreateSchema.safeParse(validInspection())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sample_number).toBe(1)
        expect(result.data.is_in_spec).toBe(true)
        expect(result.data.is_in_control).toBe(true)
        expect(result.data.inspection_timestamp).toBeInstanceOf(Date)
      }
    })

    it('rejects when plan_id is not a UUID', () => {
      expect(inspectionCreateSchema.safeParse({ ...validInspection(), plan_id: 'bad' }).success).toBe(false)
    })

    it('rejects when measured_value is missing', () => {
      const { measured_value: _omit, ...rest } = validInspection()
      expect(inspectionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects sample_number = 0 (min is 1)', () => {
      expect(inspectionCreateSchema.safeParse({ ...validInspection(), sample_number: 0 }).success).toBe(false)
    })

    it('accepts is_in_spec = false (out-of-spec measurement)', () => {
      const result = inspectionCreateSchema.safeParse({
        ...validInspection(),
        is_in_spec: false,
        is_in_control: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_in_spec).toBe(false)
        expect(result.data.is_in_control).toBe(false)
      }
    })

    it('accepts inspection_timestamp as ISO string (coerced to Date)', () => {
      const result = inspectionCreateSchema.safeParse({
        ...validInspection(),
        inspection_timestamp: '2026-02-01T10:30:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inspection_timestamp).toBeInstanceOf(Date)
      }
    })

    it('accepts lot_id and order_id as null (plan-only inspection)', () => {
      expect(
        inspectionCreateSchema.safeParse({
          ...validInspection(),
          lot_id: null,
          order_id: null,
        }).success
      ).toBe(true)
    })

    it('accepts inspector_id as null (system-recorded)', () => {
      expect(
        inspectionCreateSchema.safeParse({ ...validInspection(), inspector_id: null }).success
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// nonconformanceCreateSchema
// ---------------------------------------------------------------------------

describe('nonconformanceCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid NC with defaults', () => {
      const result = nonconformanceCreateSchema.safeParse(validNC())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.severity).toBe('major')
        expect(result.data.status).toBe('open')
        expect(result.data.disposition).toBeUndefined()
      }
    })

    it('rejects when nc_number is missing', () => {
      const { nc_number: _omit, ...rest } = validNC()
      expect(nonconformanceCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when description is empty', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), description: '' }).success).toBe(false)
    })

    it('accepts optional fields as null', () => {
      expect(
        nonconformanceCreateSchema.safeParse({
          ...validNC(),
          lot_id: null,
          lot_number: null,
          order_id: null,
          product_id: null,
          product_code: null,
          inspection_id: null,
          quantity_affected: null,
          uom: null,
          root_cause: null,
          corrective_action: null,
          preventive_action: null,
          cost_nc_usd: null,
        }).success
      ).toBe(true)
    })
  })

  describe('source enum', () => {
    const sources = ['receiving', 'in_process', 'finished_goods', 'customer_return', 'audit'] as const

    test.each(sources)('accepts source "%s"', (source) => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), source }).success).toBe(true)
    })

    it('rejects an invalid source', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), source: 'shipping' }).success).toBe(false)
    })
  })

  describe('severity enum', () => {
    const severities = ['critical', 'major', 'minor'] as const

    test.each(severities)('accepts severity "%s"', (severity) => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), severity }).success).toBe(true)
    })

    it('rejects an invalid severity', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), severity: 'low' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['open', 'under_review', 'pending_disposition', 'resolved', 'closed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), status: 'draft' }).success).toBe(false)
    })
  })

  describe('disposition enum', () => {
    const dispositions = ['rework', 'scrap', 'use_as_is', 'return_to_supplier', 'downgrade'] as const

    test.each(dispositions)('accepts disposition "%s"', (disposition) => {
      expect(
        nonconformanceCreateSchema.safeParse({ ...validNC(), disposition }).success
      ).toBe(true)
    })

    it('accepts disposition as null (not yet decided)', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), disposition: null }).success).toBe(true)
    })

    it('rejects an invalid disposition', () => {
      expect(nonconformanceCreateSchema.safeParse({ ...validNC(), disposition: 'quarantine' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// nonconformanceUpdateSchema
// ---------------------------------------------------------------------------

describe('nonconformanceUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(nonconformanceUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (open → resolved)', () => {
    expect(nonconformanceUpdateSchema.safeParse({ status: 'resolved' }).success).toBe(true)
  })

  it('accepts a disposition-only update (assigning resolution)', () => {
    expect(nonconformanceUpdateSchema.safeParse({ disposition: 'rework' }).success).toBe(true)
  })

  it('still rejects invalid severity in partial update', () => {
    expect(nonconformanceUpdateSchema.safeParse({ severity: 'blocker' }).success).toBe(false)
  })
})
