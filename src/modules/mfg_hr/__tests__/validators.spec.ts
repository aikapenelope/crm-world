/**
 * Unit tests — mfg_hr validators
 *
 * Covers the Zod schemas for workers, shifts, labor tracking, and production
 * bonuses used in the Manufacturing HR vertical.
 *
 * Venezuelan manufacturing HR context:
 *   - hourly_rate_bs: wages in Bolívares (VES) per LOTTT (Ley Orgánica del
 *     Trabajo, los Trabajadores y las Trabajadoras)
 *   - is_night_shift: night-shift surcharge required by LOTTT Art. 117
 *     (30% nocturnal premium on base wage)
 *   - is_overtime: extra time pay required by LOTTT Art. 118 (50% premium)
 *   - productionBonus: bono de producción — performance incentive paid
 *     in Bolívares, separate from LOTTT statutory benefits
 *   - shift_type 'rotating': used for workers who alternate shifts weekly
 *     (only in workerCreateSchema — actual shift records use fixed shift_type)
 *   - qualified_operations: skills list for job assignment (e.g. 'soldadura',
 *     'montacargas', 'envasado') — used by work-center scheduler
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  workerCreateSchema,
  workerUpdateSchema,
  shiftCreateSchema,
  shiftUpdateSchema,
  laborTrackingCreateSchema,
  productionBonusCreateSchema,
  productionBonusUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid worker payload. */
const validWorker = () => ({
  employee_code: 'EMP-001',
  full_name: 'Carlos Pérez González',
})

/** Minimal valid shift payload. */
const validShift = () => ({
  shift_date: new Date('2026-01-15'),
  shift_type: 'morning' as const,
})

/** Minimal valid labor tracking payload. */
const validLabor = () => ({
  worker_id: UUID,
  worker_name: 'Carlos Pérez González',
  production_order_id: UUID2,
  order_number: 'OP-2026-001',
  work_date: new Date('2026-01-15'),
  shift_type: 'morning' as const,
  hours_worked: '8.00',
})

/** Minimal valid production bonus payload. */
const validBonus = () => ({
  bonus_number: 'BON-2026-001',
  period_start: new Date('2026-01-01'),
  period_end: new Date('2026-01-31'),
  planned_quantity: '50000',
  actual_quantity: '52500',
  achievement_pct: '105.00',
  bonus_amount_bs: '120000.00',
  bonus_per_worker_bs: '15000.00',
})

// ---------------------------------------------------------------------------
// workerCreateSchema
// ---------------------------------------------------------------------------

describe('workerCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid worker with defaults', () => {
      const result = workerCreateSchema.safeParse(validWorker())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift_type).toBe('morning')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when employee_code is missing', () => {
      const { employee_code: _omit, ...rest } = validWorker()
      expect(workerCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when full_name is missing', () => {
      const { full_name: _omit, ...rest } = validWorker()
      expect(workerCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts cedula as null (document not on file)', () => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), cedula: null }).success).toBe(true)
    })

    it('accepts hire_date as ISO string (coerced to Date)', () => {
      const result = workerCreateSchema.safeParse({
        ...validWorker(),
        hire_date: '2024-03-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hire_date).toBeInstanceOf(Date)
      }
    })

    it('accepts hourly_rate_bs as null (rate pending LOTTT adjustment)', () => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), hourly_rate_bs: null }).success).toBe(true)
    })

    it('accepts qualified_operations as array of skill strings', () => {
      const result = workerCreateSchema.safeParse({
        ...validWorker(),
        qualified_operations: ['envasado', 'montacargas', 'soldadura'],
      })
      expect(result.success).toBe(true)
    })

    it('accepts qualified_operations as null (generalist worker)', () => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), qualified_operations: null }).success).toBe(true)
    })

    it('accepts work_center_id as null (warehouse/utility worker)', () => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), work_center_id: null }).success).toBe(true)
    })
  })

  describe('shift_type enum — worker schedule type', () => {
    // 'rotating' only exists in workerCreateSchema (actual shifts use fixed type)
    const shifts = ['morning', 'afternoon', 'night', 'rotating'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), shift_type }).success).toBe(true)
    })

    it('rejects an invalid shift_type', () => {
      expect(workerCreateSchema.safeParse({ ...validWorker(), shift_type: 'split' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// workerUpdateSchema
// ---------------------------------------------------------------------------

describe('workerUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(workerUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating a worker)', () => {
    expect(workerUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid shift_type in partial update', () => {
    expect(workerUpdateSchema.safeParse({ shift_type: 'split' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// shiftCreateSchema
// ---------------------------------------------------------------------------

describe('shiftCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid shift with defaults', () => {
      const result = shiftCreateSchema.safeParse(validShift())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.workers_count).toBe(0)
        expect(result.data.status).toBe('planned')
      }
    })

    it('rejects when shift_date is missing', () => {
      const { shift_date: _omit, ...rest } = validShift()
      expect(shiftCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts shift_date as ISO string (coerced to Date)', () => {
      const result = shiftCreateSchema.safeParse({
        ...validShift(),
        shift_date: '2026-01-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift_date).toBeInstanceOf(Date)
      }
    })

    it('rejects workers_count below 0', () => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), workers_count: -1 }).success).toBe(false)
    })

    it('accepts work_center_id as null (all-plant shift)', () => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), work_center_id: null }).success).toBe(true)
    })

    it('accepts production fields as null (not yet assigned)', () => {
      expect(
        shiftCreateSchema.safeParse({
          ...validShift(),
          planned_production: null,
          actual_production: null,
          production_uom: null,
        }).success
      ).toBe(true)
    })
  })

  describe('shift_type enum (no rotating — actual shift records)', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), shift_type }).success).toBe(true)
    })

    it('rejects rotating shift_type (not valid for actual shift records)', () => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), shift_type: 'rotating' }).success).toBe(false)
    })

    it('rejects an invalid shift_type', () => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), shift_type: 'split' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['planned', 'active', 'completed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(shiftCreateSchema.safeParse({ ...validShift(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// shiftUpdateSchema
// ---------------------------------------------------------------------------

describe('shiftUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(shiftUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (planned → active)', () => {
    expect(shiftUpdateSchema.safeParse({ status: 'active' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// laborTrackingCreateSchema — LOTTT-compliant labor record
// ---------------------------------------------------------------------------

describe('laborTrackingCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid labor tracking record with defaults', () => {
      const result = laborTrackingCreateSchema.safeParse(validLabor())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_overtime).toBe(false)
        expect(result.data.is_night_shift).toBe(false)
      }
    })

    it('rejects when worker_id is not a UUID', () => {
      expect(laborTrackingCreateSchema.safeParse({ ...validLabor(), worker_id: 'bad' }).success).toBe(false)
    })

    it('rejects when production_order_id is not a UUID', () => {
      expect(laborTrackingCreateSchema.safeParse({ ...validLabor(), production_order_id: 'bad' }).success).toBe(false)
    })

    it('rejects when hours_worked is missing', () => {
      const { hours_worked: _omit, ...rest } = validLabor()
      expect(laborTrackingCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts work_date as ISO string (coerced to Date)', () => {
      const result = laborTrackingCreateSchema.safeParse({
        ...validLabor(),
        work_date: '2026-01-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.work_date).toBeInstanceOf(Date)
      }
    })

    it('accepts is_overtime = true with LOTTT 50% premium flag', () => {
      const result = laborTrackingCreateSchema.safeParse({
        ...validLabor(),
        is_overtime: true,
        hourly_rate_bs: '850.00',
        total_wages_bs: '1275.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_overtime).toBe(true)
      }
    })

    it('accepts is_night_shift = true with LOTTT 30% nocturnal premium', () => {
      const result = laborTrackingCreateSchema.safeParse({
        ...validLabor(),
        is_night_shift: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_night_shift).toBe(true)
      }
    })

    it('accepts operation_id as null (general production work)', () => {
      expect(laborTrackingCreateSchema.safeParse({ ...validLabor(), operation_id: null }).success).toBe(true)
    })

    it('accepts hourly_rate_bs and total_wages_bs as null (rate lookup deferred)', () => {
      expect(
        laborTrackingCreateSchema.safeParse({
          ...validLabor(),
          hourly_rate_bs: null,
          total_wages_bs: null,
        }).success
      ).toBe(true)
    })
  })

  describe('shift_type enum (fixed shifts only — no rotating)', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(laborTrackingCreateSchema.safeParse({ ...validLabor(), shift_type }).success).toBe(true)
    })

    it('rejects rotating shift_type in labor tracking', () => {
      expect(laborTrackingCreateSchema.safeParse({ ...validLabor(), shift_type: 'rotating' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// productionBonusCreateSchema — bono de producción (LOTTT incentive)
// ---------------------------------------------------------------------------

describe('productionBonusCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid production bonus with defaults', () => {
      const result = productionBonusCreateSchema.safeParse(validBonus())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.workers_count).toBe(1)
        expect(result.data.status).toBe('calculated')
      }
    })

    it('rejects when bonus_number is missing', () => {
      const { bonus_number: _omit, ...rest } = validBonus()
      expect(productionBonusCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects workers_count = 0 (must be positive)', () => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), workers_count: 0 }).success).toBe(false)
    })

    it('accepts period_start as ISO string (coerced to Date)', () => {
      const result = productionBonusCreateSchema.safeParse({
        ...validBonus(),
        period_start: '2026-01-01',
        period_end: '2026-01-31',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.period_start).toBeInstanceOf(Date)
        expect(result.data.period_end).toBeInstanceOf(Date)
      }
    })

    it('accepts production_order_id as null (department-wide bonus)', () => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), production_order_id: null }).success).toBe(true)
    })

    it('accepts shift_type as null (bonus covers full day)', () => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), shift_type: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['calculated', 'approved', 'paid'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), status: 'draft' }).success).toBe(false)
    })
  })

  describe('shift_type enum (optional — can be null)', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(productionBonusCreateSchema.safeParse({ ...validBonus(), shift_type }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// productionBonusUpdateSchema
// ---------------------------------------------------------------------------

describe('productionBonusUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(productionBonusUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (calculated → approved)', () => {
    expect(productionBonusUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(productionBonusUpdateSchema.safeParse({ status: 'draft' }).success).toBe(false)
  })
})
