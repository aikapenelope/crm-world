/**
 * Agent Portal — Public page showing an agent's active properties.
 * Accessible at /agente/[id] without authentication.
 * Uses Kysely to query properties assigned to the agent.
 */
import type { EntityManager } from '@mikro-orm/core'

export const metadata = {
  GET: { requireAuth: false },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const agentId = pathParts[pathParts.length - 1]

  if (!agentId || agentId.length < 10) {
    return Response.json({ error: 'Agent ID required' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  // Fetch active properties assigned to this agent
  const properties = await kysely
    .selectFrom('properties')
    .select([
      'id', 'title', 'description', 'property_type', 'operation',
      'status', 'price', 'currency', 'area_m2', 'bedrooms',
      'bathrooms', 'parking', 'city', 'state', 'address_line',
    ])
    .where('assigned_to', '=', agentId)
    .where('status', 'in', ['active', 'reserved'])
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .limit(50)
    .execute()

  // Fetch cover images for each property
  const propertyIds = properties.map((p: any) => p.id)
  let coverImages: any[] = []
  if (propertyIds.length > 0) {
    coverImages = await kysely
      .selectFrom('property_images')
      .select(['property_id', 'attachment_id'])
      .where('property_id', 'in', propertyIds)
      .where('is_cover', '=', true)
      .execute()
  }

  const coverMap = new Map(coverImages.map((img: any) => [img.property_id, img.attachment_id]))

  const result = properties.map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description ? String(p.description).slice(0, 200) : null,
    property_type: p.property_type,
    operation: p.operation,
    status: p.status,
    price: p.price,
    currency: p.currency,
    area_m2: p.area_m2,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parking: p.parking,
    city: p.city,
    state: p.state,
    address_line: p.address_line,
    cover_image_id: coverMap.get(p.id) ?? null,
    portal_url: `/p/${p.id}`,
  }))

  return Response.json({
    agent_id: agentId,
    properties: result,
    total: result.length,
  })
}

export const openApi = {}
