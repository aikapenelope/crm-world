/**
 * Overdue Account Checker Worker
 *
 * Runs periodically (configured via scheduler module).
 * Checks all credit accounts with invoices past their due_date.
 * Updates credit limit status to 'suspended' or 'blocked' based on severity.
 *
 * Logic:
 * 1. Find credit_limits with current_balance > 0
 * 2. Check if any invoice transaction is past due_date
 * 3. If overdue > 60 days: block the account
 * 4. If overdue > 30 days: suspend the account
 * 5. Emit dist_credit.account.overdue (clientBroadcast: true) per account
 *
 * The worker is idempotent — running it multiple times won't double-process.
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'dist_credit.overdue-check',
  id: 'dist_credit.overdue-checker',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.resolve('em')
  const kysely = (em as any).getKysely()

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Get all tenants with active credit limits
  const tenants = await kysely
    .selectFrom('dist_credit_limits')
    .select(['tenant_id', 'organization_id'])
    .where('deleted_at', 'is', null)
    .where('status', '!=', 'blocked')
    .groupBy(['tenant_id', 'organization_id'])
    .execute()

  let totalUpdated = 0

  for (const tenant of tenants) {
    // Get limits with positive balance
    const limits = await kysely
      .selectFrom('dist_credit_limits')
      .selectAll()
      .where('tenant_id', '=', (tenant as any).tenant_id)
      .where('organization_id', '=', (tenant as any).organization_id)
      .where('deleted_at', 'is', null)
      .where('status', '!=', 'blocked')
      .execute()

    for (const limit of limits as any[]) {
      if (Number(limit.current_balance) <= 0) continue

      // Find oldest overdue invoice for this customer
      const oldestOverdue = await kysely
        .selectFrom('dist_credit_transactions')
        .select(['due_date'])
        .where('tenant_id', '=', limit.tenant_id)
        .where('organization_id', '=', limit.organization_id)
        .where('customer_id', '=', limit.customer_id)
        .where('type', '=', 'invoice')
        .where('due_date', '<', today)
        .orderBy('due_date', 'asc')
        .executeTakeFirst()

      if (!oldestOverdue) continue

      const dueDate = new Date((oldestOverdue as any).due_date)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      let newStatus: string | null = null

      if (daysOverdue > 60 && limit.status !== 'blocked') {
        newStatus = 'blocked'
      } else if (daysOverdue > 30 && limit.status === 'active') {
        newStatus = 'suspended'
      }

      if (newStatus) {
        await kysely
          .updateTable('dist_credit_limits')
          .set({ status: newStatus, updated_at: now })
          .where('id', '=', limit.id)
          .execute()

        totalUpdated++

        await emitLifecycle(
          eventsConfig,
          'dist_credit.account.overdue',
          { tenantId: limit.tenant_id as string, organizationId: limit.organization_id as string },
          { customer_id: limit.customer_id, balance: limit.current_balance, days_overdue: daysOverdue, new_status: newStatus },
        )
      }
    }
  }

  console.log(`[dist_credit.overdue-checker] Updated ${totalUpdated} accounts`)
  return { processed: totalUpdated }
}
