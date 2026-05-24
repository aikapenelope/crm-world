/**
 * Unit tests — const_daily validators
 *
 * Covers the Zod schemas for daily construction reports, labor records, and
 * activity records used in the Construction Daily Report vertical.
 *
 * Venezuelan construction daily report context:
 *   - Reporte diario de obra: required by CONAVI and private clients for
 *     progress monitoring and incident documentation
 *   - weather enum: affects productivity factor; 'rainy' triggers downtime
 *     records and potential EOT (Extension of Time) claims
 *   - safety_incidents: reportes LOPCYMAT (Ley Orgánica de Prevención,
 *     Condiciones y Medio Ambiente de Trabajo) — zero-tolerance policy
 *   - temperature_high / temperature_low: relevant for concrete curing,
 *     epoxy works, and outdoor works in extreme Venezuelan heat (>35°C)
 *   - work_hours default '8.0': jornada ordinaria LOTTT (8 hours)
 *   - createLaborSchema: cuadrillas (work crews) — headcount + trade for
 *     IVSS (seguro social) and LOPCYMAT workforce reporting
 *   - createActivitySchema: partidas ejecutadas por zona (by area) for
 *     linking actual work to scheduled tasks and budget items
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createDailyReportSchema,
  updateDailyReportSchema,
  createLaborSchema,
  createActivitySchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid daily report payload. */
const validReport = () => ({
  project_id: UUID,
  report_date: '2026-01-15',
})

/** Minimal valid labor record payload. */
const validLabor = () => ({
  report_id: UUID,
  trade: 'albañilería',
  headcount: 8,
  hours_worked: '8.0',
})

/** Minimal valid activity record payload. */
const validActivity = () => ({
  report_id: UUID,
  area: 'Nivel 2 — Eje A-D',
  description: 'Vaciado de losa de entrepiso con concreto 280 kg/cm²',
})

// ---------------------------------------------------------------------------
// createDailyReportSchema
// ---------------------------------------------------------------------------

describe('createDailyReportSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid daily report with defaults', () => {
      const result = createDailyReportSchema.safeParse(validReport())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.weather).toBe('sunny')
        expect(result.data.work_hours).toBe('8.0')
        expect(result.data.status).toBe('draft')
        expect(result.data.safety_incidents).toBe(0)
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when report_date is missing', () => {
      const { report_date: _omit, ...rest } = validReport()
      expect(createDailyReportSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts report_date as plain string (not Date)', () => {
      const result = createDailyReportSchema.safeParse(validReport())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.report_date).toBe('string')
        expect(result.data.report_date).toBe('2026-01-15')
      }
    })

    it('rejects safety_incidents below 0', () => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), safety_incidents: -1 }).success).toBe(false)
    })

    it('coerces safety_incidents from string', () => {
      const result = createDailyReportSchema.safeParse({ ...validReport(), safety_incidents: '2' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.safety_incidents).toBe(2)
      }
    })

    it('accepts temperature_high and temperature_low as numbers', () => {
      const result = createDailyReportSchema.safeParse({
        ...validReport(),
        temperature_high: 36.5,
        temperature_low: 28.0,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.temperature_high).toBe(36.5)
        expect(result.data.temperature_low).toBe(28.0)
      }
    })

    it('coerces temperature_high from string', () => {
      const result = createDailyReportSchema.safeParse({ ...validReport(), temperature_high: '36.5' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.temperature_high).toBe(36.5)
      }
    })

    it('accepts temperature_high and temperature_low as null (not recorded)', () => {
      expect(
        createDailyReportSchema.safeParse({
          ...validReport(),
          temperature_high: null,
          temperature_low: null,
        }).success
      ).toBe(true)
    })

    it('accepts optional text fields as null', () => {
      expect(
        createDailyReportSchema.safeParse({
          ...validReport(),
          overall_notes: null,
          safety_notes: null,
          submitted_by: null,
        }).success
      ).toBe(true)
    })
  })

  describe('weather enum', () => {
    const conditions = ['sunny', 'cloudy', 'rainy', 'windy', 'foggy'] as const

    test.each(conditions)('accepts weather "%s"', (weather) => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), weather }).success).toBe(true)
    })

    it('rejects an invalid weather', () => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), weather: 'stormy' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'submitted', 'approved'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createDailyReportSchema.safeParse({ ...validReport(), status: 'rejected' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateDailyReportSchema
// ---------------------------------------------------------------------------

describe('updateDailyReportSchema', () => {
  it('accepts an empty object', () => {
    expect(updateDailyReportSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (draft → submitted)', () => {
    expect(updateDailyReportSchema.safeParse({ status: 'submitted' }).success).toBe(true)
  })

  it('still rejects invalid weather in partial update', () => {
    expect(updateDailyReportSchema.safeParse({ weather: 'stormy' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createLaborSchema — cuadrillas / workforce tracking
// ---------------------------------------------------------------------------

describe('createLaborSchema', () => {
  it('accepts a minimal valid labor record', () => {
    expect(createLaborSchema.safeParse(validLabor()).success).toBe(true)
  })

  it('rejects when report_id is not a UUID', () => {
    expect(createLaborSchema.safeParse({ ...validLabor(), report_id: 'bad' }).success).toBe(false)
  })

  it('rejects when trade is missing', () => {
    const { trade: _omit, ...rest } = validLabor()
    expect(createLaborSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects headcount = 0 (must be at least 1)', () => {
    expect(createLaborSchema.safeParse({ ...validLabor(), headcount: 0 }).success).toBe(false)
  })

  it('coerces headcount from string', () => {
    const result = createLaborSchema.safeParse({ ...validLabor(), headcount: '12' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.headcount).toBe(12)
    }
  })

  it('rejects when hours_worked is missing', () => {
    const { hours_worked: _omit, ...rest } = validLabor()
    expect(createLaborSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts contractor_name as null (direct labor)', () => {
    expect(createLaborSchema.safeParse({ ...validLabor(), contractor_name: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createActivitySchema — partidas ejecutadas por área
// ---------------------------------------------------------------------------

describe('createActivitySchema', () => {
  it('accepts a minimal valid activity record', () => {
    expect(createActivitySchema.safeParse(validActivity()).success).toBe(true)
  })

  it('rejects when report_id is not a UUID', () => {
    expect(createActivitySchema.safeParse({ ...validActivity(), report_id: 'bad' }).success).toBe(false)
  })

  it('rejects when area is missing', () => {
    const { area: _omit, ...rest } = validActivity()
    expect(createActivitySchema.safeParse(rest).success).toBe(false)
  })

  it('rejects when description is empty', () => {
    expect(createActivitySchema.safeParse({ ...validActivity(), description: '' }).success).toBe(false)
  })

  it('accepts task_id as null (activity not linked to schedule)', () => {
    expect(createActivitySchema.safeParse({ ...validActivity(), task_id: null }).success).toBe(true)
  })

  it('accepts task_id as a UUID (linked to Gantt task)', () => {
    expect(createActivitySchema.safeParse({ ...validActivity(), task_id: UUID2 }).success).toBe(true)
  })

  it('accepts quantity, unit, and percent_complete as null', () => {
    expect(
      createActivitySchema.safeParse({
        ...validActivity(),
        quantity: null,
        unit: null,
        percent_complete: null,
      }).success
    ).toBe(true)
  })

  it('accepts quantity and unit for measured work', () => {
    const result = createActivitySchema.safeParse({
      ...validActivity(),
      quantity: '45.00',
      unit: 'M3',
      percent_complete: '22.50',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe('45.00')
      expect(result.data.percent_complete).toBe('22.50')
    }
  })
})
