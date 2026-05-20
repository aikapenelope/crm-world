/**
 * Register material receipt — update order line received quantities.
 */
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['const_materials.receive'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const { order_id, items } = body

  if (!order_id || !items?.length) {
    return Response.json({ error: 'order_id and items are required' }, { status: 400 })
  }

  let allReceived = true

  for (const item of items as any[]) {
    const line = await kysely
      .selectFrom('const_material_order_lines')
      .select(['ordered_quantity', 'received_quantity'])
      .where('id', '=', item.line_id)
      .executeTakeFirst()

    if (!line) continue

    const newReceived = Number((line as any).received_quantity) + Number(item.received_quantity)
    await kysely
      .updateTable('const_material_order_lines')
      .set({ received_quantity: newReceived.toFixed(4) })
      .where('id', '=', item.line_id)
      .execute()

    if (newReceived < Number((line as any).ordered_quantity)) allReceived = false
  }

  const newStatus = allReceived ? 'received' : 'partial_received'
  await kysely
    .updateTable('const_material_orders')
    .set({ status: newStatus, updated_at: new Date() })
    .where('id', '=', order_id)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  return Response.json({ success: true, order_id, status: newStatus })
}

export const openApi = {}
