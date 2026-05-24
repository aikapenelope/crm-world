/**
 * Unit tests — transactions validators
 *
 * Venezuelan real estate transactions context:
 *   - TransactionType: SALE ('sale') | LEASE ('lease') — inmobiliaria
 *   - TransactionStatus: PENDING ('pending') | COMPLETED ('completed') |
 *     CANCELLED ('cancelled')
 *   - sale_price regex /^\d+(\.\d{1,2})?$/: precio sin signo, máx 2 decimales
 *   - exchange_rate regex /^\d+(\.\d{1,8})?$/: tasa BCV hasta 8 decimales
 *   - closing_date: z.string().datetime() — requiere ISO 8601 con tiempo
 *     ('2026-01-15T10:00:00Z'), NO acepta solo fecha '2026-01-15'
 *   - commission_rate default '5.00': 5% comisión estándar Venezuela
 *   - monthly_rent y lease_months: solo para contratos de arrendamiento
 *   - completeTransactionSchema: registra cierre formal de la operación
 *   - lease_months: z.number().int() (NOT coerce) — debe ser número puro
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createTransactionSchema,
  updateTransactionSchema,
  completeTransactionSchema,
} from '../data/validators'
import { TransactionType, TransactionStatus } from '../data/entities'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validTx = () => ({
  property_id: UUID,
  transaction_type: TransactionType.SALE,
  sale_price: '150000.00',
})

// ---------------------------------------------------------------------------
// createTransactionSchema
// ---------------------------------------------------------------------------
describe('createTransactionSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal transaction with defaults', () => {
      const r = createTransactionSchema.safeParse(validTx())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.status).toBe(TransactionStatus.PENDING)
        expect(r.data.currency).toBe('USD')
        expect(r.data.commission_rate).toBe('5.00')
      }
    })
    it('rejects non-UUID property_id', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), property_id: 'bad' }).success).toBe(false)
    })
    it('accepts TransactionType.SALE as transaction_type', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), transaction_type: TransactionType.SALE }).success).toBe(true)
    })
    it('accepts TransactionType.LEASE as transaction_type', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), transaction_type: TransactionType.LEASE }).success).toBe(true)
    })
    it('rejects invalid transaction_type string', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), transaction_type: 'rental' }).success).toBe(false)
    })
    it('accepts sale_price in valid regex format', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), sale_price: '150000' }).success).toBe(true)
    })
    it('rejects sale_price with more than 2 decimal places', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), sale_price: '150000.123' }).success).toBe(false)
    })
    it('rejects sale_price with negative sign', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), sale_price: '-150000.00' }).success).toBe(false)
    })
    it('accepts exchange_rate up to 8 decimal places (BCV precision)', () => {
      const r = createTransactionSchema.safeParse({ ...validTx(), exchange_rate: '36.45210000' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.exchange_rate).toBe('36.45210000')
    })
    it('accepts exchange_rate as null (USD-only transaction)', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), exchange_rate: null }).success).toBe(true)
    })
    it('accepts closing_date as ISO 8601 datetime', () => {
      const r = createTransactionSchema.safeParse({
        ...validTx(), closing_date: '2026-01-15T10:00:00Z',
      })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.closing_date).toBe('2026-01-15T10:00:00Z')
    })
    it('rejects closing_date as plain date (datetime() requires time component)', () => {
      // z.string().datetime() rejects bare YYYY-MM-DD — needs full ISO datetime
      expect(createTransactionSchema.safeParse({ ...validTx(), closing_date: '2026-01-15' }).success).toBe(false)
    })
    it('accepts closing_date as null (not yet closed)', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), closing_date: null }).success).toBe(true)
    })
    it('accepts contact_id as null', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), contact_id: null }).success).toBe(true)
    })
    it('accepts lease fields for LEASE transaction', () => {
      const r = createTransactionSchema.safeParse({
        ...validTx(),
        transaction_type: TransactionType.LEASE,
        monthly_rent: '800.00',
        lease_months: 12,
        lease_start: '2026-02-01T00:00:00Z',
        lease_end: '2027-01-31T00:00:00Z',
      })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.lease_months).toBe(12)
    })
    it('rejects lease_months as string (NOT coerce — z.number().int())', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), lease_months: '12' }).success).toBe(false)
    })
  })

  describe('TransactionStatus enum', () => {
    const statuses = [TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.CANCELLED] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createTransactionSchema.safeParse({ ...validTx(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createTransactionSchema.safeParse({ ...validTx(), status: 'active' }).success).toBe(false)
    })
  })
})

describe('updateTransactionSchema', () => {
  it('accepts empty object', () => { expect(updateTransactionSchema.safeParse({}).success).toBe(true) })
  it('accepts commission_amount update', () => {
    expect(updateTransactionSchema.safeParse({ commission_amount: '7500.00' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// completeTransactionSchema
// ---------------------------------------------------------------------------
describe('completeTransactionSchema', () => {
  it('accepts minimal complete with required closing_date', () => {
    expect(completeTransactionSchema.safeParse({ closing_date: '2026-01-15T10:00:00Z' }).success).toBe(true)
  })
  it('rejects plain date in closing_date (needs full datetime)', () => {
    expect(completeTransactionSchema.safeParse({ closing_date: '2026-01-15' }).success).toBe(false)
  })
  it('accepts optional sale_price and commission_amount', () => {
    const r = completeTransactionSchema.safeParse({
      closing_date: '2026-01-15T10:00:00Z',
      sale_price: '148000.00',
      commission_amount: '7400.00',
    })
    expect(r.success).toBe(true)
  })
  it('accepts notes as null', () => {
    expect(completeTransactionSchema.safeParse({
      closing_date: '2026-01-15T10:00:00Z', notes: null,
    }).success).toBe(true)
  })
})
