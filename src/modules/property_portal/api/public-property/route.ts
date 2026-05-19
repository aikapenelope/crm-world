/**
 * Public API endpoint for property details.
 * No authentication required — serves only active properties.
 * Uses Kysely queries to avoid cross-module entity imports.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export const metadata = {
  GET: { requireAuth: false },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  const parsed = paramsSchema.safeParse({ id })
  if (!parsed.success) {
    return Response.json({ error: 'Invalid property ID' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const kysely = em.getKysely()

  // Only serve active properties (public visibility)
  const property = await kysely
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', parsed.data.id)
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }

  // Fetch images
  const images = await kysely
    .selectFrom('property_images')
    .selectAll()
    .where('property_id', '=', property.id)
    .where('tenant_id', '=', property.tenant_id)
    .orderBy('sort_order', 'asc')
    .execute()

  // Fetch links
  const links = await kysely
    .selectFrom('property_links')
    .selectAll()
    .where('property_id', '=', property.id)
    .where('tenant_id', '=', property.tenant_id)
    .execute()

  return Response.json({
    id: property.id,
    title: property.title,
    description: property.description,
    property_type: property.property_type,
    operation: property.operation,
    price: property.price,
    currency: property.currency,
    area_m2: property.area_m2,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    address_line: property.address_line,
    city: property.city,
    state: property.state,
    country: property.country,
    latitude: property.latitude,
    longitude: property.longitude,
    images: images.map((img: any) => ({
      id: img.id,
      attachment_id: img.attachment_id,
      sort_order: img.sort_order,
      is_cover: img.is_cover,
    })),
    links: links.map((link: any) => ({
      platform: link.platform,
      url: link.url,
      label: link.label,
    })),
  })
}

export const openApi = {}
