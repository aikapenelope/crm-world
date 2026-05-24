/**
 * Unit tests — isp_sales validators
 *
 * Cubre los schemas Zod para el módulo comercial ISP: zonas de cobertura,
 * leads y pipeline de ventas.
 *
 * Contexto venezolano:
 *   - source 'whatsapp': canal dominante de captación de leads en Venezuela.
 *   - source 'instagram': segundo canal más importante para ISPs regionales.
 *   - LEAD_STATUS refleja el pipeline de ventas ISP:
 *     new → coverage_check → quoted → scheduled → installed | lost.
 *   - coverage_status: 'covered' / 'not_covered' / 'waitlist' —
 *     la "lista de espera" es importante para ISPs con expansión planificada.
 *   - technology_available: 'fiber' / 'wireless' / 'both' —
 *     la disponibilidad depende de la infraestructura del nodo más cercano.
 *   - updateLeadSchema.extend(): agrega campos de seguimiento de cobertura
 *     que no aplican en la creación inicial.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createCoverageZoneSchema,
  updateCoverageZoneSchema,
  createLeadSchema,
  updateLeadSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validZone = () => ({
  name:    'Valencia Centro',
  city:    'Valencia',
  node_id: UUID,
})

const validLead = () => ({
  name:    'María González',
  phone:   '+58 414-111-2233',
  address: 'Av. Bolívar, Edif. La Torre, Apt 5B, Valencia',
  city:    'Valencia',
})

// ---------------------------------------------------------------------------
// createCoverageZoneSchema
// ---------------------------------------------------------------------------

describe('createCoverageZoneSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid coverage zone with defaults', () => {
      const result = createCoverageZoneSchema.safeParse(validZone())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.has_coverage).toBe(true)
        expect(result.data.technology_available).toBe('wireless')
      }
    })

    const required = ['name', 'city', 'node_id'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validZone() }
      delete (p as Record<string, unknown>)[field]
      expect(createCoverageZoneSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID node_id', () => {
      expect(createCoverageZoneSchema.safeParse({ ...validZone(), node_id: 'bad' }).success).toBe(false)
    })
  })

  describe('technology_available enum', () => {
    const techs = ['fiber', 'wireless', 'both'] as const

    test.each(techs)('accepts technology_available "%s"', (technology_available) => {
      expect(createCoverageZoneSchema.safeParse({ ...validZone(), technology_available }).success).toBe(true)
    })

    it('rejects invalid technology_available', () => {
      expect(createCoverageZoneSchema.safeParse({ ...validZone(), technology_available: 'cable' }).success).toBe(false)
    })
  })

  describe('coverage flags', () => {
    it('accepts has_coverage = false for planned expansion zone', () => {
      const result = createCoverageZoneSchema.safeParse({ ...validZone(), has_coverage: false })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.has_coverage).toBe(false)
    })

    it('accepts max_speed_mbps for capacity planning', () => {
      expect(createCoverageZoneSchema.safeParse({
        ...validZone(),
        max_speed_mbps: 100,
      }).success).toBe(true)
    })

    it('rejects non-positive max_speed_mbps', () => {
      expect(createCoverageZoneSchema.safeParse({
        ...validZone(),
        max_speed_mbps: 0,
      }).success).toBe(false)
    })

    it('accepts null max_speed_mbps (no definida aún)', () => {
      expect(createCoverageZoneSchema.safeParse({ ...validZone(), max_speed_mbps: null }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateCoverageZoneSchema
// ---------------------------------------------------------------------------

describe('updateCoverageZoneSchema', () => {
  it('accepts an empty object', () => {
    expect(updateCoverageZoneSchema.safeParse({}).success).toBe(true)
  })

  it('still validates technology_available enum on partial update', () => {
    expect(updateCoverageZoneSchema.safeParse({ technology_available: 'satellite' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createLeadSchema
// ---------------------------------------------------------------------------

describe('createLeadSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid lead with defaults', () => {
      const result = createLeadSchema.safeParse(validLead())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toBe('whatsapp')
      }
    })

    const required = ['name', 'phone', 'address', 'city'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validLead() }
      delete (p as Record<string, unknown>)[field]
      expect(createLeadSchema.safeParse(p).success).toBe(false)
    })

    it('rejects phone shorter than 7 chars', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), phone: '123456' }).success).toBe(false)
    })
  })

  describe('source enum — canales venezolanos', () => {
    const sources = ['whatsapp', 'instagram', 'referral', 'website', 'cold_call', 'other'] as const

    test.each(sources)('accepts source "%s"', (source) => {
      expect(createLeadSchema.safeParse({ ...validLead(), source }).success).toBe(true)
    })

    it('rejects invalid source', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), source: 'tiktok' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts valid email', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), email: 'maria@example.com' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), email: 'not-an-email' }).success).toBe(false)
    })

    it('accepts null email (no siempre se proporciona)', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), email: null }).success).toBe(true)
    })

    it('accepts referral_subscriber_id for referral program', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), referral_subscriber_id: UUID }).success).toBe(true)
    })

    it('rejects non-UUID referral_subscriber_id', () => {
      expect(createLeadSchema.safeParse({ ...validLead(), referral_subscriber_id: 'bad' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateLeadSchema — includes pipeline tracking fields
// ---------------------------------------------------------------------------

describe('updateLeadSchema', () => {
  describe('status pipeline', () => {
    const statuses = ['new', 'coverage_check', 'quoted', 'scheduled', 'installed', 'lost'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateLeadSchema.safeParse({ status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(updateLeadSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })

  describe('coverage_status — verificación de cobertura', () => {
    const coverages = ['covered', 'not_covered', 'waitlist'] as const

    test.each(coverages)('accepts coverage_status "%s"', (coverage_status) => {
      expect(updateLeadSchema.safeParse({ coverage_status }).success).toBe(true)
    })

    it('rejects invalid coverage_status', () => {
      expect(updateLeadSchema.safeParse({ coverage_status: 'partial' }).success).toBe(false)
    })

    it('accepts null coverage_status before check', () => {
      expect(updateLeadSchema.safeParse({ coverage_status: null }).success).toBe(true)
    })
  })

  describe('lost_reason — análisis de pérdidas', () => {
    const reasons = ['price', 'no_coverage', 'chose_competitor', 'not_responsive', 'other'] as const

    test.each(reasons)('accepts lost_reason "%s"', (lost_reason) => {
      expect(updateLeadSchema.safeParse({ status: 'lost', lost_reason }).success).toBe(true)
    })

    it('rejects invalid lost_reason', () => {
      expect(updateLeadSchema.safeParse({ lost_reason: 'budget' }).success).toBe(false)
    })

    it('accepts null lost_reason for non-lost leads', () => {
      expect(updateLeadSchema.safeParse({ status: 'quoted', lost_reason: null }).success).toBe(true)
    })
  })

  describe('installation_date', () => {
    it('accepts installation_date when lead is installed', () => {
      expect(updateLeadSchema.safeParse({
        status: 'installed',
        installation_date: '2026-01-20',
      }).success).toBe(true)
    })

    it('accepts empty update (all optional)', () => {
      expect(updateLeadSchema.safeParse({}).success).toBe(true)
    })
  })
})
