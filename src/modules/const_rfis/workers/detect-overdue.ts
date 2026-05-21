/**
 * Worker: Detect overdue RFIs (past due_date without response).
 * Runs daily. Marks open RFIs past due as urgent priority.
 * Emits const_rfis.rfi.overdue (clientBroadcast: true) for each escalation
 * so the RFIs dashboard alert counter updates live on all connected browsers.
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'const-rfis-overdue',
  id: 'const-rfis-detect-overdue',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()
  const today = new Date().toISOString().split('T')[0]

  // Workers receive tenantId + organizationId in payload for scoped emit
  const tenantId: string = payload?.tenantId ?? ''
  const organizationId: string = payload?.organizationId ?? ''

  // Find open RFIs past due_date
  let query = kysely
    .selectFrom('const_rfis')
    .select(['id', 'rfi_number', 'priority', 'tenant_id', 'organization_id'])
    .where('status', 'in', ['open', 'pending_response'])
    .where('due_date', '<', today)

  // Scope to specific tenant if provided in payload
  if (tenantId) query = query.where('tenant_id', '=', tenantId)

  const overdue = await query.execute()

  let escalated = 0
  for (const rfi of overdue as any[]) {
    if ((rfi as any).priority !== 'urgent') {
      await kysely
        .updateTable('const_rfis')
        .set({ priority: 'urgent', updated_at: new Date() })
        .where('id', '=', (rfi as any).id)
        .execute()

      // Emit per-tenant so the correct browser receives the alert
      const rfiTenantId: string = (rfi as any).tenant_id
      const rfiOrgId: string = (rfi as any).organization_id
      await emitLifecycle(
        eventsConfig,
        'const_rfis.rfi.overdue',
        { tenantId: rfiTenantId, organizationId: rfiOrgId },
        { id: (rfi as any).id, rfi_number: (rfi as any).rfi_number },
      )

      escalated++
    }
  }

  return { processed: (overdue as any[]).length, escalated, timestamp: new Date().toISOString() }
}
