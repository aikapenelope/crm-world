/**
 * Maintenance Reminder Worker.
 *
 * Checks vehicles that haven't had service in X months or X km
 * and generates reminders (for WhatsApp notification).
 *
 * Logic:
 * 1. Find vehicles with last service order > 6 months ago
 * 2. Or vehicles where current_km - km_at_last_service > 10,000
 * 3. Generate reminder data for each
 */

export const metadata = {
  queue: 'auto_vehicles.maintenance-reminder',
  id: 'auto_vehicles.maintenance-reminder',
  concurrency: 1,
}

const MONTHS_THRESHOLD = 6
const KM_THRESHOLD = 10000

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.resolve('em')
  const kysely = (em as any).getKysely()

  const now = new Date()
  const thresholdDate = new Date(now)
  thresholdDate.setMonth(thresholdDate.getMonth() - MONTHS_THRESHOLD)

  // Get all tenants with vehicles
  const tenants = await kysely
    .selectFrom('auto_vehicles')
    .select(['tenant_id', 'organization_id'])
    .where('deleted_at', 'is', null)
    .where('is_active', '=', true)
    .groupBy(['tenant_id', 'organization_id'])
    .execute()

  let totalReminders = 0

  for (const tenant of tenants as any[]) {
    // Get vehicles
    const vehicles = await kysely
      .selectFrom('auto_vehicles')
      .selectAll()
      .where('tenant_id', '=', tenant.tenant_id)
      .where('organization_id', '=', tenant.organization_id)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    for (const vehicle of vehicles as any[]) {
      // Get last completed service order
      const lastOrder = await kysely
        .selectFrom('auto_service_orders')
        .select(['received_at', 'km_at_entry', 'status'])
        .where('vehicle_id', '=', vehicle.id)
        .where('status', '=', 'delivered')
        .where('deleted_at', 'is', null)
        .orderBy('received_at', 'desc')
        .executeTakeFirst()

      if (!lastOrder) continue

      const lastServiceDate = new Date((lastOrder as any).received_at)
      const lastServiceKm = (lastOrder as any).km_at_entry ?? 0
      const currentKm = vehicle.current_km ?? 0

      const monthsSinceService = Math.floor((now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const kmSinceService = currentKm - lastServiceKm

      const needsReminder = monthsSinceService >= MONTHS_THRESHOLD || kmSinceService >= KM_THRESHOLD

      if (needsReminder) {
        totalReminders++
        // In production, this would create a notification or queue a WhatsApp message
        console.log(`[maintenance-reminder] ${vehicle.plate}: ${monthsSinceService} months / ${kmSinceService} km since last service`)
      }
    }
  }

  console.log(`[auto_vehicles.maintenance-reminder] Found ${totalReminders} vehicles needing service`)
  return { reminders: totalReminders }
}
