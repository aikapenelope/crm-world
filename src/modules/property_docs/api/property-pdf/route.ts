/**
 * Property PDF generation endpoint.
 * Returns structured data for PDF rendering.
 * Uses Kysely queries to avoid cross-module entity imports.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  const parsed = paramsSchema.safeParse({ id })
  if (!parsed.success) {
    return Response.json({ error: 'Invalid property ID' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Fetch property
  const property = await kysely
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', parsed.data.id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }

  // Get cover image
  const coverImage = await kysely
    .selectFrom('property_images')
    .selectAll()
    .where('property_id', '=', property.id)
    .where('tenant_id', '=', scope.tenantId)
    .where('is_cover', '=', true)
    .executeTakeFirst()

  const pdfData = {
    property: {
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
      city: property.city,
      state: property.state,
      address_line: property.address_line,
    },
    cover_image_id: coverImage?.attachment_id ?? null,
    public_url: `/p/${property.id}`,
    generated_at: new Date().toISOString(),
  }

  return Response.json(pdfData)
}

export const openApi = {}
