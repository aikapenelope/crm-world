/**
 * Auto Shop Dashboard API.
 * Aggregates KPIs from service orders, inspections, and parts.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_reports.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const orders = await kysely
    .selectFrom('auto_service_orders')
    .select(['status', 'total_amount', 'received_at'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const inShop = (orders as any[]).filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length
  const completed = (orders as any[]).filter((o: any) => o.status === 'delivered').length
  const revenue = (orders as any[]).filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + Number(o.total_amount), 0)

  const parts = await kysely
    .selectFrom('auto_parts')
    .select(['quantity_in_stock', 'reorder_point'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const lowStock = (parts as any[]).filter((p: any) => p.reorder_point > 0 && p.quantity_in_stock <= p.reorder_point).length

  return Response.json({
    vehicles_in_shop: inShop,
    orders_completed: completed,
    total_revenue: revenue.toFixed(2),
    total_orders: orders.length,
    parts_low_stock: lowStock,
    total_parts: parts.length,
  })
}

export const openApi = {}
