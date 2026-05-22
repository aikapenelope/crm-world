export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_sales.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const [byStatus, bySrc, converted] = await Promise.all([
    kysely.selectFrom('isp_leads')
      .select(['status', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('status').execute(),

    kysely.selectFrom('isp_leads')
      .select(['source', kysely.fn.count<number>('id').as('count')])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .where('created_at', '>=', firstDayOfMonth.toISOString())
      .groupBy('source').execute(),

    kysely.selectFrom('isp_leads')
      .select(kysely.fn.count<number>('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('status', '=', 'installed')
      .where('created_at', '>=', firstDayOfMonth.toISOString())
      .executeTakeFirst(),
  ])

  const statusMap: Record<string, number> = {}
  for (const r of byStatus as any[]) statusMap[r.status] = Number(r.count)

  const srcMap: Record<string, number> = {}
  for (const r of bySrc as any[]) srcMap[r.source] = Number(r.count)

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0)
  const convertedCount = Number((converted as any)?.count ?? 0)

  return Response.json({
    total,
    by_status: statusMap,
    new_this_month_by_source: srcMap,
    converted_this_month: convertedCount,
    conversion_rate: total > 0 ? Math.round((convertedCount / total) * 100) : 0,
  })
}

export const openApi = {}
