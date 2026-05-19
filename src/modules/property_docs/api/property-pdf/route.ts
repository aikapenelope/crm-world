/**
 * Property PDF generation endpoint.
 * Generates a 1-page property sheet with:
 * - Cover image
 * - Title + description
 * - Specs grid (type, area, rooms, parking)
 * - Price
 * - Agent branding (tenant logo + name)
 * - QR code linking to public page
 *
 * Requires auth — only agents can generate PDFs for their properties.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'
import { PropertyEntity, PropertyImageEntity } from '../../properties/data/entities'

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

  const property = await em.findOne(PropertyEntity, {
    id: parsed.data.id,
    tenant_id: scope.tenantId,
    deleted_at: null,
  } as any)

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }

  // Get cover image
  const coverImage = await em.findOne(
    PropertyImageEntity,
    { property_id: property.id, tenant_id: scope.tenantId, is_cover: true } as any,
  )

  // Build PDF data payload (actual PDF rendering will use a template engine)
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

  // For now, return JSON payload that a PDF renderer will consume
  // PDF generation (using @react-email or puppeteer) will be added
  // when the rendering infrastructure is configured
  return Response.json(pdfData)
}

export const openApi = {}
