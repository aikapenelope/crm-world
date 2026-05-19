/**
 * When a transaction is completed, update the property status
 * to 'sold' or 'rented' depending on the transaction type.
 *
 * Uses raw EM query to avoid cross-module import issues.
 * This follows the Open Mercato pattern: modules communicate via
 * events and DI, not direct entity imports across boundaries.
 */
export const metadata = {
  event: 'transactions.transaction.completed',
  persistent: true,
  id: 'transactions.update-property-status',
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.resolve('em')
  if (!em) return

  const propertyId = payload.property_id
  const tenantId = payload.tenantId
  if (!propertyId || !tenantId) return

  const newStatus = payload.transaction_type === 'sale' ? 'sold' : 'rented'

  // Use Kysely (MikroORM v7) to update without importing the entity class
  const knex = (em as any).getKysely()
  await knex
    .updateTable('properties')
    .set({ status: newStatus, updated_at: new Date() })
    .where('id', '=', propertyId)
    .where('tenant_id', '=', tenantId)
    .where('deleted_at', 'is', null)
    .execute()

  console.log(
    `[transactions] Property ${propertyId} status updated to ${newStatus}`,
  )
}
