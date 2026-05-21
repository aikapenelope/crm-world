/**
 * Portal: List completed assemblies and their minutes for a building.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('building_id')

  if (!buildingId) {
    return Response.json({ error: 'building_id is required' }, { status: 400 })
  }

  const assemblies = await kysely
    .selectFrom('condo_assemblies')
    .select([
      'id', 'assembly_number', 'assembly_type', 'title',
      'date', 'status', 'location', 'attendees_count',
    ])
    .where('building_id', '=', buildingId)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['completed', 'in_progress'])
    .orderBy('date', 'desc')
    .limit(20)
    .execute()

  return Response.json({ items: assemblies })
}

export const openApi = {}
