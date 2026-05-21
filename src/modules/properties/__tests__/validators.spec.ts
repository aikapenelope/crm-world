/**
 * Unit tests — properties validators
 *
 * Tests the Zod schemas for property creation, updates, and sub-resources
 * (images, links). All Venezuelan Real Estate business rules are exercised here.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/2026-05-18-properties-module.md
 */

import {
  createPropertySchema,
  updatePropertySchema,
  changeStatusSchema,
  addPropertyImageSchema,
  addPropertyLinkSchema,
} from '../data/validators'
import { PropertyType, PropertyOperation, PropertyStatus } from '../data/entities'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid property payload that satisfies every required field. */
const validProperty = () => ({
  title: 'Apartamento en Las Mercedes',
  property_type: PropertyType.APARTAMENTO,
  operation: PropertyOperation.ALQUILER,
  price: '1500.00',
  city: 'Caracas',
})

// ---------------------------------------------------------------------------
// createPropertySchema
// ---------------------------------------------------------------------------

describe('createPropertySchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid payload', () => {
      const result = createPropertySchema.safeParse(validProperty())
      expect(result.success).toBe(true)
    })

    it('rejects when title is missing', () => {
      const { title: _omit, ...rest } = validProperty()
      expect(createPropertySchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when property_type is missing', () => {
      const { property_type: _omit, ...rest } = validProperty()
      expect(createPropertySchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when operation is missing', () => {
      const { operation: _omit, ...rest } = validProperty()
      expect(createPropertySchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when price is missing', () => {
      const { price: _omit, ...rest } = validProperty()
      expect(createPropertySchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when city is missing', () => {
      const { city: _omit, ...rest } = validProperty()
      expect(createPropertySchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('defaults', () => {
    it('defaults status to draft', () => {
      const result = createPropertySchema.safeParse(validProperty())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe(PropertyStatus.DRAFT)
      }
    })

    it('defaults currency to USD', () => {
      const result = createPropertySchema.safeParse(validProperty())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })

    it('defaults country to VE', () => {
      const result = createPropertySchema.safeParse(validProperty())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.country).toBe('VE')
      }
    })

    it('defaults commission_rate to 5.00', () => {
      const result = createPropertySchema.safeParse(validProperty())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.commission_rate).toBe('5.00')
      }
    })
  })

  describe('property_type enum', () => {
    const validTypes = Object.values(PropertyType)

    test.each(validTypes)('accepts type "%s"', (type) => {
      const result = createPropertySchema.safeParse({ ...validProperty(), property_type: type })
      expect(result.success).toBe(true)
    })

    it('rejects an unknown property type', () => {
      const result = createPropertySchema.safeParse({ ...validProperty(), property_type: 'penthouse' })
      expect(result.success).toBe(false)
    })
  })

  describe('operation enum', () => {
    const validOps = Object.values(PropertyOperation)

    test.each(validOps)('accepts operation "%s"', (op) => {
      const result = createPropertySchema.safeParse({ ...validProperty(), operation: op })
      expect(result.success).toBe(true)
    })

    it('rejects an unknown operation', () => {
      const result = createPropertySchema.safeParse({ ...validProperty(), operation: 'subasta' })
      expect(result.success).toBe(false)
    })
  })

  describe('price validation', () => {
    const validPrices = ['1500', '1500.00', '99.50', '0.01', '10000000.00']
    const invalidPrices = ['-100', 'abc', '1.999', '1500.000', '']

    test.each(validPrices)('accepts price "%s"', (price) => {
      expect(createPropertySchema.safeParse({ ...validProperty(), price }).success).toBe(true)
    })

    test.each(invalidPrices)('rejects price "%s"', (price) => {
      expect(createPropertySchema.safeParse({ ...validProperty(), price }).success).toBe(false)
    })
  })

  describe('GPS coordinates', () => {
    it('accepts valid latitude and longitude', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        latitude: '10.4806',
        longitude: '-66.9036',
      })
      expect(result.success).toBe(true)
    })

    it('accepts negative latitude (south of equator)', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        latitude: '-33.8688',
        longitude: '151.2093',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null GPS coordinates', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        latitude: null,
        longitude: null,
      })
      expect(result.success).toBe(true)
    })

    it('rejects a latitude with more than 7 decimal places', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        latitude: '10.48060001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('optional FK fields', () => {
    it('accepts a valid UUID for contact_id', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        contact_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects a non-UUID contact_id', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        contact_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('accepts null contact_id', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        contact_id: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('field length limits', () => {
    it('rejects a title longer than 255 characters', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        title: 'A'.repeat(256),
      })
      expect(result.success).toBe(false)
    })

    it('accepts a title exactly 255 characters', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        title: 'A'.repeat(255),
      })
      expect(result.success).toBe(true)
    })

    it('rejects a description longer than 5000 characters', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        description: 'B'.repeat(5001),
      })
      expect(result.success).toBe(false)
    })

    it('rejects a city longer than 100 characters', () => {
      const result = createPropertySchema.safeParse({
        ...validProperty(),
        city: 'C'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('integer range fields', () => {
    it('rejects negative bedrooms', () => {
      expect(createPropertySchema.safeParse({ ...validProperty(), bedrooms: -1 }).success).toBe(false)
    })

    it('rejects bedrooms above 50', () => {
      expect(createPropertySchema.safeParse({ ...validProperty(), bedrooms: 51 }).success).toBe(false)
    })

    it('accepts 0 bathrooms', () => {
      expect(createPropertySchema.safeParse({ ...validProperty(), bathrooms: 0 }).success).toBe(true)
    })

    it('rejects fractional parking value', () => {
      expect(createPropertySchema.safeParse({ ...validProperty(), parking: 1.5 }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePropertySchema — all fields optional
// ---------------------------------------------------------------------------

describe('updatePropertySchema', () => {
  it('accepts an empty patch object (no required fields)', () => {
    expect(updatePropertySchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial update with only the price', () => {
    const result = updatePropertySchema.safeParse({ price: '2000.00' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe('2000.00')
    }
  })

  it('still validates the fields it receives', () => {
    expect(updatePropertySchema.safeParse({ price: 'invalid' }).success).toBe(false)
  })

  it('rejects an invalid status in a partial update', () => {
    expect(updatePropertySchema.safeParse({ status: 'published' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changeStatusSchema
// ---------------------------------------------------------------------------

describe('changeStatusSchema', () => {
  const validStatuses = Object.values(PropertyStatus)

  test.each(validStatuses)('accepts status "%s"', (status) => {
    expect(changeStatusSchema.safeParse({ status }).success).toBe(true)
  })

  it('rejects an unknown status', () => {
    expect(changeStatusSchema.safeParse({ status: 'en_oferta' }).success).toBe(false)
  })

  it('rejects missing status field', () => {
    expect(changeStatusSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addPropertyImageSchema
// ---------------------------------------------------------------------------

describe('addPropertyImageSchema', () => {
  const validImage = {
    property_id: '550e8400-e29b-41d4-a716-446655440000',
    attachment_id: '660e8400-e29b-41d4-a716-446655440001',
  }

  it('accepts a minimal valid image record', () => {
    const result = addPropertyImageSchema.safeParse(validImage)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort_order).toBe(0)
      expect(result.data.is_cover).toBe(false)
    }
  })

  it('accepts is_cover = true', () => {
    const result = addPropertyImageSchema.safeParse({ ...validImage, is_cover: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_cover).toBe(true)
    }
  })

  it('rejects a sort_order above 10 (max 10 images per property per spec)', () => {
    expect(addPropertyImageSchema.safeParse({ ...validImage, sort_order: 11 }).success).toBe(false)
  })

  it('rejects a non-UUID property_id', () => {
    expect(addPropertyImageSchema.safeParse({ ...validImage, property_id: 'bad' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addPropertyLinkSchema
// ---------------------------------------------------------------------------

describe('addPropertyLinkSchema', () => {
  const validLink = {
    property_id: '550e8400-e29b-41d4-a716-446655440000',
    platform: 'mercadolibre' as const,
    url: 'https://www.mercadolibre.com.ve/inmueble/123',
  }

  it('accepts a valid external listing link', () => {
    expect(addPropertyLinkSchema.safeParse(validLink).success).toBe(true)
  })

  const validPlatforms = ['mercadolibre', 'facebook', 'instagram', 'tiktok', 'otro']

  test.each(validPlatforms)('accepts platform "%s"', (platform) => {
    expect(addPropertyLinkSchema.safeParse({ ...validLink, platform }).success).toBe(true)
  })

  it('rejects an unknown platform (e.g. twitter)', () => {
    expect(addPropertyLinkSchema.safeParse({ ...validLink, platform: 'twitter' }).success).toBe(false)
  })

  it('rejects a non-URL in the url field', () => {
    expect(addPropertyLinkSchema.safeParse({ ...validLink, url: 'not a url' }).success).toBe(false)
  })

  it('rejects a URL exceeding 500 characters', () => {
    const longUrl = 'https://mercadolibre.com.ve/' + 'a'.repeat(480)
    expect(addPropertyLinkSchema.safeParse({ ...validLink, url: longUrl }).success).toBe(false)
  })

  it('accepts an optional label', () => {
    const result = addPropertyLinkSchema.safeParse({
      ...validLink,
      label: 'Ver en MercadoLibre',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('Ver en MercadoLibre')
    }
  })

  it('rejects a label longer than 100 characters', () => {
    expect(addPropertyLinkSchema.safeParse({ ...validLink, label: 'L'.repeat(101) }).success).toBe(false)
  })
})
