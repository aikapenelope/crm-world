/**
 * agri_cold_chain — Temperature Excursion Monitor Worker
 *
 * Queue-based worker that runs periodically (every 15 min via scheduler).
 * For each active cold storage unit, checks the latest temperature readings.
 * If the unit has been outside its target range for >= min_alert_minutes,
 * emits agri_cold_chain.temperature.excursion with clientBroadcast: true.
 *
 * Also marks any StorageLotRecords currently stored in the affected unit
 * with a non-conformity flag, linking to an agri_quality non-conformity.
 *
 * Venezuela context: CORPOELEC power cuts are the main risk. The
 * min_alert_minutes threshold (default 15 min) absorbs short outages
 * without saturating notifications.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'agri_cold_chain.check-excursions',
  id: 'agri_cold_chain.check-temperature-excursions',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em     = ctx.resolve('em')
  const kysely = (em as any).getKysely()

  // Fetch all active cold storage units
  const units = await kysely
    .selectFrom('agri_cold_storage_units')
    .select(['id', 'name', 'tenant_id', 'organization_id',
             'target_temp_min', 'target_temp_max', 'min_alert_minutes', 'alert_phone'])
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .execute()

  let alertsTriggered = 0

  for (const unit of units as any[]) {
    const alertMinutes = Number(unit.min_alert_minutes ?? 15)
    const cutoff = new Date(Date.now() - alertMinutes * 60 * 1000).toISOString()

    // Get readings from the last min_alert_minutes window
    const recentReadings = await kysely
      .selectFrom('agri_temperature_logs')
      .select(['id', 'temperature_c', 'recorded_at', 'is_excursion'])
      .where('cold_storage_unit_id', '=', unit.id)
      .where('tenant_id', '=', unit.tenant_id)
      .where('recorded_at', '>=', cutoff)
      .orderBy('recorded_at', 'desc')
      .execute()

    if ((recentReadings as any[]).length === 0) continue

    // Check if ALL recent readings are excursions (sustained, not transient)
    const allExcursions = (recentReadings as any[]).every((r: any) => r.is_excursion)
    if (!allExcursions) continue

    // Get the latest temperature for the alert payload
    const latest = (recentReadings as any[])[0]
    const latestTemp = Number((latest as any).temperature_c)
    const minTemp    = Number(unit.target_temp_min)
    const maxTemp    = Number(unit.target_temp_max)

    const direction = latestTemp > maxTemp ? 'above_max' : 'below_min'

    await emitLifecycle(
      eventsConfig,
      'agri_cold_chain.temperature.excursion',
      { tenantId: unit.tenant_id as string, organizationId: unit.organization_id as string },
      {
        unit_id:           unit.id,
        unit_name:         unit.name,
        temperature_c:     latestTemp,
        target_min:        minTemp,
        target_max:        maxTemp,
        direction,
        duration_minutes:  alertMinutes,
        alert_phone:       unit.alert_phone,
      },
    )

    // The agri_quality subscriber (subscribers/on-cold-chain-excursion.ts) handles
    // NonConformity creation and storage-lot linking when it receives this event.
    // It uses unit_id from the event payload plus WHERE non_conformity_id IS NULL
    // for idempotent NC assignment — no sentinel needed here.

    alertsTriggered++
  }

  console.log(`[agri_cold_chain.check-excursions] Checked ${(units as any[]).length} units — ${alertsTriggered} alert(s) triggered`)
  return { units_checked: (units as any[]).length, alerts_triggered: alertsTriggered }
}
