/**
 * GET /api/agri-cold-chain/temperature-logs
 * Returns recent temperature readings for a cold storage unit.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_cold_chain.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url    = new URL(request.url)
  const unitId = url.searchParams.get('cold_storage_unit_id')
  const hours  = Number(url.searchParams.get('hours') ?? '24')

  if (!unitId) return Response.json({ error: 'cold_storage_unit_id required' }, { status: 400 })

  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString()

  const readings = await kysely
    .selectFrom('agri_temperature_logs')
    .select(['id', 'temperature_c', 'humidity_pct', 'recorded_at', 'is_excursion', 'source'])
    .where('cold_storage_unit_id', '=', unitId)
    .where('tenant_id', '=', scope.tenantId)
    .where('recorded_at', '>=', since)
    .orderBy('recorded_at', 'desc')
    .limit(1000)
    .execute()

  return Response.json({ data: readings, unit_id: unitId, hours })
}

export const openApi = {}
