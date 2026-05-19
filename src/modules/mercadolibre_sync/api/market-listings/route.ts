/**
 * Read-only API for market listings.
 * Any authenticated user can query market data (it's public info).
 * No tenant scoping — data is shared across all RE tenants.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'
import { MarketListingEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  property_type: z.string().optional(),
  operation: z.string().optional(),
  city: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  min_area: z.coerce.number().optional(),
  min_bedrooms: z.coerce.number().optional(),
  search: z.string().optional(),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const parsed = listSchema.safeParse(params)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const { page, pageSize, property_type, operation, city, min_price, max_price, min_area, min_bedrooms, search } = parsed.data
  const em: EntityManager = ctx.container.resolve('em')

  // Build filter
  const where: any = { sync_status: 'active' }
  if (property_type) where.property_type = property_type
  if (operation) where.operation = operation
  if (city) where.city = { $ilike: `%${city}%` }
  if (min_price) where.price_usd = { ...(where.price_usd ?? {}), $gte: String(min_price) }
  if (max_price) where.price_usd = { ...(where.price_usd ?? {}), $lte: String(max_price) }
  if (min_area) where.area_m2 = { $gte: String(min_area) }
  if (min_bedrooms) where.bedrooms = { $gte: min_bedrooms }

  const [items, total] = await em.findAndCount(
    MarketListingEntity,
    where,
    {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: { synced_at: 'desc' } as any,
    },
  )

  return Response.json({
    items: items.map((item: any) => ({
      id: item.id,
      ml_id: item.ml_id,
      title: item.title,
      permalink: item.permalink,
      thumbnail: item.thumbnail,
      property_type: item.property_type,
      operation: item.operation,
      price: item.price,
      price_currency: item.price_currency,
      price_usd: item.price_usd,
      city: item.city,
      state: item.state,
      neighborhood: item.neighborhood,
      area_m2: item.area_m2,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      parking: item.parking,
      seller_nickname: item.seller_nickname,
      synced_at: item.synced_at,
    })),
    total,
    page,
    pageSize,
  })
}

export const openApi = {}
