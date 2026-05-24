/**
 * Unit tests — dist_commissions validators
 *
 * Covers the Zod schemas for commission rules, commission records, and list
 * queries used in the Distribution Commissions vertical.
 *
 * Venezuelan distribution commissions context:
 *   - Comisiones de ventas: compensación variable — critical motivator for
 *     Venezuelan sales force where base salary (salario mínimo) is low
 *   - type 'sale': comisión por venta — percentage of invoiced amount
 *   - type 'collection': comisión por cobro — additional incentive for
 *     collecting outstanding receivables (critical given credit risk)
 *   - type 'goal_bonus': bono por meta — lump-sum bonus for reaching
 *     period sales target (meta de ventas)
 *   - period_month format YYYY-MM: monthly accrual period — matches
 *     LOTTT payroll cycle; validated with regex /^\d{4}-\d{2}$/
 *   - min_amount default '0.00': minimum sale amount for commission to apply
 *   - All commission amounts in USD (stable base for calculation)
 *   - updateRecordSchema: standalone minimal schema — only status is
 *     updatable after creation (commission records are immutable)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createRuleSchema,
  updateRuleSchema,
  createRecordSchema,
  updateRecordSchema,
  listRulesSchema,
  listRecordsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid commission rule payload. */
const validRule = () => ({
  type: 'sale' as const,
  rate: '3.00',
})

/** Minimal valid commission record payload. */
const validRecord = () => ({
  seller_id: UUID,
  period_month: '2026-01',
  type: 'sale' as const,
  base_amount: '15000.00',
  rate_applied: '3.00',
  commission_amount: '450.00',
})

// ---------------------------------------------------------------------------
// createRuleSchema
// ---------------------------------------------------------------------------

describe('createRuleSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid commission rule with defaults', () => {
      const result = createRuleSchema.safeParse(validRule())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.min_amount).toBe('0.00')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when rate is missing', () => {
      const { rate: _omit, ...rest } = validRule()
      expect(createRuleSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts seller_id as null (global rule — all sellers)', () => {
      expect(createRuleSchema.safeParse({ ...validRule(), seller_id: null }).success).toBe(true)
    })

    it('accepts seller_id as UUID (seller-specific rule)', () => {
      expect(createRuleSchema.safeParse({ ...validRule(), seller_id: UUID }).success).toBe(true)
    })

    it('accepts goal_amount for goal_bonus rules', () => {
      const result = createRuleSchema.safeParse({
        ...validRule(),
        type: 'goal_bonus',
        goal_amount: '50000.00',
        rate: '500.00',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.goal_amount).toBe('50000.00')
    })

    it('accepts goal_amount as null (not a goal-based rule)', () => {
      expect(createRuleSchema.safeParse({ ...validRule(), goal_amount: null }).success).toBe(true)
    })

    it('accepts is_active = false (deactivated rule)', () => {
      const result = createRuleSchema.safeParse({ ...validRule(), is_active: false })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_active).toBe(false)
    })

    it('accepts description as null', () => {
      expect(createRuleSchema.safeParse({ ...validRule(), description: null }).success).toBe(true)
    })
  })

  describe('type enum', () => {
    const types = ['sale', 'collection', 'goal_bonus'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createRuleSchema.safeParse({ ...validRule(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createRuleSchema.safeParse({ ...validRule(), type: 'retention' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRuleSchema
// ---------------------------------------------------------------------------

describe('updateRuleSchema', () => {
  it('accepts an empty object', () => {
    expect(updateRuleSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating a rule)', () => {
    expect(updateRuleSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('accepts rate update (rate revision for new period)', () => {
    expect(updateRuleSchema.safeParse({ rate: '3.50' }).success).toBe(true)
  })

  it('still rejects invalid type in partial update', () => {
    expect(updateRuleSchema.safeParse({ type: 'retention' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createRecordSchema
// ---------------------------------------------------------------------------

describe('createRecordSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid commission record with defaults', () => {
      const result = createRecordSchema.safeParse(validRecord())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
      }
    })

    it('rejects when seller_id is not a UUID', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), seller_id: 'bad' }).success).toBe(false)
    })

    it('rejects when base_amount is missing', () => {
      const { base_amount: _omit, ...rest } = validRecord()
      expect(createRecordSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when commission_amount is missing', () => {
      const { commission_amount: _omit, ...rest } = validRecord()
      expect(createRecordSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts reference_id as null (no linked document)', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), reference_id: null }).success).toBe(true)
    })

    it('accepts reference_type as null', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), reference_type: null }).success).toBe(true)
    })

    it('accepts reference_type as a short string', () => {
      const result = createRecordSchema.safeParse({ ...validRecord(), reference_type: 'sales_order' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.reference_type).toBe('sales_order')
    })
  })

  describe('period_month format validation (YYYY-MM)', () => {
    it('accepts valid period_month "2026-01"', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '2026-01' }).success).toBe(true)
    })

    it('accepts valid period_month "2026-12"', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '2026-12' }).success).toBe(true)
    })

    it('rejects period_month "2026-1" (missing leading zero)', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '2026-1' }).success).toBe(false)
    })

    it('rejects period_month "26-01" (2-digit year)', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '26-01' }).success).toBe(false)
    })

    it('rejects period_month "2026/01" (wrong separator)', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '2026/01' }).success).toBe(false)
    })

    it('rejects plain year "2026"', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), period_month: '2026' }).success).toBe(false)
    })
  })

  describe('type enum', () => {
    const types = ['sale', 'collection', 'goal_bonus'] as const

    test.each(types)('accepts type "%s"', (type) => {
      expect(createRecordSchema.safeParse({ ...validRecord(), type }).success).toBe(true)
    })

    it('rejects an invalid type', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), type: 'retention' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'approved', 'paid'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createRecordSchema.safeParse({ ...validRecord(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRecordSchema — standalone minimal schema (status only)
// ---------------------------------------------------------------------------

describe('updateRecordSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateRecordSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (pending → approved)', () => {
    expect(updateRecordSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('accepts status update to paid', () => {
    expect(updateRecordSchema.safeParse({ status: 'paid' }).success).toBe(true)
  })

  it('rejects an invalid status', () => {
    expect(updateRecordSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listRulesSchema
// ---------------------------------------------------------------------------

describe('listRulesSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listRulesSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces page and pageSize from strings', () => {
    const result = listRulesSchema.safeParse({ page: '2', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.page).toBe(2)
  })

  it('accepts type filter string', () => {
    expect(listRulesSchema.safeParse({ type: 'sale' }).success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listRulesSchema.safeParse({ seller_id: UUID }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listRecordsSchema
// ---------------------------------------------------------------------------

describe('listRecordsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listRecordsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('accepts seller_id filter as UUID', () => {
    const result = listRecordsSchema.safeParse({ seller_id: UUID })
    expect(result.success).toBe(true)
  })

  it('rejects seller_id that is not a UUID', () => {
    expect(listRecordsSchema.safeParse({ seller_id: 'bad' }).success).toBe(false)
  })

  it('accepts period_month filter string', () => {
    expect(listRecordsSchema.safeParse({ period_month: '2026-01' }).success).toBe(true)
  })

  it('accepts status filter string', () => {
    expect(listRecordsSchema.safeParse({ status: 'pending' }).success).toBe(true)
  })

  it('passes through unknown fields', () => {
    expect(listRecordsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})
