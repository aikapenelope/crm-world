/**
 * Unit tests — dist_delivery validators
 *
 * Covers the Zod schemas for delivery orders, delivery items, and list queries
 * used in the Distribution Delivery vertical.
 *
 * Venezuelan distribution delivery context:
 *   - Delivery orders (órdenes de entrega) aggregate multiple sales orders
 *     into a single truck run — common in Venezuelan FMCG distribution
 *   - status 'partial': entrega parcial — very common due to road conditions,
 *     security issues (matraqueo), or client not available at time of visit
 *   - status 'in_transit': en tránsito — truck dispatched; real-time tracking
 *     not always available in Venezuelan logistics
 *   - quantity_returned: mercancía devuelta — devolución en ruta; triggers
 *     return_in stock movement and credit note to client
 *   - status 'rejected': rechazo de mercancía — client refused delivery
 *     (damaged goods, temperature break, wrong product)
 *   - dispatch_date stored as plain string (date YYYY-MM-DD)
 *   - updateDeliveryItemSchema: standalone schema (not partial of create) —
 *     only delivery-confirmation fields are updatable
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createDeliveryOrderSchema,
  updateDeliveryOrderSchema,
  createDeliveryItemSchema,
  updateDeliveryItemSchema,
  listDeliveryOrdersSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'
const UUID3 = '33333333-3333-4333-8333-333333333333'
const UUID4 = '44444444-4444-4444-8444-444444444444'

/** Minimal valid delivery order payload. */
const validOrder = () => ({
  dispatch_date: '2026-01-15',
})

/** Minimal valid delivery item payload. */
const validItem = () => ({
  delivery_order_id: UUID,
  sales_order_id: UUID2,
  customer_id: UUID3,
  product_id: UUID4,
  quantity_dispatched: 50,
})

// ---------------------------------------------------------------------------
// createDeliveryOrderSchema
// ---------------------------------------------------------------------------

describe('createDeliveryOrderSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid delivery order with defaults', () => {
      const result = createDeliveryOrderSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('preparing')
      }
    })

    it('rejects when dispatch_date is empty', () => {
      expect(createDeliveryOrderSchema.safeParse({ dispatch_date: '' }).success).toBe(false)
    })

    it('accepts dispatch_date as plain string (not Date)', () => {
      const result = createDeliveryOrderSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.dispatch_date).toBe('string')
        expect(result.data.dispatch_date).toBe('2026-01-15')
      }
    })

    it('accepts route_id and driver_id as null (unassigned delivery)', () => {
      expect(
        createDeliveryOrderSchema.safeParse({
          ...validOrder(),
          route_id: null,
          driver_id: null,
        }).success
      ).toBe(true)
    })

    it('accepts route_id and driver_id as UUIDs', () => {
      expect(
        createDeliveryOrderSchema.safeParse({
          ...validOrder(),
          route_id: UUID,
          driver_id: UUID2,
        }).success
      ).toBe(true)
    })

    it('accepts vehicle_plate as null (vehicle not assigned)', () => {
      expect(createDeliveryOrderSchema.safeParse({ ...validOrder(), vehicle_plate: null }).success).toBe(true)
    })

    it('accepts notes as null', () => {
      expect(createDeliveryOrderSchema.safeParse({ ...validOrder(), notes: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['preparing', 'dispatched', 'in_transit', 'completed', 'partial'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createDeliveryOrderSchema.safeParse({ ...validOrder(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createDeliveryOrderSchema.safeParse({ ...validOrder(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateDeliveryOrderSchema
// ---------------------------------------------------------------------------

describe('updateDeliveryOrderSchema', () => {
  it('accepts an empty object', () => {
    expect(updateDeliveryOrderSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (dispatched → in_transit)', () => {
    expect(updateDeliveryOrderSchema.safeParse({ status: 'in_transit' }).success).toBe(true)
  })

  it('accepts status update to partial (entrega parcial)', () => {
    expect(updateDeliveryOrderSchema.safeParse({ status: 'partial' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateDeliveryOrderSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createDeliveryItemSchema
// ---------------------------------------------------------------------------

describe('createDeliveryItemSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid delivery item with defaults', () => {
      const result = createDeliveryItemSchema.safeParse(validItem())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantity_delivered).toBe(0)
        expect(result.data.quantity_returned).toBe(0)
        expect(result.data.status).toBe('pending')
      }
    })

    it('rejects when delivery_order_id is not a UUID', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), delivery_order_id: 'bad' }).success).toBe(false)
    })

    it('rejects when sales_order_id is not a UUID', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), sales_order_id: 'bad' }).success).toBe(false)
    })

    it('rejects when customer_id is not a UUID', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), customer_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects quantity_dispatched below 1', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), quantity_dispatched: 0 }).success).toBe(false)
    })

    it('coerces quantity_dispatched from string', () => {
      const result = createDeliveryItemSchema.safeParse({ ...validItem(), quantity_dispatched: '50' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity_dispatched).toBe(50)
    })

    it('rejects quantity_delivered below 0', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), quantity_delivered: -1 }).success).toBe(false)
    })

    it('rejects quantity_returned below 0', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), quantity_returned: -1 }).success).toBe(false)
    })

    it('accepts a fully delivered item', () => {
      const result = createDeliveryItemSchema.safeParse({
        ...validItem(),
        quantity_delivered: 50,
        quantity_returned: 0,
        status: 'delivered',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantity_delivered).toBe(50)
        expect(result.data.status).toBe('delivered')
      }
    })

    it('accepts a partial delivery with return', () => {
      const result = createDeliveryItemSchema.safeParse({
        ...validItem(),
        quantity_delivered: 40,
        quantity_returned: 10,
        status: 'partial',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity_returned).toBe(10)
    })

    it('accepts variant_id as null', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), variant_id: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'delivered', 'partial', 'returned', 'rejected'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createDeliveryItemSchema.safeParse({ ...validItem(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateDeliveryItemSchema — standalone confirmation schema
// ---------------------------------------------------------------------------

describe('updateDeliveryItemSchema', () => {
  it('accepts an empty object', () => {
    expect(updateDeliveryItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts quantity_delivered update on delivery confirmation', () => {
    expect(updateDeliveryItemSchema.safeParse({ quantity_delivered: 50 }).success).toBe(true)
  })

  it('accepts quantity_returned update (devolución en ruta)', () => {
    expect(updateDeliveryItemSchema.safeParse({ quantity_returned: 5, status: 'partial' }).success).toBe(true)
  })

  it('accepts status-only update', () => {
    expect(updateDeliveryItemSchema.safeParse({ status: 'delivered' }).success).toBe(true)
  })

  it('accepts status update to rejected (rechazo de mercancía)', () => {
    expect(
      updateDeliveryItemSchema.safeParse({ status: 'rejected', delivery_notes: 'Producto dañado — rechazado por cliente' }).success
    ).toBe(true)
  })

  it('coerces quantity_delivered from string', () => {
    const result = updateDeliveryItemSchema.safeParse({ quantity_delivered: '45' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.quantity_delivered).toBe(45)
  })

  it('still rejects invalid status in update', () => {
    expect(updateDeliveryItemSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listDeliveryOrdersSchema
// ---------------------------------------------------------------------------

describe('listDeliveryOrdersSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listDeliveryOrdersSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listDeliveryOrdersSchema.safeParse({ page: '2', pageSize: '20' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(2)
  })

  it('rejects pageSize above 100', () => {
    expect(listDeliveryOrdersSchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })

  it('accepts status and dispatch_date filter strings', () => {
    const result = listDeliveryOrdersSchema.safeParse({ status: 'in_transit', dispatch_date: '2026-01-15' })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listDeliveryOrdersSchema.safeParse({ route_id: UUID }).success).toBe(true)
  })
})
