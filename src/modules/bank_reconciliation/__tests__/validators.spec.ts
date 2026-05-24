/**
 * Unit tests — bank_reconciliation validators
 *
 * Venezuelan bank reconciliation context:
 *   - currency default 'VES': los extractos bancarios venezolanos llegan
 *     en Bolívares (VES) — diferente de los otros módulos que usan USD
 *   - bank_code: código bancario venezolano (0102 Banco de Venezuela,
 *     0134 Banesco, 0108 BBVA, 0175 Bicentenario, etc.)
 *   - period_month regex /^\d{4}-\d{2}$/: mes de conciliación
 *   - transactions array: extracto bancario — sin min(1), puede subir vacío
 *   - reconciliation_status 'ignored': movimiento irrelevante para la
 *     conciliación (comisiones bancarias, impuestos, etc.)
 *   - direction 'credit': abono al cuenta — cobro recibido
 *   - direction 'debit': cargo a la cuenta — pago realizado
 *   - listTransactionsSchema: nota §14 — reconciliation_status como string,
 *     no como enum → NO testear rechazo de valores inválidos aquí
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  uploadStatementSchema,
  reconcileTransactionSchema,
  listTransactionsSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validStatement = () => ({
  bank_code: '0134',
  bank_name: 'Banesco Banco Universal',
  period_month: '2026-01',
  filename: 'banesco_enero_2026.csv',
  transactions: [],
})

// ---------------------------------------------------------------------------
// uploadStatementSchema
// ---------------------------------------------------------------------------
describe('uploadStatementSchema', () => {
  describe('required fields', () => {
    it('accepts minimal statement with empty transactions array', () => {
      expect(uploadStatementSchema.safeParse(validStatement()).success).toBe(true)
    })
    it('rejects missing bank_code (min(1))', () => {
      expect(uploadStatementSchema.safeParse({ ...validStatement(), bank_code: '' }).success).toBe(false)
    })
    it('rejects missing bank_name (min(1))', () => {
      expect(uploadStatementSchema.safeParse({ ...validStatement(), bank_name: '' }).success).toBe(false)
    })
    it('rejects missing filename (min(1))', () => {
      expect(uploadStatementSchema.safeParse({ ...validStatement(), filename: '' }).success).toBe(false)
    })
    it('rejects invalid period_month (missing leading zero)', () => {
      expect(uploadStatementSchema.safeParse({ ...validStatement(), period_month: '2026-1' }).success).toBe(false)
    })
    it('accepts period_month "2026-01"', () => {
      expect(uploadStatementSchema.safeParse(validStatement()).success).toBe(true)
    })
    it('accepts account_number as null (cuentas sin número de referencia)', () => {
      expect(uploadStatementSchema.safeParse({ ...validStatement(), account_number: null }).success).toBe(true)
    })
  })

  describe('transactions array items', () => {
    it('accepts a statement with actual transaction records (VES currency)', () => {
      const r = uploadStatementSchema.safeParse({
        ...validStatement(),
        transactions: [
          {
            transaction_date: '2026-01-05',
            description: 'Transferencia recibida',
            reference: 'REF-123456',
            direction: 'credit',
            amount: '5400.00',
            currency: 'VES',
            balance: '22400.00',
          },
        ],
      })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.transactions[0].currency).toBe('VES')
    })
    it('accepts currency default VES for items without explicit currency', () => {
      const r = uploadStatementSchema.safeParse({
        ...validStatement(),
        transactions: [
          { transaction_date: '2026-01-05', direction: 'debit', amount: '200.00' },
        ],
      })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.transactions[0].currency).toBe('VES')
    })
    it('rejects transaction with invalid direction', () => {
      expect(uploadStatementSchema.safeParse({
        ...validStatement(),
        transactions: [
          { transaction_date: '2026-01-05', direction: 'transfer', amount: '100.00' },
        ],
      }).success).toBe(false)
    })
    it('accepts description and reference as null', () => {
      const r = uploadStatementSchema.safeParse({
        ...validStatement(),
        transactions: [
          { transaction_date: '2026-01-05', direction: 'credit', amount: '500.00', description: null, reference: null, balance: null },
        ],
      })
      expect(r.success).toBe(true)
    })
  })

  describe('direction enum in transactions', () => {
    const directions = ['credit', 'debit'] as const
    test.each(directions)('accepts direction "%s"', (direction) => {
      const r = uploadStatementSchema.safeParse({
        ...validStatement(),
        transactions: [{ transaction_date: '2026-01-05', direction, amount: '100.00' }],
      })
      expect(r.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// reconcileTransactionSchema
// ---------------------------------------------------------------------------
describe('reconcileTransactionSchema', () => {
  it('accepts matched status with payment_id', () => {
    const r = reconcileTransactionSchema.safeParse({
      reconciliation_status: 'matched',
      matched_payment_id: UUID,
    })
    expect(r.success).toBe(true)
  })
  it('accepts unmatched status without payment_id', () => {
    const r = reconcileTransactionSchema.safeParse({
      reconciliation_status: 'unmatched',
      matched_payment_id: null,
    })
    expect(r.success).toBe(true)
  })
  it('accepts ignored status with match_notes', () => {
    const r = reconcileTransactionSchema.safeParse({
      reconciliation_status: 'ignored',
      match_notes: 'Comisión bancaria — no conciliable',
    })
    expect(r.success).toBe(true)
  })

  describe('reconciliation_status enum', () => {
    const statuses = ['matched', 'unmatched', 'ignored'] as const
    test.each(statuses)('accepts reconciliation_status "%s"', (reconciliation_status) => {
      expect(reconcileTransactionSchema.safeParse({ reconciliation_status }).success).toBe(true)
    })
    it('rejects invalid reconciliation_status', () => {
      expect(reconcileTransactionSchema.safeParse({ reconciliation_status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listTransactionsSchema
// ---------------------------------------------------------------------------
describe('listTransactionsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listTransactionsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces page and pageSize from strings', () => {
    const r = listTransactionsSchema.safeParse({ page: '2', pageSize: '25' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.page).toBe(2)
  })
  it('accepts statement_id UUID filter', () => {
    expect(listTransactionsSchema.safeParse({ statement_id: UUID }).success).toBe(true)
  })
  it('accepts reconciliation_status and search as strings', () => {
    expect(listTransactionsSchema.safeParse({ reconciliation_status: 'matched', search: 'banesco' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listTransactionsSchema.safeParse({ direction: 'credit' }).success).toBe(true)
  })
})
