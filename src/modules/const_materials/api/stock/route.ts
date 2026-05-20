/**
 * Stock summary — materials inventory per project.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['const_materials.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  let query = kysely
    .selectFrom('const_material_stock')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (projectId) query = query.where('project_id', '=', projectId)

  const stock = await query.execute()

  const available = (stock as any[]).map((s: any) => ({
    ...s,
    available_quantity: (Number(s.received_quantity) - Number(s.consumed_quantity)).toFixed(4),
    budget_variance: (Number(s.consumed_quantity) - Number(s.budget_quantity)).toFixed(4),
    is_over_budget: Number(s.consumed_quantity) > Number(s.budget_quantity),
  }))

  const totalValue = available.reduce((sum: number, s: any) => sum + (Number(s.available_quantity) * Number(s.unit_cost)), 0)

  return Response.json({
    items: available,
    total_items: available.length,
    over_budget: available.filter((s: any) => s.is_over_budget).length,
    total_value: totalValue.toFixed(2),
    currency: 'USD',
  })
}

export const openApi = {}
