/**
 * Unit tests — const_progress validators
 *
 * Covers the Zod schemas for valuations and valuation lines used in the
 * Construction Progress (avance de obra) vertical.
 *
 * Venezuelan construction progress / valuation context:
 *   - Valuación (valuation): certificación de avance — the periodic billing
 *     document submitted to the client for work completed to date
 *   - retention_amount: retención de garantía (5-10%) withheld until project
 *     completion, regulated by Ley de Contrataciones Públicas
 *   - advance_deduction: deducción de anticipo — amortisation of the initial
 *     advance payment (anticipo) against each valuation
 *   - exchange_rate / amount_ves: dual-currency fields — contracts in USD but
 *     SENIAT requires VES equivalent on fiscal invoices (BCV rate at payment)
 *   - status 'submitted': valuación entregada al cliente / ente contratante
 *   - status 'invoiced': factura fiscal emitida (SENIAT-compliant invoice)
 *   - accumulated_percent: porcentaje acumulado ejecutado — drives EOT and
 *     project completion reporting
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createValuationSchema,
  updateValuationSchema,
  createValuationLineSchema,
  updateValuationLineSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid valuation payload. */
const validValuation = () => ({
  project_id: UUID,
  period_from: '2026-01-01',
  period_to: '2026-01-31',
  total_contract: '850000.00',
})

/** Minimal valid valuation line payload. */
const validLine = () => ({
  valuation_id: UUID,
  budget_item_id: UUID2,
  item_number: '1.1.01',
  item_name: 'Excavación y nivelación',
  contracted_quantity: '200.00',
  unit_price: '45.00',
})

// ---------------------------------------------------------------------------
// createValuationSchema
// ---------------------------------------------------------------------------

describe('createValuationSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid valuation with defaults', () => {
      const result = createValuationSchema.safeParse(validValuation())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.previous_billed).toBe('0.00')
        expect(result.data.current_period).toBe('0.00')
        expect(result.data.retention_amount).toBe('0.00')
        expect(result.data.advance_deduction).toBe('0.00')
        expect(result.data.net_payable).toBe('0.00')
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createValuationSchema.safeParse({ ...validValuation(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when total_contract is missing', () => {
      const { total_contract: _omit, ...rest } = validValuation()
      expect(createValuationSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when period_from is missing', () => {
      const { period_from: _omit, ...rest } = validValuation()
      expect(createValuationSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts period_from and period_to as plain strings (not Date)', () => {
      const result = createValuationSchema.safeParse(validValuation())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.period_from).toBe('string')
        expect(result.data.period_from).toBe('2026-01-01')
      }
    })

    it('accepts exchange_rate and amount_ves for SENIAT VES reporting', () => {
      const result = createValuationSchema.safeParse({
        ...validValuation(),
        exchange_rate: '36.4521',
        amount_ves: '30984265.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.exchange_rate).toBe('36.4521')
        expect(result.data.amount_ves).toBe('30984265.00')
      }
    })

    it('accepts exchange_rate as null (USD-only payment)', () => {
      expect(createValuationSchema.safeParse({ ...validValuation(), exchange_rate: null }).success).toBe(true)
    })

    it('accepts invoice_number as null (not yet invoiced)', () => {
      expect(createValuationSchema.safeParse({ ...validValuation(), invoice_number: null }).success).toBe(true)
    })

    it('accepts a complete valuation with all amounts', () => {
      const result = createValuationSchema.safeParse({
        ...validValuation(),
        previous_billed: '120000.00',
        current_period: '85000.00',
        retention_amount: '8500.00',
        advance_deduction: '17000.00',
        net_payable: '59500.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.net_payable).toBe('59500.00')
      }
    })
  })

  describe('status enum — valuación lifecycle', () => {
    const statuses = ['draft', 'submitted', 'approved', 'invoiced', 'paid', 'rejected'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createValuationSchema.safeParse({ ...validValuation(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createValuationSchema.safeParse({ ...validValuation(), status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateValuationSchema
// ---------------------------------------------------------------------------

describe('updateValuationSchema', () => {
  it('accepts an empty object', () => {
    expect(updateValuationSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (submitted → approved)', () => {
    expect(updateValuationSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('accepts invoice_number update on invoicing', () => {
    expect(updateValuationSchema.safeParse({ status: 'invoiced', invoice_number: 'FAC-2026-001' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateValuationSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createValuationLineSchema
// ---------------------------------------------------------------------------

describe('createValuationLineSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid valuation line with defaults', () => {
      const result = createValuationLineSchema.safeParse(validLine())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.previous_quantity).toBe('0.0000')
        expect(result.data.current_quantity).toBe('0.0000')
        expect(result.data.current_amount).toBe('0.00')
        expect(result.data.accumulated_percent).toBe('0.00')
      }
    })

    it('rejects when valuation_id is not a UUID', () => {
      expect(createValuationLineSchema.safeParse({ ...validLine(), valuation_id: 'bad' }).success).toBe(false)
    })

    it('rejects when budget_item_id is not a UUID', () => {
      expect(createValuationLineSchema.safeParse({ ...validLine(), budget_item_id: 'bad' }).success).toBe(false)
    })

    it('rejects when item_number is missing', () => {
      const { item_number: _omit, ...rest } = validLine()
      expect(createValuationLineSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when contracted_quantity is missing', () => {
      const { contracted_quantity: _omit, ...rest } = validLine()
      expect(createValuationLineSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts unit as null (chapter line — no unit)', () => {
      expect(createValuationLineSchema.safeParse({ ...validLine(), unit: null }).success).toBe(true)
    })

    it('accepts a line with current period quantities', () => {
      const result = createValuationLineSchema.safeParse({
        ...validLine(),
        previous_quantity: '80.0000',
        current_quantity: '60.0000',
        current_amount: '2700.00',
        accumulated_percent: '70.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.accumulated_percent).toBe('70.00')
      }
    })
  })
})

// ---------------------------------------------------------------------------
// updateValuationLineSchema
// ---------------------------------------------------------------------------

describe('updateValuationLineSchema', () => {
  it('accepts an empty object', () => {
    expect(updateValuationLineSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a current_quantity-only update', () => {
    expect(updateValuationLineSchema.safeParse({ current_quantity: '75.0000' }).success).toBe(true)
  })
})
