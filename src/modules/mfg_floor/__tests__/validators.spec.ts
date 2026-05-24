/**
 * Unit tests — mfg_floor validators
 *
 * Covers the Zod schemas for shift reports used in the Manufacturing
 * Shop Floor (piso de producción) vertical.
 *
 * Venezuelan manufacturing floor context:
 *   - Three shifts: morning (06:00-14:00), afternoon (14:00-22:00), night (22:00-06:00)
 *   - OEE split into total and internal components:
 *     - oee_total_pct: includes CORPOELEC downtime (force-majeure)
 *     - oee_internal_pct: excludes CORPOELEC downtime (internal performance)
 *   - electrical_downtime_hrs: hours lost to CORPOELEC power cuts (SENIAT-reportable)
 *   - All production quantities stored as strings (decimals, 4 places)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  shiftReportCreateSchema,
  shiftReportUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid shift report payload. */
const validShiftReport = () => ({
  report_number: 'SR-2026-001',
  shift_type: 'morning' as const,
  shift_date: new Date('2026-01-15'),
  shift_start: new Date('2026-01-15T06:00:00Z'),
})

// ---------------------------------------------------------------------------
// shiftReportCreateSchema
// ---------------------------------------------------------------------------

describe('shiftReportCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid shift report with defaults', () => {
      const result = shiftReportCreateSchema.safeParse(validShiftReport())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.planned_production).toBe('0.0000')
        expect(result.data.actual_production).toBe('0.0000')
        expect(result.data.rejected_units).toBe('0.0000')
        expect(result.data.total_downtime_hrs).toBe('0.0000')
        expect(result.data.electrical_downtime_hrs).toBe('0.0000')
        expect(result.data.internal_downtime_hrs).toBe('0.0000')
      }
    })

    it('rejects when report_number is missing', () => {
      const { report_number: _omit, ...rest } = validShiftReport()
      expect(shiftReportCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when shift_date is missing', () => {
      const { shift_date: _omit, ...rest } = validShiftReport()
      expect(shiftReportCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when shift_start is missing', () => {
      const { shift_start: _omit, ...rest } = validShiftReport()
      expect(shiftReportCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts shift_date as ISO string (coerced to Date)', () => {
      const result = shiftReportCreateSchema.safeParse({
        ...validShiftReport(),
        shift_date: '2026-01-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift_date).toBeInstanceOf(Date)
      }
    })

    it('accepts shift_start as ISO string (coerced to Date)', () => {
      const result = shiftReportCreateSchema.safeParse({
        ...validShiftReport(),
        shift_start: '2026-01-15T06:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift_start).toBeInstanceOf(Date)
      }
    })

    it('accepts shift_end as ISO string (coerced to Date)', () => {
      const result = shiftReportCreateSchema.safeParse({
        ...validShiftReport(),
        shift_end: '2026-01-15T14:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shift_end).toBeInstanceOf(Date)
      }
    })

    it('accepts shift_end as null (shift still in progress)', () => {
      expect(
        shiftReportCreateSchema.safeParse({ ...validShiftReport(), shift_end: null }).success
      ).toBe(true)
    })

    it('accepts optional production values', () => {
      const result = shiftReportCreateSchema.safeParse({
        ...validShiftReport(),
        planned_production: '1000.0000',
        actual_production: '985.5000',
        rejected_units: '14.5000',
        production_uom: 'CAJA',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.planned_production).toBe('1000.0000')
        expect(result.data.actual_production).toBe('985.5000')
        expect(result.data.rejected_units).toBe('14.5000')
      }
    })

    it('accepts OEE percentages as null (not yet calculated)', () => {
      expect(
        shiftReportCreateSchema.safeParse({
          ...validShiftReport(),
          oee_total_pct: null,
          oee_internal_pct: null,
        }).success
      ).toBe(true)
    })

    it('accepts work_center_id as UUID', () => {
      expect(
        shiftReportCreateSchema.safeParse({ ...validShiftReport(), work_center_id: UUID }).success
      ).toBe(true)
    })
  })

  describe('shift_type enum', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(shiftReportCreateSchema.safeParse({ ...validShiftReport(), shift_type }).success).toBe(true)
    })

    it('rejects an invalid shift_type', () => {
      expect(
        shiftReportCreateSchema.safeParse({ ...validShiftReport(), shift_type: 'overtime' }).success
      ).toBe(false)
    })
  })

  describe('downtime tracking — bipartite OEE reporting', () => {
    it('accepts electrical_downtime_hrs for CORPOELEC cuts', () => {
      const result = shiftReportCreateSchema.safeParse({
        ...validShiftReport(),
        total_downtime_hrs: '2.5000',
        electrical_downtime_hrs: '2.0000',
        internal_downtime_hrs: '0.5000',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.electrical_downtime_hrs).toBe('2.0000')
        expect(result.data.internal_downtime_hrs).toBe('0.5000')
      }
    })
  })
})

// ---------------------------------------------------------------------------
// shiftReportUpdateSchema
// ---------------------------------------------------------------------------

describe('shiftReportUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(shiftReportUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial update with only actual_production', () => {
    expect(
      shiftReportUpdateSchema.safeParse({ actual_production: '990.0000' }).success
    ).toBe(true)
  })

  it('accepts OEE update after shift closes', () => {
    expect(
      shiftReportUpdateSchema.safeParse({
        oee_total_pct: '72.50',
        oee_internal_pct: '88.30',
        shift_end: new Date('2026-01-15T14:00:00Z'),
      }).success
    ).toBe(true)
  })

  it('still rejects invalid shift_type in partial update', () => {
    expect(shiftReportUpdateSchema.safeParse({ shift_type: 'overtime' }).success).toBe(false)
  })
})
