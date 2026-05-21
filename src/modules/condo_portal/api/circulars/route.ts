/**
 * Portal: List published circulars for a building.
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

  const circulars = await kysely
    .selectFrom('condo_circulars')
    .select(['id', 'circular_number', 'category', 'title', 'content', 'status', 'created_at'])
    .where('building_id', '=', buildingId)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', '=', 'published')
    .orderBy('created_at', 'desc')
    .limit(30)
    .execute()

  return Response.json({ items: circulars })
}

export const openApi = {}
