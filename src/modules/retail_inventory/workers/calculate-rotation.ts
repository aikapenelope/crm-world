/**
 * Worker: calculate-rotation
 *
 * Calcula métricas de rotación de inventario por producto/branch.
 * Se ejecuta diariamente via scheduler.
 *
 * Lógica:
 * 1. Para cada producto en cada warehouse (branch):
 *    - Obtiene stock actual (closing_stock)
 *    - Suma movimientos de salida del mes (total_sold)
 *    - Suma movimientos de entrada del mes (total_received)
 *    - Calcula rotation_index = total_sold / avg_stock
 *    - Calcula days_of_stock = closing_stock / (total_sold / 30)
 *    - Marca is_dead_stock si no hay movimiento en 90+ días
 * 2. Upsert en retail_stock_rotation
 */

export async function calculateRotation(context: any) {
  const em = context.container.resolve('em')
  const scope = context.scope
  const kysely = (em as any).getKysely()

  const now = new Date()
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Get all inventory items
  const items = await kysely
    .selectFrom('dist_inventory_items')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .select(['id', 'product_id', 'variant_id', 'warehouse_code', 'quantity_available'])
    .execute()

  for (const item of items) {
    // Get movements for this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const movements = await kysely
      .selectFrom('dist_inventory_movements')
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('product_id', '=', item.product_id)
      .where('warehouse_code', '=', item.warehouse_code)
      .where('created_at', '>=', monthStart)
      .select(['type', 'quantity'])
      .execute()

    const totalSold = movements
      .filter((m: any) => m.type === 'sale_out')
      .reduce((sum: number, m: any) => sum + Math.abs(m.quantity), 0)

    const totalReceived = movements
      .filter((m: any) => ['purchase_in', 'return_in'].includes(m.type))
      .reduce((sum: number, m: any) => sum + m.quantity, 0)

    const closingStock = item.quantity_available
    const avgStock = closingStock > 0 ? closingStock : 1
    const rotationIndex = totalSold / avgStock
    const daysOfStock = totalSold > 0 ? Math.round(closingStock / (totalSold / 30)) : 999

    // Check last movement date
    const lastMovement = await kysely
      .selectFrom('dist_inventory_movements')
      .where('product_id', '=', item.product_id)
      .where('warehouse_code', '=', item.warehouse_code)
      .orderBy('created_at', 'desc')
      .select('created_at')
      .limit(1)
      .executeTakeFirst()

    const lastMovementAt = lastMovement?.created_at ?? null
    const isDeadStock = !lastMovementAt || new Date(lastMovementAt as string) < ninetyDaysAgo

    // Upsert rotation record
    await kysely
      .insertInto('retail_stock_rotation')
      .values({
        id: crypto.randomUUID(),
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        branch_id: item.warehouse_code,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        period_month: periodMonth,
        opening_stock: closingStock,
        closing_stock: closingStock,
        total_sold: totalSold,
        total_received: totalReceived,
        rotation_index: rotationIndex.toFixed(2),
        days_of_stock: daysOfStock,
        is_dead_stock: isDeadStock,
        last_movement_at: lastMovementAt,
        calculated_at: now,
      } as any)
      .onConflict((oc: any) =>
        oc.columns(['tenant_id', 'organization_id', 'branch_id', 'product_id', 'period_month'])
          .doUpdateSet({
            closing_stock: closingStock,
            total_sold: totalSold,
            total_received: totalReceived,
            rotation_index: rotationIndex.toFixed(2),
            days_of_stock: daysOfStock,
            is_dead_stock: isDeadStock,
            last_movement_at: lastMovementAt,
            calculated_at: now,
          } as any)
      )
      .execute()
  }
}
