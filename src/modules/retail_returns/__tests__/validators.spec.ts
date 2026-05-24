/**
 * Unit tests — retail_returns validators
 *
 * Venezuelan retail returns context:
 *   - refund_method 'credit_note': nota de crédito SENIAT — default in VEN
 *     because cash refunds require fiscal authorization
 *   - refund_method 'store_credit': crédito en tienda — avoids forex issues
 *   - condition 'unsellable': producto deteriorado — scrapped without restock
 *   - creditNotes status 'partially_used' / 'fully_used' tracks nota balance
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createReturnSchema,
  updateReturnSchema,
  listReturnSchema,
  createPolicySchema,
  listPolicySchema,
  listCreditNotesSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validLine = () => ({
  product_id: UUID, quantity: 1, unit_price: '6.50',
})
const validReturn = () => ({
  branch_id: UUID,
  reason: 'defective' as const,
  lines: [validLine()],
})
const validPolicy = () => ({
  name: 'Política Estándar 30 días',
})

// ---------------------------------------------------------------------------
// createReturnSchema
// ---------------------------------------------------------------------------
describe('createReturnSchema', () => {
  it('accepts minimal return with defaults', () => {
    const r = createReturnSchema.safeParse(validReturn())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.refund_method).toBe('credit_note')
  })
  it('rejects non-UUID branch_id', () => {
    expect(createReturnSchema.safeParse({ ...validReturn(), branch_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty lines array (min 1)', () => {
    expect(createReturnSchema.safeParse({ ...validReturn(), lines: [] }).success).toBe(false)
  })
  it('rejects line quantity below 1', () => {
    expect(createReturnSchema.safeParse({
      ...validReturn(), lines: [{ ...validLine(), quantity: 0 }],
    }).success).toBe(false)
  })
  it('accepts customer_id as null (anonymous return)', () => {
    expect(createReturnSchema.safeParse({ ...validReturn(), customer_id: null }).success).toBe(true)
  })

  describe('reason enum', () => {
    const reasons = ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other'] as const
    test.each(reasons)('accepts reason "%s"', (reason) => {
      expect(createReturnSchema.safeParse({ ...validReturn(), reason }).success).toBe(true)
    })
    it('rejects invalid reason', () => {
      expect(createReturnSchema.safeParse({ ...validReturn(), reason: 'expired' }).success).toBe(false)
    })
  })

  describe('refund_method enum', () => {
    const methods = ['original', 'credit_note', 'store_credit', 'cash'] as const
    test.each(methods)('accepts refund_method "%s"', (refund_method) => {
      expect(createReturnSchema.safeParse({ ...validReturn(), refund_method }).success).toBe(true)
    })
  })

  describe('line condition enum', () => {
    const conditions = ['new', 'good', 'damaged', 'defective', 'unsellable'] as const
    test.each(conditions)('accepts line condition "%s"', (condition) => {
      const r = { ...validReturn(), lines: [{ ...validLine(), condition }] }
      expect(createReturnSchema.safeParse(r).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateReturnSchema
// ---------------------------------------------------------------------------
describe('updateReturnSchema', () => {
  it('accepts empty object', () => { expect(updateReturnSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['approved', 'inspecting', 'completed', 'rejected', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateReturnSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateReturnSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })
})

describe('listReturnSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listReturnSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['requested', 'approved', 'inspecting', 'completed', 'rejected', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listReturnSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('passes through unknown fields', () => {
    expect(listReturnSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPolicySchema
// ---------------------------------------------------------------------------
describe('createPolicySchema', () => {
  it('accepts minimal policy with defaults', () => {
    const r = createPolicySchema.safeParse(validPolicy())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.max_days).toBe(30)
      expect(r.data.requires_receipt).toBe(true)
      expect(r.data.requires_original_packaging).toBe(false)
      expect(r.data.refund_method).toBe('credit_note')
      expect(r.data.restocking_fee_percent).toBe('0.00')
    }
  })
  it('rejects missing name', () => {
    expect(createPolicySchema.safeParse({}).success).toBe(false)
  })
  it('rejects max_days below 1', () => {
    expect(createPolicySchema.safeParse({ ...validPolicy(), max_days: 0 }).success).toBe(false)
  })
  it('accepts category_ids array of UUIDs', () => {
    expect(createPolicySchema.safeParse({ ...validPolicy(), category_ids: [UUID] }).success).toBe(true)
  })
  it('accepts category_ids as null (applies to all)', () => {
    expect(createPolicySchema.safeParse({ ...validPolicy(), category_ids: null }).success).toBe(true)
  })

  describe('refund_method enum', () => {
    const methods = ['original', 'credit_note', 'store_credit', 'cash'] as const
    test.each(methods)('accepts refund_method "%s"', (refund_method) => {
      expect(createPolicySchema.safeParse({ ...validPolicy(), refund_method }).success).toBe(true)
    })
  })
})

describe('listPolicySchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listPolicySchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('passes through unknown fields', () => {
    expect(listPolicySchema.safeParse({ category_id: UUID }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listCreditNotesSchema
// ---------------------------------------------------------------------------
describe('listCreditNotesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listCreditNotesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['active', 'partially_used', 'fully_used', 'expired', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listCreditNotesSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('accepts customer_id filter', () => {
    expect(listCreditNotesSchema.safeParse({ customer_id: UUID }).success).toBe(true)
  })
})
