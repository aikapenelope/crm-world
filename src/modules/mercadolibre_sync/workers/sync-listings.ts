/**
 * MercadoLibre sync worker.
 *
 * Runs on a schedule (daily) to sync real estate listings from
 * MercadoLibre Venezuela. Uses the ML Search API to fetch listings
 * by category and stores them in market_listings table.
 *
 * Credentials:
 * - MERCADOLIBRE_CLIENT_ID (env var in Coolify)
 * - MERCADOLIBRE_CLIENT_SECRET (env var in Coolify)
 * - MERCADOLIBRE_ACCESS_TOKEN (env var in Coolify, auto-refreshed)
 *
 * Categories synced (Venezuela - MLV):
 * - MLV1459: Apartamentos venta
 * - MLV1460: Apartamentos alquiler
 * - MLV1461: Casas venta
 * - MLV1462: Casas alquiler
 * - MLV1463: Oficinas
 * - MLV1464: Locales comerciales
 */

export const metadata = {
  queue: 'mercadolibre-sync',
  id: 'mercadolibre_sync.sync-listings',
  concurrency: 1,
}

const ML_API_BASE = 'https://api.mercadolibre.com'
const ML_SITE = 'MLV' // Venezuela

// Category mapping
const CATEGORIES = [
  { id: 'MLV1459', property_type: 'apartamento', operation: 'venta' },
  { id: 'MLV1460', property_type: 'apartamento', operation: 'alquiler' },
  { id: 'MLV1461', property_type: 'casa', operation: 'venta' },
  { id: 'MLV1462', property_type: 'casa', operation: 'alquiler' },
  { id: 'MLV1463', property_type: 'oficina', operation: 'venta' },
  { id: 'MLV1464', property_type: 'comercial', operation: 'venta' },
] as const

const MAX_ITEMS_PER_CATEGORY = 200
const PAGE_SIZE = 50

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.resolve('em')
  if (!em) {
    console.error('[mercadolibre_sync] No EntityManager available')
    return
  }

  const accessToken = process.env.MERCADOLIBRE_ACCESS_TOKEN
  if (!accessToken) {
    console.warn('[mercadolibre_sync] MERCADOLIBRE_ACCESS_TOKEN not set, skipping sync')
    return
  }

  const { MarketListingEntity } = await import('../data/entities')

  let totalSynced = 0

  for (const category of CATEGORIES) {
    try {
      const items = await fetchCategory(accessToken, category.id)

      for (const item of items) {
        const existing = await em.findOne(MarketListingEntity, { ml_id: item.id } as any)

        const listingData = {
          ml_id: item.id,
          title: item.title?.slice(0, 500) ?? '',
          permalink: item.permalink?.slice(0, 500) ?? null,
          thumbnail: item.thumbnail?.slice(0, 500) ?? null,
          property_type: category.property_type,
          operation: category.operation,
          category_id: category.id,
          price: item.price ? String(item.price) : null,
          price_currency: item.currency_id ?? null,
          price_usd: item.currency_id === 'USD' ? String(item.price) : null,
          city: item.address?.city_name ?? null,
          state: item.address?.state_name ?? null,
          neighborhood: item.address?.neighborhood_name ?? null,
          latitude: item.location?.latitude ? String(item.location.latitude) : null,
          longitude: item.location?.longitude ? String(item.location.longitude) : null,
          seller_nickname: item.seller?.nickname ?? null,
          seller_id: item.seller?.id ? String(item.seller.id) : null,
          sync_status: 'active',
          synced_at: new Date(),
        }

        // Extract attributes (area, bedrooms, etc.)
        if (item.attributes) {
          for (const attr of item.attributes) {
            if (attr.id === 'TOTAL_AREA' && attr.value_number) {
              ;(listingData as any).area_m2 = String(attr.value_number)
            }
            if (attr.id === 'BEDROOMS' && attr.value_number) {
              ;(listingData as any).bedrooms = Number(attr.value_number)
            }
            if (attr.id === 'BATHROOMS' && attr.value_number) {
              ;(listingData as any).bathrooms = Number(attr.value_number)
            }
            if (attr.id === 'PARKING_LOTS' && attr.value_number) {
              ;(listingData as any).parking = Number(attr.value_number)
            }
          }
        }

        if (existing) {
          Object.assign(existing, listingData)
        } else {
          const entry = em.create(MarketListingEntity, {
            ...listingData,
            created_at: new Date(),
            updated_at: new Date(),
          } as any)
          em.persist(entry)
        }

        totalSynced++
      }

      await em.flush()
      console.log(`[mercadolibre_sync] Category ${category.id}: ${items.length} items`)
    } catch (err: any) {
      console.error(`[mercadolibre_sync] Error syncing ${category.id}: ${err.message}`)
    }
  }

  console.log(`[mercadolibre_sync] Sync complete: ${totalSynced} total items`)
}

async function fetchCategory(token: string, categoryId: string): Promise<any[]> {
  const items: any[] = []
  let offset = 0

  while (offset < MAX_ITEMS_PER_CATEGORY) {
    const url = `${ML_API_BASE}/sites/${ML_SITE}/search?category=${categoryId}&offset=${offset}&limit=${PAGE_SIZE}`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.error('[mercadolibre_sync] Token expired — needs refresh')
      }
      break
    }

    const data = await response.json()
    const results = data.results ?? []

    if (results.length === 0) break

    items.push(...results)
    offset += PAGE_SIZE

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return items
}
