const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_inventory.view'] },
}

export const metadata = routeMetadata

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Inventory summary across all branches
  const inventorySummary = await kysely
    .selectFrom('dist_inventory_items')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .select([
      kysely.fn.count('id').as('total_products'),
      kysely.fn.sum('quantity_available').as('total_units'),
    ])
    .executeTakeFirst()

  // Low stock alerts
  const lowStockCount = await kysely
    .selectFrom('dist_inventory_items')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('reorder_point', '>', 0)
    .where('quantity_available', '<=', kysely.ref('reorder_point'))
    .select(kysely.fn.count('id').as('count'))
    .executeTakeFirst()

  // Dead stock count
  const deadStockCount = await kysely
    .selectFrom('retail_stock_rotation')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('is_dead_stock', '=', true)
    .select(kysely.fn.count('id').as('count'))
    .executeTakeFirst()

  // Pending counts
  const pendingCounts = await kysely
    .selectFrom('retail_stock_counts')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['planned', 'in_progress'])
    .select(kysely.fn.count('id').as('count'))
    .executeTakeFirst()

  // Branches with inventory
  const branchCount = await kysely
    .selectFrom('dist_inventory_items')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .select(kysely.fn.countDistinct('warehouse_code').as('count'))
    .executeTakeFirst()

  return Response.json({
    total_products: Number(inventorySummary?.total_products ?? 0),
    total_units: Number(inventorySummary?.total_units ?? 0),
    low_stock_alerts: Number(lowStockCount?.count ?? 0),
    dead_stock_count: Number(deadStockCount?.count ?? 0),
    pending_counts: Number(pendingCounts?.count ?? 0),
    branch_count: Number(branchCount?.count ?? 0),
  })
}

export const openApi = {}
