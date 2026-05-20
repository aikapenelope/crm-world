/**
 * Distribution Dashboard API.
 * Aggregates KPIs from dist_credit, dist_inventory, dist_delivery, dist_routes.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_reports.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const periodMonth = url.searchParams.get('period_month') ?? null

  // --- Accounts Receivable ---
  const creditLimits = await kysely
    .selectFrom('dist_credit_limits')
    .select(['current_balance', 'credit_limit', 'status'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const totalReceivable = (creditLimits as any[]).reduce((s: number, l: any) => s + Number(l.current_balance), 0)
  const blockedClients = (creditLimits as any[]).filter((l: any) => l.status === 'blocked').length

  // --- Inventory ---
  const inventoryItems = await kysely
    .selectFrom('dist_inventory_items')
    .select(['quantity_available', 'unit_cost', 'reorder_point'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const inventoryValue = (inventoryItems as any[]).reduce((s: number, i: any) => s + (i.quantity_available * Number(i.unit_cost)), 0)
  const lowStockCount = (inventoryItems as any[]).filter((i: any) => i.reorder_point > 0 && i.quantity_available <= i.reorder_point).length

  // --- Deliveries (recent) ---
  const deliveryOrders = await kysely
    .selectFrom('dist_delivery_orders')
    .select(['status', 'total_items', 'delivered_items', 'returned_items'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const totalDeliveries = (deliveryOrders as any[]).length
  const completedDeliveries = (deliveryOrders as any[]).filter((d: any) => d.status === 'completed').length
  const totalReturned = (deliveryOrders as any[]).reduce((s: number, d: any) => s + d.returned_items, 0)

  // --- Routes effectiveness ---
  const visits = await kysely
    .selectFrom('dist_route_visits')
    .select(['status'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const totalVisits = (visits as any[]).length
  const ordersFromVisits = (visits as any[]).filter((v: any) => v.status === 'order_taken').length
  const routeEffectiveness = totalVisits > 0 ? Math.round((ordersFromVisits / totalVisits) * 100) : 0

  const dashboard = {
    accounts_receivable: {
      total_receivable: totalReceivable.toFixed(2),
      total_clients: creditLimits.length,
      blocked_clients: blockedClients,
    },
    inventory: {
      total_value: inventoryValue.toFixed(2),
      total_products: inventoryItems.length,
      low_stock_alerts: lowStockCount,
    },
    deliveries: {
      total: totalDeliveries,
      completed: completedDeliveries,
      completion_rate: totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
      total_returned: totalReturned,
    },
    routes: {
      total_visits: totalVisits,
      orders_taken: ordersFromVisits,
      effectiveness: routeEffectiveness,
    },
  }

  return Response.json(dashboard)
}

export const openApi = {}
