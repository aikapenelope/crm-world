/**
 * agri_hr — On Flock Completed Subscriber
 *
 * Triggered by: agri_units.flock.completed
 *
 * When a flock finishes production, this subscriber checks if the farm unit
 * is managed by an integrated producer (ownership_type = 'integrated'). If so,
 * it automatically creates a ProducerSettlement pre-filled with the real KPIs
 * from the cycle (FCA, avg_weight, mortality).
 *
 * The settlement is created with status = 'calculated', ready for the
 * field technician to review and submit for manager approval (workflow).
 *
 * Note: target_fca, target_weight_kg, and price_per_kg_usd are read from
 * the FarmUnit notes field as JSON if present (e.g., '{"target_fca":2.0,"price_per_kg":0.85}'),
 * otherwise sensible defaults are used. A proper contract entity will be
 * added in a future sprint.
 *
 * Cross-module: reads agri_flocks, agri_farm_units, agri_flock_weekly_records
 * via Kysely — never imports foreign entities directly.
 */
import { AgriProducerSettlementEntity } from '../data/entities'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  event: 'agri_units.flock.completed',
  persistent: true,
  id: 'agri_hr.on-flock-completed',
}

export default async function handler(payload: any, ctx: any) {
  const em     = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const flockId = payload?.flock_id ?? payload?.id
  if (!flockId) {
    console.log('[agri_hr.on-flock-completed] No flock_id in payload — skipping')
    return { skipped: true }
  }

  const tenantId      = payload.tenantId
  const organizationId = payload.organizationId

  // Load the completed flock
  const flock = await kysely
    .selectFrom('agri_flocks')
    .selectAll()
    .where('id', '=', flockId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst()

  if (!flock) {
    console.log(`[agri_hr.on-flock-completed] Flock ${flockId} not found`)
    return { skipped: true }
  }

  const f = flock as any

  // Load the farm unit to check if it belongs to an integrated producer
  const farmUnit = f.farm_unit_id ? await kysely
    .selectFrom('agri_farm_units')
    .select(['id', 'name', 'ownership_type', 'owner_producer_id', 'notes'])
    .where('id', '=', f.farm_unit_id)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirst() : null

  if (!farmUnit || (farmUnit as any).ownership_type !== 'integrated') {
    console.log(`[agri_hr.on-flock-completed] Farm unit is not integrated — no settlement needed`)
    return { skipped: true, reason: 'not_integrated' }
  }

  const fu = farmUnit as any
  if (!fu.owner_producer_id) {
    console.log(`[agri_hr.on-flock-completed] Integrated farm unit has no owner_producer_id — skipping`)
    return { skipped: true, reason: 'no_producer_id' }
  }

  // Get the latest weekly record for actual KPIs
  const lastWeekly = await kysely
    .selectFrom('agri_flock_weekly_records')
    .selectAll()
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', tenantId)
    .orderBy('week_number', 'desc')
    .limit(1)
    .executeTakeFirst()

  const lw = lastWeekly as any

  if (!lw) {
    console.log(`[agri_hr.on-flock-completed] No weekly records found for flock ${flockId} — cannot calculate settlement`)
    return { skipped: true, reason: 'no_weekly_records' }
  }

  // Extract actual cycle metrics
  const initialCount     = Number(f.initial_count)
  const finalBirds       = Number(lw.live_count ?? 0)
  const actualFca        = lw.fca_accumulated ? Number(lw.fca_accumulated) : null
  const actualAvgWeightG = Number(lw.avg_body_weight_g ?? 0)
  const actualAvgWeightKg = actualAvgWeightG / 1000
  const actualMortalityPct = initialCount > 0
    ? ((initialCount - finalBirds) / initialCount) * 100
    : 0

  // Try to parse contract terms from farm unit notes JSON
  // Expected format: {"target_fca": 2.0, "target_weight_kg": 2.2, "price_per_kg_usd": 0.85}
  let contractTerms: Record<string, number> = {}
  try {
    if (fu.notes && fu.notes.trim().startsWith('{')) {
      contractTerms = JSON.parse(fu.notes)
    }
  } catch {
    // notes is plain text, use defaults
  }

  const targetFca        = contractTerms.target_fca ?? 2.0
  const targetWeightKg   = contractTerms.target_weight_kg ?? 2.2
  const pricePerKgUsd    = contractTerms.price_per_kg_usd ?? 0.85  // USD/kg live weight — typical Venezuela 2025

  // Calculate base payment: final_birds × avg_weight_kg × price_per_kg
  const basePayment = finalBirds * actualAvgWeightKg * pricePerKgUsd

  // FCA bonus/penalty (±5% of base for each 0.05 FCA deviation from target)
  let fcaBonus  = 0
  let fcaPenalty = 0
  if (actualFca != null) {
    const fcaDiff = targetFca - actualFca
    if (fcaDiff > 0) {
      // Better FCA (lower) → bonus: 5% of base per 0.05 improvement
      fcaBonus = basePayment * (fcaDiff / 0.05) * 0.05
    } else if (fcaDiff < -0.1) {
      // Worse FCA (significantly higher) → penalty
      fcaPenalty = basePayment * (Math.abs(fcaDiff) / 0.05) * 0.03
    }
  }

  // Weight bonus: 3% of base per 100g above target
  let weightBonus = 0
  if (actualAvgWeightKg > targetWeightKg) {
    const weightDiffG = (actualAvgWeightKg - targetWeightKg) * 1000
    weightBonus = basePayment * (weightDiffG / 100) * 0.03
  }

  const totalPayment = basePayment + fcaBonus + weightBonus - fcaPenalty

  const cycleStartDate = new Date(f.start_date)
  const cycleEndDate   = f.actual_end_date ? new Date(f.actual_end_date) : new Date()

  // Create the settlement
  const settlement = em.create(AgriProducerSettlementEntity, {
    tenant_id:             tenantId,
    organization_id:       organizationId,
    producer_id:           fu.owner_producer_id,
    farm_unit_id:          f.farm_unit_id,
    flock_id:              flockId,
    cycle_start_date:      cycleStartDate,
    cycle_end_date:        cycleEndDate,
    initial_birds:         initialCount,
    final_birds:           finalBirds,
    actual_fca:            actualFca != null ? actualFca.toFixed(3) : '2.000',
    actual_avg_weight_kg:  actualAvgWeightKg.toFixed(3),
    actual_mortality_pct:  actualMortalityPct.toFixed(2),
    target_fca:            targetFca.toFixed(3),
    target_weight_kg:      targetWeightKg.toFixed(3),
    price_per_kg_usd:      pricePerKgUsd.toFixed(4),
    base_payment_usd:      basePayment.toFixed(2),
    fca_bonus_usd:         fcaBonus.toFixed(2),
    weight_bonus_usd:      weightBonus.toFixed(2),
    fca_penalty_usd:       fcaPenalty.toFixed(2),
    total_payment_usd:     totalPayment.toFixed(2),
    status:                'calculated',
    notes:                 'Liquidación generada automáticamente al completar el ciclo. Revisar y ajustar antes de aprobar.',
  } as any)

  em.persist(settlement)
  await em.flush()

  await emitLifecycle(eventsConfig, 'agri_hr.settlement.calculated', { tenantId, organizationId }, {
    settlement_id:   settlement.id,
    flock_id:        flockId,
    farm_unit_name:  fu.name,
    producer_id:     fu.owner_producer_id,
    total_payment:   totalPayment.toFixed(2),
    actual_fca:      actualFca?.toFixed(3) ?? '—',
  })

  console.log(
    `[agri_hr.on-flock-completed] Settlement created for flock ${flockId}` +
    ` — producer ${fu.owner_producer_id}, total USD ${totalPayment.toFixed(2)}`,
  )

  return { created: true, settlement_id: settlement.id, total_payment_usd: totalPayment.toFixed(2) }
}
