/**
 * Unit tests — isp_billing validators
 *
 * Cubre los schemas Zod para facturación ISP venezolana: facturas mensuales,
 * registros de cobro y cambios de estado. Este módulo tiene workers activos
 * (detect-overdue) que cortan el servicio automáticamente.
 *
 * Contexto venezolano:
 *   - Facturas en USD con equivalente VES calculado a tasa BCV.
 *   - IVA 16 % registrado en VES; el abonado paga en USD.
 *   - IGTF 3 % aplica cuando el pago es en divisas o cripto.
 *   - 7 métodos de pago: zelle, pago_movil, efectivo_usd, efectivo_ves,
 *     transferencia, binance, otro.
 *   - Estados de factura: pending → partial/overdue → paid/cancelled.
 *   - period_month YYYY-MM: una factura por abonado por período.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createInvoiceSchema,
  updateInvoiceSchema,
  changeInvoiceStatusSchema,
  registerPaymentSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validInvoice = () => ({
  subscriber_id:    UUID,
  invoice_number:   'FAC-202601-00001',
  period_month:     '2026-01',
  issue_date:       '2026-01-01',
  due_date:         '2026-01-15',
  base_amount_usd:  '25.00',
  subtotal_usd:     '25.00',
  total_usd:        '25.00',
  balance_usd:      '25.00',
})

const validPayment = () => ({
  invoice_id:      UUID,
  subscriber_id:   UUID2,
  payment_date:    '2026-01-10',
  amount_usd:      '25.00',
  payment_method:  'zelle' as const,
})

// ---------------------------------------------------------------------------
// createInvoiceSchema
// ---------------------------------------------------------------------------

describe('createInvoiceSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid invoice with defaults', () => {
      const result = createInvoiceSchema.safeParse(validInvoice())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.iva_rate).toBe('16.00')
        expect(result.data.addons_amount_usd).toBe('0.00')
        expect(result.data.discount_amount_usd).toBe('0.00')
      }
    })

    const required = ['subscriber_id', 'invoice_number', 'period_month',
      'issue_date', 'due_date', 'base_amount_usd', 'subtotal_usd',
      'total_usd', 'balance_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validInvoice() }
      delete (p as Record<string, unknown>)[field]
      expect(createInvoiceSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID subscriber_id', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), subscriber_id: 'not-uuid' }).success).toBe(false)
    })
  })

  describe('period_month format YYYY-MM', () => {
    it('accepts valid period_month', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), period_month: '2026-12' }).success).toBe(true)
    })

    it('rejects wrong separator (YYYY/MM)', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), period_month: '2026/01' }).success).toBe(false)
    })
  })

  describe('monetary amount format (max 2 decimals)', () => {
    it('accepts integers and 2-decimal amounts', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), base_amount_usd: '30' }).success).toBe(true)
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), base_amount_usd: '30.50' }).success).toBe(true)
    })

    it('rejects amounts with 3+ decimal places', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), base_amount_usd: '30.500' }).success).toBe(false)
    })

    it('rejects negative amounts', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), total_usd: '-5.00' }).success).toBe(false)
    })
  })

  describe('Venezuelan bi-currency fields', () => {
    it('accepts bcv_rate up to 4 decimal places (tasa BCV)', () => {
      const result = createInvoiceSchema.safeParse({
        ...validInvoice(),
        bcv_rate: '39.1234',
        iva_amount_ves: '158.36',
        total_ves: '979.09',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null bcv_rate when invoice is USD-only', () => {
      expect(createInvoiceSchema.safeParse({ ...validInvoice(), bcv_rate: null }).success).toBe(true)
    })

    it('accepts custom iva_rate (e.g. 0.00 for exempt subscribers)', () => {
      const result = createInvoiceSchema.safeParse({ ...validInvoice(), iva_rate: '0.00' })
      expect(result.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateInvoiceSchema — partial patch
// ---------------------------------------------------------------------------

describe('updateInvoiceSchema', () => {
  it('accepts an empty object', () => {
    expect(updateInvoiceSchema.safeParse({}).success).toBe(true)
  })

  it('still validates monetary format on partial update', () => {
    expect(updateInvoiceSchema.safeParse({ balance_usd: 'diez' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changeInvoiceStatusSchema
// ---------------------------------------------------------------------------

describe('changeInvoiceStatusSchema', () => {
  const validStatuses = ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'in_dispute'] as const

  test.each(validStatuses)('accepts status "%s"', (status) => {
    expect(changeInvoiceStatusSchema.safeParse({ invoice_id: UUID, status }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(changeInvoiceStatusSchema.safeParse({ invoice_id: UUID, status: 'refunded' }).success).toBe(false)
  })

  it('rejects non-UUID invoice_id', () => {
    expect(changeInvoiceStatusSchema.safeParse({ invoice_id: 'bad', status: 'paid' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// registerPaymentSchema
// ---------------------------------------------------------------------------

describe('registerPaymentSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid payment with defaults', () => {
      const result = registerPaymentSchema.safeParse(validPayment())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
        expect(result.data.igtf_applies).toBe(false)
      }
    })

    const required = ['invoice_id', 'subscriber_id', 'payment_date',
      'amount_usd', 'payment_method'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validPayment() }
      delete (p as Record<string, unknown>)[field]
      expect(registerPaymentSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('payment_method enum — 7 métodos venezolanos', () => {
    const methods = ['zelle', 'pago_movil', 'efectivo_usd', 'efectivo_ves',
      'transferencia', 'binance', 'otro'] as const

    test.each(methods)('accepts payment_method "%s"', (payment_method) => {
      expect(registerPaymentSchema.safeParse({ ...validPayment(), payment_method }).success).toBe(true)
    })

    it('rejects invalid payment_method', () => {
      expect(registerPaymentSchema.safeParse({ ...validPayment(), payment_method: 'cripto' }).success).toBe(false)
    })
  })

  describe('currency enum', () => {
    const currencies = ['USD', 'VES', 'USDT', 'EUR'] as const

    test.each(currencies)('accepts currency "%s"', (currency) => {
      expect(registerPaymentSchema.safeParse({ ...validPayment(), currency }).success).toBe(true)
    })

    it('rejects invalid currency', () => {
      expect(registerPaymentSchema.safeParse({ ...validPayment(), currency: 'BTC' }).success).toBe(false)
    })
  })

  describe('IGTF and exchange rate', () => {
    it('accepts igtf_applies = true for foreign-currency payments', () => {
      const result = registerPaymentSchema.safeParse({
        ...validPayment(),
        payment_method: 'binance',
        currency: 'USDT',
        igtf_applies: true,
        bcv_rate_at_payment: '39.50',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.igtf_applies).toBe(true)
    })

    it('accepts pago_movil in VES with exchange rate', () => {
      expect(registerPaymentSchema.safeParse({
        ...validPayment(),
        payment_method: 'pago_movil',
        currency: 'VES',
        amount_ves: '987.50',
        bcv_rate_at_payment: '39.50',
      }).success).toBe(true)
    })

    it('accepts valid photo_receipt_url', () => {
      expect(registerPaymentSchema.safeParse({
        ...validPayment(),
        photo_receipt_url: 'https://storage.example.com/receipt.jpg',
      }).success).toBe(true)
    })

    it('rejects invalid photo_receipt_url', () => {
      expect(registerPaymentSchema.safeParse({
        ...validPayment(),
        photo_receipt_url: 'not-a-url',
      }).success).toBe(false)
    })
  })
})
