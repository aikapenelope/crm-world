import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Tools: Distribution vertical
// Queries: dist_credit_limits, dist_inventory_items, dist_delivery_orders,
//          dist_route_visits, dist_commission_records
// =============================================================================

const getReceivablesSummary = defineAiTool({
  name: 'dist.get_receivables_summary',
  description: 'Get accounts receivable summary: total outstanding, overdue clients, blocked accounts. Answer "¿cuánto nos deben?" or "who is blocked?"',
  isMutation: false,
  requiredFeatures: ['dist_reports.view'],
  inputSchema: z.object({
    status: z.enum(['active', 'blocked', 'overdue']).optional().describe('Filter by account status'),
    min_balance: z.number().optional().describe('Minimum outstanding balance in USD'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('dist_credit_limits')
      .select(['client_id', 'current_balance', 'credit_limit', 'status', 'last_payment_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.status) query = query.where('status', '=', args.status)

    const limits = await query.execute()

    const all = limits as any[]
    const totalReceivable = all.reduce((s: number, l: any) => s + Number(l.current_balance), 0)
    const blocked = all.filter((l: any) => l.status === 'blocked')
    const overdue = all.filter((l: any) => l.status === 'overdue')
    const filtered = args.min_balance
      ? all.filter((l: any) => Number(l.current_balance) >= args.min_balance!)
      : all

    return {
      total_receivable: totalReceivable.toFixed(2),
      total_clients: all.length,
      blocked_count: blocked.length,
      overdue_count: overdue.length,
      currency: 'USD',
      top_debtors: filtered
        .sort((a: any, b: any) => Number(b.current_balance) - Number(a.current_balance))
        .slice(0, 10)
        .map((l: any) => ({
          client_id: l.client_id,
          balance: Number(l.current_balance).toFixed(2),
          status: l.status,
          last_payment: l.last_payment_date,
        })),
    }
  },
})

const getInventoryStatus = defineAiTool({
  name: 'dist.get_inventory_status',
  description: 'Get inventory status: total products, low-stock alerts, total value. Answer "¿qué productos están bajos?" or "inventory value".',
  isMutation: false,
  requiredFeatures: ['dist_reports.view'],
  inputSchema: z.object({
    low_stock_only: z.boolean().optional().describe('If true, only return items at or below reorder point'),
    warehouse_code: z.string().optional().describe('Filter by specific warehouse'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('dist_inventory_items')
      .select(['product_id', 'warehouse_code', 'quantity_available', 'reorder_point', 'unit_cost', 'currency'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.warehouse_code) query = query.where('warehouse_code', '=', args.warehouse_code)

    const items = await query.execute()
    const all = items as any[]

    const lowStock = all.filter((i: any) => i.reorder_point > 0 && i.quantity_available <= i.reorder_point)
    const totalValue = all.reduce((s: number, i: any) => s + (i.quantity_available * Number(i.unit_cost)), 0)
    const filtered = args.low_stock_only ? lowStock : all

    return {
      total_products: all.length,
      low_stock_count: lowStock.length,
      total_value: totalValue.toFixed(2),
      currency: 'USD',
      items: filtered.slice(0, 15).map((i: any) => ({
        product_id: i.product_id,
        warehouse: i.warehouse_code,
        available: i.quantity_available,
        reorder_point: i.reorder_point,
        is_low: i.reorder_point > 0 && i.quantity_available <= i.reorder_point,
        value: (i.quantity_available * Number(i.unit_cost)).toFixed(2),
      })),
    }
  },
})

const getDeliveryPerformance = defineAiTool({
  name: 'dist.get_delivery_performance',
  description: 'Get delivery orders performance: completed, pending, returns. Answer "¿cómo van los despachos?" or delivery stats.',
  isMutation: false,
  requiredFeatures: ['dist_reports.view'],
  inputSchema: z.object({
    status: z.enum(['pending', 'in_transit', 'completed', 'partial']).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('dist_delivery_orders')
      .select(['id', 'status', 'total_items', 'delivered_items', 'returned_items', 'created_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.status) query = query.where('status', '=', args.status)

    const orders = await query.orderBy('created_at', 'desc').limit(args.limit).execute()
    const all = orders as any[]

    const completed = all.filter((o: any) => o.status === 'completed').length
    const pending = all.filter((o: any) => o.status === 'pending').length
    const totalReturned = all.reduce((s: number, o: any) => s + o.returned_items, 0)
    const completionRate = all.length > 0 ? Math.round((completed / all.length) * 100) : 0

    return {
      total_orders: all.length,
      completed,
      pending,
      completion_rate: completionRate,
      total_returned: totalReturned,
      orders: all.slice(0, 10),
    }
  },
})

const getRouteEffectiveness = defineAiTool({
  name: 'dist.get_route_effectiveness',
  description: 'Get route effectiveness: visits made, orders taken, conversion rate. Answer "¿qué tan efectivas son las rutas?" or route performance.',
  isMutation: false,
  requiredFeatures: ['dist_reports.view'],
  inputSchema: z.object({
    limit: z.number().int().min(1).max(30).default(20),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const visits = await kysely
      .selectFrom('dist_route_visits')
      .select(['id', 'status', 'route_id'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .limit(args.limit * 5)
      .execute()

    const all = visits as any[]
    const ordersFromVisits = all.filter((v: any) => v.status === 'order_taken').length
    const noAnswers = all.filter((v: any) => v.status === 'no_answer').length
    const effectiveness = all.length > 0 ? Math.round((ordersFromVisits / all.length) * 100) : 0

    return {
      total_visits: all.length,
      orders_taken: ordersFromVisits,
      no_answer: noAnswers,
      effectiveness_rate: effectiveness,
      message: `${effectiveness}% de conversión en rutas (${ordersFromVisits} pedidos de ${all.length} visitas)`,
    }
  },
})

const getCommissionSummary = defineAiTool({
  name: 'dist.get_commission_summary',
  description: 'Get salesperson commission summary. Answer "¿cuánto se deben de comisiones?" or who earned the most.',
  isMutation: false,
  requiredFeatures: ['dist_reports.view'],
  inputSchema: z.object({
    salesperson_id: z.string().uuid().optional().describe('Filter by specific salesperson'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('dist_commission_records')
      .select(['salesperson_id', 'commission_type', 'amount', 'status', 'period_month'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.salesperson_id) query = query.where('salesperson_id', '=', args.salesperson_id)

    const records = await query.execute()
    const all = records as any[]

    const pending = all.filter((r: any) => r.status === 'pending')
    const paid = all.filter((r: any) => r.status === 'paid')
    const totalPending = pending.reduce((s: number, r: any) => s + Number(r.amount), 0)
    const totalPaid = paid.reduce((s: number, r: any) => s + Number(r.amount), 0)

    // Group by salesperson
    const bySalesperson = new Map<string, number>()
    for (const r of pending) {
      const id = r.salesperson_id as string
      bySalesperson.set(id, (bySalesperson.get(id) ?? 0) + Number(r.amount))
    }
    const topEarners = Array.from(bySalesperson.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, amount]) => ({ salesperson_id: id, pending: amount.toFixed(2) }))

    return {
      total_pending: totalPending.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      pending_count: pending.length,
      top_earners: topEarners,
      currency: 'USD',
    }
  },
})

export const aiTools = [
  getReceivablesSummary,
  getInventoryStatus,
  getDeliveryPerformance,
  getRouteEffectiveness,
  getCommissionSummary,
]

export default aiTools
