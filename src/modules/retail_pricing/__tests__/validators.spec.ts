/**
 * Unit tests — retail_pricing validators
 *
 * Venezuelan retail pricing context:
 *   - max_regulated_price: precio máximo regulado — SUNDDE (Venezuela's
 *     price-control authority) sets caps on essential goods; pricing must
 *     stay below this ceiling or retailer faces SUNDDE sanctions
 *   - alert_type 'above_regulated': precio supera el regulado — compliance
 *     alert requiring immediate price correction
 *   - alert_type 'exchange_rate_drift': desviación del tipo de cambio —
 *     product cost in VES has drifted from BCV rate used at last pricing
 *   - bulkUpdateSchema.update_type 'exchange_rate': actualización masiva por
 *     cambio de tasa BCV — batch repricing when BCV rate changes significantly
 *   - channel 'wholesale': precios mayorista — distribuidores y revendedores
 *   - min_margin_percent: margen mínimo — floor below which sale is a loss
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createPricingRuleSchema,
  updatePricingRuleSchema,
  listPricingRulesSchema,
  bulkUpdateSchema,
  listAlertsSchema,
  acknowledgeAlertSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validRule = () => ({ name: 'Margen mínimo 20%', min_margin_percent: '20.00' })
const validBulk = () => ({ update_type: 'exchange_rate' as const })

// ---------------------------------------------------------------------------
// createPricingRuleSchema
// ---------------------------------------------------------------------------
describe('createPricingRuleSchema', () => {
  it('accepts minimal pricing rule with defaults', () => {
    const r = createPricingRuleSchema.safeParse(validRule())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.currency).toBe('USD')
      expect(r.data.priority).toBe(0)
    }
  })
  it('rejects missing name', () => {
    expect(createPricingRuleSchema.safeParse({ min_margin_percent: '20.00' }).success).toBe(false)
  })
  it('rejects missing min_margin_percent', () => {
    expect(createPricingRuleSchema.safeParse({ name: 'Rule' }).success).toBe(false)
  })
  it('accepts max_regulated_price (SUNDDE price cap)', () => {
    const r = createPricingRuleSchema.safeParse({ ...validRule(), max_regulated_price: '8.50' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.max_regulated_price).toBe('8.50')
  })
  it('accepts max_regulated_price as null (unregulated product)', () => {
    expect(createPricingRuleSchema.safeParse({ ...validRule(), max_regulated_price: null }).success).toBe(true)
  })
  it('accepts target_margin_percent as null', () => {
    expect(createPricingRuleSchema.safeParse({ ...validRule(), target_margin_percent: null }).success).toBe(true)
  })
  it('accepts category_id as null (all categories)', () => {
    expect(createPricingRuleSchema.safeParse({ ...validRule(), category_id: null }).success).toBe(true)
  })

  describe('channel enum', () => {
    const channels = ['store', 'online', 'wholesale'] as const
    test.each(channels)('accepts channel "%s"', (channel) => {
      expect(createPricingRuleSchema.safeParse({ ...validRule(), channel }).success).toBe(true)
    })
    it('rejects invalid channel', () => {
      expect(createPricingRuleSchema.safeParse({ ...validRule(), channel: 'b2b' }).success).toBe(false)
    })
    it('accepts channel as null (all channels)', () => {
      expect(createPricingRuleSchema.safeParse({ ...validRule(), channel: null }).success).toBe(true)
    })
  })
})

describe('updatePricingRuleSchema', () => {
  it('accepts empty object', () => { expect(updatePricingRuleSchema.safeParse({}).success).toBe(true) })
  it('accepts max_regulated_price update', () => {
    expect(updatePricingRuleSchema.safeParse({ max_regulated_price: '9.00' }).success).toBe(true)
  })
  it('still rejects invalid channel in partial update', () => {
    expect(updatePricingRuleSchema.safeParse({ channel: 'b2b' }).success).toBe(false)
  })
})

describe('listPricingRulesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listPricingRulesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('channel filter enum', () => {
    const channels = ['store', 'online', 'wholesale'] as const
    test.each(channels)('accepts channel filter "%s"', (channel) => {
      expect(listPricingRulesSchema.safeParse({ channel }).success).toBe(true)
    })
  })
  it('accepts category_id UUID filter', () => {
    expect(listPricingRulesSchema.safeParse({ category_id: UUID }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listPricingRulesSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// bulkUpdateSchema
// ---------------------------------------------------------------------------
describe('bulkUpdateSchema', () => {
  it('accepts exchange_rate bulk update', () => {
    const r = bulkUpdateSchema.safeParse({
      ...validBulk(), old_exchange_rate: '36.00', new_exchange_rate: '36.45',
    })
    expect(r.success).toBe(true)
  })
  it('accepts percentage bulk update', () => {
    const r = bulkUpdateSchema.safeParse({ update_type: 'percentage', percentage_change: '5.00' })
    expect(r.success).toBe(true)
  })
  it('accepts optional fields as null', () => {
    const r = bulkUpdateSchema.safeParse({
      ...validBulk(),
      old_exchange_rate: null, new_exchange_rate: null,
      percentage_change: null, category_id: null, channel: null,
    })
    expect(r.success).toBe(true)
  })

  describe('update_type enum', () => {
    const types = ['exchange_rate', 'percentage', 'fixed'] as const
    test.each(types)('accepts update_type "%s"', (update_type) => {
      expect(bulkUpdateSchema.safeParse({ update_type }).success).toBe(true)
    })
    it('rejects invalid update_type', () => {
      expect(bulkUpdateSchema.safeParse({ update_type: 'manual' }).success).toBe(false)
    })
  })

  describe('channel enum', () => {
    const channels = ['store', 'online', 'wholesale'] as const
    test.each(channels)('accepts channel "%s"', (channel) => {
      expect(bulkUpdateSchema.safeParse({ ...validBulk(), channel }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// listAlertsSchema
// ---------------------------------------------------------------------------
describe('listAlertsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listAlertsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('alert_type filter enum', () => {
    const types = ['below_cost', 'below_margin', 'above_regulated', 'exchange_rate_drift'] as const
    test.each(types)('accepts alert_type filter "%s"', (alert_type) => {
      expect(listAlertsSchema.safeParse({ alert_type }).success).toBe(true)
    })
  })

  describe('status filter enum', () => {
    const statuses = ['active', 'acknowledged', 'resolved'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listAlertsSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('passes through unknown fields', () => {
    expect(listAlertsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// acknowledgeAlertSchema
// ---------------------------------------------------------------------------
describe('acknowledgeAlertSchema', () => {
  it('accepts valid UUID alert_id', () => {
    expect(acknowledgeAlertSchema.safeParse({ alert_id: UUID }).success).toBe(true)
  })
  it('rejects non-UUID alert_id', () => {
    expect(acknowledgeAlertSchema.safeParse({ alert_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing alert_id', () => {
    expect(acknowledgeAlertSchema.safeParse({}).success).toBe(false)
  })
})
