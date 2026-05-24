/**
 * Unit tests — retail_loyalty validators
 *
 * Venezuelan retail loyalty context:
 *   - points_per_usd default '10.00': 10 puntos por USD gastado
 *   - point_value_usd default '0.0100': canje a $0.01 por punto
 *   - type 'whatsapp_blast': campaña por WhatsApp Business — primary
 *     marketing channel in Venezuelan retail (internet penetration via mobile)
 *   - target_segment 'inactive': recuperación de clientes inactivos
 *   - expiration_days: puntos con vencimiento — compliance with INDEPABIS
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createProgramSchema,
  updateProgramSchema,
  createTierSchema,
  listAccountsSchema,
  earnPointsSchema,
  redeemPointsSchema,
  createCampaignSchema,
  listCampaignsSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validProgram  = () => ({ name: 'Club Fidelidad Oro' })
const validTier     = () => ({ program_id: UUID, name: 'Plata', min_points_lifetime: 0 })
const validEarn     = () => ({ customer_id: UUID, amount_usd: 50.00 })
const validRedeem   = () => ({ customer_id: UUID, points: 500 })
const validCampaign = () => ({
  name: 'Campaña WhatsApp Enero', type: 'whatsapp_blast' as const,
  starts_at: '2026-01-01',
})

// ---------------------------------------------------------------------------
// createProgramSchema
// ---------------------------------------------------------------------------
describe('createProgramSchema', () => {
  it('accepts minimal program with defaults', () => {
    const r = createProgramSchema.safeParse(validProgram())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.points_per_usd).toBe('10.00')
      expect(r.data.points_currency).toBe('USD')
      expect(r.data.min_redemption_points).toBe(100)
      expect(r.data.point_value_usd).toBe('0.0100')
    }
  })
  it('rejects missing name', () => {
    expect(createProgramSchema.safeParse({}).success).toBe(false)
  })
  it('rejects min_redemption_points below 1', () => {
    expect(createProgramSchema.safeParse({ ...validProgram(), min_redemption_points: 0 }).success).toBe(false)
  })
  it('accepts expiration_days as integer', () => {
    const r = createProgramSchema.safeParse({ ...validProgram(), expiration_days: 365 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.expiration_days).toBe(365)
  })
  it('accepts expiration_days as null (no expiry)', () => {
    expect(createProgramSchema.safeParse({ ...validProgram(), expiration_days: null }).success).toBe(true)
  })
  it('rejects expiration_days below 1', () => {
    expect(createProgramSchema.safeParse({ ...validProgram(), expiration_days: 0 }).success).toBe(false)
  })
})

describe('updateProgramSchema', () => {
  it('accepts empty object', () => { expect(updateProgramSchema.safeParse({}).success).toBe(true) })
  it('accepts points_per_usd update', () => {
    expect(updateProgramSchema.safeParse({ points_per_usd: '15.00' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createTierSchema
// ---------------------------------------------------------------------------
describe('createTierSchema', () => {
  it('accepts minimal tier with defaults', () => {
    const r = createTierSchema.safeParse(validTier())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.discount_percent).toBe('0.00')
      expect(r.data.multiplier).toBe('1.00')
      expect(r.data.sort_order).toBe(0)
    }
  })
  it('rejects non-UUID program_id', () => {
    expect(createTierSchema.safeParse({ ...validTier(), program_id: 'bad' }).success).toBe(false)
  })
  it('rejects min_points_lifetime below 0', () => {
    expect(createTierSchema.safeParse({ ...validTier(), min_points_lifetime: -1 }).success).toBe(false)
  })
  it('accepts benefits as record', () => {
    const r = createTierSchema.safeParse({ ...validTier(), benefits: { free_shipping: true } })
    expect(r.success).toBe(true)
  })
  it('accepts benefits as null', () => {
    expect(createTierSchema.safeParse({ ...validTier(), benefits: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listAccountsSchema
// ---------------------------------------------------------------------------
describe('listAccountsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listAccountsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts customer_id and tier_id UUID filters', () => {
    expect(listAccountsSchema.safeParse({ customer_id: UUID, tier_id: UUID2 }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listAccountsSchema.safeParse({ program_id: UUID }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// earnPointsSchema
// ---------------------------------------------------------------------------
describe('earnPointsSchema', () => {
  it('accepts minimal earn with defaults', () => {
    const r = earnPointsSchema.safeParse(validEarn())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.reference_type).toBe('sale')
  })
  it('rejects non-UUID customer_id', () => {
    expect(earnPointsSchema.safeParse({ ...validEarn(), customer_id: 'bad' }).success).toBe(false)
  })
  it('rejects amount_usd below 0.01', () => {
    expect(earnPointsSchema.safeParse({ ...validEarn(), amount_usd: 0 }).success).toBe(false)
  })

  describe('reference_type enum', () => {
    const types = ['sale', 'manual', 'campaign'] as const
    test.each(types)('accepts reference_type "%s"', (reference_type) => {
      expect(earnPointsSchema.safeParse({ ...validEarn(), reference_type }).success).toBe(true)
    })
    it('rejects invalid reference_type', () => {
      expect(earnPointsSchema.safeParse({ ...validEarn(), reference_type: 'refund' }).success).toBe(false)
    })
  })
  it('accepts reference_id as null', () => {
    expect(earnPointsSchema.safeParse({ ...validEarn(), reference_id: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// redeemPointsSchema
// ---------------------------------------------------------------------------
describe('redeemPointsSchema', () => {
  it('accepts minimal redeem with defaults', () => {
    const r = redeemPointsSchema.safeParse(validRedeem())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.reference_type).toBe('sale')
  })
  it('rejects points below 1', () => {
    expect(redeemPointsSchema.safeParse({ ...validRedeem(), points: 0 }).success).toBe(false)
  })

  describe('reference_type enum', () => {
    const types = ['sale', 'manual'] as const
    test.each(types)('accepts reference_type "%s"', (reference_type) => {
      expect(redeemPointsSchema.safeParse({ ...validRedeem(), reference_type }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// createCampaignSchema
// ---------------------------------------------------------------------------
describe('createCampaignSchema', () => {
  it('accepts minimal campaign with defaults', () => {
    const r = createCampaignSchema.safeParse(validCampaign())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.target_segment).toBe('all')
  })
  it('rejects missing starts_at', () => {
    const { starts_at: _o, ...rest } = validCampaign()
    expect(createCampaignSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts ends_at as null (open-ended campaign)', () => {
    expect(createCampaignSchema.safeParse({ ...validCampaign(), ends_at: null }).success).toBe(true)
  })

  describe('type enum', () => {
    const types = ['points_multiplier', 'bonus_points', 'discount', 'whatsapp_blast'] as const
    test.each(types)('accepts type "%s"', (type) => {
      expect(createCampaignSchema.safeParse({ ...validCampaign(), type }).success).toBe(true)
    })
    it('rejects invalid type', () => {
      expect(createCampaignSchema.safeParse({ ...validCampaign(), type: 'email_blast' }).success).toBe(false)
    })
  })

  describe('target_segment enum', () => {
    const segments = ['all', 'tier', 'inactive', 'birthday', 'custom'] as const
    test.each(segments)('accepts target_segment "%s"', (target_segment) => {
      expect(createCampaignSchema.safeParse({ ...validCampaign(), target_segment }).success).toBe(true)
    })
  })
})

describe('listCampaignsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listCampaignsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['draft', 'scheduled', 'active', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listCampaignsSchema.safeParse({ status }).success).toBe(true)
    })
  })
})
