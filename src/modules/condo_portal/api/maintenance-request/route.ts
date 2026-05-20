/**
 * Portal: Create maintenance request from owner portal.
 */
export const metadata = {
  POST: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.maintenance'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const { building_id, unit_id, title, description, category, priority } = body

  if (!building_id || !title || !description || !category) {
    return Response.json({ error: 'building_id, title, description, and category are required' }, { status: 400 })
  }

  // Get unit info for the requester name
  let requesterName = 'Propietario'
  if (unit_id) {
    const unit = await kysely
      .selectFrom('condo_units')
      .select(['owner_name', 'unit_number'])
      .where('id', '=', unit_id)
      .where('tenant_id', '=', scope.tenantId)
      .executeTakeFirst()
    if (unit) {
      requesterName = (unit as any).owner_name ?? `Unidad ${(unit as any).unit_number}`
    }
  }

  const requestNumber = `SOL-${Date.now().toString(36).toUpperCase().slice(-5)}`

  await kysely
    .insertInto('condo_maintenance_requests')
    .values({
      id: crypto.randomUUID(),
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      building_id,
      request_number: requestNumber,
      requested_by_unit_id: unit_id ?? null,
      requested_by_name: requesterName,
      category: category ?? 'other',
      priority: priority ?? 'medium',
      title,
      description,
      status: 'open',
      currency: 'USD',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute()

  return Response.json({
    success: true,
    request_number: requestNumber,
  })
}

export const openApi = {}
