/**
 * Unit tests — isp_plans validators
 *
 * Cubre los schemas Zod para planes de servicio ISP y add-ons.
 *
 * Contexto venezolano:
 *   - Planes en USD (referencia), facturado en VES a tasa BCV.
 *   - Tecnologías disponibles: fiber (zonas urbanas), wireless (zonas rurales),
 *     cable (legacy), dedicated (corporativos).
 *   - is_symmetric: plans corporativos tienen misma velocidad down/up.
 *   - is_promotional: planes con precio especial por tiempo limitado
 *     (promotional_until marca la fecha de vencimiento de la promo).
 *   - radius_profile / olt_profile: integración con Radius/OLT para
 *     activación automática del servicio al conectar.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createServicePlanSchema,
  updateServicePlanSchema,
  createPlanAddonSchema,
  updatePlanAddonSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPlan = () => ({
  name:               'Plan Hogar 10 Mbps',
  technology:         'wireless' as const,
  download_mbps:      10,
  upload_mbps:        2,
  monthly_price_usd:  '18.00',
})

const validAddon = () => ({
  name:              'IP Fija',
  monthly_price_usd: '5.00',
})

// ---------------------------------------------------------------------------
// createServicePlanSchema
// ---------------------------------------------------------------------------

describe('createServicePlanSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid plan with defaults', () => {
      const result = createServicePlanSchema.safeParse(validPlan())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_symmetric).toBe(false)
        expect(result.data.target_segment).toBe('residential')
        expect(result.data.is_active).toBe(true)
        expect(result.data.is_promotional).toBe(false)
        expect(result.data.sort_order).toBe(0)
        expect(result.data.installation_fee_usd).toBe('0.00')
      }
    })

    const required = ['name', 'technology', 'download_mbps', 'upload_mbps', 'monthly_price_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validPlan() }
      delete (p as Record<string, unknown>)[field]
      expect(createServicePlanSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('technology enum', () => {
    const techs = ['fiber', 'wireless', 'cable', 'dedicated'] as const

    test.each(techs)('accepts technology "%s"', (technology) => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), technology }).success).toBe(true)
    })

    it('rejects invalid technology', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), technology: 'satellite' }).success).toBe(false)
    })
  })

  describe('target_segment enum', () => {
    const segments = ['residential', 'pyme', 'corporate', 'wholesale'] as const

    test.each(segments)('accepts target_segment "%s"', (target_segment) => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), target_segment }).success).toBe(true)
    })

    it('rejects invalid segment', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), target_segment: 'government' }).success).toBe(false)
    })
  })

  describe('bandwidth limits', () => {
    it('rejects download_mbps = 0', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), download_mbps: 0 }).success).toBe(false)
    })

    it('accepts 100 Gbps dedicated plan (100000 Mbps)', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), download_mbps: 100000, upload_mbps: 100000 }).success).toBe(true)
    })

    it('rejects fractional Mbps', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), download_mbps: 1.5 }).success).toBe(false)
    })
  })

  describe('symmetric plan (corporativo)', () => {
    it('accepts is_symmetric = true for corporate fiber plans', () => {
      const result = createServicePlanSchema.safeParse({
        name: 'Empresarial Simétrico 100 Mbps',
        technology: 'fiber',
        download_mbps: 100,
        upload_mbps: 100,
        is_symmetric: true,
        target_segment: 'corporate',
        monthly_price_usd: '150.00',
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.is_symmetric).toBe(true)
    })
  })

  describe('promotional plan', () => {
    it('accepts is_promotional with promotional_until date', () => {
      const result = createServicePlanSchema.safeParse({
        ...validPlan(),
        is_promotional: true,
        promotional_until: '2026-03-31',
        monthly_price_usd: '10.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_promotional).toBe(true)
        expect(result.data.promotional_until).toBe('2026-03-31')
      }
    })

    it('accepts null promotional_until for non-promotional plans', () => {
      expect(createServicePlanSchema.safeParse({ ...validPlan(), promotional_until: null }).success).toBe(true)
    })
  })

  describe('network integration profiles', () => {
    it('accepts radius_profile and olt_profile for auto-provisioning', () => {
      const result = createServicePlanSchema.safeParse({
        ...validPlan(),
        radius_profile: 'hogar-10mbps',
        olt_profile: 'OLT-VLAN-100',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null profiles (manual provisioning)', () => {
      expect(createServicePlanSchema.safeParse({
        ...validPlan(),
        radius_profile: null,
        olt_profile: null,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateServicePlanSchema — partial patch
// ---------------------------------------------------------------------------

describe('updateServicePlanSchema', () => {
  it('accepts an empty object', () => {
    expect(updateServicePlanSchema.safeParse({}).success).toBe(true)
  })

  it('accepts price-only update (ajuste tarifario)', () => {
    expect(updateServicePlanSchema.safeParse({ monthly_price_usd: '20.00' }).success).toBe(true)
  })

  it('accepts is_active = false to deactivate a plan', () => {
    expect(updateServicePlanSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still validates technology enum on partial update', () => {
    expect(updateServicePlanSchema.safeParse({ technology: 'satellite' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createPlanAddonSchema
// ---------------------------------------------------------------------------

describe('createPlanAddonSchema', () => {
  it('accepts a minimal valid addon with defaults', () => {
    const result = createPlanAddonSchema.safeParse(validAddon())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_active).toBe(true)
    }
  })

  it('rejects when name is missing', () => {
    const { name: _omit, ...rest } = validAddon()
    expect(createPlanAddonSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects when monthly_price_usd is missing', () => {
    const { monthly_price_usd: _omit, ...rest } = validAddon()
    expect(createPlanAddonSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid addon price format', () => {
    expect(createPlanAddonSchema.safeParse({ ...validAddon(), monthly_price_usd: '-1' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updatePlanAddonSchema — partial patch
// ---------------------------------------------------------------------------

describe('updatePlanAddonSchema', () => {
  it('accepts an empty object', () => {
    expect(updatePlanAddonSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active toggle', () => {
    expect(updatePlanAddonSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})
