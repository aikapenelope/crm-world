/**
 * GET /api/agri-portal/my-settlements
 *
 * Returns the producer's settlement history.
 * Only settlements for this producer (producer_id = customerEntityId).
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['agri_portal.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em         = ctx.container.resolve('em')
  const scope      = ctx.scope
  const kysely     = (em as any).getKysely()
  const producerId = ctx.customerContext?.customerEntityId

  if (!producerId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url      = new URL(request.url)
  const page     = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Number(url.searchParams.get('pageSize') ?? 20))
  const offset   = (page - 1) * pageSize

  const settlements = await kysely
    .selectFrom('agri_producer_settlements')
    .select([
      'id', 'cycle_start_date', 'cycle_end_date',
      'actual_fca', 'actual_avg_weight_kg', 'actual_mortality_pct',
      'target_fca', 'base_payment_usd', 'fca_bonus_usd', 'weight_bonus_usd',
      'fca_penalty_usd', 'total_payment_usd', 'status', 'payment_date',
    ])
    .where('producer_id', '=', producerId)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('cycle_end_date', 'desc')
    .limit(pageSize)
    .offset(offset)
    .execute()

  return Response.json({ data: settlements, page, pageSize })
}

export const openApi = {}
