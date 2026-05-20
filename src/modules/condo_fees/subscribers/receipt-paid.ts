/**
 * Subscriber: When a receipt is paid, trigger reserve fund contribution.
 * Listens to condo_fees.receipt.paid event and enqueues the worker.
 */

export const metadata = {
  event: 'condo_fees.receipt.paid',
  persistent: true,
  id: 'condo-fees-receipt-paid-reserve-fund',
}

export default async function handler(payload: any, ctx: any) {
  const queue = ctx.container.resolve('queue')

  // Enqueue reserve fund contribution
  await queue.enqueue('condo-reserve-fund', {
    receipt_id: payload.entityId ?? payload.id,
    tenant_id: payload.tenantId,
    organization_id: payload.organizationId,
  })
}
