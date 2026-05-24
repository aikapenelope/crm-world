export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_technicians.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const today = new Date().toISOString().split('T')[0]

  const [woByStatus, techStatus, todayOts] = await Promise.all([
    kysely.selectFrom('isp_work_orders')
      .select(['status', kysely.fn.count('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .groupBy('status').execute(),

    kysely.selectFrom('isp_field_technicians')
      .select(['status', kysely.fn.count('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('status').execute(),

    kysely.selectFrom('isp_work_orders')
      .select(kysely.fn.count('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('scheduled_date', '=', today)
      .where('status', 'in', ['scheduled', 'in_progress'])
      .executeTakeFirst(),
  ])

  const woMap: Record<string, number> = {}
  for (const r of woByStatus as any[]) woMap[r.status] = Number(r.count)

  const techMap: Record<string, number> = {}
  for (const r of techStatus as any[]) techMap[r.status] = Number(r.count)

  return Response.json({
    work_orders: {
      pending: woMap.pending ?? 0,
      scheduled: woMap.scheduled ?? 0,
      in_progress: woMap.in_progress ?? 0,
      completed: woMap.completed ?? 0,
    },
    technicians: {
      available: techMap.available ?? 0,
      on_route: techMap.on_route ?? 0,
      on_site: techMap.on_site ?? 0,
      off_duty: techMap.off_duty ?? 0,
    },
    today_orders: Number((todayOts as any)?.count ?? 0),
  })
}

export const openApi = {}
