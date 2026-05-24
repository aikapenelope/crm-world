import { z } from 'zod'

export const createStorefrontSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  branding: z.record(z.string(), z.unknown()).nullable().optional(),
  payment_methods: z.array(z.string()).nullable().optional(),
  delivery_zones: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  social_links: z.record(z.string(), z.string()).nullable().optional(),
})

export const createOnlineOrderSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  guest_name: z.string().max(100).nullable().optional(),
  guest_phone: z.string().max(30).nullable().optional(),
  guest_email: z.string().email().nullable().optional(),
  delivery_type: z.enum(['pickup', 'delivery']).default('delivery'),
  delivery_address: z.record(z.string(), z.string()).nullable().optional(),
  payment_method: z.string().max(30).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  source: z.enum(['web', 'whatsapp', 'instagram']).default('web'),
  lines: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    product_title: z.string(),
    quantity: z.number().int().min(1),
    unit_price: z.string(),
  })).min(1),
})

export const updateOnlineOrderSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['confirmed', 'failed']).optional(),
  payment_reference: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const listOnlineOrdersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'confirmed', 'failed']).optional(),
}).passthrough()

export const createPublishSchema = z.object({
  product_id: z.string().uuid(),
  platform: z.enum(['instagram', 'whatsapp', 'tiktok', 'facebook']),
  content: z.string().min(1).max(2000),
  hashtags: z.string().max(500).nullable().optional(),
  image_urls: z.array(z.string().url()).nullable().optional(),
})
