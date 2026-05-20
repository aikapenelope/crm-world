/**
 * Portal: Owner account summary — receipts, debt, payments.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const unitId = url.searchParams.get('unit_id')

  if (!unitId) {
    return Response.json({ error: 'unit_id is required' }, { status: 400 })
  }

  // Get unit info
  const unit = await kysely
    .selectFrom('condo_units')
    .selectAll()
    .where('id', '=', unitId)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!unit) {
    return Response.json({ error: 'Unit not found' }, { status: 404 })
  }

  // Get receipts for this unit
  const receipts = await kysely
    .selectFrom('condo_receipts')
    .selectAll()
    .where('unit_id', '=', unitId)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('period_month', 'desc')
    .execute()

  const pendingReceipts = (receipts as any[]).filter((r: any) => r.status === 'pending' || r.status === 'overdue' || r.status === 'partial')
  const paidReceipts = (receipts as any[]).filter((r: any) => r.status === 'paid')
  const totalDebt = pendingReceipts.reduce((s: number, r: any) => s + Number(r.total_amount) - Number(r.paid_amount), 0)

  return Response.json({
    unit: {
      id: (unit as any).id,
      unit_number: (unit as any).unit_number,
      building_id: (unit as any).building_id,
      aliquot_percent: (unit as any).aliquot_percent,
      owner_name: (unit as any).owner_name,
    },
    balance: {
      total_debt: totalDebt.toFixed(2),
      pending_receipts: pendingReceipts.length,
      paid_receipts: paidReceipts.length,
      currency: 'USD',
    },
    recent_receipts: (receipts as any[]).slice(0, 12).map((r: any) => ({
      id: r.id,
      receipt_number: r.receipt_number,
      period_month: r.period_month,
      total_amount: r.total_amount,
      paid_amount: r.paid_amount,
      status: r.status,
      due_date: r.due_date,
    })),
  })
}

export const openApi = {}
