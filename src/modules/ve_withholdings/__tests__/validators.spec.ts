/**
 * Unit tests — ve_withholdings validators
 *
 * Cubre los schemas Zod para retenciones de IVA e ISLR venezolanas.
 * Este módulo es transversal y lo usan todos los tenants que operan como
 * agentes de retención ante el SENIAT.
 *
 * Contexto venezolano:
 *   - type 'iva': Retención de IVA — agentes de retención aplican
 *     75 % del IVA (o 100 % si son contribuyentes especiales).
 *     Comprobante obligatorio por cada factura retenida.
 *   - type 'islr': Retención de ISLR — varía por tipo de servicio:
 *     - Servicios profesionales: 5 %
 *     - Compras de bienes: 2 %
 *     El proveedor obtiene el crédito al declarar.
 *   - fortnight (quincena): 1 = primera quincena (1-15), 2 = segunda (16-31).
 *     Las declaraciones de retención se entregan por quincena al SENIAT.
 *   - status lifecycle: pending → applied → declared
 *   - period_month formato YYYY-MM: igual que ve_tax_books.
 *   - voucher_number: número del comprobante de retención emitido.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createWithholdingSchema,
  updateWithholdingSchema,
  listWithholdingsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid IVA withholding — supplier invoice. */
const validIva = () => ({
  type: 'iva' as const,
  period_month: '2026-01',
  fortnight: 1,
  supplier_rif: 'J-12345678-9',
  supplier_name: 'Servicios Técnicos C.A.',
  invoice_number: 'A-00001234',
  invoice_date: '2026-01-10',
  invoice_amount: '1000.00',
  tax_amount: '160.00',    // IVA 16 %
  withholding_rate: '75',  // 75 % del IVA para agente especial
  withholding_amount: '120.00',
})

/** Minimal valid ISLR withholding — professional services. */
const validIslr = () => ({
  type: 'islr' as const,
  period_month: '2026-01',
  fortnight: 1,
  supplier_rif: 'V-12345678',
  supplier_name: 'Consultor Independiente',
  invoice_number: 'RV-001',
  invoice_date: '2026-01-12',
  invoice_amount: '2000.00',
  tax_amount: '2000.00',         // base imponible ISLR
  withholding_rate: '5',         // 5 % servicios profesionales
  withholding_amount: '100.00',
})

// ---------------------------------------------------------------------------
// createWithholdingSchema
// ---------------------------------------------------------------------------

describe('createWithholdingSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid IVA withholding with defaults', () => {
      const result = createWithholdingSchema.safeParse(validIva())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
        expect(result.data.fortnight).toBe(1)
      }
    })

    it('accepts a minimal valid ISLR withholding', () => {
      expect(createWithholdingSchema.safeParse(validIslr()).success).toBe(true)
    })

    const requiredFields = [
      'type',
      'period_month',
      'supplier_rif',
      'supplier_name',
      'invoice_number',
      'invoice_date',
      'invoice_amount',
      'tax_amount',
      'withholding_rate',
      'withholding_amount',
    ] as const

    test.each(requiredFields)('rejects when %s is missing', (field) => {
      const payload = { ...validIva() }
      delete (payload as Record<string, unknown>)[field]
      expect(createWithholdingSchema.safeParse(payload).success).toBe(false)
    })
  })

  describe('type enum — IVA vs ISLR', () => {
    it('accepts type "iva" (retención del impuesto al valor agregado)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), type: 'iva' }).success).toBe(true)
    })

    it('accepts type "islr" (impuesto sobre la renta)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIslr(), type: 'islr' }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), type: 'igtf' }).success).toBe(false)
    })
  })

  describe('fortnight — quincena SENIAT', () => {
    it('accepts fortnight = 1 (primera quincena: días 1-15)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), fortnight: 1 }).success).toBe(true)
    })

    it('accepts fortnight = 2 (segunda quincena: días 16-31)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), fortnight: 2 }).success).toBe(true)
    })

    it('rejects fortnight = 0 (fuera de rango)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), fortnight: 0 }).success).toBe(false)
    })

    it('rejects fortnight = 3 (fuera de rango)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), fortnight: 3 }).success).toBe(false)
    })

    it('coerces string fortnight from form input', () => {
      const result = createWithholdingSchema.safeParse({ ...validIva(), fortnight: '2' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.fortnight).toBe(2)
    })
  })

  describe('period_month format YYYY-MM', () => {
    it('accepts valid period_month', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), period_month: '2026-12' }).success).toBe(true)
    })

    it('rejects wrong format (YYYY/MM)', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), period_month: '2026/01' }).success).toBe(false)
    })

    it('rejects date format YYYY-MM-DD', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), period_month: '2026-01-15' }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const validStatuses = ['pending', 'applied', 'declared'] as const

    test.each(validStatuses)('accepts status "%s"', (status) => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createWithholdingSchema.safeParse({ ...validIva(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('Venezuelan withholding rates', () => {
    it('accepts 75 % IVA withholding for ordinary special taxpayers', () => {
      const result = createWithholdingSchema.safeParse({
        ...validIva(),
        withholding_rate: '75',
        withholding_amount: '120.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts 100 % IVA withholding for full-retention special taxpayers', () => {
      const result = createWithholdingSchema.safeParse({
        ...validIva(),
        withholding_rate: '100',
        withholding_amount: '160.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts 2 % ISLR for goods purchases', () => {
      expect(createWithholdingSchema.safeParse({
        ...validIslr(),
        withholding_rate: '2',
        withholding_amount: '40.00',
        invoice_amount: '2000.00',
      }).success).toBe(true)
    })

    it('accepts 5 % ISLR for professional services', () => {
      expect(createWithholdingSchema.safeParse({
        ...validIslr(),
        withholding_rate: '5',
        withholding_amount: '100.00',
      }).success).toBe(true)
    })
  })

  describe('optional fields', () => {
    it('accepts voucher_number (comprobante emitido al proveedor)', () => {
      const result = createWithholdingSchema.safeParse({
        ...validIva(),
        voucher_number: 'COMP-2026-0015',
        status: 'applied',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null for optional nullable fields', () => {
      expect(createWithholdingSchema.safeParse({
        ...validIva(),
        voucher_number: null,
        notes: null,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateWithholdingSchema — partial patch
// ---------------------------------------------------------------------------

describe('updateWithholdingSchema', () => {
  it('accepts an empty object (all fields optional in update)', () => {
    expect(updateWithholdingSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status-only update (pending → applied after applying the withholding)', () => {
    expect(updateWithholdingSchema.safeParse({ status: 'applied' }).success).toBe(true)
  })

  it('accepts adding voucher_number after applying (applied → declared)', () => {
    expect(updateWithholdingSchema.safeParse({
      voucher_number: 'COMP-2026-0015',
      status: 'declared',
    }).success).toBe(true)
  })

  it('still validates type enum on partial update', () => {
    expect(updateWithholdingSchema.safeParse({ type: 'igtf' }).success).toBe(false)
  })

  it('still validates status enum on partial update', () => {
    expect(updateWithholdingSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })

  it('still validates period_month format on partial update', () => {
    expect(updateWithholdingSchema.safeParse({ period_month: '01-2026' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listWithholdingsSchema — query params
// ---------------------------------------------------------------------------

describe('listWithholdingsSchema', () => {
  it('accepts an empty query with defaults', () => {
    const result = listWithholdingsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('accepts filtering by type', () => {
    expect(listWithholdingsSchema.safeParse({ type: 'islr' }).success).toBe(true)
  })

  it('rejects invalid type filter', () => {
    expect(listWithholdingsSchema.safeParse({ type: 'igtf' }).success).toBe(false)
  })

  it('accepts filtering by period_month', () => {
    expect(listWithholdingsSchema.safeParse({ period_month: '2026-01' }).success).toBe(true)
  })

  it('accepts filtering by status (string, passthrough)', () => {
    expect(listWithholdingsSchema.safeParse({ status: 'declared' }).success).toBe(true)
  })

  it('rejects pageSize above 100', () => {
    expect(listWithholdingsSchema.safeParse({ pageSize: 101 }).success).toBe(false)
  })

  it('coerces string page from query params', () => {
    const result = listWithholdingsSchema.safeParse({ page: '3', pageSize: '20' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(20)
    }
  })
})
