/**
 * Register payment for a receipt.
 * Emits condo_fees.receipt.paid (clientBroadcast: true) so the receipts
 * dashboard and the collections view refresh in real-time.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['condo_fees.collect'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const { receipt_id, paid_amount, payment_method, payment_reference, notes } = body

  if (!receipt_id || !paid_amount || !payment_method) {
    return Response.json({ error: 'receipt_id, paid_amount, and payment_method are required' }, { status: 400 })
  }

  // Get receipt
  const receipt = await kysely
    .selectFrom('condo_receipts')
    .selectAll()
    .where('id', '=', receipt_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!receipt) {
    return Response.json({ error: 'Receipt not found' }, { status: 404 })
  }

  const r = receipt as any
  const newPaidAmount = Number(r.paid_amount) + Number(paid_amount)
  const totalAmount = Number(r.total_amount)
  const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial'

  await kysely
    .updateTable('condo_receipts')
    .set({
      paid_amount: newPaidAmount.toFixed(2),
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date() : r.paid_at,
      payment_method: payment_method,
      payment_reference: payment_reference ?? r.payment_reference,
      notes: notes ?? r.notes,
      updated_at: new Date(),
    })
    .where('id', '=', receipt_id)
    .execute()

  // Emit lifecycle event — clientBroadcast: true means the browser receives
  // this instantly, refreshing the receipts list and the collections dashboard
  // without a page reload.
  await emitLifecycle(eventsConfig, 'condo_fees.receipt.paid', scope, {
    id: receipt_id,
    new_status: newStatus,
    unit_id: r.unit_id,
    building_id: r.building_id,
  })

  return Response.json({
    success: true,
    receipt_id,
    new_status: newStatus,
    paid_amount: newPaidAmount.toFixed(2),
    total_amount: totalAmount.toFixed(2),
    remaining: Math.max(0, totalAmount - newPaidAmount).toFixed(2),
  })
}

export const openApi = {}
