/**
 * Unit tests — retail_inventory validators
 *
 * Venezuelan retail inventory context:
 *   - count_type 'spot_check': conteo selectivo — used after CORPOELEC cuts
 *     when refrigerated inventory is at risk
 *   - is_dead_stock: inventario sin rotación — products stuck due to price
 *     controls or supply imbalances (common in Venezuelan retail)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createCountSchema,
  updateCountSchema,
  listCountSchema,
  listRotationSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validCount = () => ({ branch_id: UUID, planned_date: '2026-01-20' })

// ---------------------------------------------------------------------------
// createCountSchema
// ---------------------------------------------------------------------------
describe('createCountSchema', () => {
  it('accepts minimal count with defaults', () => {
    const r = createCountSchema.safeParse(validCount())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count_type).toBe('full')
  })
  it('rejects non-UUID branch_id', () => {
    expect(createCountSchema.safeParse({ ...validCount(), branch_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty planned_date', () => {
    expect(createCountSchema.safeParse({ ...validCount(), planned_date: '' }).success).toBe(false)
  })
  it('accepts planned_date as plain string', () => {
    const r = createCountSchema.safeParse(validCount())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.planned_date).toBe('string')
  })
  it('accepts notes as null', () => {
    expect(createCountSchema.safeParse({ ...validCount(), notes: null }).success).toBe(true)
  })

  describe('count_type enum', () => {
    const types = ['full', 'partial', 'spot_check'] as const
    test.each(types)('accepts count_type "%s"', (count_type) => {
      expect(createCountSchema.safeParse({ ...validCount(), count_type }).success).toBe(true)
    })
    it('rejects invalid count_type', () => {
      expect(createCountSchema.safeParse({ ...validCount(), count_type: 'cycle' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateCountSchema
// ---------------------------------------------------------------------------
describe('updateCountSchema', () => {
  it('accepts empty object', () => { expect(updateCountSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateCountSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateCountSchema.safeParse({ status: 'approved' }).success).toBe(false)
    })
  })

  it('accepts performed_by as UUID', () => {
    expect(updateCountSchema.safeParse({ performed_by: UUID }).success).toBe(true)
  })
  it('accepts lines array with counted quantities', () => {
    const r = updateCountSchema.safeParse({
      lines: [{ id: UUID, counted_quantity: 25 }],
    })
    expect(r.success).toBe(true)
  })
  it('rejects counted_quantity below 0', () => {
    expect(updateCountSchema.safeParse({
      lines: [{ id: UUID, counted_quantity: -1 }],
    }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listCountSchema
// ---------------------------------------------------------------------------
describe('listCountSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listCountSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces page from string', () => {
    const r = listCountSchema.safeParse({ page: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.page).toBe(2)
  })

  describe('status filter enum', () => {
    const statuses = ['planned', 'in_progress', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listCountSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('passes through unknown fields', () => {
    expect(listCountSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listRotationSchema
// ---------------------------------------------------------------------------
describe('listRotationSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listRotationSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces is_dead_stock from string', () => {
    const r = listRotationSchema.safeParse({ is_dead_stock: 'true' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_dead_stock).toBe(true)
  })
  it('accepts branch_id UUID filter', () => {
    expect(listRotationSchema.safeParse({ branch_id: UUID }).success).toBe(true)
  })
  it('accepts period_month filter string', () => {
    expect(listRotationSchema.safeParse({ period_month: '2026-01' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listRotationSchema.safeParse({ product_id: UUID }).success).toBe(true)
  })
})
