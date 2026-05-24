/**
 * Unit tests — const_materials validators
 *
 * Covers the Zod schemas for material purchase orders, order lines, and
 * goods-receipt operations used in the Construction Materials vertical.
 *
 * Venezuelan construction materials context:
 *   - supplier_rif: RIF del proveedor — required for SENIAT fiscal invoicing
 *     and IGTF application on USD/crypto payments
 *   - status 'partial_received': recepción parcial — very common in Venezuela
 *     due to supply chain constraints (escasez de materiales)
 *   - currency default 'USD': construction materials denominated in USD;
 *     cement, steel (acero de refuerzo), and hardware are often USD-priced
 *   - receiveSchema: goods receipt confirmation — items array links line_ids
 *     to actual received quantities for inventory update
 *   - total_amount default '0.00': order total calculated from lines
 *   - expected_delivery as plain string: date TBD or estimated (supply
 *     uncertainty is normal in Venezuelan construction)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createOrderSchema,
  updateOrderSchema,
  createOrderLineSchema,
  receiveSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'
const UUID3 = '33333333-3333-4333-8333-333333333333'

/** Minimal valid materials order payload. */
const validOrder = () => ({
  project_id: UUID,
  supplier_name: 'Ferretería Industrial del Zulia C.A.',
  order_date: '2026-01-10',
})

/** Minimal valid order line payload. */
const validLine = () => ({
  order_id: UUID,
  material_name: 'Acero de refuerzo #4 (cabilla)',
  unit: 'KG',
  ordered_quantity: '5000',
  unit_price: '1.85',
  total_price: '9250.00',
})

/** Minimal valid receive payload. */
const validReceive = () => ({
  order_id: UUID,
  items: [
    { line_id: UUID2, received_quantity: '5000' },
  ],
})

// ---------------------------------------------------------------------------
// createOrderSchema
// ---------------------------------------------------------------------------

describe('createOrderSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid materials order with defaults', () => {
      const result = createOrderSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.total_amount).toBe('0.00')
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createOrderSchema.safeParse({ ...validOrder(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when supplier_name is missing', () => {
      const { supplier_name: _omit, ...rest } = validOrder()
      expect(createOrderSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when order_date is missing', () => {
      const { order_date: _omit, ...rest } = validOrder()
      expect(createOrderSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts order_date as plain string (not Date)', () => {
      const result = createOrderSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.order_date).toBe('string')
        expect(result.data.order_date).toBe('2026-01-10')
      }
    })

    it('accepts supplier_rif for SENIAT invoicing', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder(),
        supplier_rif: 'J-30456789-2',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.supplier_rif).toBe('J-30456789-2')
      }
    })

    it('accepts supplier_rif as null (informal supplier)', () => {
      expect(createOrderSchema.safeParse({ ...validOrder(), supplier_rif: null }).success).toBe(true)
    })

    it('accepts expected_delivery as plain string', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder(),
        expected_delivery: '2026-01-20',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expected_delivery).toBe('2026-01-20')
      }
    })

    it('accepts expected_delivery as null (delivery date TBD)', () => {
      expect(createOrderSchema.safeParse({ ...validOrder(), expected_delivery: null }).success).toBe(true)
    })
  })

  describe('status enum — materials supply lifecycle', () => {
    const statuses = ['draft', 'sent', 'confirmed', 'partial_received', 'received', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createOrderSchema.safeParse({ ...validOrder(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createOrderSchema.safeParse({ ...validOrder(), status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateOrderSchema
// ---------------------------------------------------------------------------

describe('updateOrderSchema', () => {
  it('accepts an empty object', () => {
    expect(updateOrderSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (sent → partial_received)', () => {
    expect(updateOrderSchema.safeParse({ status: 'partial_received' }).success).toBe(true)
  })

  it('accepts total_amount update after lines are added', () => {
    expect(updateOrderSchema.safeParse({ total_amount: '9250.00' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateOrderSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createOrderLineSchema
// ---------------------------------------------------------------------------

describe('createOrderLineSchema', () => {
  it('accepts a minimal valid order line', () => {
    expect(createOrderLineSchema.safeParse(validLine()).success).toBe(true)
  })

  it('rejects when order_id is not a UUID', () => {
    expect(createOrderLineSchema.safeParse({ ...validLine(), order_id: 'bad' }).success).toBe(false)
  })

  it('rejects when material_name is missing', () => {
    const { material_name: _omit, ...rest } = validLine()
    expect(createOrderLineSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects when unit is missing', () => {
    const { unit: _omit, ...rest } = validLine()
    expect(createOrderLineSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects unit longer than 20 chars', () => {
    expect(createOrderLineSchema.safeParse({ ...validLine(), unit: 'U'.repeat(21) }).success).toBe(false)
  })

  it('rejects when ordered_quantity is missing', () => {
    const { ordered_quantity: _omit, ...rest } = validLine()
    expect(createOrderLineSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects when unit_price is missing', () => {
    const { unit_price: _omit, ...rest } = validLine()
    expect(createOrderLineSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts budget_item_id as null (not linked to APU line)', () => {
    expect(createOrderLineSchema.safeParse({ ...validLine(), budget_item_id: null }).success).toBe(true)
  })

  it('accepts budget_item_id as a UUID (linked to APU line)', () => {
    expect(createOrderLineSchema.safeParse({ ...validLine(), budget_item_id: UUID3 }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// receiveSchema — confirmación de recepción de materiales
// ---------------------------------------------------------------------------

describe('receiveSchema', () => {
  it('accepts a minimal valid receive payload', () => {
    expect(receiveSchema.safeParse(validReceive()).success).toBe(true)
  })

  it('rejects when order_id is not a UUID', () => {
    expect(receiveSchema.safeParse({ ...validReceive(), order_id: 'bad' }).success).toBe(false)
  })

  it('accepts multiple items in one receive operation', () => {
    const result = receiveSchema.safeParse({
      order_id: UUID,
      items: [
        { line_id: UUID2, received_quantity: '3000' },
        { line_id: UUID3, received_quantity: '1500' },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items).toHaveLength(2)
    }
  })

  it('accepts empty items array (no-op receive)', () => {
    expect(receiveSchema.safeParse({ order_id: UUID, items: [] }).success).toBe(true)
  })

  it('rejects when line_id is not a UUID', () => {
    expect(
      receiveSchema.safeParse({
        order_id: UUID,
        items: [{ line_id: 'bad', received_quantity: '100' }],
      }).success
    ).toBe(false)
  })

  it('rejects when received_quantity is missing from an item', () => {
    expect(
      receiveSchema.safeParse({
        order_id: UUID,
        items: [{ line_id: UUID2 }],
      }).success
    ).toBe(false)
  })
})
