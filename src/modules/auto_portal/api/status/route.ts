/**
 * Portal Vehicle Status API.
 * Returns the current service order status for a customer's vehicle.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_portal.view_status'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const vehicleId = url.searchParams.get('vehicle_id')

  if (!vehicleId) {
    return Response.json({ error: 'vehicle_id is required' }, { status: 400 })
  }

  const order = await kysely
    .selectFrom('auto_service_orders')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('vehicle_id', '=', vehicleId)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .executeTakeFirst()

  if (!order) {
    return Response.json({ status: 'no_active_order', vehicle_id: vehicleId })
  }

  return Response.json({
    order_id: (order as any).id,
    order_number: (order as any).order_number,
    status: (order as any).status,
    received_at: (order as any).received_at,
    customer_complaint: (order as any).customer_complaint,
    estimated_completion: (order as any).estimated_completion,
    total_amount: (order as any).total_amount,
    currency: (order as any).currency,
  })
}

export const openApi = {}
