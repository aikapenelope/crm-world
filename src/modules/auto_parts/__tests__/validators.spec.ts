/**
 * Unit tests — auto_parts validators
 *
 * Venezuelan auto parts context:
 *   - unit default 'pieza': unidad de medida en español — estándar en
 *     talleres venezolanos (pieza, litro, metro, juego)
 *   - category 'filters': filtros (aceite, aire, combustible) — alta rotación
 *   - category 'fluids': fluidos (aceite, refrigerante, ATF) — consumibles
 *   - compatible_brands: array de marcas compatibles (Toyota, Ford, Chevy...)
 *   - cost_price / sell_price: z.string().min(1) — NO testear '' (min(1))
 *   - reorder_point coerce min(0): puede llegar como string desde formulario
 *   - currency default 'USD': repuestos en USD (mercado venezolano)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createPartSchema,
  updatePartSchema,
  listPartsSchema,
} from '../data/validators'

const validPart = () => ({
  code: 'FRN-TOY-001',
  name: 'Pastillas de freno Toyota Corolla 2015-2019',
  cost_price: '28.00',
  sell_price: '42.00',
})

describe('createPartSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal part with defaults', () => {
      const r = createPartSchema.safeParse(validPart())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.category).toBe('other')
        expect(r.data.unit).toBe('pieza')
        expect(r.data.currency).toBe('USD')
        expect(r.data.quantity_in_stock).toBe(0)
        expect(r.data.reorder_point).toBe(0)
      }
    })
    it('rejects missing code (min(1))', () => {
      const { code: _o, ...rest } = validPart()
      expect(createPartSchema.safeParse(rest).success).toBe(false)
    })
    it('rejects missing name (min(1))', () => {
      const { name: _o, ...rest } = validPart()
      expect(createPartSchema.safeParse(rest).success).toBe(false)
    })
    it('rejects empty cost_price (min(1))', () => {
      expect(createPartSchema.safeParse({ ...validPart(), cost_price: '' }).success).toBe(false)
    })
    it('rejects empty sell_price (min(1))', () => {
      expect(createPartSchema.safeParse({ ...validPart(), sell_price: '' }).success).toBe(false)
    })
    it('rejects quantity_in_stock below 0', () => {
      expect(createPartSchema.safeParse({ ...validPart(), quantity_in_stock: -1 }).success).toBe(false)
    })
    it('coerces quantity_in_stock from string', () => {
      const r = createPartSchema.safeParse({ ...validPart(), quantity_in_stock: '8' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.quantity_in_stock).toBe(8)
    })
    it('coerces reorder_point from string', () => {
      const r = createPartSchema.safeParse({ ...validPart(), reorder_point: '2' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.reorder_point).toBe(2)
    })
    it('accepts compatible_brands as string array', () => {
      const r = createPartSchema.safeParse({ ...validPart(), compatible_brands: ['Toyota', 'Lexus'] })
      expect(r.success).toBe(true)
    })
    it('accepts compatible_brands as null', () => {
      expect(createPartSchema.safeParse({ ...validPart(), compatible_brands: null }).success).toBe(true)
    })
    it('accepts brand and location as null', () => {
      expect(createPartSchema.safeParse({ ...validPart(), brand: null, location: null }).success).toBe(true)
    })
  })

  describe('category enum', () => {
    const cats = ['brakes', 'engine', 'electrical', 'suspension', 'filters', 'fluids', 'body', 'other'] as const
    test.each(cats)('accepts category "%s"', (category) => {
      expect(createPartSchema.safeParse({ ...validPart(), category }).success).toBe(true)
    })
    it('rejects invalid category', () => {
      expect(createPartSchema.safeParse({ ...validPart(), category: 'tires' }).success).toBe(false)
    })
  })
})

describe('updatePartSchema', () => {
  it('accepts empty object', () => { expect(updatePartSchema.safeParse({}).success).toBe(true) })
  it('accepts sell_price update (price adjustment)', () => {
    expect(updatePartSchema.safeParse({ sell_price: '45.00' }).success).toBe(true)
  })
  it('accepts quantity_in_stock update after purchase receipt', () => {
    expect(updatePartSchema.safeParse({ quantity_in_stock: 12 }).success).toBe(true)
  })
  it('still rejects invalid category in partial update', () => {
    expect(updatePartSchema.safeParse({ category: 'tires' }).success).toBe(false)
  })
})

describe('listPartsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listPartsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts category filter string', () => {
    expect(listPartsSchema.safeParse({ category: 'brakes' }).success).toBe(true)
  })
  it('accepts search filter', () => {
    expect(listPartsSchema.safeParse({ search: 'toyota' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listPartsSchema.safeParse({ brand: 'Toyota' }).success).toBe(true)
  })
})
