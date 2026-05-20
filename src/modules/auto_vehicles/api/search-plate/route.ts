/**
 * Quick search by plate number.
 * Returns vehicle + customer + last service order.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_vehicles.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const plate = url.searchParams.get('plate')?.trim().toUpperCase().replace(/[\s-]/g, '')

  if (!plate || plate.length < 3) {
    return Response.json({ error: 'plate is required (min 3 chars)' }, { status: 400 })
  }

  // Search vehicle by plate (partial match)
  const vehicles = await kysely
    .selectFrom('auto_vehicles')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('plate', 'like', `%${plate}%`)
    .where('deleted_at', 'is', null)
    .limit(5)
    .execute()

  if ((vehicles as any[]).length === 0) {
    return Response.json({ found: false, vehicles: [] })
  }

  // Get customer names
  const customerIds = [...new Set((vehicles as any[]).map((v: any) => v.customer_id))]
  const customers = await kysely
    .selectFrom('customer_people')
    .select(['id', 'display_name', 'primary_phone'])
    .where('id', 'in', customerIds)
    .execute()
  const customerMap = new Map<string, any>(customers.map((c: any) => [c.id, c]))

  // Get last service order for each vehicle
  const vehicleIds = (vehicles as any[]).map((v: any) => v.id)
  const lastOrders = await kysely
    .selectFrom('auto_service_orders')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('vehicle_id', 'in', vehicleIds)
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()

  const lastOrderByVehicle = new Map<string, any>()
  for (const order of lastOrders as any[]) {
    if (!lastOrderByVehicle.has(order.vehicle_id)) {
      lastOrderByVehicle.set(order.vehicle_id, order)
    }
  }

  const results = (vehicles as any[]).map((v: any) => {
    const customer = customerMap.get(v.customer_id) as any
    const lastOrder = lastOrderByVehicle.get(v.id) as any
    return {
      vehicle: {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        current_km: v.current_km,
      },
      customer: customer ? {
        id: customer.id,
        name: customer.display_name,
        phone: customer.primary_phone,
      } : null,
      last_order: lastOrder ? {
        id: lastOrder.id,
        order_number: lastOrder.order_number,
        status: lastOrder.status,
        received_at: lastOrder.received_at,
        total_amount: lastOrder.total_amount,
      } : null,
    }
  })

  return Response.json({ found: true, vehicles: results })
}

export const openApi = {}
