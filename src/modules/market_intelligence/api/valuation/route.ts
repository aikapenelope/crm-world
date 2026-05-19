/**
 * Valuation API endpoint.
 * Queries market_listings to calculate KPIs for a given property profile.
 * Returns: avg, median, min, max, P25, P75, price/m2, position, sample size.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'
import { valuationRequestSchema } from '../../data/validators'
import { MarketValuationEntity } from '../../data/entities'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['market_intelligence.valuate'] },
}

export async function POST(request: Request, ctx: any) {
  const body = await request.json()
  const parsed = valuationRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const input = parsed.data
  const em: EntityManager = ctx.container.resolve('em')
  const scope = ctx.scope

  // Query market listings matching the criteria using Kysely
  // (avoids cross-module entity import)
  const kysely = em.getKysely()
  let query = kysely
    .selectFrom('market_listings')
    .selectAll()
    .where('property_type', '=', input.property_type)
    .where('operation', '=', input.operation)
    .where('sync_status', '=', 'active')
    .where('price_usd', 'is not', null)
    .where('price_usd', '>', '0')
    .orderBy('price_usd', 'asc')
    .limit(500)

  if (input.city) {
    query = query.where('city', 'ilike', `%${input.city}%`)
  }

  const listings = await query.execute()

  if (listings.length === 0) {
    return Response.json({
      sample_size: 0,
      message: 'No hay datos de mercado para estos criterios',
    })
  }

  // Extract prices as numbers
  const prices = listings
    .map((l: any) => parseFloat(l.price_usd))
    .filter((p: number) => !isNaN(p) && p > 0)
    .sort((a: number, b: number) => a - b)

  const n = prices.length

  // Calculate KPIs
  const sum = prices.reduce((a: number, b: number) => a + b, 0)
  const avg = sum / n
  const median = n % 2 === 0 ? (prices[n / 2 - 1] + prices[n / 2]) / 2 : prices[Math.floor(n / 2)]
  const min = prices[0]
  const max = prices[n - 1]
  const p25 = prices[Math.floor(n * 0.25)]
  const p75 = prices[Math.floor(n * 0.75)]

  // Price per m2 (only for listings with area)
  const withArea = listings.filter((l: any) => l.area_m2 && parseFloat(l.area_m2) > 0)
  const avgPricePerM2 = withArea.length > 0
    ? withArea.reduce((sum: number, l: any) => sum + parseFloat(l.price_usd) / parseFloat(l.area_m2), 0) / withArea.length
    : null

  // Position of reference price
  let pricePosition: string | null = null
  let percentileRank: number | null = null

  if (input.reference_price && input.reference_price > 0) {
    const below = prices.filter((p: number) => p < input.reference_price!).length
    percentileRank = Math.round((below / n) * 100)
    pricePosition = percentileRank < 33 ? 'below_market'
      : percentileRank > 66 ? 'above_market'
      : 'at_market'
  }

  // Top comparables (closest to reference price or median)
  const targetPrice = input.reference_price ?? median
  const comparables = listings
    .sort((a: any, b: any) => Math.abs(parseFloat(a.price_usd) - targetPrice) - Math.abs(parseFloat(b.price_usd) - targetPrice))
    .slice(0, 10)

  // Save valuation result
  const valuation = em.create(MarketValuationEntity, {
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    property_type: input.property_type,
    operation: input.operation,
    city: input.city,
    zone: input.zone ?? null,
    area_m2: input.area_m2 ? String(input.area_m2) : null,
    bedrooms: input.bedrooms ?? null,
    reference_price: input.reference_price ? String(input.reference_price) : null,
    sample_size: n,
    avg_price: String(Math.round(avg * 100) / 100),
    median_price: String(Math.round(median * 100) / 100),
    min_price: String(min),
    max_price: String(max),
    p25_price: String(Math.round(p25 * 100) / 100),
    p75_price: String(Math.round(p75 * 100) / 100),
    avg_price_per_m2: avgPricePerM2 ? String(Math.round(avgPricePerM2 * 100) / 100) : null,
    price_position: pricePosition,
    percentile_rank: percentileRank,
    comparable_ids: comparables.map((c: any) => c.id),
    property_id: input.property_id ?? null,
    created_at: new Date(),
  } as any)
  em.persist(valuation)
  await em.flush()

  return Response.json({
    id: valuation.id,
    sample_size: n,
    avg_price: Math.round(avg * 100) / 100,
    median_price: Math.round(median * 100) / 100,
    min_price: min,
    max_price: max,
    p25_price: Math.round(p25 * 100) / 100,
    p75_price: Math.round(p75 * 100) / 100,
    avg_price_per_m2: avgPricePerM2 ? Math.round(avgPricePerM2 * 100) / 100 : null,
    price_position: pricePosition,
    percentile_rank: percentileRank,
    comparables: comparables.map((c: any) => ({
      id: c.id,
      ml_id: c.ml_id,
      title: c.title,
      price_usd: c.price_usd,
      area_m2: c.area_m2,
      bedrooms: c.bedrooms,
      city: c.city,
      neighborhood: c.neighborhood,
      permalink: c.permalink,
      thumbnail: c.thumbnail,
    })),
  })
}

export const openApi = {}
