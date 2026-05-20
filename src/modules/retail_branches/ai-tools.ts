import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Tools: Retail vertical
// Queries: retail_branches, retail_stock_rotation, retail_loyalty_accounts,
//          retail_online_orders, retail_price_alerts, retail_purchase_orders
// =============================================================================

const getBranchOverview = defineAiTool({
  name: 'retail.get_branch_overview',
  description: 'Get overview of all branches: name, location, staff count. Answer "¿cuántas tiendas tenemos?" or branch list.',
  isMutation: false,
  requiredFeatures: ['retail_branches.view'],
  inputSchema: z.object({
    is_active: z.boolean().optional().describe('Filter by active status'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('retail_branches')
      .select(['id', 'name', 'branch_type', 'city', 'is_active'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.is_active !== undefined) query = query.where('is_active', '=', args.is_active)

    const branches = await query.execute()
    const all = branches as any[]

    return {
      total_branches: all.length,
      active: all.filter((b: any) => b.is_active).length,
      branches: all.map((b: any) => ({
        name: b.name,
        type: b.branch_type,
        city: b.city,
        active: b.is_active,
      })),
    }
  },
})

const getDeadStockAlerts = defineAiTool({
  name: 'retail.get_dead_stock_alerts',
  description: 'Get products with no rotation (dead stock). Answer "¿qué productos no se venden?" or slow-moving inventory.',
  isMutation: false,
  requiredFeatures: ['retail_inventory.view'],
  inputSchema: z.object({
    days_without_movement: z.number().int().min(30).default(90).describe('Days without sales to flag as dead stock'),
    limit: z.number().int().min(1).max(20).default(15),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - args.days_without_movement)

    const rotations = await kysely
      .selectFrom('retail_stock_rotation')
      .select(['product_id', 'branch_id', 'last_sale_date', 'quantity_on_hand', 'days_without_movement'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('days_without_movement', '>=', args.days_without_movement)
      .orderBy('days_without_movement', 'desc')
      .limit(args.limit)
      .execute()

    const all = rotations as any[]

    return {
      dead_stock_count: all.length,
      items: all.map((r: any) => ({
        product_id: r.product_id,
        branch_id: r.branch_id,
        days_stagnant: r.days_without_movement,
        on_hand: r.quantity_on_hand,
        last_sale: r.last_sale_date,
      })),
      message: all.length > 0
        ? `⚠️ ${all.length} productos sin movimiento por más de ${args.days_without_movement} días`
        : '✅ No hay dead stock detectado',
    }
  },
})

const getLoyaltyStats = defineAiTool({
  name: 'retail.get_loyalty_stats',
  description: 'Get loyalty program stats: active members, points distributed, top customers. Answer "¿cómo va el programa de fidelización?"',
  isMutation: false,
  requiredFeatures: ['retail_loyalty.view'],
  inputSchema: z.object({}),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const accounts = await kysely
      .selectFrom('retail_loyalty_accounts')
      .select(['id', 'points_balance', 'tier_id', 'is_active', 'lifetime_points'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .execute()

    const all = accounts as any[]
    const active = all.filter((a: any) => a.is_active)
    const totalPoints = active.reduce((s: number, a: any) => s + Number(a.points_balance || 0), 0)
    const totalLifetime = active.reduce((s: number, a: any) => s + Number(a.lifetime_points || 0), 0)

    // Top by lifetime points
    const topCustomers = active
      .sort((a: any, b: any) => Number(b.lifetime_points || 0) - Number(a.lifetime_points || 0))
      .slice(0, 5)
      .map((a: any) => ({ id: a.id, lifetime: a.lifetime_points, balance: a.points_balance }))

    return {
      total_members: all.length,
      active_members: active.length,
      total_points_outstanding: totalPoints,
      total_lifetime_points: totalLifetime,
      top_customers: topCustomers,
    }
  },
})

const getOnlineOrdersPending = defineAiTool({
  name: 'retail.get_online_orders_pending',
  description: 'Get pending e-commerce orders that need fulfillment. Answer "¿cuántos pedidos online están pendientes?"',
  isMutation: false,
  requiredFeatures: ['retail_ecommerce.view'],
  inputSchema: z.object({
    status: z.enum(['pending', 'confirmed', 'preparing', 'shipped']).optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('retail_online_orders')
      .select(['id', 'order_number', 'status', 'total_amount', 'currency', 'payment_status', 'created_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.status) query = query.where('status', '=', args.status)
    else query = query.where('status', 'not in', ['delivered', 'cancelled'])

    const orders = await query.orderBy('created_at', 'asc').execute()
    const all = orders as any[]

    // Group by status
    const byCounts: Record<string, number> = {}
    for (const o of all) { byCounts[o.status] = (byCounts[o.status] ?? 0) + 1 }

    const totalValue = all.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0)

    return {
      pending_orders: all.length,
      by_status: byCounts,
      total_value: totalValue.toFixed(2),
      oldest_order: all[0] ? { number: all[0].order_number, date: all[0].created_at } : null,
    }
  },
})

const getPriceAlerts = defineAiTool({
  name: 'retail.get_price_alerts',
  description: 'Get pricing alerts: products below cost or under margin target. Answer "¿tenemos productos a pérdida?" or price alerts.',
  isMutation: false,
  requiredFeatures: ['retail_pricing.view'],
  inputSchema: z.object({
    alert_type: z.enum(['below_cost', 'low_margin', 'price_drop']).optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('retail_price_alerts')
      .select(['id', 'product_id', 'alert_type', 'current_price', 'cost_price', 'suggested_price', 'is_resolved'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('is_resolved', '=', false)

    if (args.alert_type) query = query.where('alert_type', '=', args.alert_type)

    const alerts = await query.execute()
    const all = alerts as any[]

    const belowCost = all.filter((a: any) => a.alert_type === 'below_cost')

    return {
      total_alerts: all.length,
      below_cost_count: belowCost.length,
      alerts: all.slice(0, 15).map((a: any) => ({
        product_id: a.product_id,
        type: a.alert_type,
        current_price: Number(a.current_price || 0).toFixed(2),
        cost_price: Number(a.cost_price || 0).toFixed(2),
        suggested: Number(a.suggested_price || 0).toFixed(2),
      })),
      message: belowCost.length > 0
        ? `⚠️ ${belowCost.length} productos se están vendiendo por debajo del costo`
        : all.length > 0
        ? `${all.length} alertas de precio activas`
        : '✅ Sin alertas de precio activas',
    }
  },
})

export const aiTools = [
  getBranchOverview,
  getDeadStockAlerts,
  getLoyaltyStats,
  getOnlineOrdersPending,
  getPriceAlerts,
]

export default aiTools
