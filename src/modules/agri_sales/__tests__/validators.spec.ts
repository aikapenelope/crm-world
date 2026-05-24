/**
 * Unit tests — agri_sales validators
 *
 * Cubre los schemas Zod para ventas agroalimentarias: órdenes de venta,
 * guías de despacho y facturas.
 *
 * Contexto venezolano:
 *   - Ventas a cadenas de supermercados y distribuidores en USD.
 *   - IVA 16 % registrado en VES a tasa BCV.
 *   - IGTF 3 % cuando el cliente paga en divisas o USDT.
 *   - required_transport_temp: temperatura de transporte requerida
 *     (ej: '0-4°C' para fresco, '-18°C' para congelado).
 *   - saleDispatch status 'temperature_incident': excursión de temperatura
 *     durante el transporte — activa NC automáticamente.
 *   - items min(1): toda orden debe tener al menos 1 ítem de venta.
 *   - control_number: número de control SENIAT en la factura (obligatorio
 *     para empresas con declaración de IVA).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  saleOrderCreateSchema,
  saleOrderUpdateSchema,
  saleDispatchCreateSchema,
  saleDispatchUpdateSchema,
  saleInvoiceCreateSchema,
  saleInvoiceUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validItem = () => ({ product_name: 'Pollo entero fresco 2.1kg', quantity_kg: 500, unit_price_usd: 1.85 })

const validOrder = () => ({
  order_number: 'SO-AGRI-2026-001',
  customer_id:  UUID,
  order_date:   new Date('2026-01-20'),
  items:        [validItem()],
  subtotal_usd: '925.00',
  total_usd:    '925.00',
})

const validDispatch = () => ({
  dispatch_number: 'GD-AGRI-2026-001',
  sale_order_id:   UUID,
  dispatch_date:   new Date('2026-01-22'),
  items:           [{ lot_number: 'PROD-2026-001', quantity_kg: 500 }],
  total_weight_kg: '500.000',
})

const validInvoice = () => ({
  invoice_number: 'A-00001001',
  sale_order_id:  UUID,
  customer_id:    UUID2,
  issue_date:     new Date('2026-01-22'),
  due_date:       new Date('2026-02-06'),
  subtotal_usd:   '925.00',
  total_usd:      '925.00',
})

// ---------------------------------------------------------------------------
// saleOrderCreateSchema
// ---------------------------------------------------------------------------

describe('saleOrderCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid order with defaults', () => {
      const result = saleOrderCreateSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    const required = ['order_number', 'customer_id', 'order_date',
      'items', 'subtotal_usd', 'total_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validOrder() }
      delete (p as Record<string, unknown>)[field]
      expect(saleOrderCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects empty items array (min 1 item required)', () => {
      expect(saleOrderCreateSchema.safeParse({ ...validOrder(), items: [] }).success).toBe(false)
    })

    it('rejects item with non-positive quantity_kg', () => {
      expect(saleOrderCreateSchema.safeParse({
        ...validOrder(),
        items: [{ product_name: 'Pollo', quantity_kg: 0, unit_price_usd: 1.85 }],
      }).success).toBe(false)
    })

    it('rejects item with non-positive unit_price_usd', () => {
      expect(saleOrderCreateSchema.safeParse({
        ...validOrder(),
        items: [{ product_name: 'Pollo', quantity_kg: 500, unit_price_usd: 0 }],
      }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['draft', 'confirmed', 'partially_dispatched',
      'fully_dispatched', 'invoiced', 'paid', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(saleOrderCreateSchema.safeParse({ ...validOrder(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(saleOrderCreateSchema.safeParse({ ...validOrder(), status: 'pending' }).success).toBe(false)
    })
  })

  describe('Venezuelan bi-currency fields', () => {
    it('accepts IVA 16% with BCV rate and VES amounts', () => {
      expect(saleOrderCreateSchema.safeParse({
        ...validOrder(),
        iva_rate: '16.00',
        iva_amount_ves: '5836.00',
        bcv_rate: '39.50',
        total_ves: '36537.50',
      }).success).toBe(true)
    })

    it('accepts null VES fields for USD-only transactions', () => {
      expect(saleOrderCreateSchema.safeParse({
        ...validOrder(),
        iva_amount_ves: null,
        bcv_rate: null,
        total_ves: null,
      }).success).toBe(true)
    })
  })

  describe('transport temperature', () => {
    it('accepts required_transport_temp for cold-chain orders', () => {
      expect(saleOrderCreateSchema.safeParse({
        ...validOrder(),
        required_transport_temp: '0-4°C',
      }).success).toBe(true)
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

  it('still validates status enum on partial update', () => {
    expect(saleOrderUpdateSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// saleDispatchCreateSchema
// ---------------------------------------------------------------------------

describe('saleDispatchCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid dispatch with defaults', () => {
      const result = saleDispatchCreateSchema.safeParse(validDispatch())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
      }
    })

    const required = ['dispatch_number', 'sale_order_id', 'dispatch_date',
      'items', 'total_weight_kg'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validDispatch() }
      delete (p as Record<string, unknown>)[field]
      expect(saleDispatchCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects empty items array (min 1)', () => {
      expect(saleDispatchCreateSchema.safeParse({ ...validDispatch(), items: [] }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'in_transit', 'delivered', 'temperature_incident'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(saleDispatchCreateSchema.safeParse({ ...validDispatch(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(saleDispatchCreateSchema.safeParse({ ...validDispatch(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('temperature monitoring', () => {
    it('accepts loading and delivery temperatures for cold-chain', () => {
      expect(saleDispatchCreateSchema.safeParse({
        ...validDispatch(),
        loading_temp_c: '2.5',
        delivery_temp_c: '3.1',
      }).success).toBe(true)
    })

    it('accepts null temperatures for ambient dispatch', () => {
      expect(saleDispatchCreateSchema.safeParse({
        ...validDispatch(),
        loading_temp_c: null,
        delivery_temp_c: null,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// saleDispatchUpdateSchema
// ---------------------------------------------------------------------------

describe('saleDispatchUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(saleDispatchUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts temperature_incident status when excursion detected', () => {
    expect(saleDispatchUpdateSchema.safeParse({
      status: 'temperature_incident',
      notes: 'Temperatura llegó a 7°C durante 40 min — cadena de frío comprometida',
    }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// saleInvoiceCreateSchema
// ---------------------------------------------------------------------------

describe('saleInvoiceCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid invoice with defaults', () => {
      const result = saleInvoiceCreateSchema.safeParse(validInvoice())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
      }
    })

    const required = ['invoice_number', 'sale_order_id', 'customer_id',
      'issue_date', 'due_date', 'subtotal_usd', 'total_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validInvoice() }
      delete (p as Record<string, unknown>)[field]
      expect(saleInvoiceCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['pending', 'partial', 'paid', 'overdue', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(saleInvoiceCreateSchema.safeParse({ ...validInvoice(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(saleInvoiceCreateSchema.safeParse({ ...validInvoice(), status: 'disputed' }).success).toBe(false)
    })
  })

  describe('Venezuelan fiscal fields', () => {
    it('accepts control_number SENIAT', () => {
      expect(saleInvoiceCreateSchema.safeParse({
        ...validInvoice(),
        control_number: '00-12345678',
      }).success).toBe(true)
    })

    it('accepts IGTF 3% for foreign-currency clients', () => {
      expect(saleInvoiceCreateSchema.safeParse({
        ...validInvoice(),
        igtf_amount_usd: '27.75',
        total_usd: '952.75',
      }).success).toBe(true)
    })

    it('accepts IVA 16% with BCV equivalence', () => {
      expect(saleInvoiceCreateSchema.safeParse({
        ...validInvoice(),
        iva_rate: '16.00',
        iva_amount_ves: '5836.00',
        bcv_rate: '39.50',
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// saleInvoiceUpdateSchema
// ---------------------------------------------------------------------------

describe('saleInvoiceUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(saleInvoiceUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates status enum on partial update', () => {
    expect(saleInvoiceUpdateSchema.safeParse({ status: 'disputed' }).success).toBe(false)
  })
})
