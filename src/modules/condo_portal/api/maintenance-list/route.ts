/**
 * Portal: List maintenance requests for an owner's unit/building.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.maintenance'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const unitId = url.searchParams.get('unit_id')
  const buildingId = url.searchParams.get('building_id')

  if (!unitId && !buildingId) {
    return Response.json({ error: 'unit_id or building_id is required' }, { status: 400 })
  }

  let query = kysely
    .selectFrom('condo_maintenance_requests')
    .select([
      'id', 'request_number', 'title', 'category', 'priority',
      'status', 'created_at', 'assigned_to', 'completed_at',
    ])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .orderBy('created_at', 'desc')

  if (unitId) {
    query = query.where('requested_by_unit_id', '=', unitId)
  } else if (buildingId) {
    query = query.where('building_id', '=', buildingId)
  }

  const requests = await query.limit(50).execute()

  return Response.json({ items: requests })
}

export const openApi = {}
