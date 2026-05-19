/**
 * Property Sheet HTML endpoint.
 * Returns a printable HTML page for a property (use browser print or PDF service).
 */
import type { EntityManager } from '@mikro-orm/core'
import { renderPropertySheetHtml, type PropertySheetData } from '../../services/pdf-renderer'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const propertyId = url.searchParams.get('id')

  if (!propertyId) {
    return Response.json({ error: 'Property ID required' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const property = await kysely
    .selectFrom('properties')
    .selectAll()
    .where('id', '=', propertyId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }

  // Get cover image
  const coverImage = await kysely
    .selectFrom('property_images')
    .select(['attachment_id'])
    .where('property_id', '=', propertyId)
    .where('is_cover', '=', true)
    .executeTakeFirst()

  const sheetData: PropertySheetData = {
    id: property.id,
    title: property.title,
    description: property.description ?? null,
    property_type: property.property_type,
    operation: property.operation,
    status: property.status,
    price: property.price,
    currency: property.currency,
    area_m2: property.area_m2 ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    parking: property.parking ?? null,
    city: property.city,
    state: property.state ?? null,
    address_line: property.address_line ?? null,
    commission_rate: property.commission_rate ?? '5.00',
    cover_image_url: coverImage ? `/api/attachments/${coverImage.attachment_id}/download` : null,
    agent_name: null, // TODO: resolve from assigned_to user
    agent_phone: null,
    agent_email: null,
    portal_url: `/p/${property.id}`,
  }

  const html = renderPropertySheetHtml(sheetData)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export const openApi = {}
