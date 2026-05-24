/**
 * GET /api/mfg-portal/orders
 *
 * Pedidos del cliente industrial autenticado.
 * Resuelve la identidad via ctx.customerContext.customerEntityId
 * (el operador vincula el cliente en customer_accounts/admin/users).
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['mfg_portal.view_orders'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const orders = await kysely
    .selectFrom('mfg_sale_orders_mfg')
    .selectAll()
    .where('customer_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .limit(20)
    .execute()

  return Response.json({ items: orders })
}

export const openApi = {}
