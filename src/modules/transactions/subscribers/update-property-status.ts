/**
 * When a transaction is completed, update the property status
 * to 'sold' or 'rented' depending on the transaction type.
 */
export const metadata = {
  event: 'transactions.transaction.completed',
  persistent: true,
  id: 'transactions.update-property-status',
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.resolve('em')
  if (!em) return

  const { PropertyEntity, PropertyStatus } = await import(
    '../../../properties/data/entities'
  )

  const property = await em.findOne(PropertyEntity, {
    id: payload.property_id,
    tenant_id: payload.tenantId,
    deleted_at: null,
  })

  if (!property) return

  const newStatus = payload.transaction_type === 'sale'
    ? PropertyStatus.SOLD
    : PropertyStatus.RENTED

  property.status = newStatus
  property.updated_at = new Date()
  await em.flush()

  console.log(
    `[transactions] Property ${property.id} status updated to ${newStatus}`,
  )
}
