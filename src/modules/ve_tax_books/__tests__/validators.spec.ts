/**
 * Unit tests — ve_tax_books validators
 *
 * Cubre los schemas Zod para los libros de IVA venezolanos (ventas y compras)
 * y la lista de asientos. Este módulo es transversal: todos los tenants con
 * obligaciones fiscales ante el SENIAT lo usan para generar los libros de
 * IVA exigidos por la Providencia Administrativa N° SNAT/2003/1677.
 *
 * Contexto venezolano:
 *   - book_type: 'sales' (libro de ventas) o 'purchases' (libro de compras).
 *   - document_type: los 4 tipos de documento SENIAT reconocidos.
 *     - 'factura'                 — venta/compra normal
 *     - 'nota_credito'            — ajuste a la baja (devolución, descuento)
 *     - 'nota_debito'             — ajuste al alza (cargo adicional)
 *     - 'comprobante_retencion'   — retención de IVA por agente de retención
 *   - tax_rate default '16.00': tasa general IVA Venezuela.
 *   - igtf_amount: Impuesto a Grandes Transacciones Financieras (3 %) cuando
 *     el pago es en divisas o cripto.
 *   - period_month formato YYYY-MM: obligatorio para cuadrar el período fiscal.
 *   - counterpart_rif: el RIF del proveedor o cliente (formato SENIAT).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createEntrySchema,
  updateEntrySchema,
  listEntriesSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid sales-book entry. */
const validEntry = () => ({
  book_type: 'sales' as const,
  period_month: '2026-01',
  entry_date: '2026-01-15',
  document_type: 'factura' as const,
  document_number: 'A-00001234',
  counterpart_rif: 'J-12345678-9',
  counterpart_name: 'ACME Distribuidora C.A.',
  taxable_base: '860.00',
  total_amount: '1000.00',
})

// ---------------------------------------------------------------------------
// createEntrySchema
// ---------------------------------------------------------------------------

describe('createEntrySchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid entry with defaults applied', () => {
      const result = createEntrySchema.safeParse(validEntry())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_exempt).toBe(false)
        expect(result.data.tax_rate).toBe('16.00')
        expect(result.data.tax_amount).toBe('0.00')
        expect(result.data.igtf_amount).toBe('0.00')
        expect(result.data.withholding_amount).toBe('0.00')
        expect(result.data.currency).toBe('USD')
      }
    })

    const requiredFields = [
      'book_type',
      'period_month',
      'entry_date',
      'document_type',
      'document_number',
      'counterpart_rif',
      'counterpart_name',
      'taxable_base',
      'total_amount',
    ] as const

    test.each(requiredFields)('rejects when %s is missing', (field) => {
      const payload = { ...validEntry() }
      delete (payload as Record<string, unknown>)[field]
      expect(createEntrySchema.safeParse(payload).success).toBe(false)
    })
  })

  describe('book_type enum', () => {
    it('accepts "sales" (libro de ventas)', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), book_type: 'sales' }).success).toBe(true)
    })

    it('accepts "purchases" (libro de compras)', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), book_type: 'purchases' }).success).toBe(true)
    })

    it('rejects an invalid book_type', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), book_type: 'imports' }).success).toBe(false)
    })
  })

  describe('document_type enum — tipos SENIAT', () => {
    const docTypes = [
      'factura',
      'nota_credito',
      'nota_debito',
      'comprobante_retencion',
    ] as const

    test.each(docTypes)('accepts document_type "%s"', (document_type) => {
      expect(createEntrySchema.safeParse({ ...validEntry(), document_type }).success).toBe(true)
    })

    it('rejects an invalid document_type', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), document_type: 'factura_especial' }).success).toBe(false)
    })
  })

  describe('period_month format YYYY-MM', () => {
    it('accepts valid period_month', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), period_month: '2026-12' }).success).toBe(true)
    })

    it('rejects period_month with wrong format (YYYY/MM)', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), period_month: '2026/01' }).success).toBe(false)
    })

    it('rejects period_month as YYYY-MM-DD (too long)', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), period_month: '2026-01-15' }).success).toBe(false)
    })

    it('rejects period_month with text', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), period_month: 'enero-2026' }).success).toBe(false)
    })
  })

  describe('Venezuelan fiscal amounts', () => {
    it('accepts is_exempt = true for exonerated products (alimentos, medicinas)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        is_exempt: true,
        tax_rate: '0.00',
        tax_amount: '0.00',
        total_amount: '860.00',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_exempt).toBe(true)
    })

    it('accepts igtf_amount for USD/crypto payments (IGTF 3 %)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        igtf_amount: '30.00',   // 3 % de 1000 USD
        total_amount: '1030.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts withholding_amount for special taxpayers (75 % del IVA)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        withholding_amount: '107.40',  // 75 % de 16 % sobre base 860
        total_amount: '1000.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts custom tax_rate (reduced rate 8 % for certain electronic payments)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        tax_rate: '8.00',
        tax_amount: '68.80',
        total_amount: '928.80',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('multi-currency support', () => {
    it('accepts currency VES with exchange_rate (tasa BCV)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        currency: 'VES',
        exchange_rate: '39.50',
        taxable_base: '33970.00',
        tax_amount: '5435.20',
        total_amount: '39500.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null exchange_rate for USD entries (no conversion needed)', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), exchange_rate: null }).success).toBe(true)
    })
  })

  describe('optional fields', () => {
    it('accepts control_number (N° de control SENIAT en facturas)', () => {
      const result = createEntrySchema.safeParse({
        ...validEntry(),
        control_number: '00-12345678',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null for optional nullable fields', () => {
      expect(createEntrySchema.safeParse({
        ...validEntry(),
        control_number: null,
        exchange_rate: null,
        payment_method_code: null,
        notes: null,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateEntrySchema — partial of create
// ---------------------------------------------------------------------------

describe('updateEntrySchema', () => {
  it('accepts an empty object (all fields optional in update)', () => {
    expect(updateEntrySchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-like partial update with only notes', () => {
    expect(updateEntrySchema.safeParse({ notes: 'Corregido por contador' }).success).toBe(true)
  })

  it('still validates book_type enum on partial update', () => {
    expect(updateEntrySchema.safeParse({ book_type: 'invalid' }).success).toBe(false)
  })

  it('still validates document_type enum on partial update', () => {
    expect(updateEntrySchema.safeParse({ document_type: 'recibo' }).success).toBe(false)
  })

  it('still validates period_month format on partial update', () => {
    expect(updateEntrySchema.safeParse({ period_month: 'ene-2026' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listEntriesSchema — query params
// ---------------------------------------------------------------------------

describe('listEntriesSchema', () => {
  it('accepts an empty query (all defaults applied)', () => {
    const result = listEntriesSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('accepts filtering by book_type', () => {
    expect(listEntriesSchema.safeParse({ book_type: 'purchases' }).success).toBe(true)
  })

  it('rejects invalid book_type filter', () => {
    expect(listEntriesSchema.safeParse({ book_type: 'other' }).success).toBe(false)
  })

  it('accepts filtering by period_month', () => {
    expect(listEntriesSchema.safeParse({ period_month: '2026-01' }).success).toBe(true)
  })

  it('rejects pageSize above 100', () => {
    expect(listEntriesSchema.safeParse({ pageSize: 101 }).success).toBe(false)
  })

  it('coerces string page and pageSize from query params', () => {
    const result = listEntriesSchema.safeParse({ page: '2', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(25)
    }
  })
})
