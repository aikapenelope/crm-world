/**
 * Unit tests — dist_price_lists validators
 *
 * Covers the Zod schemas for price lists, price list items, customer price
 * assignments, and list queries used in the Distribution Price Lists vertical.
 *
 * Venezuelan distribution price list context:
 *   - type 'standard': lista de precio estándar — base price for all clients
 *   - type 'promotional': precio de oferta — time-bounded promotions; valid_from
 *     / valid_until define the promotional window
 *   - type 'volume': precio por volumen — escalonado; min_quantity triggers
 *     the price tier (bulk discounts for large distributors)
 *   - is_default: lista asignada automáticamente a clientes sin asignación
 *     explícita — only one should be default at a time
 *   - currency default 'USD': all distribution pricing in USD (BCV parity)
 *   - assignCustomerSchema: allows multiple price lists per customer with
 *     priority ordering (lower priority number = higher precedence)
 *   - valid_from / valid_until stored as plain strings (date YYYY-MM-DD)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createPriceListSchema,
  updatePriceListSchema,
  createPriceListItemSchema,
  updatePriceListItemSchema,
  assignCustomerSchema,
  listPriceListsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid price list payload. */
const validList = () => ({
  name: 'Lista Estándar 2026',
  code: 'PL-STD-2026',
})

/** Minimal valid price list item payload. */
const validItem = () => ({
  price_list_id: UUID,
  product_id: UUID2,
  unit_price: '6.50',
})

/** Minimal valid assign customer payload. */
const validAssign = () => ({
  customer_id: UUID,
  price_list_id: UUID2,
})

// ---------------------------------------------------------------------------
// createPriceListSchema
// ---------------------------------------------------------------------------

describe('createPriceListSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid price list with defaults', () => {
      const result = createPriceListSchema.safeParse(validList())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('standard')
        expect(result.data.currency).toBe('USD')
        expect(result.data.is_default).toBe(false)
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validList()
      expect(createPriceListSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validList()
      expect(createPriceListSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts is_default = true (global default list)', () => {
      const result = createPriceListSchema.safeParse({ ...validList(), is_default: true })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_default).toBe(true)
    })

    it('accepts valid_from and valid_until as plain strings', () => {
      const result = createPriceListSchema.safeParse({
        ...validList(),
        type: 'promotional',
        valid_from: '2026-06-01',
        valid_until: '2026-06-30',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.valid_from).toBe('2026-06-01')
        expect(result.data.valid_until).toBe('2026-06-30')
      }
    })

    it('accepts valid_from and valid_until as null (permanent list)', () => {
      expect(
        createPriceListSchema.safeParse({ ...validList(), valid_from: null, valid_until: null }).success
      ).toBe(true)
    })

    it('accepts description as null', () => {
      expect(createPriceListSchema.safeParse({ ...validList(), description: null }).success).toBe(true)
    })
  })

  describe('type enum', () => {
    const types = ['standard', 'promotional', 'volume'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createPriceListSchema.safeParse({ ...validList(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createPriceListSchema.safeParse({ ...validList(), type: 'wholesale' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePriceListSchema
// ---------------------------------------------------------------------------

describe('updatePriceListSchema', () => {
  it('accepts an empty object', () => {
    expect(updatePriceListSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating expired list)', () => {
    expect(updatePriceListSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid type in partial update', () => {
    expect(updatePriceListSchema.safeParse({ type: 'wholesale' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createPriceListItemSchema
// ---------------------------------------------------------------------------

describe('createPriceListItemSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid price list item with defaults', () => {
      const result = createPriceListItemSchema.safeParse(validItem())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.min_quantity).toBe(1)
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects when price_list_id is not a UUID', () => {
      expect(createPriceListItemSchema.safeParse({ ...validItem(), price_list_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(createPriceListItemSchema.safeParse({ ...validItem(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects when unit_price is missing', () => {
      const { unit_price: _omit, ...rest } = validItem()
      expect(createPriceListItemSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects min_quantity below 1', () => {
      expect(createPriceListItemSchema.safeParse({ ...validItem(), min_quantity: 0 }).success).toBe(false)
    })

    it('coerces min_quantity from string', () => {
      const result = createPriceListItemSchema.safeParse({ ...validItem(), min_quantity: '100' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.min_quantity).toBe(100)
    })

    it('accepts variant_id as null (non-variant product)', () => {
      expect(createPriceListItemSchema.safeParse({ ...validItem(), variant_id: null }).success).toBe(true)
    })

    it('accepts variant_id as UUID (product with variant)', () => {
      expect(createPriceListItemSchema.safeParse({ ...validItem(), variant_id: UUID }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePriceListItemSchema
// ---------------------------------------------------------------------------

describe('updatePriceListItemSchema', () => {
  it('accepts an empty object', () => {
    expect(updatePriceListItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a unit_price-only update (price revision)', () => {
    expect(updatePriceListItemSchema.safeParse({ unit_price: '7.25' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// assignCustomerSchema
// ---------------------------------------------------------------------------

describe('assignCustomerSchema', () => {
  it('accepts a minimal valid customer assignment with defaults', () => {
    const result = assignCustomerSchema.safeParse(validAssign())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe(0)
    }
  })

  it('rejects when customer_id is not a UUID', () => {
    expect(assignCustomerSchema.safeParse({ ...validAssign(), customer_id: 'bad' }).success).toBe(false)
  })

  it('rejects when price_list_id is not a UUID', () => {
    expect(assignCustomerSchema.safeParse({ ...validAssign(), price_list_id: 'bad' }).success).toBe(false)
  })

  it('rejects priority below 0', () => {
    expect(assignCustomerSchema.safeParse({ ...validAssign(), priority: -1 }).success).toBe(false)
  })

  it('coerces priority from string', () => {
    const result = assignCustomerSchema.safeParse({ ...validAssign(), priority: '10' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.priority).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// listPriceListsSchema
// ---------------------------------------------------------------------------

describe('listPriceListsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listPriceListsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listPriceListsSchema.safeParse({ page: '2', pageSize: '20' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it('rejects pageSize above 100', () => {
    expect(listPriceListsSchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })

  it('accepts type and is_active filter strings', () => {
    const result = listPriceListsSchema.safeParse({ type: 'promotional', is_active: 'true' })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listPriceListsSchema.safeParse({ custom_filter: 'x' }).success).toBe(true)
  })
})
