/**
 * Maintenance Dashboard API — KPIs.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_maintenance.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const requests = await kysely
    .selectFrom('condo_maintenance_requests')
    .select(['status', 'priority', 'actual_cost'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const open = (requests as any[]).filter((r: any) => r.status === 'open').length
  const inProgress = (requests as any[]).filter((r: any) => r.status === 'in_progress' || r.status === 'assigned').length
  const completed = (requests as any[]).filter((r: any) => r.status === 'completed').length
  const emergencies = (requests as any[]).filter((r: any) => r.priority === 'emergency' && r.status !== 'completed').length
  const totalCost = (requests as any[]).reduce((s: number, r: any) => s + (Number(r.actual_cost) || 0), 0)

  const workOrders = await kysely
    .selectFrom('condo_work_orders')
    .select(['status', 'final_amount'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const pendingOrders = (workOrders as any[]).filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled').length

  return Response.json({
    requests: { open, in_progress: inProgress, completed, emergencies, total: (requests as any[]).length },
    work_orders: { pending: pendingOrders, total: (workOrders as any[]).length },
    costs: { total: totalCost.toFixed(2), currency: 'USD' },
  })
}

export const openApi = {}
