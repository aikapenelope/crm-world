/**
 * agri_vet — Daily Mortality Monitor Worker
 *
 * Runs daily via the scheduler module.
 * For each active flock, sums today's mortality records and checks
 * whether the daily mortality % exceeds the flock's threshold.
 *
 * If exceeded → emits agri_vet.mortality.alert_triggered (clientBroadcast)
 * which in turn creates a notification for the production manager.
 *
 * Cross-module rule:
 * - Reads agri_flocks (agri_units module) via Kysely — no direct entity import
 * - Reads agri_vet_mortality_records (own module)
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'agri_vet.mortality-monitor',
  id: 'agri_vet.mortality-monitor',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em     = ctx.resolve('em')
  const kysely = (em as any).getKysely()

  const today = new Date().toISOString().split('T')[0]

  // Fetch all active flocks across all tenants
  const flocks = await kysely
    .selectFrom('agri_flocks')
    .select(['id', 'flock_number', 'tenant_id', 'organization_id',
             'initial_count', 'mortality_threshold_pct'])
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .execute()

  let alertsTriggered = 0

  for (const flock of flocks as any[]) {
    // Sum all mortality records for today
    const todayMortality = await kysely
      .selectFrom('agri_vet_mortality_records')
      .select([kysely.fn.sum('count').as('total')])
      .where('flock_id', '=', flock.id)
      .where('tenant_id', '=', flock.tenant_id)
      .where('record_date', '=', today)
      .executeTakeFirst()

    const dailyCount = Number((todayMortality as any)?.total ?? 0)
    if (dailyCount === 0) continue

    // Get current live count from latest weekly record
    const lastWeekly = await kysely
      .selectFrom('agri_flock_weekly_records')
      .select(['live_count'])
      .where('flock_id', '=', flock.id)
      .where('tenant_id', '=', flock.tenant_id)
      .orderBy('week_number', 'desc')
      .limit(1)
      .executeTakeFirst()

    const basePop = Number((lastWeekly as any)?.live_count ?? flock.initial_count)
    if (basePop <= 0) continue

    const dailyPct   = (dailyCount / basePop) * 100
    const threshold  = Number(flock.mortality_threshold_pct ?? 0.20)

    if (dailyPct > threshold) {
      await emitLifecycle(
        eventsConfig,
        'agri_vet.mortality.alert_triggered',
        { tenantId: flock.tenant_id as string, organizationId: flock.organization_id as string },
        {
          flock_id:         flock.id,
          flock_number:     flock.flock_number,
          daily_count:      dailyCount,
          daily_pct:        Number(dailyPct.toFixed(3)),
          threshold_pct:    threshold,
          base_population:  basePop,
          date:             today,
        },
      )
      alertsTriggered++
    }
  }

  console.log(`[agri_vet.mortality-monitor] Checked ${(flocks as any[]).length} flocks — ${alertsTriggered} alert(s) triggered`)
  return { flocks_checked: (flocks as any[]).length, alerts_triggered: alertsTriggered }
}
