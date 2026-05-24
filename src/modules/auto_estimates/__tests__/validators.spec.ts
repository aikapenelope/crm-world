/**
 * Unit tests — auto_estimates validators
 *
 * Venezuelan auto repair estimate context:
 *   - status 'partially_approved': aprobación parcial — cliente aprueba
 *     algunos ítems pero rechaza otros (común para controlar presupuesto)
 *   - status 'expired': presupuesto vencido — valid_until superado
 *   - createEstimateItemSchema.is_approved default false: cada ítem del
 *     presupuesto requiere aprobación explícita del cliente
 *   - updateEstimateSchema: schema STANDALONE (no partial de create)
 *   - valid_until: z.string() sin regex — fecha libre (§14: no testear rechazo de '')
 *   - currency default 'USD'
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createEstimateSchema,
  updateEstimateSchema,
  createEstimateItemSchema,
  listEstimatesSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'
const UUID3 = '33333333-3333-4333-8333-333333333333'

const validEstimate = () => ({
  service_order_id: UUID,
  vehicle_id: UUID2,
  customer_id: UUID3,
  estimate_number: 'PRES-2026-001',
})

const validItem = () => ({
  estimate_id: UUID,
  type: 'part' as const,
  description: 'Correa de distribución Toyota 2ZR-FE',
  quantity: 1,
  unit_price: '48.00',
  total_price: '48.00',
})

// ---------------------------------------------------------------------------
// createEstimateSchema
// ---------------------------------------------------------------------------
describe('createEstimateSchema', () => {
  it('accepts minimal estimate with defaults', () => {
    const r = createEstimateSchema.safeParse(validEstimate())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.currency).toBe('USD')
  })
  it('rejects non-UUID service_order_id', () => {
    expect(createEstimateSchema.safeParse({ ...validEstimate(), service_order_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing estimate_number (min(1))', () => {
    expect(createEstimateSchema.safeParse({ ...validEstimate(), estimate_number: '' }).success).toBe(false)
  })
  it('accepts valid_until as plain string (no regex constraint)', () => {
    const r = createEstimateSchema.safeParse({ ...validEstimate(), valid_until: '2026-02-15' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.valid_until).toBe('2026-02-15')
  })
  it('accepts valid_until as null (no expiry)', () => {
    expect(createEstimateSchema.safeParse({ ...validEstimate(), valid_until: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// updateEstimateSchema — standalone schema
// ---------------------------------------------------------------------------
describe('updateEstimateSchema', () => {
  it('accepts empty object', () => { expect(updateEstimateSchema.safeParse({}).success).toBe(true) })
  it('accepts customer_notes as null', () => {
    expect(updateEstimateSchema.safeParse({ customer_notes: null }).success).toBe(true)
  })
  it('accepts totals update after item addition', () => {
    expect(updateEstimateSchema.safeParse({
      subtotal_labor: '150.00',
      subtotal_parts: '120.00',
      tax_amount: '43.20',
      total_amount: '313.20',
    }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['draft', 'sent', 'partially_approved', 'approved', 'rejected', 'expired'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateEstimateSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateEstimateSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// createEstimateItemSchema
// ---------------------------------------------------------------------------
describe('createEstimateItemSchema', () => {
  it('accepts minimal item with defaults', () => {
    const r = createEstimateItemSchema.safeParse(validItem())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.quantity).toBe(1)
      expect(r.data.is_approved).toBe(false)
    }
  })
  it('rejects non-UUID estimate_id', () => {
    expect(createEstimateItemSchema.safeParse({ ...validItem(), estimate_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty description (min(1))', () => {
    expect(createEstimateItemSchema.safeParse({ ...validItem(), description: '' }).success).toBe(false)
  })
  it('rejects quantity below 1', () => {
    expect(createEstimateItemSchema.safeParse({ ...validItem(), quantity: 0 }).success).toBe(false)
  })
  it('coerces quantity from string', () => {
    const r = createEstimateItemSchema.safeParse({ ...validItem(), quantity: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.quantity).toBe(2)
  })
  it('rejects empty unit_price (min(1))', () => {
    expect(createEstimateItemSchema.safeParse({ ...validItem(), unit_price: '' }).success).toBe(false)
  })
  it('accepts is_approved = true (item approved by customer)', () => {
    const r = createEstimateItemSchema.safeParse({ ...validItem(), is_approved: true })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_approved).toBe(true)
  })

  describe('type enum', () => {
    const types = ['labor', 'part'] as const
    test.each(types)('accepts type "%s"', (type) => {
      expect(createEstimateItemSchema.safeParse({ ...validItem(), type }).success).toBe(true)
    })
    it('rejects invalid type', () => {
      expect(createEstimateItemSchema.safeParse({ ...validItem(), type: 'service' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listEstimatesSchema
// ---------------------------------------------------------------------------
describe('listEstimatesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listEstimatesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts service_order_id UUID filter', () => {
    expect(listEstimatesSchema.safeParse({ service_order_id: UUID }).success).toBe(true)
  })
  it('accepts status filter string', () => {
    expect(listEstimatesSchema.safeParse({ status: 'sent' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listEstimatesSchema.safeParse({ customer_id: UUID }).success).toBe(true)
  })
})
