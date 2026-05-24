/**
 * agri_inputs — On Medication Prescribed Subscriber
 *
 * Triggered by: agri_vet.medication.prescribed
 *
 * When a medication treatment is prescribed, this subscriber deducts
 * the medication from agri_input_items inventory.
 *
 * Same approximate name-matching logic as on-vaccination-applied.ts.
 * Movement type = 'consumption', reference_type = 'medication_record'.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'
import { v4 } from 'uuid'

export const metadata = {
  event: 'agri_vet.medication.prescribed',
  persistent: true,
  id: 'agri_inputs.on-medication-prescribed',
}

export default async function handler(payload: any, ctx: any) {
  const em     = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const tenantId       = payload.tenantId
  const organizationId = payload.organizationId

  if (!tenantId) return { skipped: true }

  // Find recently prescribed medications (last 5 min)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const recentMeds = await kysely
    .selectFrom('agri_vet_medication_records')
    .select(['id', 'medication_name', 'flock_id', 'treatment_duration_days'])
    .where('tenant_id', '=', tenantId)
    .where('created_at', '>=', fiveMinAgo)
    .execute()

  if ((recentMeds as any[]).length === 0) return { skipped: true, reason: 'no_recent_prescriptions' }

  let deducted = 0

  for (const med of recentMeds as any[]) {
    const medName         = (med as any).medication_name as string
    const treatmentDays   = Number((med as any).treatment_duration_days ?? 1)

    // Find matching item in inventory
    const item = await kysely
      .selectFrom('agri_input_items')
      .select(['id', 'name', 'quantity_available', 'min_stock', 'unit'])
      .where('tenant_id', '=', tenantId)
      .where('organization_id', '=', organizationId)
      .where('input_type', '=', 'medication')
      .where('name', 'ilike', `%${medName.slice(0, 20)}%`)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!item) {
      console.log(`[agri_inputs.on-medication-prescribed] No inventory item for medication "${medName}"`)
      continue
    }

    const it = item as any
    // Rough quantity: 1 unit per day of treatment (ml, doses, etc.)
    const qtyConsumed = treatmentDays

    const currentQty = Number(it.quantity_available)
    const newQty     = Math.max(0, currentQty - qtyConsumed)

    await kysely.insertInto('agri_input_movements').values({
      id:              v4(),
      tenant_id:       tenantId,
      organization_id: organizationId,
      input_item_id:   it.id,
      movement_type:   'consumption',
      quantity:        String(-qtyConsumed),
      reference_type:  'medication_record',
      reference_id:    (med as any).id,
      notes:           `Auto-deducción: tratamiento ${medName}, ${treatmentDays} días`,
      created_at:      new Date().toISOString(),
    } as any).execute()

    await kysely.updateTable('agri_input_items')
      .set({ quantity_available: newQty.toFixed(3), updated_at: new Date() })
      .where('id', '=', it.id)
      .execute()

    const minStock = Number(it.min_stock ?? 0)
    if (newQty <= minStock) {
      await emitLifecycle(eventsConfig, 'agri_inputs.item.stock_low',
        { tenantId, organizationId },
        { item_id: it.id, item_name: it.name, quantity_available: newQty, min_stock: minStock },
      )
    }

    deducted++
    console.log(`[agri_inputs.on-medication-prescribed] Deducted ${qtyConsumed} ${it.unit} of ${it.name}`)
  }

  return { processed: (recentMeds as any[]).length, deducted }
}
