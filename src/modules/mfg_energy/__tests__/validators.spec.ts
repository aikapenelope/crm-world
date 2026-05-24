/**
 * Unit tests — mfg_energy validators
 *
 * Covers the Zod schemas for energy consumption records and power outage logs
 * used in the Manufacturing Energy vertical.
 *
 * Venezuelan manufacturing energy context:
 *   - CORPOELEC is the state electricity provider — unreliable supply is endemic
 *   - Three energy sources: grid (CORPOELEC), generator (planta eléctrica), mixed
 *   - Power outages tracked for: ISLR force-majeure, OEE bipartite reporting,
 *     and SENIAT insurance claims
 *   - generator_fuel_liters / fuel_cost_usd track diesel consumption cost in USD
 *   - scheduled_restriction: programmed CORPOELEC rationing (rationamiento)
 *   - complete_blackout: emergency nationwide cut (apagón general)
 *   - duration_hrs defaults to 8.00 (standard 8-hour shift energy period)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  energyConsumptionCreateSchema,
  powerOutageCreateSchema,
  powerOutageUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid energy consumption payload. */
const validConsumption = () => ({
  work_center_code: 'WC-LIN-01',
  work_center_name: 'Línea de envasado 1',
  record_date: new Date('2026-01-15'),
  shift_type: 'morning' as const,
  kwh_consumed: '245.50',
})

/** Minimal valid power outage payload. */
const validOutage = () => ({
  started_at: new Date('2026-01-15T14:00:00Z'),
})

// ---------------------------------------------------------------------------
// energyConsumptionCreateSchema
// ---------------------------------------------------------------------------

describe('energyConsumptionCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid energy consumption record with defaults', () => {
      const result = energyConsumptionCreateSchema.safeParse(validConsumption())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.energy_source).toBe('grid')
        expect(result.data.duration_hrs).toBe('8.00')
        expect(result.data.generator_hrs).toBe('0.00')
      }
    })

    it('rejects when work_center_code is missing', () => {
      const { work_center_code: _omit, ...rest } = validConsumption()
      expect(energyConsumptionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when work_center_name is missing', () => {
      const { work_center_name: _omit, ...rest } = validConsumption()
      expect(energyConsumptionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when kwh_consumed is missing', () => {
      const { kwh_consumed: _omit, ...rest } = validConsumption()
      expect(energyConsumptionCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts record_date as ISO string (coerced to Date)', () => {
      const result = energyConsumptionCreateSchema.safeParse({
        ...validConsumption(),
        record_date: '2026-01-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.record_date).toBeInstanceOf(Date)
      }
    })

    it('accepts work_center_id as null (ad-hoc consumption)', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), work_center_id: null }).success
      ).toBe(true)
    })

    it('accepts work_center_id as UUID (linked to work center)', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), work_center_id: UUID }).success
      ).toBe(true)
    })

    it('accepts production_order_id as null (no linked order)', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), production_order_id: null }).success
      ).toBe(true)
    })

    it('accepts optional cost fields as null', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({
          ...validConsumption(),
          cost_per_kwh_usd: null,
          total_energy_cost_usd: null,
          generator_fuel_cost_usd: null,
          kwh_planned: null,
        }).success
      ).toBe(true)
    })

    it('accepts a mixed-source record with generator hours and fuel cost', () => {
      const result = energyConsumptionCreateSchema.safeParse({
        ...validConsumption(),
        energy_source: 'mixed',
        generator_hrs: '4.00',
        generator_fuel_cost_usd: '28.50',
        kwh_planned: '300.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.energy_source).toBe('mixed')
        expect(result.data.generator_hrs).toBe('4.00')
      }
    })
  })

  describe('shift_type enum', () => {
    const shifts = ['morning', 'afternoon', 'night'] as const

    test.each(shifts)('accepts shift_type "%s"', (shift_type) => {
      expect(energyConsumptionCreateSchema.safeParse({ ...validConsumption(), shift_type }).success).toBe(true)
    })

    it('rejects an invalid shift_type', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), shift_type: 'overtime' }).success
      ).toBe(false)
    })
  })

  describe('energy_source enum', () => {
    const sources = ['grid', 'generator', 'mixed'] as const

    test.each(sources)('accepts energy_source "%s"', (energy_source) => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), energy_source }).success
      ).toBe(true)
    })

    it('rejects an invalid energy_source', () => {
      expect(
        energyConsumptionCreateSchema.safeParse({ ...validConsumption(), energy_source: 'solar' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// powerOutageCreateSchema — CORPOELEC event logging
// ---------------------------------------------------------------------------

describe('powerOutageCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid power outage with defaults', () => {
      const result = powerOutageCreateSchema.safeParse(validOutage())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.outage_type).toBe('unscheduled_cut')
        expect(result.data.used_generator).toBe(false)
      }
    })

    it('rejects when started_at is missing', () => {
      expect(powerOutageCreateSchema.safeParse({}).success).toBe(false)
    })

    it('accepts started_at as ISO string (coerced to Date)', () => {
      const result = powerOutageCreateSchema.safeParse({
        started_at: '2026-01-15T14:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.started_at).toBeInstanceOf(Date)
      }
    })

    it('accepts ended_at as null (outage still active)', () => {
      expect(
        powerOutageCreateSchema.safeParse({ ...validOutage(), ended_at: null }).success
      ).toBe(true)
    })

    it('accepts ended_at as ISO string (outage resolved)', () => {
      const result = powerOutageCreateSchema.safeParse({
        ...validOutage(),
        ended_at: '2026-01-15T18:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ended_at).toBeInstanceOf(Date)
      }
    })

    it('accepts used_generator = true with fuel data', () => {
      const result = powerOutageCreateSchema.safeParse({
        ...validOutage(),
        used_generator: true,
        generator_fuel_liters: '120.00',
        fuel_cost_usd: '85.20',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.used_generator).toBe(true)
        expect(result.data.generator_fuel_liters).toBe('120.00')
        expect(result.data.fuel_cost_usd).toBe('85.20')
      }
    })

    it('accepts optional impact fields as null', () => {
      expect(
        powerOutageCreateSchema.safeParse({
          ...validOutage(),
          zone: null,
          impact_production_hrs_lost: null,
          products_affected: null,
          generator_fuel_liters: null,
          fuel_cost_usd: null,
        }).success
      ).toBe(true)
    })
  })

  describe('outage_type enum — CORPOELEC event taxonomy', () => {
    const types = [
      'scheduled_restriction',
      'unscheduled_cut',
      'voltage_fluctuation',
      'complete_blackout',
    ] as const

    test.each(types)('accepts outage_type "%s"', (outage_type) => {
      expect(powerOutageCreateSchema.safeParse({ ...validOutage(), outage_type }).success).toBe(true)
    })

    it('rejects an invalid outage_type', () => {
      expect(
        powerOutageCreateSchema.safeParse({ ...validOutage(), outage_type: 'maintenance' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// powerOutageUpdateSchema
// ---------------------------------------------------------------------------

describe('powerOutageUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(powerOutageUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts ended_at-only update (closing an outage event)', () => {
    expect(
      powerOutageUpdateSchema.safeParse({ ended_at: new Date('2026-01-15T18:00:00Z') }).success
    ).toBe(true)
  })

  it('accepts notes-only update (adding CORPOELEC ticket reference)', () => {
    expect(
      powerOutageUpdateSchema.safeParse({ notes: 'Ticket CORPOELEC #2026-00451' }).success
    ).toBe(true)
  })

  it('still rejects invalid outage_type in partial update', () => {
    expect(powerOutageUpdateSchema.safeParse({ outage_type: 'maintenance' }).success).toBe(false)
  })
})
