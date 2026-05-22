/**
 * GET /api/isp-portal/invoices
 * Facturas del abonado autenticado (ordenadas por fecha, más recientes primero).
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  // Obtener el subscriber_id del abonado autenticado
  const subscriber = await kysely
    .selectFrom('isp_subscribers')
    .select(['id'])
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const pageSize = 12

  const invoices = await kysely
    .selectFrom('isp_invoices')
    .select(['id', 'invoice_number', 'period_month', 'issue_date', 'due_date', 'status', 'total_usd', 'paid_amount_usd', 'balance_usd', 'paid_at'])
    .where('subscriber_id', '=', (subscriber as any).id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .orderBy('period_month', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .execute()

  return Response.json({ invoices })
}

export const openApi = {}
