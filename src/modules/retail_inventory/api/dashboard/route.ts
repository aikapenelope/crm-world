const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_inventory.view'] },
}

export const metadata = routeMetadata

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Inventory summary across all branches
  const inventoryItems = await kysely
    .selectFrom('dist_inventory_items')
    .select(['id', 'quantity_available', 'reorder_point', 'warehouse_code'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .execute()

  const totalProducts = (inventoryItems as any[]).length
  const totalUnits = (inventoryItems as any[]).reduce((sum: number, i: any) => sum + (i.quantity_available ?? 0), 0)
  const lowStockAlerts = (inventoryItems as any[]).filter((i: any) => i.reorder_point > 0 && i.quantity_available <= i.reorder_point).length
  const branchCodes = new Set((inventoryItems as any[]).map((i: any) => i.warehouse_code))

  // Dead stock count
  const deadStockItems = await kysely
    .selectFrom('retail_stock_rotation')
    .select(['id'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('is_dead_stock', '=', true)
    .execute()

  // Pending counts
  const pendingCountItems = await kysely
    .selectFrom('retail_stock_counts')
    .select(['id'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['planned', 'in_progress'])
    .execute()

  return Response.json({
    total_products: totalProducts,
    total_units: totalUnits,
    low_stock_alerts: lowStockAlerts,
    dead_stock_count: (deadStockItems as any[]).length,
    pending_counts: (pendingCountItems as any[]).length,
    branch_count: branchCodes.size,
  })
}

export const openApi = {}
