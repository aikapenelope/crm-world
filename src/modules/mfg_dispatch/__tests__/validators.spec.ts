/**
 * Unit tests — mfg_dispatch validators
 *
 * Covers the Zod schemas for sale orders, sale order lines, dispatch orders,
 * and Certificates of Analysis (CoA) used in the Manufacturing Dispatch vertical.
 *
 * Venezuelan manufacturing dispatch context:
 *   - iva_pct default '16.00': Venezuelan standard IVA (Impuesto al Valor Agregado)
 *   - igtf_pct optional: IGTF 3% applies when customer pays in USD/crypto
 *   - customer_rif: RIF del cliente — required for SENIAT fiscal invoicing
 *   - requires_coa: Certificate of Analysis (certificado de análisis) required
 *     for pharmaceutical, food, and chemical shipments regulated by SENCAMER
 *   - requires_temperature_control: cold-chain dispatch (alimentos perecederos)
 *   - CoA (coaCreateSchema): qa_results is a flexible record for lab parameters
 *     (pH, humidity, color, particle size) — format varies per product
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  saleOrderCreateSchema,
  saleOrderUpdateSchema,
  saleOrderLineCreateSchema,
  saleOrderLineUpdateSchema,
  dispatchOrderCreateSchema,
  dispatchOrderUpdateSchema,
  coaCreateSchema,
  coaUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid sale order payload. */
const validSaleOrder = () => ({
  order_number: 'SO-2026-001',
  customer_name: 'Distribuidora Andina C.A.',
})

/** Minimal valid sale order line payload. */
const validSOLine = () => ({
  sale_order_id: UUID,
  line_number: 1,
  product_id: UUID2,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  quantity: '500',
  uom: 'CAJA',
  unit_price_usd: '6.00',
  total_price_usd: '3000.00',
})

/** Minimal valid dispatch order payload. */
const validDispatch = () => ({
  dispatch_number: 'DO-2026-001',
  sale_order_id: UUID,
  sale_order_number: 'SO-2026-001',
  customer_name: 'Distribuidora Andina C.A.',
})

/** Minimal valid CoA payload. */
const validCOA = () => ({
  coa_number: 'COA-2026-001',
  lot_id: UUID,
  lot_number: 'LOTE-2026-001',
  product_id: UUID2,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  production_date: new Date('2026-01-15'),
  quantity: '5000.00',
  uom: 'KG',
})

// ---------------------------------------------------------------------------
// saleOrderCreateSchema
// ---------------------------------------------------------------------------

describe('saleOrderCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid sale order with defaults', () => {
      const result = saleOrderCreateSchema.safeParse(validSaleOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.currency).toBe('USD')
        expect(result.data.iva_pct).toBe('16.00')
        expect(result.data.subtotal_usd).toBe('0.00')
        expect(result.data.iva_amount_usd).toBe('0.00')
        expect(result.data.igtf_amount_usd).toBe('0.00')
        expect(result.data.total_usd).toBe('0.00')
        expect(result.data.requires_temperature_control).toBe(false)
        expect(result.data.requires_coa).toBe(false)
      }
    })

    it('rejects when order_number is missing', () => {
      const { order_number: _omit, ...rest } = validSaleOrder()
      expect(saleOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when customer_name is missing', () => {
      const { customer_name: _omit, ...rest } = validSaleOrder()
      expect(saleOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts customer_id as null (walk-in customer)', () => {
      expect(saleOrderCreateSchema.safeParse({ ...validSaleOrder(), customer_id: null }).success).toBe(true)
    })

    it('accepts igtf_pct for USD/crypto payment (IGTF 3%)', () => {
      const result = saleOrderCreateSchema.safeParse({
        ...validSaleOrder(),
        igtf_pct: '3.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.igtf_pct).toBe('3.00')
      }
    })

    it('accepts igtf_pct as null (VES payment — no IGTF)', () => {
      expect(saleOrderCreateSchema.safeParse({ ...validSaleOrder(), igtf_pct: null }).success).toBe(true)
    })

    it('accepts requires_coa = true (SENCAMER-regulated product)', () => {
      const result = saleOrderCreateSchema.safeParse({
        ...validSaleOrder(),
        requires_coa: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requires_coa).toBe(true)
      }
    })

    it('accepts requires_temperature_control = true (cold-chain dispatch)', () => {
      const result = saleOrderCreateSchema.safeParse({
        ...validSaleOrder(),
        requires_temperature_control: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requires_temperature_control).toBe(true)
      }
    })

    it('accepts scheduled_dispatch_date as ISO string (coerced to Date)', () => {
      const result = saleOrderCreateSchema.safeParse({
        ...validSaleOrder(),
        scheduled_dispatch_date: '2026-02-10T08:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduled_dispatch_date).toBeInstanceOf(Date)
      }
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'confirmed', 'in_preparation', 'dispatched', 'invoiced', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(saleOrderCreateSchema.safeParse({ ...validSaleOrder(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(saleOrderCreateSchema.safeParse({ ...validSaleOrder(), status: 'shipped' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// saleOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('saleOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(saleOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (confirmed → in_preparation)', () => {
    expect(saleOrderUpdateSchema.safeParse({ status: 'in_preparation' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(saleOrderUpdateSchema.safeParse({ status: 'shipped' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// saleOrderLineCreateSchema
// ---------------------------------------------------------------------------

describe('saleOrderLineCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid sale order line', () => {
      expect(saleOrderLineCreateSchema.safeParse(validSOLine()).success).toBe(true)
    })

    it('rejects when sale_order_id is not a UUID', () => {
      expect(saleOrderLineCreateSchema.safeParse({ ...validSOLine(), sale_order_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(saleOrderLineCreateSchema.safeParse({ ...validSOLine(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects line_number = 0 (must be positive)', () => {
      expect(saleOrderLineCreateSchema.safeParse({ ...validSOLine(), line_number: 0 }).success).toBe(false)
    })

    it('accepts lot_id and lot_number as null (non-lot-tracked product)', () => {
      expect(
        saleOrderLineCreateSchema.safeParse({
          ...validSOLine(),
          lot_id: null,
          lot_number: null,
        }).success
      ).toBe(true)
    })

    it('accepts production_order_id as null (no linked production order)', () => {
      expect(saleOrderLineCreateSchema.safeParse({ ...validSOLine(), production_order_id: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// saleOrderLineUpdateSchema
// ---------------------------------------------------------------------------

describe('saleOrderLineUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(saleOrderLineUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a quantity-only update', () => {
    expect(saleOrderLineUpdateSchema.safeParse({ quantity: '600' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// dispatchOrderCreateSchema
// ---------------------------------------------------------------------------

describe('dispatchOrderCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid dispatch order with defaults', () => {
      const result = dispatchOrderCreateSchema.safeParse(validDispatch())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.requires_temperature_control).toBe(false)
      }
    })

    it('rejects when dispatch_number is missing', () => {
      const { dispatch_number: _omit, ...rest } = validDispatch()
      expect(dispatchOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when sale_order_id is not a UUID', () => {
      expect(
        dispatchOrderCreateSchema.safeParse({ ...validDispatch(), sale_order_id: 'bad' }).success
      ).toBe(false)
    })

    it('accepts dispatch_date as ISO string (coerced to Date)', () => {
      const result = dispatchOrderCreateSchema.safeParse({
        ...validDispatch(),
        dispatch_date: '2026-02-10T08:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dispatch_date).toBeInstanceOf(Date)
      }
    })

    it('accepts carrier info as optional null fields', () => {
      expect(
        dispatchOrderCreateSchema.safeParse({
          ...validDispatch(),
          carrier_name: null,
          vehicle_plate: null,
          driver_name: null,
          temperature_range: null,
        }).success
      ).toBe(true)
    })

    it('accepts requires_temperature_control = true with temperature_range', () => {
      const result = dispatchOrderCreateSchema.safeParse({
        ...validDispatch(),
        requires_temperature_control: true,
        temperature_range: '2-8°C',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requires_temperature_control).toBe(true)
        expect(result.data.temperature_range).toBe('2-8°C')
      }
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'loading', 'in_transit', 'delivered', 'returned'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(dispatchOrderCreateSchema.safeParse({ ...validDispatch(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(
        dispatchOrderCreateSchema.safeParse({ ...validDispatch(), status: 'cancelled' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// dispatchOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('dispatchOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(dispatchOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (loading → in_transit)', () => {
    expect(dispatchOrderUpdateSchema.safeParse({ status: 'in_transit' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// coaCreateSchema — Certificado de Análisis (SENCAMER requirement)
// ---------------------------------------------------------------------------

describe('coaCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid CoA with defaults', () => {
      const result = coaCreateSchema.safeParse(validCOA())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_released).toBe(false)
      }
    })

    it('rejects when lot_id is not a UUID', () => {
      expect(coaCreateSchema.safeParse({ ...validCOA(), lot_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_code is missing', () => {
      const { product_code: _omit, ...rest } = validCOA()
      expect(coaCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts production_date as ISO string (coerced to Date)', () => {
      const result = coaCreateSchema.safeParse({
        ...validCOA(),
        production_date: '2026-01-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.production_date).toBeInstanceOf(Date)
      }
    })

    it('accepts expiry_date as null (no expiry on this product)', () => {
      expect(coaCreateSchema.safeParse({ ...validCOA(), expiry_date: null }).success).toBe(true)
    })

    it('accepts qa_results as a record with mixed value types', () => {
      const result = coaCreateSchema.safeParse({
        ...validCOA(),
        qa_results: {
          humedad_pct: '3.5',
          ph: 6.8,
          conforme: true,
          observacion: 'Lote aprobado',
        },
      })
      expect(result.success).toBe(true)
    })

    it('accepts qa_results as null (results not yet entered)', () => {
      expect(coaCreateSchema.safeParse({ ...validCOA(), qa_results: null }).success).toBe(true)
    })

    it('accepts is_released = true (CoA officially released)', () => {
      const result = coaCreateSchema.safeParse({
        ...validCOA(),
        is_released: true,
        approved_by: 'Ing. García',
        approved_at: new Date('2026-01-16T09:00:00Z'),
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_released).toBe(true)
        expect(result.data.approved_by).toBe('Ing. García')
      }
    })

    it('accepts dispatch_order_id as null (CoA not yet linked to dispatch)', () => {
      expect(coaCreateSchema.safeParse({ ...validCOA(), dispatch_order_id: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// coaUpdateSchema
// ---------------------------------------------------------------------------

describe('coaUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(coaUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_released-only update (releasing CoA)', () => {
    expect(coaUpdateSchema.safeParse({ is_released: true }).success).toBe(true)
  })

  it('accepts qa_results update after lab results received', () => {
    expect(
      coaUpdateSchema.safeParse({
        qa_results: { humedad_pct: '3.5', conforme: true },
      }).success
    ).toBe(true)
  })
})
