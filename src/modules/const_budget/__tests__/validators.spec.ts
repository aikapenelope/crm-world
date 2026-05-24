/**
 * Unit tests — const_budget validators
 *
 * Covers the Zod schemas for budget items, budget resources, and list queries
 * used in the Construction Budget vertical.
 *
 * Venezuelan construction budget context:
 *   - APU (Análisis de Precios Unitarios): Venezuelan standard cost breakdown
 *     method — each budget line decomposes into material + labor + equipment
 *   - is_chapter = true: línea de capítulo (chapter heading) — no quantities,
 *     just groups sub-items for APU structure
 *   - category 'civil': obras civiles (excavación, concreto, relleno, etc.)
 *   - level: WBS depth (0=chapter, 1=section, 2=sub-section, 3-5=line items)
 *   - currency default 'USD': presupuesto en dólares (dual-currency projects)
 *   - resource_type 'overhead': gastos generales — typically 10-15% in VEN
 *   - sort_order uses coerce (accepts string from query params)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createBudgetItemSchema,
  updateBudgetItemSchema,
  createBudgetResourceSchema,
  updateBudgetResourceSchema,
  listBudgetItemsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid budget item payload. */
const validItem = () => ({
  project_id: UUID,
  item_number: '1.1.01',
  name: 'Excavación y nivelación de terreno',
})

/** Minimal valid budget resource payload. */
const validResource = () => ({
  budget_item_id: UUID,
  resource_type: 'material' as const,
  name: 'Arena gruesa lavada',
  unit: 'M3',
  quantity: '50.00',
  unit_price: '12.50',
  total: '625.00',
})

// ---------------------------------------------------------------------------
// createBudgetItemSchema
// ---------------------------------------------------------------------------

describe('createBudgetItemSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid budget item with defaults', () => {
      const result = createBudgetItemSchema.safeParse(validItem())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe('civil')
        expect(result.data.level).toBe(0)
        expect(result.data.quantity).toBe('0.0000')
        expect(result.data.unit_cost).toBe('0.0000')
        expect(result.data.total_cost).toBe('0.00')
        expect(result.data.currency).toBe('USD')
        expect(result.data.is_chapter).toBe(false)
        expect(result.data.sort_order).toBe(0)
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when item_number is missing', () => {
      const { item_number: _omit, ...rest } = validItem()
      expect(createBudgetItemSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validItem()
      expect(createBudgetItemSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects level above 5', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), level: 6 }).success).toBe(false)
    })

    it('rejects level below 0', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), level: -1 }).success).toBe(false)
    })

    it('coerces level from string', () => {
      const result = createBudgetItemSchema.safeParse({ ...validItem(), level: '2' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.level).toBe(2)
      }
    })

    it('accepts is_chapter = true (capítulo sin cantidades)', () => {
      const result = createBudgetItemSchema.safeParse({
        ...validItem(),
        is_chapter: true,
        level: 0,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_chapter).toBe(true)
      }
    })

    it('accepts parent_id as null (top-level chapter)', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), parent_id: null }).success).toBe(true)
    })

    it('accepts parent_id as a UUID (nested sub-item)', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), parent_id: UUID2 }).success).toBe(true)
    })

    it('accepts unit as null (chapter row — no unit)', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), unit: null }).success).toBe(true)
    })

    it('coerces sort_order from string', () => {
      const result = createBudgetItemSchema.safeParse({ ...validItem(), sort_order: '10' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort_order).toBe(10)
      }
    })
  })

  describe('category enum — APU breakdown categories', () => {
    const categories = ['civil', 'electrical', 'mechanical', 'architectural', 'special', 'general'] as const

    test.each(categories)('accepts category "%s"', (category) => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), category }).success).toBe(true)
    })

    it('rejects an invalid category', () => {
      expect(createBudgetItemSchema.safeParse({ ...validItem(), category: 'plumbing' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateBudgetItemSchema
// ---------------------------------------------------------------------------

describe('updateBudgetItemSchema', () => {
  it('accepts an empty object', () => {
    expect(updateBudgetItemSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a total_cost-only update (recalculation)', () => {
    expect(updateBudgetItemSchema.safeParse({ total_cost: '12500.00' }).success).toBe(true)
  })

  it('still rejects invalid category in partial update', () => {
    expect(updateBudgetItemSchema.safeParse({ category: 'plumbing' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createBudgetResourceSchema — APU resource breakdown
// ---------------------------------------------------------------------------

describe('createBudgetResourceSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid budget resource with defaults', () => {
      const result = createBudgetResourceSchema.safeParse(validResource())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
        expect(result.data.sort_order).toBe(0)
      }
    })

    it('rejects when budget_item_id is not a UUID', () => {
      expect(createBudgetResourceSchema.safeParse({ ...validResource(), budget_item_id: 'bad' }).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validResource()
      expect(createBudgetResourceSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when unit is missing', () => {
      const { unit: _omit, ...rest } = validResource()
      expect(createBudgetResourceSchema.safeParse(rest).success).toBe(false)
    })

    it('coerces sort_order from string', () => {
      const result = createBudgetResourceSchema.safeParse({ ...validResource(), sort_order: '5' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sort_order).toBe(5)
      }
    })
  })

  describe('resource_type enum — APU cost components', () => {
    const types = ['material', 'labor', 'equipment', 'subcontract', 'overhead'] as const

    test.each(types)('accepts resource_type "%s"', (resource_type) => {
      expect(createBudgetResourceSchema.safeParse({ ...validResource(), resource_type }).success).toBe(true)
    })

    it('rejects an invalid resource_type', () => {
      expect(createBudgetResourceSchema.safeParse({ ...validResource(), resource_type: 'fuel' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateBudgetResourceSchema
// ---------------------------------------------------------------------------

describe('updateBudgetResourceSchema', () => {
  it('accepts an empty object', () => {
    expect(updateBudgetResourceSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a unit_price-only update (price escalation)', () => {
    expect(updateBudgetResourceSchema.safeParse({ unit_price: '15.00' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listBudgetItemsSchema — coerce pagination from query strings
// ---------------------------------------------------------------------------

describe('listBudgetItemsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listBudgetItemsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(200)
    }
  })

  it('coerces string page and pageSize to numbers', () => {
    const result = listBudgetItemsSchema.safeParse({ page: '3', pageSize: '100' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(100)
    }
  })

  it('rejects pageSize above 500', () => {
    expect(listBudgetItemsSchema.safeParse({ pageSize: '501' }).success).toBe(false)
  })

  it('accepts project_id filter as a UUID', () => {
    const result = listBudgetItemsSchema.safeParse({ project_id: UUID })
    expect(result.success).toBe(true)
  })

  it('accepts parent_id as null (root items)', () => {
    const result = listBudgetItemsSchema.safeParse({ parent_id: null })
    expect(result.success).toBe(true)
  })

  it('passes through unknown fields (passthrough schema)', () => {
    expect(listBudgetItemsSchema.safeParse({ unknown_param: 'val' }).success).toBe(true)
  })
})
