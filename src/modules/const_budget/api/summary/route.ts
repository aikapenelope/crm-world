/**
 * Budget summary by chapter/category for a project.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['const_budget.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  let query = kysely
    .selectFrom('const_budget_items')
    .select(['id', 'item_number', 'name', 'total_cost', 'category', 'is_chapter', 'level', 'parent_id', 'unit', 'quantity', 'unit_cost'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (projectId) query = query.where('project_id', '=', projectId)

  const items = await query.orderBy('item_number', 'asc').execute()

  // Group by category
  const byCategory: Record<string, number> = {}
  let grandTotal = 0

  for (const item of items as any[]) {
    if (!item.is_chapter && item.level > 0) {
      const cat = item.category as string
      const cost = Number(item.total_cost)
      byCategory[cat] = (byCategory[cat] ?? 0) + cost
      grandTotal += cost
    }
  }

  // Chapters (level 0) total
  const chapters = (items as any[]).filter((i: any) => i.is_chapter || i.level === 0)

  return Response.json({
    grand_total: grandTotal.toFixed(2),
    item_count: (items as any[]).length,
    chapter_count: chapters.length,
    by_category: byCategory,
    currency: 'USD',
  })
}

export const openApi = {}
