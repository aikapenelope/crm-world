export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_support.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const [byStatus, byType, outages, slaBreached] = await Promise.all([
    kysely.selectFrom('isp_support_tickets')
      .select(['status', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .groupBy('status').execute(),

    kysely.selectFrom('isp_support_tickets')
      .select(['type', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('status', 'not in', ['resolved', 'closed'])
      .groupBy('type').execute(),

    kysely.selectFrom('isp_outages')
      .select(kysely.fn.count<number>('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('status', '!=', 'resolved')
      .executeTakeFirst(),

    kysely.selectFrom('isp_support_tickets')
      .select(kysely.fn.count<number>('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('sla_breached', '=', true)
      .where('status', 'not in', ['resolved', 'closed'])
      .executeTakeFirst(),
  ])

  const statusMap: Record<string, number> = {}
  for (const row of byStatus as any[]) statusMap[row.status] = Number(row.count)

  const typeMap: Record<string, number> = {}
  for (const row of byType as any[]) typeMap[row.type] = Number(row.count)

  return Response.json({
    by_status: {
      open: statusMap.open ?? 0,
      assigned: statusMap.assigned ?? 0,
      in_progress: statusMap.in_progress ?? 0,
      pending_client: statusMap.pending_client ?? 0,
      resolved: statusMap.resolved ?? 0,
    },
    open_by_type: typeMap,
    active_outages: Number((outages as any)?.count ?? 0),
    sla_breached: Number((slaBreached as any)?.count ?? 0),
  })
}

export const openApi = {}
