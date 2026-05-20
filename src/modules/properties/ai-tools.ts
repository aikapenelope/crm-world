import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Tools: Real Estate vertical
// Queries: properties, property_transactions, market_valuations, match_results
// =============================================================================

const getPortfolioOverview = defineAiTool({
  name: 're.get_portfolio_overview',
  description: 'Get real estate portfolio overview: properties by status, operation type, city. Answer "¿cómo está el portafolio?" or property summary.',
  isMutation: false,
  requiredFeatures: ['properties.view'],
  inputSchema: z.object({
    status: z.enum(['draft', 'active', 'reserved', 'sold', 'rented', 'inactive']).optional(),
    operation: z.enum(['venta', 'alquiler', 'venta_alquiler']).optional(),
    city: z.string().optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('properties')
      .select(['id', 'property_type', 'operation', 'status', 'city', 'price', 'currency', 'updated_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.status) query = query.where('status', '=', args.status)
    if (args.operation) query = query.where('operation', '=', args.operation)
    if (args.city) query = query.where('city', 'ilike', `%${args.city}%`)

    const props = await query.execute()
    const all = props as any[]

    // Aggregate
    const byStatus: Record<string, number> = {}
    const byOperation: Record<string, number> = {}
    const byType: Record<string, number> = {}
    for (const p of all) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
      byOperation[p.operation] = (byOperation[p.operation] ?? 0) + 1
      byType[p.property_type] = (byType[p.property_type] ?? 0) + 1
    }

    const activeProps = all.filter((p: any) => p.status === 'active')
    const totalActiveValue = activeProps.reduce((s: number, p: any) => s + Number(p.price || 0), 0)

    // Days without update (stale)
    const now = new Date()
    const stale = all.filter((p: any) => {
      const updated = new Date(p.updated_at)
      const days = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
      return days > 30 && p.status === 'active'
    })

    return {
      total_properties: all.length,
      active: activeProps.length,
      stale_active: stale.length,
      total_active_value: totalActiveValue.toFixed(0),
      by_status: byStatus,
      by_operation: byOperation,
      by_type: byType,
    }
  },
})

const getSalesPipeline = defineAiTool({
  name: 're.get_sales_pipeline',
  description: 'Get recent property transactions: closings, commissions, pipeline value. Answer "¿cuántas ventas hemos cerrado?" or transaction overview.',
  isMutation: false,
  requiredFeatures: ['transactions.view'],
  inputSchema: z.object({
    transaction_type: z.enum(['sale', 'rental', 'lease']).optional(),
    limit: z.number().int().min(1).max(30).default(15),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('property_transactions')
      .select(['id', 'transaction_type', 'status', 'property_id', 'sale_price', 'commission_amount', 'currency', 'closing_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.transaction_type) query = query.where('transaction_type', '=', args.transaction_type)

    const txns = await query.orderBy('closing_date', 'desc').limit(args.limit).execute()
    const all = txns as any[]

    const closed = all.filter((t: any) => t.status === 'closed')
    const totalVolume = closed.reduce((s: number, t: any) => s + Number(t.sale_price || 0), 0)
    const totalCommissions = closed.reduce((s: number, t: any) => s + Number(t.commission_amount || 0), 0)

    return {
      total_transactions: all.length,
      closed_count: closed.length,
      pipeline_count: all.filter((t: any) => t.status !== 'closed').length,
      total_volume: totalVolume.toFixed(0),
      total_commissions: totalCommissions.toFixed(0),
      currency: 'USD',
      recent: closed.slice(0, 5).map((t: any) => ({
        type: t.transaction_type,
        price: `${t.currency} ${Number(t.sale_price || 0).toFixed(0)}`,
        commission: `${t.currency} ${Number(t.commission_amount || 0).toFixed(0)}`,
        date: t.closing_date,
      })),
    }
  },
})

const getStaleProperties = defineAiTool({
  name: 're.get_stale_properties',
  description: 'Get active properties with no activity for 30+ days. Answer "¿qué propiedades no tienen actividad?" or stale listings.',
  isMutation: false,
  requiredFeatures: ['properties.view'],
  inputSchema: z.object({
    days_inactive: z.number().int().min(7).default(30).describe('Minimum days without update to flag'),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - args.days_inactive)

    const props = await kysely
      .selectFrom('properties')
      .select(['id', 'property_type', 'operation', 'city', 'price', 'currency', 'updated_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'active')
      .where('updated_at', '<', cutoff)
      .where('deleted_at', 'is', null)
      .orderBy('updated_at', 'asc')
      .limit(args.limit)
      .execute()

    const all = props as any[]
    const now = new Date()

    return {
      stale_count: all.length,
      properties: all.map((p: any) => {
        const days = Math.round((now.getTime() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        return {
          type: p.property_type,
          operation: p.operation,
          city: p.city,
          price: `${p.currency} ${Number(p.price || 0).toFixed(0)}`,
          days_inactive: days,
        }
      }),
    }
  },
})

const getMarketInsights = defineAiTool({
  name: 're.get_market_insights',
  description: 'Get market intelligence: average valuations by type, price trends. Answer "¿qué vale el mercado?" or market pricing data.',
  isMutation: false,
  requiredFeatures: ['properties.view'],
  inputSchema: z.object({
    property_type: z.string().optional().describe('Filter by property type (apartamento, casa, etc.)'),
    city: z.string().optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('market_valuations')
      .select(['property_type', 'city', 'avg_price_m2', 'p25_price', 'p75_price', 'sample_count', 'currency'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.property_type) query = query.where('property_type', '=', args.property_type)
    if (args.city) query = query.where('city', 'ilike', `%${args.city}%`)

    const valuations = await query.execute()
    const all = valuations as any[]

    return {
      market_segments: all.length,
      data: all.slice(0, 10).map((v: any) => ({
        type: v.property_type,
        city: v.city,
        avg_per_m2: `${v.currency} ${Number(v.avg_price_m2 || 0).toFixed(0)}`,
        p25: `${v.currency} ${Number(v.p25_price || 0).toFixed(0)}`,
        p75: `${v.currency} ${Number(v.p75_price || 0).toFixed(0)}`,
        sample: v.sample_count,
      })),
    }
  },
})

const getTopListingsByValue = defineAiTool({
  name: 're.get_top_listings',
  description: 'Get top active listings by asking price. Answer "¿cuáles son las propiedades más valiosas en el portafolio?"',
  isMutation: false,
  requiredFeatures: ['properties.view'],
  inputSchema: z.object({
    operation: z.enum(['venta', 'alquiler']).optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('properties')
      .select(['id', 'title', 'property_type', 'city', 'price', 'currency', 'area_m2', 'operation'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)

    if (args.operation) query = query.where('operation', '=', args.operation)

    const props = await query.orderBy('price', 'desc').limit(args.limit).execute()
    const all = props as any[]

    return {
      top_listings: all.map((p: any) => ({
        title: p.title,
        type: p.property_type,
        city: p.city,
        price: `${p.currency} ${Number(p.price || 0).toLocaleString('es-VE')}`,
        area: p.area_m2 ? `${p.area_m2} m²` : null,
        operation: p.operation,
      })),
    }
  },
})

export const aiTools = [
  getPortfolioOverview,
  getSalesPipeline,
  getStaleProperties,
  getMarketInsights,
  getTopListingsByValue,
]

export default aiTools
