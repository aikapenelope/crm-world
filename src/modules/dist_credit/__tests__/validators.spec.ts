/**
 * Unit tests — dist_credit validators
 *
 * Covers the Zod schemas for customer credit limits, credit transactions,
 * and list queries used in the Distribution Credit vertical.
 *
 * Venezuelan distribution credit context:
 *   - Credit management in Venezuela is complex: hyperinflation historically
 *     eroded receivables; most distributors moved to USD-denominated credit
 *   - status 'suspended': crédito suspendido — client exceeded limit or has
 *     overdue invoices; prevents new orders but allows collections
 *   - status 'blocked': crédito bloqueado — legal action or fraud risk;
 *     requires management override to unblock
 *   - payment_terms_days default 30: crédito a 30 días (standard Venezuelan
 *     distribution terms); max 365 (annual credit lines)
 *   - type 'credit_note': nota de crédito — SENIAT-regulated fiscal document
 *     used for returns and price adjustments (requires correlative number)
 *   - exchange_rate: BCV rate at transaction date for VES equivalent reporting
 *   - All monetary amounts in USD (dual-currency stabilisation)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createCreditLimitSchema,
  updateCreditLimitSchema,
  createCreditTransactionSchema,
  listCreditLimitsSchema,
  listTransactionsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid credit limit payload. */
const validLimit = () => ({
  customer_id: UUID,
  credit_limit: '5000.00',
})

/** Minimal valid credit transaction payload. */
const validTx = () => ({
  customer_id: UUID,
  type: 'invoice' as const,
  reference_type: 'sales_invoice' as const,
  amount: '1250.00',
  description: 'Factura FV-2026-00142',
})

// ---------------------------------------------------------------------------
// createCreditLimitSchema
// ---------------------------------------------------------------------------

describe('createCreditLimitSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid credit limit with defaults', () => {
      const result = createCreditLimitSchema.safeParse(validLimit())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
        expect(result.data.payment_terms_days).toBe(30)
        expect(result.data.status).toBe('active')
      }
    })

    it('rejects when customer_id is not a UUID', () => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), customer_id: 'bad' }).success).toBe(false)
    })

    it('rejects when credit_limit is missing', () => {
      const { credit_limit: _omit, ...rest } = validLimit()
      expect(createCreditLimitSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects payment_terms_days below 1', () => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), payment_terms_days: 0 }).success).toBe(false)
    })

    it('rejects payment_terms_days above 365', () => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), payment_terms_days: 366 }).success).toBe(false)
    })

    it('coerces payment_terms_days from string', () => {
      const result = createCreditLimitSchema.safeParse({ ...validLimit(), payment_terms_days: '60' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.payment_terms_days).toBe(60)
    })

    it('accepts notes as null', () => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), notes: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'suspended', 'blocked'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createCreditLimitSchema.safeParse({ ...validLimit(), status: 'expired' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateCreditLimitSchema
// ---------------------------------------------------------------------------

describe('updateCreditLimitSchema', () => {
  it('accepts an empty object', () => {
    expect(updateCreditLimitSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (active → suspended)', () => {
    expect(updateCreditLimitSchema.safeParse({ status: 'suspended' }).success).toBe(true)
  })

  it('accepts credit_limit increase', () => {
    expect(updateCreditLimitSchema.safeParse({ credit_limit: '8000.00' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateCreditLimitSchema.safeParse({ status: 'expired' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createCreditTransactionSchema
// ---------------------------------------------------------------------------

describe('createCreditTransactionSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid credit transaction', () => {
      const result = createCreditTransactionSchema.safeParse(validTx())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects when customer_id is not a UUID', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), customer_id: 'bad' }).success).toBe(false)
    })

    it('rejects when amount is missing', () => {
      const { amount: _omit, ...rest } = validTx()
      expect(createCreditTransactionSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when description is empty', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), description: '' }).success).toBe(false)
    })

    it('accepts reference_id as null (manual transaction)', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), reference_id: null }).success).toBe(true)
    })

    it('accepts exchange_rate for BCV dual-currency reporting', () => {
      const result = createCreditTransactionSchema.safeParse({
        ...validTx(), exchange_rate: '36.45',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.exchange_rate).toBe('36.45')
    })

    it('accepts exchange_rate as null (USD-only transaction)', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), exchange_rate: null }).success).toBe(true)
    })

    it('accepts due_date as plain string', () => {
      const result = createCreditTransactionSchema.safeParse({ ...validTx(), due_date: '2026-02-28' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.due_date).toBe('2026-02-28')
    })
  })

  describe('type enum', () => {
    const types = ['invoice', 'payment', 'credit_note', 'adjustment'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), type: 'debit_note' }).success).toBe(false)
    })
  })

  describe('reference_type enum', () => {
    const refTypes = ['sales_invoice', 'sales_payment', 'sales_credit_memo', 'manual'] as const

    test.each(refTypes)('accepts reference_type "%s"', (reference_type) => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), reference_type }).success).toBe(true)
    })

    it('rejects an invalid reference_type', () => {
      expect(createCreditTransactionSchema.safeParse({ ...validTx(), reference_type: 'purchase_order' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listCreditLimitsSchema
// ---------------------------------------------------------------------------

describe('listCreditLimitsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listCreditLimitsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listCreditLimitsSchema.safeParse({ page: '2', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejects pageSize above 100', () => {
    expect(listCreditLimitsSchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })

  it('accepts optional search and status filters', () => {
    const result = listCreditLimitsSchema.safeParse({ search: 'andina', status: 'suspended' })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listCreditLimitsSchema.safeParse({ unknown: 'val' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listTransactionsSchema
// ---------------------------------------------------------------------------

describe('listTransactionsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listTransactionsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('accepts customer_id filter as UUID', () => {
    const result = listTransactionsSchema.safeParse({ customer_id: UUID })
    expect(result.success).toBe(true)
  })

  it('rejects customer_id that is not a UUID', () => {
    expect(listTransactionsSchema.safeParse({ customer_id: 'bad' }).success).toBe(false)
  })

  it('accepts type filter string', () => {
    const result = listTransactionsSchema.safeParse({ type: 'invoice' })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listTransactionsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})
