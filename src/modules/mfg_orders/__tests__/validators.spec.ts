/**
 * Unit tests — mfg_orders validators
 *
 * Covers the Zod schemas for work centers, production orders, order operations,
 * material issues, and downtime records used in the Manufacturing vertical.
 *
 * Venezuelan manufacturing context:
 *   - Downtime causes include electrical cuts (CORPOELEC OEE impact split)
 *   - material_shortage is a first-class cause category due to scarcity
 *   - is_force_majeure distinguishes CORPOELEC cuts from internal failures
 *     (split required by Venezuela's bipartite OEE reporting standard)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  workCenterCreateSchema,
  workCenterUpdateSchema,
  productionOrderCreateSchema,
  productionOrderUpdateSchema,
  orderOperationCreateSchema,
  orderOperationUpdateSchema,
  materialIssueCreateSchema,
  downtimeCreateSchema,
  downtimeUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid work center payload. */
const validWorkCenter = () => ({
  code: 'WC-LIN-01',
  name: 'Línea de envasado 1',
})

/** Minimal valid production order payload. */
const validOrder = () => ({
  order_number: 'OP-2026-001',
  bom_id: UUID,
  product_id: UUID2,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  planned_quantity: '1000',
  uom: 'CAJA',
})

/** Minimal valid downtime payload (CORPOELEC cut). */
const validDowntime = () => ({
  started_at: new Date('2026-01-15T14:00:00Z'),
  cause_category: 'electrical_cut' as const,
  cause_description: 'Corte eléctrico CORPOELEC — Zona 4 Maracaibo',
})

// ---------------------------------------------------------------------------
// workCenterCreateSchema
// ---------------------------------------------------------------------------

describe('workCenterCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid work center with defaults', () => {
      const result = workCenterCreateSchema.safeParse(validWorkCenter())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('line')
        expect(result.data.capacity_hrs_per_shift).toBe('8.00')
        expect(result.data.efficiency_pct).toBe('100.00')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validWorkCenter()
      expect(workCenterCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validWorkCenter()
      expect(workCenterCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects code longer than 30 chars', () => {
      expect(workCenterCreateSchema.safeParse({ ...validWorkCenter(), code: 'X'.repeat(31) }).success).toBe(false)
    })
  })

  describe('type enum', () => {
    const types = ['machine', 'line', 'cell', 'manual'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(workCenterCreateSchema.safeParse({ ...validWorkCenter(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(workCenterCreateSchema.safeParse({ ...validWorkCenter(), type: 'robot' }).success).toBe(false)
    })
  })

  it('accepts cost_per_hr_usd as null (no cost tracking)', () => {
    expect(workCenterCreateSchema.safeParse({ ...validWorkCenter(), cost_per_hr_usd: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// workCenterUpdateSchema
// ---------------------------------------------------------------------------

describe('workCenterUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(workCenterUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts efficiency-only update', () => {
    expect(workCenterUpdateSchema.safeParse({ efficiency_pct: '95.00' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// productionOrderCreateSchema
// ---------------------------------------------------------------------------

describe('productionOrderCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid production order with defaults', () => {
      const result = productionOrderCreateSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('planned')
      }
    })

    it('rejects when order_number is missing', () => {
      const { order_number: _omit, ...rest } = validOrder()
      expect(productionOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when bom_id is not a UUID', () => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), bom_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), product_id: 'bad' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['planned', 'released', 'in_progress', 'completed', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), status: 'draft' }).success).toBe(false)
    })
  })

  describe('scheduled dates', () => {
    it('accepts ISO date strings coerced to Date (scheduled_start)', () => {
      const result = productionOrderCreateSchema.safeParse({
        ...validOrder(),
        scheduled_start: '2026-02-01T08:00:00Z',
        scheduled_end: '2026-02-01T16:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduled_start).toBeInstanceOf(Date)
      }
    })

    it('accepts null scheduled_start and scheduled_end', () => {
      expect(
        productionOrderCreateSchema.safeParse({
          ...validOrder(),
          scheduled_start: null,
          scheduled_end: null,
        }).success
      ).toBe(true)
    })
  })

  describe('string length limits', () => {
    it('rejects order_number longer than 50 chars', () => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), order_number: 'X'.repeat(51) }).success).toBe(false)
    })

    it('rejects uom longer than 20 chars', () => {
      expect(productionOrderCreateSchema.safeParse({ ...validOrder(), uom: 'U'.repeat(21) }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// productionOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('productionOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(productionOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(productionOrderUpdateSchema.safeParse({ status: 'released' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// orderOperationCreateSchema
// ---------------------------------------------------------------------------

describe('orderOperationCreateSchema', () => {
  const validOperation = () => ({
    order_id: UUID,
    operation_number: 1,
    operation_name: 'Mezclado de ingredientes',
    planned_duration_hrs: '2.50',
  })

  it('accepts a minimal valid operation with defaults', () => {
    const result = orderOperationCreateSchema.safeParse(validOperation())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('pending')
    }
  })

  it('rejects operation_number = 0 (must be positive)', () => {
    expect(orderOperationCreateSchema.safeParse({ ...validOperation(), operation_number: 0 }).success).toBe(false)
  })

  it('rejects a negative operation_number', () => {
    expect(orderOperationCreateSchema.safeParse({ ...validOperation(), operation_number: -1 }).success).toBe(false)
  })

  describe('status enum', () => {
    const statuses = ['pending', 'in_progress', 'completed', 'skipped'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(orderOperationCreateSchema.safeParse({ ...validOperation(), status }).success).toBe(true)
    })

    it('rejects an invalid operation status', () => {
      expect(orderOperationCreateSchema.safeParse({ ...validOperation(), status: 'paused' }).success).toBe(false)
    })
  })

  it('accepts optional work_center_id as null', () => {
    expect(orderOperationCreateSchema.safeParse({ ...validOperation(), work_center_id: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// orderOperationUpdateSchema
// ---------------------------------------------------------------------------

describe('orderOperationUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(orderOperationUpdateSchema.safeParse({}).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// materialIssueCreateSchema
// ---------------------------------------------------------------------------

describe('materialIssueCreateSchema', () => {
  const validIssue = () => ({
    order_id: UUID,
    component_code: 'MP-HARINA',
    component_name: 'Harina de trigo',
    planned_quantity: '500',
    issued_quantity: '498.5',
    uom: 'KG',
    issue_date: new Date('2026-02-01T10:00:00Z'),
  })

  it('accepts a minimal valid material issue', () => {
    expect(materialIssueCreateSchema.safeParse(validIssue()).success).toBe(true)
  })

  it('rejects when order_id is not a UUID', () => {
    expect(materialIssueCreateSchema.safeParse({ ...validIssue(), order_id: 'bad' }).success).toBe(false)
  })

  it('accepts issue_date as an ISO string (coerced to Date)', () => {
    const result = materialIssueCreateSchema.safeParse({
      ...validIssue(),
      issue_date: '2026-02-01T10:00:00Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.issue_date).toBeInstanceOf(Date)
    }
  })

  it('accepts optional lot_id and lot_number as null', () => {
    expect(
      materialIssueCreateSchema.safeParse({
        ...validIssue(),
        lot_id: null,
        lot_number: null,
      }).success
    ).toBe(true)
  })

  it('accepts optional bom_line_id as null (free-form issue)', () => {
    expect(materialIssueCreateSchema.safeParse({ ...validIssue(), bom_line_id: null }).success).toBe(true)
  })

  it('rejects lot_number longer than 50 chars', () => {
    expect(
      materialIssueCreateSchema.safeParse({ ...validIssue(), lot_number: 'L'.repeat(51) }).success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// downtimeCreateSchema — OEE bipartido (internal vs CORPOELEC)
// ---------------------------------------------------------------------------

describe('downtimeCreateSchema', () => {
  it('accepts a minimal valid downtime (CORPOELEC cut)', () => {
    const result = downtimeCreateSchema.safeParse(validDowntime())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_force_majeure).toBe(false)
      expect(result.data.started_at).toBeInstanceOf(Date)
    }
  })

  it('accepts is_force_majeure=true for CORPOELEC cuts (split OEE reporting)', () => {
    const result = downtimeCreateSchema.safeParse({
      ...validDowntime(),
      is_force_majeure: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts ended_at as null (downtime still active)', () => {
    expect(downtimeCreateSchema.safeParse({ ...validDowntime(), ended_at: null }).success).toBe(true)
  })

  it('rejects when cause_description is empty', () => {
    expect(downtimeCreateSchema.safeParse({ ...validDowntime(), cause_description: '' }).success).toBe(false)
  })

  describe('cause_category enum — Venezuelan manufacturing context', () => {
    const causes = [
      'electrical_cut',
      'mechanical_failure',
      'material_shortage',
      'quality_hold',
      'format_change',
      'maintenance',
      'operator_absence',
      'other',
    ] as const

    test.each(causes)('accepts cause_category "%s"', (cause_category) => {
      expect(downtimeCreateSchema.safeParse({ ...validDowntime(), cause_category }).success).toBe(true)
    })

    it('rejects an invalid cause_category', () => {
      expect(downtimeCreateSchema.safeParse({ ...validDowntime(), cause_category: 'planned_stop' }).success).toBe(false)
    })
  })

  it('accepts started_at as an ISO string (coerced to Date)', () => {
    const result = downtimeCreateSchema.safeParse({
      ...validDowntime(),
      started_at: '2026-01-15T14:00:00Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.started_at).toBeInstanceOf(Date)
    }
  })
})

// ---------------------------------------------------------------------------
// downtimeUpdateSchema
// ---------------------------------------------------------------------------

describe('downtimeUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(downtimeUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts ended_at-only update (closing a downtime)', () => {
    expect(downtimeUpdateSchema.safeParse({ ended_at: new Date() }).success).toBe(true)
  })
})
