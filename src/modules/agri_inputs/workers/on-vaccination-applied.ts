/**
 * agri_inputs — On Vaccination Applied Subscriber
 *
 * Triggered by: agri_vet.vaccination.applied
 *
 * When a vaccination record is marked as applied, this subscriber looks up
 * the matching vaccine in agri_input_items by vaccine_name (case-insensitive,
 * partial match) and deducts the consumed quantity from inventory.
 *
 * Name matching is approximate because VaccinationRecord.vaccine_name and
 * InputItem.name can vary in wording. The first match wins. If no match is
 * found, a warning is logged but no error is thrown — the vet workflow is
 * never blocked by inventory issues.
 *
 * Movement created: type = 'consumption', reference_type = 'vaccination_record'
 *
 * Cross-module: reads agri_vet_vaccination_records, agri_input_items,
 * agri_input_movements via Kysely.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'
import { v4 } from 'uuid'

export const metadata = {
  event: 'agri_vet.vaccination.applied',
  persistent: true,
  id: 'agri_inputs.on-vaccination-applied',
}

export default async function handler(payload: any, ctx: any) {
  const em     = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const tenantId       = payload.tenantId
  const organizationId = payload.organizationId

  if (!tenantId) return { skipped: true }

  // The payload from the interceptor may not include the record details.
  // We need to find the most recently applied vaccination records (last 5 min).
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const recentVaccinations = await kysely
    .selectFrom('agri_vet_vaccination_records')
    .select(['id', 'vaccine_name', 'birds_treated', 'dose_applied', 'dose_unit', 'flock_id'])
    .where('tenant_id', '=', tenantId)
    .where('status', '=', 'applied')
    .where('updated_at', '>=', fiveMinAgo)
    .execute()

  if ((recentVaccinations as any[]).length === 0) {
    // Payload might include record details directly
    const vaccineName = payload.vaccine_name
    if (!vaccineName) return { skipped: true, reason: 'no_recent_vaccinations' }
  }

  let deducted = 0

  for (const vax of recentVaccinations as any[]) {
    const vaccineName  = (vax as any).vaccine_name as string
    const birdsTreated = Number((vax as any).birds_treated ?? 0)
    const doseApplied  = Number((vax as any).dose_applied ?? 1)

    // Find matching item in inventory (case-insensitive partial match)
    const item = await kysely
      .selectFrom('agri_input_items')
      .select(['id', 'name', 'quantity_available', 'min_stock', 'unit'])
      .where('tenant_id', '=', tenantId)
      .where('organization_id', '=', organizationId)
      .where('input_type', '=', 'vaccine')
      .where('name', 'ilike', `%${vaccineName.slice(0, 20)}%`)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!item) {
      console.log(`[agri_inputs.on-vaccination-applied] No inventory item found for vaccine "${vaccineName}"`)
      continue
    }

    const it = item as any
    // Calculate quantity consumed: if unit is 'doses', qty = birds_treated × dose_per_bird
    // If unit is 'ml' or similar, qty = dose_applied × birds_treated
    const qtyConsumed = (it.unit === 'doses' || !it.unit)
      ? birdsTreated > 0 ? birdsTreated * doseApplied : 1
      : birdsTreated > 0 ? birdsTreated * doseApplied : doseApplied

    const currentQty = Number(it.quantity_available)
    const newQty     = Math.max(0, currentQty - qtyConsumed)

    // Record the movement
    await kysely.insertInto('agri_input_movements').values({
      id:              v4(),
      tenant_id:       tenantId,
      organization_id: organizationId,
      input_item_id:   it.id,
      movement_type:   'consumption',
      quantity:        String(-qtyConsumed),
      reference_type:  'vaccination_record',
      reference_id:    (vax as any).id,
      notes:           `Auto-deducción: vacuna ${vaccineName} en flock ${(vax as any).flock_id}`,
      created_at:      new Date().toISOString(),
    } as any).execute()

    // Update stock
    await kysely.updateTable('agri_input_items')
      .set({ quantity_available: newQty.toFixed(3), updated_at: new Date() })
      .where('id', '=', it.id)
      .execute()

    // Check min stock
    const minStock = Number(it.min_stock ?? 0)
    if (newQty <= minStock) {
      await emitLifecycle(eventsConfig, 'agri_inputs.item.stock_low',
        { tenantId, organizationId },
        { item_id: it.id, item_name: it.name, quantity_available: newQty, min_stock: minStock },
      )
    }

    deducted++
    console.log(
      `[agri_inputs.on-vaccination-applied] Deducted ${qtyConsumed} ${it.unit} of ${it.name}` +
      ` (stock: ${currentQty.toFixed(1)} → ${newQty.toFixed(1)})`,
    )
  }

  return { processed: (recentVaccinations as any[]).length, deducted }
}
