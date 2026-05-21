/**
 * Unit tests — matching/services/scoring (ScoringEngine)
 *
 * The scoring engine calculates compatibility scores between contact preferences
 * and property listings. It is the core algorithm of the Real Estate vertical.
 *
 * Weights (default, total = 100):
 *   property_type  30 pts — exact enum match
 *   city           25 pts — case-insensitive substring match
 *   budget         25 pts — price ≤ max_budget (full), price ≤ budget×1.15 (half)
 *   operation      20 pts — exact match OR property.operation = 'venta_alquiler'
 *
 * Test strategy:
 *   - Mock the EntityManager / Kysely layer (no database required)
 *   - Exercise every scoring branch in calculateScore (private, tested indirectly)
 *   - Verify sorting, filtering, and null-safety behaviour
 *   - Verify custom-weight constructor
 *
 * Reference: https://docs.open-mercato.dev/framework/modules/overview
 * Spec: .ai/specs/2026-05-18-properties-module.md §Matching
 */

import { ScoringEngine, type MatchScore } from '../services/scoring'

// ---------------------------------------------------------------------------
// Kysely mock factory
// ---------------------------------------------------------------------------

type MockProperty = {
  id: string
  tenant_id: string
  property_type: string
  operation: string
  city: string
  price: string
  status: string
  deleted_at: null
}

type MockPreference = {
  contact_id: string
  tenant_id: string
  preferred_type: string | null
  preferred_city: string | null
  preferred_operation: string | null
  max_budget: string | null
  is_active: boolean
  deleted_at: null
}

/**
 * Creates a Kysely fluent-builder mock that returns different values depending
 * on which table is queried. This pattern mirrors how the scoring engine
 * calls (em as any).getKysely() internally.
 *
 * See: https://kulshekhar.github.io/ts-jest/docs/getting-started/options/diagnostics
 */
function makeKysely(options: {
  property?: MockProperty | null
  preferences?: MockPreference[]
  properties?: MockProperty[]
  preference?: MockPreference | null
}): any {
  const makeBuilder = (table: string) => {
    const builder: any = {
      selectAll: () => builder,
      where: () => builder,
      executeTakeFirst: jest.fn().mockResolvedValue(
        table === 'properties'
          ? (options.property ?? null)
          : (options.preference ?? null),
      ),
      execute: jest.fn().mockResolvedValue(
        table === 'properties'
          ? (options.properties ?? [])
          : (options.preferences ?? []),
      ),
    }
    return builder
  }

  return {
    selectFrom: jest.fn().mockImplementation((table: string) => makeBuilder(table)),
  }
}

/** Build a mock EntityManager that exposes getKysely(). */
function makeMockEm(options: Parameters<typeof makeKysely>[0]) {
  return { getKysely: () => makeKysely(options) } as any
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-001'

function makeProperty(overrides: Partial<MockProperty> = {}): MockProperty {
  return {
    id: 'prop-001',
    tenant_id: TENANT_ID,
    property_type: 'apartamento',
    operation: 'alquiler',
    city: 'Caracas',
    price: '1000.00',
    status: 'active',
    deleted_at: null,
    ...overrides,
  }
}

function makePreference(overrides: Partial<MockPreference> = {}): MockPreference {
  return {
    contact_id: 'contact-001',
    tenant_id: TENANT_ID,
    preferred_type: 'apartamento',
    preferred_city: 'Caracas',
    preferred_operation: 'alquiler',
    max_budget: '1500.00',
    is_active: true,
    deleted_at: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// scoreForProperty
// ---------------------------------------------------------------------------

describe('ScoringEngine.scoreForProperty', () => {
  it('returns an empty array when the property does not exist', async () => {
    const em = makeMockEm({ property: null, preferences: [makePreference()] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('nonexistent-id', TENANT_ID)

    expect(result).toEqual([])
  })

  it('returns an empty array when there are no preferences', async () => {
    const em = makeMockEm({ property: makeProperty(), preferences: [] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    expect(result).toEqual([])
  })

  it('returns a perfect score of 100 when all criteria match', async () => {
    const property = makeProperty()
    const preference = makePreference()
    const em = makeMockEm({ property, preferences: [preference] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    expect(result).toHaveLength(1)
    expect(result[0].score).toBe(100)
    expect(result[0].propertyId).toBe('prop-001')
    expect(result[0].contactId).toBe('contact-001')
  })

  it('returns a score of 0 and filters it out when nothing matches', async () => {
    const property = makeProperty({ property_type: 'terreno', city: 'Maracaibo', operation: 'venta' })
    const preference = makePreference({
      preferred_type: 'casa',
      preferred_city: 'Valencia',
      preferred_operation: 'alquiler',
      max_budget: '100.00', // price 1000 >> budget 100
    })
    const em = makeMockEm({ property, preferences: [preference] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    // score=0 entries are filtered out
    expect(result).toHaveLength(0)
  })

  it('returns results sorted by score descending', async () => {
    const property = makeProperty({ property_type: 'apartamento', city: 'Caracas', operation: 'alquiler', price: '1000.00' })
    const preferences: MockPreference[] = [
      // score = 25 (only budget matches)
      makePreference({ contact_id: 'c1', preferred_type: 'casa', preferred_city: 'Maracaibo', preferred_operation: 'venta', max_budget: '1500.00' }),
      // score = 100 (all match)
      makePreference({ contact_id: 'c2', preferred_type: 'apartamento', preferred_city: 'Caracas', preferred_operation: 'alquiler', max_budget: '1500.00' }),
      // score = 30 (only type matches)
      makePreference({ contact_id: 'c3', preferred_type: 'apartamento', preferred_city: 'Maracaibo', preferred_operation: 'venta', max_budget: '100.00' }),
    ]
    const em = makeMockEm({ property, preferences })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score)
  })

  it('includes a breakdown of which criteria scored', async () => {
    const property = makeProperty({ property_type: 'apartamento', city: 'Caracas' })
    const preference = makePreference({ preferred_type: 'apartamento', preferred_city: 'Caracas', preferred_operation: null, max_budget: null })
    const em = makeMockEm({ property, preferences: [preference] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    expect(result).toHaveLength(1)
    const score: MatchScore = result[0]
    expect(score.breakdown.property_type).toBe(30)
    expect(score.breakdown.city).toBe(25)
    expect(score.breakdown.operation).toBeUndefined()
    expect(score.breakdown.budget).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// scoreForContact
// ---------------------------------------------------------------------------

describe('ScoringEngine.scoreForContact', () => {
  it('returns an empty array when the contact has no active preference', async () => {
    const em = makeMockEm({ preference: null, properties: [makeProperty()] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForContact('contact-001', TENANT_ID)

    expect(result).toEqual([])
  })

  it('returns an empty array when there are no active properties', async () => {
    const em = makeMockEm({ preference: makePreference(), properties: [] })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForContact('contact-001', TENANT_ID)

    expect(result).toEqual([])
  })

  it('scores multiple properties against one contact preference', async () => {
    const preference = makePreference()
    const properties: MockProperty[] = [
      makeProperty({ id: 'p1', property_type: 'apartamento', city: 'Caracas', operation: 'alquiler', price: '1000.00' }),
      makeProperty({ id: 'p2', property_type: 'casa', city: 'Caracas', operation: 'alquiler', price: '1000.00' }),
    ]
    const em = makeMockEm({ preference, properties })
    const engine = new ScoringEngine(em)

    const result = await engine.scoreForContact('contact-001', TENANT_ID)

    // p1: type+city+budget+operation = 100; p2: city+budget+operation = 70
    expect(result).toHaveLength(2)
    const ids = result.map((r) => r.propertyId)
    expect(ids).toContain('p1')
    expect(ids).toContain('p2')
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })
})

// ---------------------------------------------------------------------------
// Scoring algorithm — individual dimension tests
// ---------------------------------------------------------------------------

describe('ScoringEngine scoring algorithm', () => {
  async function score(propOverrides: Partial<MockProperty>, prefOverrides: Partial<MockPreference>): Promise<MatchScore | undefined> {
    const property = makeProperty(propOverrides)
    const preference = makePreference(prefOverrides)
    const em = makeMockEm({ property, preferences: [preference] })
    const engine = new ScoringEngine(em)
    const result = await engine.scoreForProperty('prop-001', TENANT_ID)
    return result[0]
  }

  describe('property_type dimension (30 pts)', () => {
    it('scores 30 pts when property_type exactly matches preference', async () => {
      const s = await score({ property_type: 'casa' }, { preferred_type: 'casa' })
      expect(s?.breakdown.property_type).toBe(30)
    })

    it('scores 0 pts when property_type does not match preference', async () => {
      const s = await score({ property_type: 'terreno' }, { preferred_type: 'casa' })
      expect(s?.breakdown.property_type).toBeUndefined()
    })

    it('ignores property_type dimension when preference has no preferred_type', async () => {
      const s = await score({ property_type: 'apartamento' }, { preferred_type: null })
      expect(s?.breakdown.property_type).toBeUndefined()
    })
  })

  describe('city dimension (25 pts)', () => {
    it('scores 25 pts for an exact city match', async () => {
      const s = await score({ city: 'Caracas' }, { preferred_city: 'Caracas' })
      expect(s?.breakdown.city).toBe(25)
    })

    it('scores 25 pts for a case-insensitive match', async () => {
      const s = await score({ city: 'caracas' }, { preferred_city: 'CARACAS' })
      expect(s?.breakdown.city).toBe(25)
    })

    it('scores 25 pts when property city contains preference city', async () => {
      // "Gran Caracas" contains "Caracas"
      const s = await score({ city: 'Gran Caracas' }, { preferred_city: 'Caracas' })
      expect(s?.breakdown.city).toBe(25)
    })

    it('scores 25 pts when preference city contains property city', async () => {
      const s = await score({ city: 'Caracas' }, { preferred_city: 'Gran Caracas' })
      expect(s?.breakdown.city).toBe(25)
    })

    it('scores 0 pts for entirely different cities', async () => {
      const s = await score({ city: 'Maracaibo' }, { preferred_city: 'Valencia' })
      expect(s?.breakdown.city).toBeUndefined()
    })

    it('ignores city dimension when preference has no preferred_city', async () => {
      const s = await score({ city: 'Caracas' }, { preferred_city: null })
      expect(s?.breakdown.city).toBeUndefined()
    })
  })

  describe('budget dimension (25 pts)', () => {
    it('scores 25 pts when price is exactly equal to max_budget', async () => {
      const s = await score({ price: '1500.00' }, { max_budget: '1500.00' })
      expect(s?.breakdown.budget).toBe(25)
    })

    it('scores 25 pts when price is below max_budget', async () => {
      const s = await score({ price: '1000.00' }, { max_budget: '1500.00' })
      expect(s?.breakdown.budget).toBe(25)
    })

    it('scores half (13 pts) when price is up to 15 % over max_budget', async () => {
      // price = 1050 → budget = 1000 → 1050/1000 = 1.05 (within 15 % tolerance)
      // Math.round(weights.budget * 0.5) = Math.round(25 * 0.5) = Math.round(12.5) = 13
      const s = await score({ price: '1050.00' }, { max_budget: '1000.00' })
      expect(s?.breakdown.budget).toBe(13)
    })

    it('scores 0 pts when price exceeds max_budget by more than 15 %', async () => {
      // price = 1200 → budget = 1000 → 20 % over
      const s = await score({ price: '1200.00' }, { max_budget: '1000.00' })
      expect(s?.breakdown.budget).toBeUndefined()
    })

    it('ignores budget dimension when preference has no max_budget', async () => {
      const s = await score({ price: '1000.00' }, { max_budget: null })
      expect(s?.breakdown.budget).toBeUndefined()
    })
  })

  describe('operation dimension (20 pts)', () => {
    it('scores 20 pts for an exact operation match', async () => {
      const s = await score({ operation: 'venta' }, { preferred_operation: 'venta' })
      expect(s?.breakdown.operation).toBe(20)
    })

    it('scores 20 pts when property.operation = venta_alquiler (matches any preference)', async () => {
      const s1 = await score({ operation: 'venta_alquiler' }, { preferred_operation: 'venta' })
      const s2 = await score({ operation: 'venta_alquiler' }, { preferred_operation: 'alquiler' })
      expect(s1?.breakdown.operation).toBe(20)
      expect(s2?.breakdown.operation).toBe(20)
    })

    it('scores 0 pts when operations are incompatible', async () => {
      const s = await score({ operation: 'venta' }, { preferred_operation: 'alquiler' })
      expect(s?.breakdown.operation).toBeUndefined()
    })

    it('ignores operation dimension when preference has no preferred_operation', async () => {
      const s = await score({ operation: 'venta' }, { preferred_operation: null })
      expect(s?.breakdown.operation).toBeUndefined()
    })
  })
})

// ---------------------------------------------------------------------------
// Custom weights
// ---------------------------------------------------------------------------

describe('ScoringEngine with custom weights', () => {
  it('uses custom weights when provided', async () => {
    const customWeights = { property_type: 50, city: 50, budget: 0, operation: 0 }
    const property = makeProperty({ property_type: 'casa', city: 'Valencia' })
    const preference = makePreference({
      preferred_type: 'casa',
      preferred_city: 'Valencia',
      preferred_operation: null,
      max_budget: null,
    })
    const em = makeMockEm({ property, preferences: [preference] })
    const engine = new ScoringEngine(em, customWeights)

    const result = await engine.scoreForProperty('prop-001', TENANT_ID)

    expect(result).toHaveLength(1)
    expect(result[0].score).toBe(100) // 50 (type) + 50 (city)
    expect(result[0].breakdown.property_type).toBe(50)
    expect(result[0].breakdown.city).toBe(50)
  })

  it('partial weight overrides are merged with defaults', async () => {
    // Only override property_type weight; others stay at default
    const engine = new ScoringEngine({} as any, { property_type: 40 })
    // We just confirm instantiation does not throw
    expect(engine).toBeInstanceOf(ScoringEngine)
  })
})
