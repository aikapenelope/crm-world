/**
 * Portal: Report a payment (owner uploads proof).
 */
export const metadata = {
  POST: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.report_payment'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const { receipt_id, amount, payment_method, reference, notes } = body

  if (!receipt_id || !amount || !payment_method) {
    return Response.json({ error: 'receipt_id, amount, and payment_method are required' }, { status: 400 })
  }

  // Verify receipt exists and belongs to tenant
  const receipt = await kysely
    .selectFrom('condo_receipts')
    .select(['id', 'status', 'total_amount', 'paid_amount'])
    .where('id', '=', receipt_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!receipt) {
    return Response.json({ error: 'Receipt not found' }, { status: 404 })
  }

  const r = receipt as any
  if (r.status === 'paid' || r.status === 'cancelled') {
    return Response.json({ error: 'Receipt is already paid or cancelled' }, { status: 400 })
  }

  // Register payment (partial or full)
  const newPaid = Number(r.paid_amount) + Number(amount)
  const total = Number(r.total_amount)
  const newStatus = newPaid >= total ? 'paid' : 'partial'

  await kysely
    .updateTable('condo_receipts')
    .set({
      paid_amount: newPaid.toFixed(2),
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date() : null,
      payment_method: payment_method,
      payment_reference: reference ?? null,
      notes: notes ?? null,
      updated_at: new Date(),
    })
    .where('id', '=', receipt_id)
    .execute()

  return Response.json({
    success: true,
    receipt_id,
    new_status: newStatus,
    paid_amount: newPaid.toFixed(2),
    remaining: Math.max(0, total - newPaid).toFixed(2),
  })
}

export const openApi = {}
