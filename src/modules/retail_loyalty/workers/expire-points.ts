/**
 * Worker: expire-points
 *
 * Expira puntos vencidos de cuentas de fidelización.
 * Se ejecuta diariamente via scheduler.
 *
 * Lógica:
 * 1. Busca transacciones tipo 'earn' con expires_at < now y puntos aún disponibles
 * 2. Resta los puntos expirados del balance actual
 * 3. Crea transacción tipo 'expire'
 */

import type { RequestContext } from '@open-mercato/shared/lib/api/context'

export async function expirePoints(context: RequestContext) {
  const { em, scope } = context
  const kysely = (em as any).getKysely()
  const now = new Date()

  // Find expired earn transactions that haven't been processed
  const expiredTransactions = await kysely
    .selectFrom('retail_loyalty_transactions')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('type', '=', 'earn')
    .where('expires_at', '<', now)
    .where('points', '>', 0)
    .select(['id', 'account_id', 'points'])
    .execute()

  for (const tx of expiredTransactions) {
    const account = await kysely
      .selectFrom('retail_loyalty_accounts')
      .where('id', '=', (tx as any).account_id)
      .selectAll()
      .executeTakeFirst()

    if (!account || (account as any).current_points <= 0) continue

    const pointsToExpire = Math.min((tx as any).points, (account as any).current_points)
    const newBalance = (account as any).current_points - pointsToExpire

    // Update account balance
    await kysely
      .updateTable('retail_loyalty_accounts')
      .set({ current_points: newBalance, updated_at: now } as any)
      .where('id', '=', (account as any).id)
      .execute()

    // Record expiration transaction
    await kysely
      .insertInto('retail_loyalty_transactions')
      .values({
        id: crypto.randomUUID(),
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        account_id: (tx as any).account_id,
        type: 'expire',
        points: -pointsToExpire,
        balance_after: newBalance,
        reference_type: 'expiration',
        reference_id: (tx as any).id,
        description: `Expiración de ${pointsToExpire} puntos`,
        created_at: now,
      } as any)
      .execute()

    // Mark original transaction as processed (set points to 0)
    await kysely
      .updateTable('retail_loyalty_transactions')
      .set({ points: 0 } as any)
      .where('id', '=', (tx as any).id)
      .execute()
  }
}
