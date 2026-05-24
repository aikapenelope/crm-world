/**
 * Unit tests — dist_inventory validators
 *
 * Covers the Zod schemas for inventory items, stock movements, and list queries
 * used in the Distribution Inventory vertical.
 *
 * Venezuelan distribution inventory context:
 *   - warehouse_code default 'main': almacén principal; multi-warehouse
 *     supported for distributors with regional depósitos
 *   - quantity_available uses coerce (accepts string values from forms/APIs)
 *   - reorder_point / reorder_quantity: puntos de reorden — critical in
 *     Venezuela where supply chains are unpredictable (escasez)
 *   - type 'return_in': devolución de cliente — common in Venezuelan
 *     distribution due to temperature issues, expired products
 *   - type 'count': inventario físico — periodic counts to detect
 *     discrepancies common with informal handling (merma)
 *   - reference_type 'manual': ajuste manual — requires supervisor approval
 *   - unit_cost default '0.0000': cost populated from purchase receipts
 *   - All monetary values in USD (distribution invoicing standard)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createMovementSchema,
  listInventorySchema,
  listMovementsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid inventory item payload. */
const validItem = () => ({
  product_id: UUID,
})

/** Minimal valid movement payload. */
const validMovement = () => ({
  product_id: UUID,
  type: 'purchase_in' as const,
  quantity: 100,
})

// ---------------------------------------------------------------------------
// createInventoryItemSchema
// ---------------------------------------------------------------------------

describe('createInventoryItemSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid inventory item with defaults', () => {
      const result = createInventoryItemSchema.safeParse(validItem())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.warehouse_code).toBe('main')
        expect(result.data.quantity_available).toBe(0)
        expect(result.data.reorder_point).toBe(0)
        expect(result.data.reorder_quantity).toBe(0)
        expect(result.data.unit_cost).toBe('0.0000')
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects when product_id is not a UUID', () => {
      expect(createInventoryItemSchema.safeParse({ ...validItem(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects quantity_available below 0', () => {
      expect(createInventoryItemSchema.safeParse({ ...validItem(), quantity_available: -1 }).success).toBe(false)
    })

    it('coerces quantity_available from string', () => {
      const result = createInventoryItemSchema.safeParse({ ...validItem(), quantity_available: '250' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity_available).toBe(250)
    })

    it('coerces reorder_point from string', () => {
      const result = createInventoryItemSchema.safeParse({ ...validItem(), reorder_point: '50' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.reorder_point).toBe(50)
    })

    it('coerces reorder_quantity from string', () => {
      const result = createInventoryItemSchema.safeParse({ ...validItem(), reorder_quantity: '200' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.reorder_quantity).toBe(200)
    })

    it('accepts variant_id as null (non-variant product)', () => {
      expect(createInventoryItemSchema.safeParse({ ...validItem(), variant_id: null }).success).toBe(true)
    })

    it('accepts variant_id as UUID', () => {
      expect(createInventoryItemSchema.safeParse({ ...validItem(), variant_id: UUID2 }).success).toBe(true)
    })

    it('accepts a custom warehouse_code (depósito regional)', () => {
      const result = createInventoryItemSchema.safeParse({ ...validItem(), warehouse_code: 'ALM-ZUL-01' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.warehouse_code).toBe('ALM-ZUL-01')
    })
  })
})

// ---------------------------------------------------------------------------
// updateInventoryItemSchema
// ---------------------------------------------------------------------------

describe('updateInventoryItemSchema', () => {
  it('accepts an empty object', () => {
    expect(updateInventoryItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a quantity_available-only update (stock count adjustment)', () => {
    const result = updateInventoryItemSchema.safeParse({ quantity_available: 180 })
    expect(result.success).toBe(true)
  })

  it('accepts reorder_point and reorder_quantity update', () => {
    expect(
      updateInventoryItemSchema.safeParse({ reorder_point: 30, reorder_quantity: 150 }).success
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createMovementSchema
// ---------------------------------------------------------------------------

describe('createMovementSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid movement with defaults', () => {
      const result = createMovementSchema.safeParse(validMovement())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.warehouse_code).toBe('main')
        expect(result.data.reference_type).toBe('manual')
      }
    })

    it('rejects when product_id is not a UUID', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), product_id: 'bad' }).success).toBe(false)
    })

    it('coerces quantity from string', () => {
      const result = createMovementSchema.safeParse({ ...validMovement(), quantity: '50' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.quantity).toBe(50)
    })

    it('accepts negative quantity (sale_out / adjustment)', () => {
      const result = createMovementSchema.safeParse({ ...validMovement(), quantity: -10 })
      expect(result.success).toBe(true)
    })

    it('accepts reference_id as null (unlinked movement)', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), reference_id: null }).success).toBe(true)
    })

    it('accepts unit_cost as null (cost not recorded at movement time)', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), unit_cost: null }).success).toBe(true)
    })

    it('accepts notes as null', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), notes: null }).success).toBe(true)
    })
  })

  describe('type enum', () => {
    const types = ['purchase_in', 'sale_out', 'return_in', 'adjustment', 'transfer', 'count'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createMovementSchema.safeParse({ ...validMovement(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), type: 'writeoff' }).success).toBe(false)
    })
  })

  describe('reference_type enum', () => {
    const refTypes = ['sales_order', 'purchase_order', 'return', 'manual'] as const

    test.each(refTypes)('accepts reference_type "%s"', (reference_type) => {
      expect(createMovementSchema.safeParse({ ...validMovement(), reference_type }).success).toBe(true)
    })

    it('rejects an invalid reference_type', () => {
      expect(createMovementSchema.safeParse({ ...validMovement(), reference_type: 'transfer_order' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listInventorySchema
// ---------------------------------------------------------------------------

describe('listInventorySchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listInventorySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listInventorySchema.safeParse({ page: '3', pageSize: '30' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(30)
    }
  })

  it('rejects pageSize above 100', () => {
    expect(listInventorySchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })

  it('accepts warehouse_code and low_stock filters', () => {
    const result = listInventorySchema.safeParse({ warehouse_code: 'main', low_stock: 'true' })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listInventorySchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listMovementsSchema
// ---------------------------------------------------------------------------

describe('listMovementsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listMovementsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('accepts product_id filter as UUID', () => {
    const result = listMovementsSchema.safeParse({ product_id: UUID })
    expect(result.success).toBe(true)
  })

  it('rejects product_id that is not a UUID', () => {
    expect(listMovementsSchema.safeParse({ product_id: 'bad' }).success).toBe(false)
  })

  it('accepts type filter string', () => {
    expect(listMovementsSchema.safeParse({ type: 'sale_out' }).success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listMovementsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})
