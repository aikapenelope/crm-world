/**
 * Worker: Generate WhatsApp reminder messages for debtors.
 * Scheduled to run weekly. Generates wa.me links for all debtors
 * with phone numbers, logs the collection action, and emits
 * condo_collections.debtor.detected (clientBroadcast: true) so the
 * collections dashboard alert counter refreshes in real-time.
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'condo-collections-whatsapp',
  id: 'condo-collections-whatsapp-reminder',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const { tenant_id, organization_id, building_id } = payload

  if (!tenant_id || !organization_id) {
    return { skipped: true, reason: 'Missing tenant context' }
  }

  // Get overdue receipts with owner phone
  let query = kysely
    .selectFrom('condo_receipts')
    .innerJoin('condo_units', 'condo_units.id', 'condo_receipts.unit_id')
    .select([
      'condo_receipts.unit_id',
      'condo_receipts.owner_name',
      'condo_receipts.unit_number',
      'condo_receipts.total_amount',
      'condo_receipts.paid_amount',
      'condo_receipts.period_month',
      'condo_units.owner_phone',
    ])
    .where('condo_receipts.tenant_id', '=', tenant_id)
    .where('condo_receipts.organization_id', '=', organization_id)
    .where('condo_receipts.status', 'in', ['overdue'])

  if (building_id) {
    query = query.where('condo_receipts.building_id', '=', building_id)
  }

  const results = await query.execute()

  // Group by unit
  const unitMessages = new Map<string, any>()
  for (const r of results as any[]) {
    if (!r.owner_phone) continue
    const key = r.unit_id as string
    const debt = Number(r.total_amount) - Number(r.paid_amount)
    const existing = unitMessages.get(key)
    if (existing) {
      existing.total_debt += debt
      existing.periods.push(r.period_month)
    } else {
      unitMessages.set(key, {
        unit_id: r.unit_id,
        owner_name: r.owner_name,
        unit_number: r.unit_number,
        owner_phone: r.owner_phone,
        total_debt: debt,
        periods: [r.period_month],
      })
    }
  }

  // Log collection actions
  const now = new Date()
  let actionsLogged = 0

  for (const [, msg] of unitMessages) {
    await kysely
      .insertInto('condo_collection_actions')
      .values({
        id: crypto.randomUUID(),
        tenant_id,
        organization_id,
        unit_id: msg.unit_id,
        action_type: 'whatsapp',
        action_date: now,
        result: 'contacted',
        notes: `Recordatorio automático: deuda $${msg.total_debt.toFixed(2)} (${msg.periods.join(', ')})`,
        created_at: now,
      })
      .execute()
    actionsLogged++
  }

  // Emit debtor.detected per tenant so the collections dashboard refreshes.
  if (actionsLogged > 0) {
    await emitLifecycle(
      eventsConfig,
      'condo_collections.debtor.detected',
      { tenantId: tenant_id as string, organizationId: organization_id as string },
      { debtors_count: actionsLogged },
    )
  }

  return {
    success: true,
    debtors_contacted: actionsLogged,
    total_debt: Array.from(unitMessages.values()).reduce((s, m) => s + m.total_debt, 0).toFixed(2),
    timestamp: now.toISOString(),
  }
}
