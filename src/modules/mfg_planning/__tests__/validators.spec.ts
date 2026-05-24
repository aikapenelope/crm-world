/**
 * Unit tests — mfg_planning validators
 *
 * Covers the Zod schemas for master production schedules and energy windows
 * used in the Manufacturing Planning vertical.
 *
 * Venezuelan manufacturing planning context:
 *   - Master schedule week_start / week_end align with ISOCalendar Mon-Sun
 *   - Energy windows model CORPOELEC rationing schedules (programmed cuts)
 *   - restriction_type 'restriction' = programmed CORPOELEC cut (shift planning blocker)
 *   - restriction_type 'unstable' = voltage fluctuation risk (low reliability)
 *   - reliability_pct drives MPS feasibility calculations
 *   - day_of_week: 0=Sunday ... 6=Saturday (JS Date convention)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  masterScheduleCreateSchema,
  masterScheduleUpdateSchema,
  energyWindowCreateSchema,
  energyWindowUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid master schedule payload. */
const validSchedule = () => ({
  schedule_number: 'MPS-2026-W04',
  week_start: new Date('2026-01-26'),
  week_end: new Date('2026-02-01'),
  product_id: UUID,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  planned_quantity: '5000',
  uom: 'CAJA',
})

/** Minimal valid energy window payload (Monday 12:00-16:00 CORPOELEC restriction). */
const validEnergyWindow = () => ({
  zone: 'Zulia Zona 4',
  day_of_week: 1,
  hour_start: 12,
  hour_end: 16,
})

// ---------------------------------------------------------------------------
// masterScheduleCreateSchema
// ---------------------------------------------------------------------------

describe('masterScheduleCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid master schedule with defaults', () => {
      const result = masterScheduleCreateSchema.safeParse(validSchedule())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('planned')
        expect(result.data.priority).toBe(50)
      }
    })

    it('rejects when schedule_number is missing', () => {
      const { schedule_number: _omit, ...rest } = validSchedule()
      expect(masterScheduleCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(masterScheduleCreateSchema.safeParse({ ...validSchedule(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_code is missing', () => {
      const { product_code: _omit, ...rest } = validSchedule()
      expect(masterScheduleCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts week_start as ISO string (coerced to Date)', () => {
      const result = masterScheduleCreateSchema.safeParse({
        ...validSchedule(),
        week_start: '2026-01-26',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.week_start).toBeInstanceOf(Date)
      }
    })

    it('accepts work_center_id as null (no specific line assigned)', () => {
      expect(
        masterScheduleCreateSchema.safeParse({ ...validSchedule(), work_center_id: null }).success
      ).toBe(true)
    })

    it('accepts planned_start and planned_end as null (flexible scheduling)', () => {
      expect(
        masterScheduleCreateSchema.safeParse({
          ...validSchedule(),
          planned_start: null,
          planned_end: null,
        }).success
      ).toBe(true)
    })

    it('rejects priority below 1', () => {
      expect(
        masterScheduleCreateSchema.safeParse({ ...validSchedule(), priority: 0 }).success
      ).toBe(false)
    })

    it('rejects priority above 100', () => {
      expect(
        masterScheduleCreateSchema.safeParse({ ...validSchedule(), priority: 101 }).success
      ).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['planned', 'confirmed', 'in_progress', 'completed'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(masterScheduleCreateSchema.safeParse({ ...validSchedule(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(
        masterScheduleCreateSchema.safeParse({ ...validSchedule(), status: 'cancelled' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// masterScheduleUpdateSchema
// ---------------------------------------------------------------------------

describe('masterScheduleUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(masterScheduleUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (planned → confirmed)', () => {
    expect(masterScheduleUpdateSchema.safeParse({ status: 'confirmed' }).success).toBe(true)
  })

  it('accepts a priority-only update', () => {
    expect(masterScheduleUpdateSchema.safeParse({ priority: 80 }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// energyWindowCreateSchema — CORPOELEC rationing schedule
// ---------------------------------------------------------------------------

describe('energyWindowCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid energy window with defaults', () => {
      const result = energyWindowCreateSchema.safeParse(validEnergyWindow())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.restriction_type).toBe('restriction')
        expect(result.data.reliability_pct).toBe('80.00')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when zone is missing', () => {
      const { zone: _omit, ...rest } = validEnergyWindow()
      expect(energyWindowCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects day_of_week below 0', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), day_of_week: -1 }).success
      ).toBe(false)
    })

    it('rejects day_of_week above 6', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), day_of_week: 7 }).success
      ).toBe(false)
    })

    it('rejects hour_start below 0', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_start: -1 }).success
      ).toBe(false)
    })

    it('rejects hour_start above 23', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_start: 24 }).success
      ).toBe(false)
    })

    it('rejects hour_end below 0', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_end: -1 }).success
      ).toBe(false)
    })

    it('rejects hour_end above 23', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_end: 24 }).success
      ).toBe(false)
    })

    it('accepts all valid hours 0-23 for hour_start', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_start: 0 }).success
      ).toBe(true)
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), hour_start: 23 }).success
      ).toBe(true)
    })

    it('accepts valid_from and valid_until as null (permanent schedule)', () => {
      expect(
        energyWindowCreateSchema.safeParse({
          ...validEnergyWindow(),
          valid_from: null,
          valid_until: null,
        }).success
      ).toBe(true)
    })

    it('accepts valid_from as ISO string (coerced to Date)', () => {
      const result = energyWindowCreateSchema.safeParse({
        ...validEnergyWindow(),
        valid_from: '2026-01-01',
        valid_until: '2026-06-30',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.valid_from).toBeInstanceOf(Date)
        expect(result.data.valid_until).toBeInstanceOf(Date)
      }
    })
  })

  describe('restriction_type enum — CORPOELEC rationing categories', () => {
    const types = ['restriction', 'reliable', 'unstable'] as const

    test.each(types)('accepts restriction_type "%s"', (restriction_type) => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), restriction_type }).success
      ).toBe(true)
    })

    it('rejects an invalid restriction_type', () => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), restriction_type: 'blackout' }).success
      ).toBe(false)
    })
  })

  describe('all days of week (0=Sunday through 6=Saturday)', () => {
    const days = [0, 1, 2, 3, 4, 5, 6] as const

    test.each(days)('accepts day_of_week = %d', (day_of_week) => {
      expect(
        energyWindowCreateSchema.safeParse({ ...validEnergyWindow(), day_of_week }).success
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// energyWindowUpdateSchema
// ---------------------------------------------------------------------------

describe('energyWindowUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(energyWindowUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating a window)', () => {
    expect(energyWindowUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid restriction_type in partial update', () => {
    expect(energyWindowUpdateSchema.safeParse({ restriction_type: 'blackout' }).success).toBe(false)
  })
})
