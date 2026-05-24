/**
 * Worker: Detect overdue tuition charges.
 * Runs daily via scheduler. Finds pending charges past their due_date
 * and marks them as 'overdue'. Emits tuition.charge.overdue (clientBroadcast: true)
 * per charge so the collections dashboard alert counter increments in real-time.
 *
 * The worker is idempotent — charges already in 'overdue' status are skipped.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'tuition-overdue',
  id: 'tuition-detect-overdue',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Find all pending charges whose due_date has passed
  const overdueCharges = await kysely
    .selectFrom('tuition_charges')
    .select(['id', 'tenant_id', 'organization_id', 'student_id', 'amount', 'period_month'])
    .where('status', '=', 'pending')
    .where('due_date', '<', today)
    .where('deleted_at', 'is', null)
    .execute()

  let markedOverdue = 0

  for (const charge of overdueCharges as any[]) {
    await kysely
      .updateTable('tuition_charges')
      .set({ status: 'overdue', updated_at: now })
      .where('id', '=', charge.id)
      .execute()

    await emitLifecycle(
      eventsConfig,
      'tuition.charge.overdue',
      { tenantId: charge.tenant_id as string, organizationId: charge.organization_id as string },
      { id: charge.id as string, student_id: charge.student_id, period_month: charge.period_month },
    )

    markedOverdue++
  }

  return {
    processed: (overdueCharges as any[]).length,
    marked_overdue: markedOverdue,
    timestamp: now.toISOString(),
  }
}
