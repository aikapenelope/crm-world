/**
 * GET /api/agri-portal/producer-dashboard
 *
 * Returns the producer's active flock data and KPIs.
 * Authenticated via portal customer auth — producer_id = customerEntityId.
 *
 * The producer's customer record is linked to a FarmUnit via
 * agri_farm_units.owner_producer_id = customerEntityId.
 * From the FarmUnit we find the active Flock and its latest weekly record.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['agri_portal.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em          = ctx.container.resolve('em')
  const scope       = ctx.scope
  const kysely      = (em as any).getKysely()
  const producerId  = ctx.customerContext?.customerEntityId

  if (!producerId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find farm units owned by this producer
  const farmUnits = await kysely
    .selectFrom('agri_farm_units')
    .select(['id', 'name', 'unit_type', 'location_address'])
    .where('owner_producer_id', '=', producerId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .execute()

  const farmUnitIds = (farmUnits as any[]).map((u: any) => u.id)

  if (farmUnitIds.length === 0) {
    return Response.json({ has_active_cycle: false, farm_units: [] })
  }

  // Find active flocks in those farm units
  const activeFlocks = await kysely
    .selectFrom('agri_flocks')
    .selectAll()
    .where('farm_unit_id', 'in', farmUnitIds)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .orderBy('start_date', 'desc')
    .execute()

  const flock = (activeFlocks as any[])[0] ?? null

  if (!flock) {
    return Response.json({
      has_active_cycle: false,
      farm_units: farmUnits,
    })
  }

  // Get latest weekly record
  const latestRecord = await kysely
    .selectFrom('agri_flock_weekly_records')
    .selectAll()
    .where('flock_id', '=', flock.id)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('week_number', 'desc')
    .limit(1)
    .executeTakeFirst()

  const today       = new Date()
  const startDate   = new Date(flock.start_date)
  const daysInCycle = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const r = latestRecord as any

  // Calculate KPIs from latest record
  let fca: number | null = null
  let iep: number | null = null
  let viabilityPct: number | null = null

  if (r) {
    const initCount  = Number(flock.initial_count)
    const initWtG    = Number(flock.initial_avg_weight_g ?? 0)
    const liveCount  = Number(r.live_count)
    const avgWtG     = Number(r.avg_body_weight_g)
    const cumFeedKg  = Number(r.cumulative_feed_kg)

    viabilityPct = initCount > 0 ? (liveCount / initCount) * 100 : 0
    const weightGainedKg = ((avgWtG / 1000) * liveCount) - ((initWtG / 1000) * initCount)
    if (weightGainedKg > 0 && cumFeedKg > 0) fca = cumFeedKg / weightGainedKg
    if (fca && fca > 0 && daysInCycle > 0) {
      iep = (avgWtG / 1000) * (viabilityPct / 100) / (fca * daysInCycle) * 100
    }
  }

  // Project weight at day 42
  let projectedWeight42: number | null = null
  if (r && daysInCycle > 0) {
    const initWtG = Number(flock.initial_avg_weight_g ?? 0)
    const dailyGain = (Number(r.avg_body_weight_g) - initWtG) / daysInCycle
    const daysRemaining = Math.max(0, 42 - daysInCycle)
    projectedWeight42 = (Number(r.avg_body_weight_g) + dailyGain * daysRemaining) / 1000
  }

  const farmUnit = (farmUnits as any[]).find((u: any) => u.id === flock.farm_unit_id)

  return Response.json({
    has_active_cycle:  true,
    flock: {
      id:              flock.id,
      flock_number:    flock.flock_number,
      species:         flock.species,
      genetic_line:    flock.genetic_line,
      start_date:      flock.start_date,
      initial_count:   flock.initial_count,
      planned_end_date: flock.planned_end_date,
    },
    farm_unit:    farmUnit ?? null,
    days_in_cycle: daysInCycle,
    kpis: {
      fca:                 fca != null ? Number(fca.toFixed(3)) : null,
      iep:                 iep != null ? Number(iep.toFixed(1)) : null,
      viability_pct:       viabilityPct != null ? Number(viabilityPct.toFixed(2)) : null,
      live_count:          r ? Number(r.live_count) : flock.initial_count,
      avg_body_weight_g:   r ? Number(r.avg_body_weight_g) : null,
      cumulative_feed_kg:  r ? Number(r.cumulative_feed_kg) : null,
      projected_weight_kg: projectedWeight42 != null ? Number(projectedWeight42.toFixed(3)) : null,
      week_number:         r ? Number(r.week_number) : 0,
    },
  })
}

export const openApi = {}
