/**
 * Unit tests — payment_methods validators
 *
 * Cubre los schemas Zod para métodos de pago venezolanos y el registro
 * de pagos aplicados. Este módulo es transversal: todos los tenants lo usan
 * para procesar cobros en USD, VES y cripto.
 *
 * Contexto venezolano:
 *   - 7 métodos de pago locales: Zelle, Binance/USDT, efectivo USD,
 *     efectivo VES, transferencia bancaria, pago móvil, punto de venta.
 *   - Las transacciones en divisas están sujetas al IGTF 3 %.
 *   - El exchange_rate se registra al momento del pago (tasa BCV del día).
 *   - requiresReference = true en transferencias y pagos móviles
 *     (el número de referencia es obligatorio para conciliación).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  recordPaymentSchema,
  updatePaymentRecordSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid payment method — the code/name/currency triplet is always required. */
const validMethod = () => ({
  code: 'zelle',
  name: 'Zelle',
  currency: 'USD',
})

/** Minimal valid payment record. */
const validRecord = () => ({
  payment_method_code: 'zelle',
  amount: '150.00',
  currency: 'USD',
  payment_date: new Date().toISOString(),
})

// ---------------------------------------------------------------------------
// createPaymentMethodSchema
// ---------------------------------------------------------------------------

describe('createPaymentMethodSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid method with defaults applied', () => {
      const result = createPaymentMethodSchema.safeParse(validMethod())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requiresReference).toBe(false)
        expect(result.data.isActive).toBe(true)
        expect(result.data.sortOrder).toBe(0)
      }
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validMethod()
      expect(createPaymentMethodSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validMethod()
      expect(createPaymentMethodSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when currency is missing', () => {
      const { currency: _omit, ...rest } = validMethod()
      expect(createPaymentMethodSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('field length limits', () => {
    it('rejects code longer than 50 chars', () => {
      expect(createPaymentMethodSchema.safeParse({ ...validMethod(), code: 'x'.repeat(51) }).success).toBe(false)
    })

    it('rejects name longer than 100 chars', () => {
      expect(createPaymentMethodSchema.safeParse({ ...validMethod(), name: 'n'.repeat(101) }).success).toBe(false)
    })

    it('rejects currency shorter than 3 chars (needs ISO 4217 minimum)', () => {
      expect(createPaymentMethodSchema.safeParse({ ...validMethod(), currency: 'US' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts requiresReference = true (transferencias y pago móvil)', () => {
      const result = createPaymentMethodSchema.safeParse({
        ...validMethod(),
        code: 'transferencia',
        name: 'Transferencia bancaria',
        currency: 'VES',
        requiresReference: true,
        referenceLabel: 'N° de referencia bancaria',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requiresReference).toBe(true)
        expect(result.data.referenceLabel).toBe('N° de referencia bancaria')
      }
    })

    it('accepts isActive = false (método desactivado)', () => {
      const result = createPaymentMethodSchema.safeParse({ ...validMethod(), isActive: false })
      expect(result.success).toBe(true)
    })

    it('accepts sortOrder for display ordering', () => {
      const result = createPaymentMethodSchema.safeParse({ ...validMethod(), sortOrder: 5 })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.sortOrder).toBe(5)
    })

    it('rejects negative sortOrder', () => {
      expect(createPaymentMethodSchema.safeParse({ ...validMethod(), sortOrder: -1 }).success).toBe(false)
    })

    it('accepts null for optional nullable fields', () => {
      const result = createPaymentMethodSchema.safeParse({
        ...validMethod(),
        referenceLabel: null,
        instructions: null,
        icon: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Venezuelan payment methods', () => {
    const veMethods = [
      { code: 'zelle',          currency: 'USD',  name: 'Zelle' },
      { code: 'binance',        currency: 'USDT', name: 'Binance Pay / USDT' },
      { code: 'efectivo_usd',   currency: 'USD',  name: 'Efectivo USD' },
      { code: 'efectivo_ves',   currency: 'VES',  name: 'Efectivo VES' },
      { code: 'transferencia',  currency: 'VES',  name: 'Transferencia bancaria' },
      { code: 'pago_movil',     currency: 'VES',  name: 'Pago Móvil' },
      { code: 'punto',          currency: 'VES',  name: 'Punto de venta' },
    ] as const

    test.each(veMethods)('acepta método $code ($currency)', ({ code, currency, name }) => {
      expect(createPaymentMethodSchema.safeParse({ code, currency, name }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePaymentMethodSchema — partial patch
// ---------------------------------------------------------------------------

describe('updatePaymentMethodSchema', () => {
  it('accepts an empty object (all fields optional in update)', () => {
    expect(updatePaymentMethodSchema.safeParse({}).success).toBe(true)
  })

  it('accepts isActive-only toggle (activar/desactivar método)', () => {
    expect(updatePaymentMethodSchema.safeParse({ isActive: false }).success).toBe(true)
  })

  it('still validates field lengths on partial update', () => {
    expect(updatePaymentMethodSchema.safeParse({ code: 'x'.repeat(51) }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// recordPaymentSchema
// ---------------------------------------------------------------------------

describe('recordPaymentSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid payment record', () => {
      const result = recordPaymentSchema.safeParse(validRecord())
      expect(result.success).toBe(true)
    })

    it('rejects when payment_method_code is missing', () => {
      const { payment_method_code: _omit, ...rest } = validRecord()
      expect(recordPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when amount is missing', () => {
      const { amount: _omit, ...rest } = validRecord()
      expect(recordPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when currency is missing', () => {
      const { currency: _omit, ...rest } = validRecord()
      expect(recordPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when payment_date is missing', () => {
      const { payment_date: _omit, ...rest } = validRecord()
      expect(recordPaymentSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('amount validation', () => {
    it('accepts integer amounts', () => {
      expect(recordPaymentSchema.safeParse({ ...validRecord(), amount: '100' }).success).toBe(true)
    })

    it('accepts amounts with up to 4 decimal places', () => {
      expect(recordPaymentSchema.safeParse({ ...validRecord(), amount: '99.9999' }).success).toBe(true)
    })

    it('rejects amounts with 5+ decimal places', () => {
      expect(recordPaymentSchema.safeParse({ ...validRecord(), amount: '1.00000' }).success).toBe(false)
    })

    it('rejects negative amounts', () => {
      expect(recordPaymentSchema.safeParse({ ...validRecord(), amount: '-50.00' }).success).toBe(false)
    })

    it('rejects non-numeric amount', () => {
      expect(recordPaymentSchema.safeParse({ ...validRecord(), amount: 'cien' }).success).toBe(false)
    })
  })

  describe('exchange rate and USD conversion', () => {
    it('accepts exchange_rate for VES transactions (tasa BCV)', () => {
      const result = recordPaymentSchema.safeParse({
        ...validRecord(),
        payment_method_code: 'pago_movil',
        amount: '400000.00',
        currency: 'VES',
        amount_usd: '10.00',
        exchange_rate: '40000.00000000',
      })
      expect(result.success).toBe(true)
    })

    it('accepts exchange_rate with up to 8 decimal places (precisión BCV)', () => {
      expect(
        recordPaymentSchema.safeParse({ ...validRecord(), exchange_rate: '39.12345678' }).success,
      ).toBe(true)
    })

    it('accepts null exchange_rate (USD payments need no conversion)', () => {
      expect(
        recordPaymentSchema.safeParse({ ...validRecord(), exchange_rate: null }).success,
      ).toBe(true)
    })
  })

  describe('reference tracking', () => {
    it('accepts a reference number (confirmación de transferencia)', () => {
      const result = recordPaymentSchema.safeParse({
        ...validRecord(),
        payment_method_code: 'transferencia',
        reference: '202601151234',
        reference_type: 'invoice',
        reference_id: UUID,
      })
      expect(result.success).toBe(true)
    })

    it('rejects reference_id that is not a UUID', () => {
      expect(
        recordPaymentSchema.safeParse({ ...validRecord(), reference_id: 'not-a-uuid' }).success,
      ).toBe(false)
    })

    it('accepts payment_date as ISO datetime string', () => {
      expect(
        recordPaymentSchema.safeParse({ ...validRecord(), payment_date: '2026-01-15T14:30:00.000Z' }).success,
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePaymentRecordSchema — status transitions
// ---------------------------------------------------------------------------

describe('updatePaymentRecordSchema', () => {
  const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'] as const

  test.each(validStatuses)('accepts status "%s"', (status) => {
    expect(updatePaymentRecordSchema.safeParse({ status }).success).toBe(true)
  })

  it('rejects an invalid status', () => {
    expect(updatePaymentRecordSchema.safeParse({ status: 'refunded' }).success).toBe(false)
  })

  it('accepts an empty object (all fields optional)', () => {
    expect(updatePaymentRecordSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update with only notes', () => {
    expect(updatePaymentRecordSchema.safeParse({ notes: 'Confirmado por administrador' }).success).toBe(true)
  })
})
