/**
 * GET /api/isp-subscribers/dashboard
 * KPIs de abonados: activos, por estado, por segmento, nuevos del mes.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_subscribers.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const [byStatus, byType, newThisMonth] = await Promise.all([
    kysely
      .selectFrom('isp_subscribers')
      .select(['service_status', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('service_status')
      .execute(),

    kysely
      .selectFrom('isp_subscribers')
      .select(['subscriber_type', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('subscriber_type')
      .execute(),

    kysely
      .selectFrom('isp_subscribers')
      .select(kysely.fn.count<number>('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .where('created_at', '>=', firstDayOfMonth.toISOString())
      .executeTakeFirst(),
  ])

  const statusMap: Record<string, number> = {}
  for (const row of byStatus as any[]) statusMap[row.service_status] = Number(row.count)

  const typeMap: Record<string, number> = {}
  for (const row of byType as any[]) typeMap[row.subscriber_type] = Number(row.count)

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0)

  return Response.json({
    total,
    by_status: {
      active:               statusMap.active               ?? 0,
      pending_installation: statusMap.pending_installation ?? 0,
      suspended_overdue:    statusMap.suspended_overdue    ?? 0,
      suspended_voluntary:  statusMap.suspended_voluntary  ?? 0,
      cancelled:            statusMap.cancelled            ?? 0,
    },
    by_type: {
      residential: typeMap.residential ?? 0,
      pyme:        typeMap.pyme        ?? 0,
      corporate:   typeMap.corporate   ?? 0,
      wholesale:   typeMap.wholesale   ?? 0,
    },
    new_this_month: Number((newThisMonth as any)?.count ?? 0),
  })
}

export const openApi = {}
