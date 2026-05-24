/**
 * Unit tests — retail_ecommerce validators
 *
 * Venezuelan retail e-commerce context:
 *   - source 'whatsapp': pedidos por WhatsApp Business — dominant channel in
 *     Venezuelan retail; customers share screenshots of catalogues
 *   - source 'instagram': ventas por DM de Instagram — second channel
 *   - delivery_type 'pickup': retiro en tienda — avoids delivery risk
 *     (inseguridad vial en Venezuela)
 *   - slug regex /^[a-z0-9-]+$/: URL-safe storefront identifier
 *   - createPublishSchema: publication to social platforms for product posts
 *   - image_urls: array of validated URLs for product images
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createStorefrontSchema,
  createOnlineOrderSchema,
  updateOnlineOrderSchema,
  listOnlineOrdersSchema,
  createPublishSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validStorefront = () => ({ name: 'Tienda Online Caracas', slug: 'tienda-caracas' })
const validLine       = () => ({ product_id: UUID, product_title: 'Galletas Soda 500g', quantity: 2, unit_price: '6.50' })
const validOrder      = () => ({ lines: [validLine()] })
const validPublish    = () => ({
  product_id: UUID,
  platform: 'instagram' as const,
  content: 'Nuevo producto disponible — Galletas de soda 500g a $6.50',
})

// ---------------------------------------------------------------------------
// createStorefrontSchema
// ---------------------------------------------------------------------------
describe('createStorefrontSchema', () => {
  it('accepts minimal storefront', () => {
    expect(createStorefrontSchema.safeParse(validStorefront()).success).toBe(true)
  })
  it('rejects slug with uppercase', () => {
    expect(createStorefrontSchema.safeParse({ ...validStorefront(), slug: 'Tienda-CAR' }).success).toBe(false)
  })
  it('rejects slug with spaces', () => {
    expect(createStorefrontSchema.safeParse({ ...validStorefront(), slug: 'tienda car' }).success).toBe(false)
  })
  it('accepts slug with hyphens and numbers', () => {
    expect(createStorefrontSchema.safeParse({ ...validStorefront(), slug: 'tienda-01' }).success).toBe(true)
  })
  it('accepts payment_methods as string array', () => {
    const r = createStorefrontSchema.safeParse({ ...validStorefront(), payment_methods: ['pago_movil', 'zelle'] })
    expect(r.success).toBe(true)
  })
  it('accepts payment_methods as null', () => {
    expect(createStorefrontSchema.safeParse({ ...validStorefront(), payment_methods: null }).success).toBe(true)
  })
  it('accepts social_links record', () => {
    const r = createStorefrontSchema.safeParse({
      ...validStorefront(), social_links: { instagram: 'https://instagram.com/tienda' },
    })
    expect(r.success).toBe(true)
  })
  it('accepts config and branding as null', () => {
    expect(createStorefrontSchema.safeParse({ ...validStorefront(), config: null, branding: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createOnlineOrderSchema
// ---------------------------------------------------------------------------
describe('createOnlineOrderSchema', () => {
  it('accepts minimal order with defaults', () => {
    const r = createOnlineOrderSchema.safeParse(validOrder())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.delivery_type).toBe('delivery')
      expect(r.data.source).toBe('web')
    }
  })
  it('rejects empty lines array (min 1)', () => {
    expect(createOnlineOrderSchema.safeParse({ lines: [] }).success).toBe(false)
  })
  it('rejects line quantity below 1', () => {
    expect(createOnlineOrderSchema.safeParse({ lines: [{ ...validLine(), quantity: 0 }] }).success).toBe(false)
  })
  it('accepts customer_id as null (guest order)', () => {
    expect(createOnlineOrderSchema.safeParse({ ...validOrder(), customer_id: null }).success).toBe(true)
  })
  it('accepts guest fields for anonymous orders', () => {
    const r = createOnlineOrderSchema.safeParse({
      ...validOrder(), guest_name: 'Ana Pérez', guest_phone: '0412-555-0001',
    })
    expect(r.success).toBe(true)
  })
  it('rejects invalid guest_email', () => {
    expect(createOnlineOrderSchema.safeParse({ ...validOrder(), guest_email: 'not-email' }).success).toBe(false)
  })

  describe('delivery_type enum', () => {
    const types = ['pickup', 'delivery'] as const
    test.each(types)('accepts delivery_type "%s"', (delivery_type) => {
      expect(createOnlineOrderSchema.safeParse({ ...validOrder(), delivery_type }).success).toBe(true)
    })
    it('rejects invalid delivery_type', () => {
      expect(createOnlineOrderSchema.safeParse({ ...validOrder(), delivery_type: 'courier' }).success).toBe(false)
    })
  })

  describe('source enum', () => {
    const sources = ['web', 'whatsapp', 'instagram'] as const
    test.each(sources)('accepts source "%s"', (source) => {
      expect(createOnlineOrderSchema.safeParse({ ...validOrder(), source }).success).toBe(true)
    })
    it('rejects invalid source', () => {
      expect(createOnlineOrderSchema.safeParse({ ...validOrder(), source: 'tiktok' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateOnlineOrderSchema
// ---------------------------------------------------------------------------
describe('updateOnlineOrderSchema', () => {
  it('accepts empty object', () => { expect(updateOnlineOrderSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateOnlineOrderSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateOnlineOrderSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })

  describe('payment_status enum', () => {
    const statuses = ['confirmed', 'failed'] as const
    test.each(statuses)('accepts payment_status "%s"', (payment_status) => {
      expect(updateOnlineOrderSchema.safeParse({ payment_status }).success).toBe(true)
    })
  })
  it('accepts payment_reference null', () => {
    expect(updateOnlineOrderSchema.safeParse({ payment_reference: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listOnlineOrdersSchema
// ---------------------------------------------------------------------------
describe('listOnlineOrdersSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listOnlineOrdersSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listOnlineOrdersSchema.safeParse({ status }).success).toBe(true)
    })
  })

  describe('payment_status filter enum', () => {
    const statuses = ['pending', 'confirmed', 'failed'] as const
    test.each(statuses)('accepts payment_status filter "%s"', (payment_status) => {
      expect(listOnlineOrdersSchema.safeParse({ payment_status }).success).toBe(true)
    })
  })
  it('passes through unknown fields', () => {
    expect(listOnlineOrdersSchema.safeParse({ source: 'whatsapp' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPublishSchema
// ---------------------------------------------------------------------------
describe('createPublishSchema', () => {
  it('accepts minimal publish payload', () => {
    expect(createPublishSchema.safeParse(validPublish()).success).toBe(true)
  })
  it('rejects non-UUID product_id', () => {
    expect(createPublishSchema.safeParse({ ...validPublish(), product_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty content', () => {
    expect(createPublishSchema.safeParse({ ...validPublish(), content: '' }).success).toBe(false)
  })

  describe('platform enum', () => {
    const platforms = ['instagram', 'whatsapp', 'tiktok', 'facebook'] as const
    test.each(platforms)('accepts platform "%s"', (platform) => {
      expect(createPublishSchema.safeParse({ ...validPublish(), platform }).success).toBe(true)
    })
    it('rejects invalid platform', () => {
      expect(createPublishSchema.safeParse({ ...validPublish(), platform: 'twitter' }).success).toBe(false)
    })
  })
  it('accepts image_urls array of valid URLs', () => {
    const r = createPublishSchema.safeParse({
      ...validPublish(), image_urls: ['https://cdn.example.com/img1.jpg'],
    })
    expect(r.success).toBe(true)
  })
  it('rejects image_urls with invalid URL', () => {
    expect(createPublishSchema.safeParse({
      ...validPublish(), image_urls: ['not-a-url'],
    }).success).toBe(false)
  })
  it('accepts image_urls as null', () => {
    expect(createPublishSchema.safeParse({ ...validPublish(), image_urls: null }).success).toBe(true)
  })
  it('accepts hashtags as null', () => {
    expect(createPublishSchema.safeParse({ ...validPublish(), hashtags: null }).success).toBe(true)
  })
})
