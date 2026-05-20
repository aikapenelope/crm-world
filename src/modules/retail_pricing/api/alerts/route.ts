import { listAlertsSchema, acknowledgeAlertSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_pricing.alerts'] },
  POST: { requireAuth: true, requireFeatures: ['retail_pricing.alerts'] },
}

export const metadata = routeMetadata

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const params = listAlertsSchema.parse(Object.fromEntries(url.searchParams))

  let query = kysely
    .selectFrom('retail_price_alerts')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (params.alert_type) query = query.where('alert_type', '=', params.alert_type)
  if (params.status) query = query.where('status', '=', params.status)

  const items = await query
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)
    .execute()

  return Response.json({ items })
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const user = ctx.user
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const input = acknowledgeAlertSchema.parse(body)

  await kysely
    .updateTable('retail_price_alerts')
    .set({
      status: 'acknowledged',
      acknowledged_by: user?.id ?? null,
      acknowledged_at: new Date(),
    } as any)
    .where('id', '=', input.alert_id)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  return Response.json({ ok: true })
}

export const openApi = {}
