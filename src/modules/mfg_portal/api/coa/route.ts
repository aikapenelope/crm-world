/**
 * GET /api/mfg-portal/coa?dispatch_order_id=...
 *
 * Certificados de análisis de los lotes del cliente autenticado.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['mfg_portal.download_coa'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const url = new URL(request.url)
  const dispatchOrderId = url.searchParams.get('dispatch_order_id')

  // Load CoAs for dispatch orders belonging to this customer
  let coaQuery = kysely
    .selectFrom('mfg_coa as c')
    .innerJoin('mfg_dispatch_orders as d', 'd.id', 'c.dispatch_order_id')
    .innerJoin('mfg_sale_orders_mfg as so', 'so.id', 'd.sale_order_id')
    .select([
      'c.id', 'c.coa_number', 'c.lot_number', 'c.product_code', 'c.product_name',
      'c.production_date', 'c.expiry_date', 'c.quantity', 'c.uom',
      'c.qa_results', 'c.approved_by', 'c.approved_at', 'c.is_released',
    ])
    .where('so.customer_id', '=', customerEntityId)
    .where('c.tenant_id', '=', scope.tenantId)
    .where('c.is_released', '=', true)

  if (dispatchOrderId) {
    coaQuery = coaQuery.where('c.dispatch_order_id', '=', dispatchOrderId)
  }

  const coas = await coaQuery.orderBy('c.created_at', 'desc').limit(50).execute()

  return Response.json({ items: coas })
}

export const openApi = {}
