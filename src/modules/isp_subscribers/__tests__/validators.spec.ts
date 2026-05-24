/**
 * Unit tests — isp_subscribers validators
 *
 * Cubre los schemas Zod para abonados ISP, cambios de estado y contratos.
 *
 * Contexto venezolano:
 *   - subscriber_type: residential (mayoría), pyme, corporate, wholesale.
 *   - billing_cycle_day 1-28 — nunca 29/30/31 para evitar ambigüedad
 *     de fin de mes en febrero y meses cortos.
 *   - cut_policy_days: días de gracia antes del corte automático
 *     (el worker detect-overdue lo aplica diariamente).
 *   - SERVICE_STATUSES completo: pending_installation → active →
 *     suspended_overdue/suspended_voluntary → pending_change_plan → cancelled.
 *   - mac_address: formato IEEE (AA:BB:CC:DD:EE:FF) para CPE inventory.
 *   - coordinates: GPS con hasta 7 decimales (precisión ~1 m) para instalaciones rurales.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createSubscriberSchema,
  updateSubscriberSchema,
  changeStatusSchema,
  createContractSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validSubscriber = () => ({
  monthly_price_usd:    '25.00',
  installation_address: 'Calle 5, Residencias El Parque, Apt 3B',
  installation_city:    'Valencia',
})

const validContract = () => ({
  subscriber_id:   UUID,
  contract_number: 'CONT-2026-0001',
  start_date:      '2026-01-15',
  monthly_price_usd: '25.00',
})

// ---------------------------------------------------------------------------
// createSubscriberSchema
// ---------------------------------------------------------------------------

describe('createSubscriberSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid subscriber with defaults', () => {
      const result = createSubscriberSchema.safeParse(validSubscriber())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.subscriber_type).toBe('residential')
        expect(result.data.billing_cycle_day).toBe(1)
        expect(result.data.cut_policy_days).toBe(7)
      }
    })

    it('rejects when monthly_price_usd is missing', () => {
      const { monthly_price_usd: _omit, ...rest } = validSubscriber()
      expect(createSubscriberSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when installation_address is missing', () => {
      const { installation_address: _omit, ...rest } = validSubscriber()
      expect(createSubscriberSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when installation_city is missing', () => {
      const { installation_city: _omit, ...rest } = validSubscriber()
      expect(createSubscriberSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('subscriber_type enum', () => {
    const types = ['residential', 'pyme', 'corporate', 'wholesale'] as const

    test.each(types)('accepts subscriber_type "%s"', (subscriber_type) => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), subscriber_type }).success).toBe(true)
    })

    it('rejects invalid subscriber_type', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), subscriber_type: 'government' }).success).toBe(false)
    })
  })

  describe('billing_cycle_day — business rule: max 28', () => {
    it('accepts day 1 (inicio de mes)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), billing_cycle_day: 1 }).success).toBe(true)
    })

    it('accepts day 28 (máximo permitido)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), billing_cycle_day: 28 }).success).toBe(true)
    })

    it('rejects day 0', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), billing_cycle_day: 0 }).success).toBe(false)
    })

    it('rejects day 29 (ambigüedad en febrero)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), billing_cycle_day: 29 }).success).toBe(false)
    })

    it('rejects day 31', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), billing_cycle_day: 31 }).success).toBe(false)
    })
  })

  describe('cut_policy_days — días de gracia antes del corte automático', () => {
    it('accepts 1 day (corte inmediato)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), cut_policy_days: 1 }).success).toBe(true)
    })

    it('accepts 60 days (máximo, para corporativos)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), cut_policy_days: 60 }).success).toBe(true)
    })

    it('rejects 0 days', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), cut_policy_days: 0 }).success).toBe(false)
    })

    it('rejects 61 days', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), cut_policy_days: 61 }).success).toBe(false)
    })
  })

  describe('mac_address format IEEE', () => {
    it('accepts valid MAC address (AA:BB:CC:DD:EE:FF)', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        mac_address: 'A4:B1:C2:D3:E4:F5',
      }).success).toBe(true)
    })

    it('accepts lowercase MAC address', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        mac_address: 'a4:b1:c2:d3:e4:f5',
      }).success).toBe(true)
    })

    it('rejects MAC with wrong separator (-)', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        mac_address: 'A4-B1-C2-D3-E4-F5',
      }).success).toBe(false)
    })

    it('rejects incomplete MAC address', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        mac_address: 'A4:B1:C2:D3',
      }).success).toBe(false)
    })

    it('accepts null mac_address (CPE no asignado)', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), mac_address: null }).success).toBe(true)
    })
  })

  describe('GPS coordinates — instalaciones rurales venezolanas', () => {
    it('accepts coordinates up to 7 decimal places', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        coordinates_lat: '10.1234567',
        coordinates_lng: '-68.1234567',
      }).success).toBe(true)
    })

    it('accepts negative latitude (sur del ecuador)', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        coordinates_lat: '-10.12345',
      }).success).toBe(true)
    })

    it('rejects coordinates with 8+ decimal places', () => {
      expect(createSubscriberSchema.safeParse({
        ...validSubscriber(),
        coordinates_lat: '10.12345678',
      }).success).toBe(false)
    })
  })

  describe('price validation', () => {
    it('rejects non-numeric monthly_price_usd', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), monthly_price_usd: 'gratis' }).success).toBe(false)
    })

    it('rejects price with 3+ decimal places', () => {
      expect(createSubscriberSchema.safeParse({ ...validSubscriber(), monthly_price_usd: '25.000' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateSubscriberSchema — partial patch
// ---------------------------------------------------------------------------

describe('updateSubscriberSchema', () => {
  it('accepts an empty object', () => {
    expect(updateSubscriberSchema.safeParse({}).success).toBe(true)
  })

  it('still validates billing_cycle_day on partial update', () => {
    expect(updateSubscriberSchema.safeParse({ billing_cycle_day: 31 }).success).toBe(false)
  })

  it('still validates mac_address format on partial update', () => {
    expect(updateSubscriberSchema.safeParse({ mac_address: 'bad-mac' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changeStatusSchema
// ---------------------------------------------------------------------------

describe('changeStatusSchema', () => {
  const statuses = [
    'pending_installation',
    'active',
    'suspended_overdue',
    'suspended_voluntary',
    'pending_change_plan',
    'cancelled',
  ] as const

  test.each(statuses)('accepts new_status "%s"', (new_status) => {
    expect(changeStatusSchema.safeParse({ subscriber_id: UUID, new_status }).success).toBe(true)
  })

  it('rejects invalid new_status', () => {
    expect(changeStatusSchema.safeParse({ subscriber_id: UUID, new_status: 'blocked' }).success).toBe(false)
  })

  it('rejects non-UUID subscriber_id', () => {
    expect(changeStatusSchema.safeParse({ subscriber_id: 'bad', new_status: 'active' }).success).toBe(false)
  })

  it('accepts optional reason (max 500 chars)', () => {
    expect(changeStatusSchema.safeParse({
      subscriber_id: UUID,
      new_status: 'suspended_voluntary',
      reason: 'Solicitud del abonado — viaje temporal',
    }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createContractSchema
// ---------------------------------------------------------------------------

describe('createContractSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid contract with defaults', () => {
      const result = createContractSchema.safeParse(validContract())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.contract_type).toBe('monthly')
        expect(result.data.installation_fee_usd).toBe('0.00')
        expect(result.data.deposit_usd).toBe('0.00')
      }
    })

    it('rejects non-UUID subscriber_id', () => {
      expect(createContractSchema.safeParse({ ...validContract(), subscriber_id: 'bad' }).success).toBe(false)
    })
  })

  describe('contract_type enum', () => {
    const types = ['monthly', 'annual', 'special'] as const

    test.each(types)('accepts contract_type "%s"', (contract_type) => {
      expect(createContractSchema.safeParse({ ...validContract(), contract_type }).success).toBe(true)
    })

    it('rejects invalid contract_type', () => {
      expect(createContractSchema.safeParse({ ...validContract(), contract_type: 'biannual' }).success).toBe(false)
    })
  })

  describe('optional financial fields', () => {
    it('accepts installation_fee_usd and deposit_usd', () => {
      const result = createContractSchema.safeParse({
        ...validContract(),
        installation_fee_usd: '50.00',
        deposit_usd: '25.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts document_url for signed contract PDF', () => {
      expect(createContractSchema.safeParse({
        ...validContract(),
        document_url: 'https://storage.example.com/contract-001.pdf',
      }).success).toBe(true)
    })

    it('rejects invalid document_url', () => {
      expect(createContractSchema.safeParse({
        ...validContract(),
        document_url: 'not-a-url',
      }).success).toBe(false)
    })

    it('accepts null end_date for open-ended contracts', () => {
      expect(createContractSchema.safeParse({ ...validContract(), end_date: null }).success).toBe(true)
    })
  })
})
