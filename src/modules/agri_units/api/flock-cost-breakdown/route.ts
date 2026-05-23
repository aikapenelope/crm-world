/**
 * GET /api/agri-units/flock-cost-breakdown?flock_id=<uuid>
 *
 * Calculates the production cost breakdown for a flock in real time.
 *
 * Cost components:
 *   1. Feed cost — cumulative feed consumed × cost of feed batches allocated
 *      (from agri_feed_allocations → agri_feed_batches.cost_per_ton_usd)
 *      Fallback: formula cost if batch cost is not set.
 *   2. Input costs — medications/vaccines applied to this flock
 *      (from agri_input_movements with reference_type = 'vaccination_record' or 'medication_record')
 *   3. Total cost per kg live = total_cost / (live_count × avg_weight_kg)
 *
 * Returns USD and VES values (if BCV rate is available).
 */

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_units.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url      = new URL(request.url)
  const flockId  = url.searchParams.get('flock_id')

  if (!flockId) return Response.json({ error: 'flock_id is required' }, { status: 400 })

  // ── Flock + latest weekly record ──────────────────────────────────────────
  const flock = await kysely
    .selectFrom('agri_flocks')
    .select(['id', 'initial_count', 'initial_avg_weight_g', 'species'])
    .where('id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!flock) return Response.json({ error: 'Flock not found' }, { status: 404 })

  const latestRecord = await kysely
    .selectFrom('agri_flock_weekly_records')
    .select(['live_count', 'avg_body_weight_g', 'cumulative_feed_kg', 'week_number'])
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('week_number', 'desc')
    .limit(1)
    .executeTakeFirst()

  const f  = flock as any
  const lr = latestRecord as any

  const liveBiomassKg = lr
    ? (Number(lr.live_count) * Number(lr.avg_body_weight_g)) / 1000
    : 0
  const cumFeedKg = lr ? Number(lr.cumulative_feed_kg) : 0

  // ── 1. Feed cost via allocations ───────────────────────────────────────────
  const allocations = await kysely
    .selectFrom('agri_feed_allocations')
    .select(['feed_batch_id', 'quantity_kg'])
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  let feedCostUsd = 0
  const feedDetails: any[] = []

  for (const alloc of allocations as any[]) {
    const batch = await kysely
      .selectFrom('agri_feed_batches')
      .select(['batch_number', 'formula_id', 'cost_per_ton_usd'])
      .where('id', '=', (alloc as any).feed_batch_id)
      .where('tenant_id', '=', scope.tenantId)
      .executeTakeFirst()

    if (!batch) continue

    const b = batch as any
    let costPerTon = Number(b.cost_per_ton_usd ?? 0)

    // Fallback to formula cost if batch cost not set
    if (costPerTon <= 0 && b.formula_id) {
      const formula = await kysely
        .selectFrom('agri_feed_formulas')
        .select(['cost_per_ton_usd', 'name'])
        .where('id', '=', b.formula_id)
        .where('tenant_id', '=', scope.tenantId)
        .executeTakeFirst()
      if (formula) costPerTon = Number((formula as any).cost_per_ton_usd ?? 0)
    }

    const qtyKg    = Number((alloc as any).quantity_kg)
    const batchCost = (qtyKg / 1000) * costPerTon
    feedCostUsd   += batchCost

    feedDetails.push({
      batch_number:   b.batch_number,
      quantity_kg:    qtyKg,
      cost_per_ton:   costPerTon.toFixed(2),
      batch_cost_usd: batchCost.toFixed(2),
    })
  }

  // If no allocations, estimate from cumulative feed and latest formula cost
  if (allocations.length === 0 && cumFeedKg > 0) {
    const latestFormula = await kysely
      .selectFrom('agri_feed_formulas')
      .select(['cost_per_ton_usd', 'name'])
      .where('tenant_id', '=', scope.tenantId)
      .where('species', 'in', [f.species, 'all'])
      .where('is_active', '=', true)
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst()

    if (latestFormula) {
      const lf = latestFormula as any
      feedCostUsd = (cumFeedKg / 1000) * Number(lf.cost_per_ton_usd ?? 0)
      feedDetails.push({
        batch_number:   'Estimado (sin asignaciones)',
        quantity_kg:    cumFeedKg,
        cost_per_ton:   Number(lf.cost_per_ton_usd ?? 0).toFixed(2),
        batch_cost_usd: feedCostUsd.toFixed(2),
      })
    }
  }

  // ── 2. Input costs (medications + vaccines applied) ────────────────────────
  // Look at input movements linked to vet records for this flock
  const vetRecordIds: string[] = []

  const vaccRecords = await kysely
    .selectFrom('agri_vet_vaccination_records')
    .select(['id'])
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'applied')
    .execute()
  vaccRecords.forEach((r: any) => vetRecordIds.push(r.id))

  const medRecords = await kysely
    .selectFrom('agri_vet_medication_records')
    .select(['id'])
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .execute()
  medRecords.forEach((r: any) => vetRecordIds.push(r.id))

  let inputCostUsd = 0
  const inputDetails: any[] = []

  if (vetRecordIds.length > 0) {
    const movements = await kysely
      .selectFrom('agri_input_movements as m')
      .innerJoin('agri_input_items as i', 'i.id', 'm.input_item_id')
      .select(['i.name', 'm.quantity', 'm.unit_cost_usd'])
      .where('m.tenant_id', '=', scope.tenantId)
      .where('m.reference_type', 'in', ['vaccination_record', 'medication_record'])
      .where('m.reference_id', 'in', vetRecordIds)
      .execute()

    for (const mov of movements as any[]) {
      const qty  = Math.abs(Number(mov.quantity))
      const cost = Number(mov.unit_cost_usd ?? 0) * qty
      inputCostUsd += cost
      if (cost > 0) {
        inputDetails.push({
          item_name:    mov.name,
          quantity:     qty,
          unit_cost:    Number(mov.unit_cost_usd ?? 0).toFixed(4),
          total_cost:   cost.toFixed(2),
        })
      }
    }
  }

  // ── 3. Totals ──────────────────────────────────────────────────────────────
  const totalCostUsd     = feedCostUsd + inputCostUsd
  const costPerKgLiveUsd = liveBiomassKg > 0 ? totalCostUsd / liveBiomassKg : null

  // Current BCV rate for VES equivalent
  const rateRow = await kysely
    .selectFrom('venezuela_rates')
    .select(['bcv_rate'])
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst()
  const bcvRate = Number((rateRow as any)?.bcv_rate ?? 0)

  return Response.json({
    flock_id:         flockId,
    cumulative_feed_kg: cumFeedKg,
    live_biomass_kg:  liveBiomassKg.toFixed(2),
    breakdown: {
      feed: {
        cost_usd:   feedCostUsd.toFixed(2),
        pct_total:  totalCostUsd > 0 ? ((feedCostUsd / totalCostUsd) * 100).toFixed(1) : '—',
        details:    feedDetails,
      },
      inputs: {
        cost_usd:   inputCostUsd.toFixed(2),
        pct_total:  totalCostUsd > 0 ? ((inputCostUsd / totalCostUsd) * 100).toFixed(1) : '—',
        details:    inputDetails,
      },
    },
    total_cost_usd:       totalCostUsd.toFixed(2),
    cost_per_kg_live_usd: costPerKgLiveUsd != null ? costPerKgLiveUsd.toFixed(4) : null,
    cost_per_kg_live_ves: costPerKgLiveUsd != null && bcvRate > 0
      ? (costPerKgLiveUsd * bcvRate).toFixed(2)
      : null,
    bcv_rate: bcvRate > 0 ? bcvRate : null,
  })
}

export const openApi = {}
