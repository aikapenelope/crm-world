/**
 * GET /api/isp-portal/payments
 * Pagos registrados del abonado autenticado.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.view_account'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const subscriber = await kysely
    .selectFrom('isp_subscribers').select(['id'])
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })

  const payments = await kysely
    .selectFrom('isp_payments')
    .select(['id', 'payment_date', 'amount_usd', 'currency', 'payment_method', 'reference_number', 'igtf_applies', 'igtf_amount_usd', 'confirmed_at', 'invoice_id'])
    .where('subscriber_id', '=', (subscriber as any).id)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('payment_date', 'desc')
    .limit(24)
    .execute()

  return Response.json({ payments })
}

export const openApi = {}
