/**
 * Common area reservations API.
 * Integrates with the planner module for availability management.
 * Handles booking, cancellation, and listing of reservations.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_properties.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_properties.view'] },
  DELETE: { requireAuth: true, requireFeatures: ['condo_properties.manage_areas'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const areaId = url.searchParams.get('area_id')
  const date = url.searchParams.get('date')

  let query = kysely
    .selectFrom('condo_reservations')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .orderBy('reservation_date', 'asc')

  if (areaId) query = query.where('area_id', '=', areaId)
  if (date) query = query.where('reservation_date', '=', date)

  const reservations = await query.execute()
  return Response.json({ items: reservations })
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const { area_id, unit_id, reservation_date, start_time, end_time, purpose, notes } = body

  if (!area_id || !unit_id || !reservation_date || !start_time || !end_time) {
    return Response.json({ error: 'area_id, unit_id, reservation_date, start_time, and end_time are required' }, { status: 400 })
  }

  // Check area is reservable
  const area = await kysely
    .selectFrom('condo_common_areas')
    .select(['id', 'name', 'is_reservable', 'reservation_fee'])
    .where('id', '=', area_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!area) return Response.json({ error: 'Area not found' }, { status: 404 })
  if (!(area as any).is_reservable) return Response.json({ error: 'This area is not reservable' }, { status: 400 })

  // Check for conflicts (same area, same date, overlapping time)
  const conflicts = await kysely
    .selectFrom('condo_reservations')
    .select(['id'])
    .where('area_id', '=', area_id)
    .where('reservation_date', '=', reservation_date)
    .where('status', '!=', 'cancelled')
    .where('start_time', '<', end_time)
    .where('end_time', '>', start_time)
    .execute()

  if ((conflicts as any[]).length > 0) {
    return Response.json({ error: 'Time slot already reserved. Please choose another time.' }, { status: 409 })
  }

  // Get unit info
  const unit = await kysely
    .selectFrom('condo_units')
    .select(['unit_number', 'owner_name'])
    .where('id', '=', unit_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  const reservation = {
    id: crypto.randomUUID(),
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    area_id,
    unit_id,
    reserved_by_name: (unit as any)?.owner_name ?? 'Propietario',
    unit_number: (unit as any)?.unit_number ?? '',
    reservation_date,
    start_time,
    end_time,
    purpose: purpose ?? null,
    fee_amount: (area as any).reservation_fee ?? '0.00',
    status: 'confirmed',
    notes: notes ?? null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  await kysely.insertInto('condo_reservations').values(reservation).execute()

  return Response.json({
    success: true,
    reservation: {
      id: reservation.id,
      area_name: (area as any).name,
      date: reservation_date,
      time: `${start_time} - ${end_time}`,
      fee: reservation.fee_amount,
    },
  })
}

export async function DELETE(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const reservationId = url.searchParams.get('id')

  if (!reservationId) return Response.json({ error: 'id is required' }, { status: 400 })

  await kysely
    .updateTable('condo_reservations')
    .set({ status: 'cancelled', updated_at: new Date() })
    .where('id', '=', reservationId)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  return Response.json({ success: true, cancelled: reservationId })
}

export const openApi = {}
