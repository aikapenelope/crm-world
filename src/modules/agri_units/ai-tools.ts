import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// agri.get_active_flocks
// Lotes activos con KPIs calculados en tiempo real (FCA, IEP, viabilidad)
// =============================================================================

const getActiveFlocks = defineAiTool({
  name: 'agri.get_active_flocks',
  description: 'Get all active production flocks with real-time KPIs: FCA, IEP, viability, days in cycle, and projected harvest weight.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({
    farm_unit_id: z.string().uuid().optional().describe('Filter by specific farm unit / house'),
    species: z.string().optional().describe('Filter by species (broiler, swine, etc.)'),
  }),
  async handler(args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('agri_flocks')
      .select(['id', 'flock_number', 'farm_unit_id', 'species', 'genetic_line',
               'start_date', 'initial_count', 'initial_avg_weight_g', 'mortality_threshold_pct',
               'planned_end_date', 'status'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)

    if (args.farm_unit_id) query = query.where('farm_unit_id', '=', args.farm_unit_id)
    if (args.species)      query = query.where('species', '=', args.species)

    const flocks = await query.orderBy('start_date', 'desc').limit(20).execute()
    const today  = new Date()

    const result = await Promise.all((flocks as any[]).map(async (flock: any) => {
      const lastRecord = await kysely
        .selectFrom('agri_flock_weekly_records')
        .selectAll()
        .where('flock_id', '=', flock.id)
        .where('tenant_id', '=', ctx.tenantId)
        .orderBy('week_number', 'desc')
        .limit(1)
        .executeTakeFirst()

      const startDate    = new Date(flock.start_date)
      const daysInCycle  = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      const r = lastRecord as any

      let fca: number | null = null
      let iep: number | null = null
      let viabilityPct: number | null = null

      if (r) {
        const liveCount     = Number(r.live_count)
        const avgWeightG    = Number(r.avg_body_weight_g)
        const cumFeedKg     = Number(r.cumulative_feed_kg)
        const initCount     = Number(flock.initial_count)
        const initWeightG   = Number(flock.initial_avg_weight_g ?? 0)

        viabilityPct = initCount > 0 ? (liveCount / initCount) * 100 : 0
        const weightGainedKg = ((avgWeightG / 1000) * liveCount) - ((initWeightG / 1000) * initCount)
        if (weightGainedKg > 0 && cumFeedKg > 0) fca = cumFeedKg / weightGainedKg
        if (fca && fca > 0 && daysInCycle > 0) {
          iep = (avgWeightG / 1000) * (viabilityPct / 100) / (fca * daysInCycle) * 100
        }
      }

      return {
        flock_number:      flock.flock_number,
        species:           flock.species,
        genetic_line:      flock.genetic_line,
        days_in_cycle:     daysInCycle,
        initial_count:     flock.initial_count,
        current_week:      r ? Number(r.week_number) : 0,
        fca:               fca != null ? Number(fca.toFixed(3)) : null,
        iep:               iep != null ? Number(iep.toFixed(1)) : null,
        viability_pct:     viabilityPct != null ? Number(viabilityPct.toFixed(2)) : null,
        avg_weight_g:      r ? Number(r.avg_body_weight_g) : null,
        planned_end_date:  flock.planned_end_date,
      }
    }))

    return { flocks: result, total: result.length }
  },
})

// =============================================================================
// agri.get_mortality_alerts
// Lotes con mortalidad que superó el umbral en los últimos 7 días
// =============================================================================

const getMortalityAlerts = defineAiTool({
  name: 'agri.get_mortality_alerts',
  description: 'Get flocks with abnormal mortality in the last 7 days — daily mortality exceeded the threshold.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoff = sevenDaysAgo.toISOString().split('T')[0]

    // Get active flocks with their mortality threshold
    const flocks = await kysely
      .selectFrom('agri_flocks')
      .select(['id', 'flock_number', 'initial_count', 'mortality_threshold_pct'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)
      .execute()

    const alerts = []
    for (const flock of flocks as any[]) {
      const records = await kysely
        .selectFrom('agri_flock_weekly_records')
        .select(['week_number', 'weekly_mortality', 'live_count', 'record_date'])
        .where('flock_id', '=', flock.id)
        .where('tenant_id', '=', ctx.tenantId)
        .where('record_date', '>=', cutoff)
        .execute()

      for (const rec of records as any[]) {
        const liveCountBefore = Number(rec.live_count) + Number(rec.weekly_mortality)
        const dailyMortalityPct = liveCountBefore > 0
          ? (Number(rec.weekly_mortality) / 7 / liveCountBefore) * 100
          : 0

        if (dailyMortalityPct > Number(flock.mortality_threshold_pct)) {
          alerts.push({
            flock_number:         flock.flock_number,
            week:                 rec.week_number,
            record_date:          rec.record_date,
            weekly_mortality:     rec.weekly_mortality,
            daily_mortality_pct:  Number(dailyMortalityPct.toFixed(3)),
            threshold_pct:        flock.mortality_threshold_pct,
          })
        }
      }
    }

    return { alerts, count: alerts.length, message: alerts.length > 0 ? `${alerts.length} semana(s) con mortalidad anormal en los últimos 7 días` : 'Sin alertas de mortalidad' }
  },
})

// =============================================================================
// agri.get_feed_cost_breakdown
// Costo de producción por kg vivo por lote (fuente: agri_feed si disponible)
// =============================================================================

const getFeedCostBreakdown = defineAiTool({
  name: 'agri.get_feed_cost_breakdown',
  description: 'Get production cost breakdown per kg live weight per active flock. Includes feed formulas cost when available.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({
    flock_id: z.string().uuid().optional().describe('Specific flock ID'),
  }),
  async handler(args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let flockQuery = kysely
      .selectFrom('agri_flocks')
      .select(['id', 'flock_number', 'species', 'initial_count', 'initial_avg_weight_g'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)

    if (args.flock_id) flockQuery = flockQuery.where('id', '=', args.flock_id)

    const flocks = await flockQuery.limit(10).execute()
    const result = []

    for (const flock of flocks as any[]) {
      const lastRec = await kysely
        .selectFrom('agri_flock_weekly_records')
        .select(['avg_body_weight_g', 'live_count', 'cumulative_feed_kg', 'week_number'])
        .where('flock_id', '=', flock.id)
        .where('tenant_id', '=', ctx.tenantId)
        .orderBy('week_number', 'desc')
        .limit(1)
        .executeTakeFirst()

      if (!lastRec) continue
      const r = lastRec as any

      const liveCount     = Number(r.live_count)
      const avgWeightG    = Number(r.avg_body_weight_g)
      const cumFeedKg     = Number(r.cumulative_feed_kg)
      const initCount     = Number(flock.initial_count)
      const initWeightG   = Number(flock.initial_avg_weight_g ?? 0)
      const weightGainedKg = ((avgWeightG / 1000) * liveCount) - ((initWeightG / 1000) * initCount)
      const fca = weightGainedKg > 0 ? cumFeedKg / weightGainedKg : null

      // Try to get average feed cost from agri_feed_formulas (Sprint B module)
      let avgFeedCostPerKg: number | null = null
      try {
        const formula = await kysely
          .selectFrom('agri_feed_formulas')
          .select(['cost_per_ton_usd'])
          .where('tenant_id', '=', ctx.tenantId)
          .where('is_active', '=', true)
          .executeTakeFirst()
        if (formula) avgFeedCostPerKg = Number((formula as any).cost_per_ton_usd) / 1000
      } catch {
        // agri_feed tables not yet initialized — feed cost unavailable
      }

      const feedCostPerKgLive = avgFeedCostPerKg && fca ? avgFeedCostPerKg * fca : null

      result.push({
        flock_number:            flock.flock_number,
        species:                 flock.species,
        week:                    r.week_number,
        cumulative_feed_kg:      cumFeedKg,
        weight_gained_kg:        Number(weightGainedKg.toFixed(2)),
        fca:                     fca != null ? Number(fca.toFixed(3)) : null,
        feed_cost_per_kg_usd:    feedCostPerKgLive != null ? Number(feedCostPerKgLive.toFixed(4)) : 'Requiere configurar fórmulas de alimento',
      })
    }

    return { flocks: result, total: result.length }
  },
})

// =============================================================================
// agri.get_vaccination_schedule
// Vacunas vencidas o próximas en los próximos 7 días (fuente: agri_vet)
// =============================================================================

const getVaccinationSchedule = defineAiTool({
  name: 'agri.get_vaccination_schedule',
  description: 'Get upcoming vaccinations (next 7 days) and overdue vaccinations across all active flocks.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const today       = new Date()
    const in7Days     = new Date()
    in7Days.setDate(in7Days.getDate() + 7)

    const todayStr   = today.toISOString().split('T')[0]
    const in7DaysStr = in7Days.toISOString().split('T')[0]

    try {
      const upcoming = await kysely
        .selectFrom('agri_vet_vaccination_records as vr')
        .innerJoin('agri_flocks as f', 'f.id', 'vr.flock_id')
        .select([
          'vr.id', 'vr.vaccine_name', 'vr.scheduled_date', 'vr.status',
          'f.flock_number', 'f.species',
        ])
        .where('vr.tenant_id', '=', ctx.tenantId)
        .where('vr.organization_id', '=', ctx.organizationId)
        .where('vr.status', '=', 'scheduled')
        .where('vr.scheduled_date', '<=', in7DaysStr)
        .orderBy('vr.scheduled_date', 'asc')
        .limit(20)
        .execute()

      const overdue = (upcoming as any[]).filter((v: any) => v.scheduled_date < todayStr)
      const dueNext = (upcoming as any[]).filter((v: any) => v.scheduled_date >= todayStr)

      return {
        overdue_count:    overdue.length,
        due_next_7_days:  dueNext.length,
        overdue,
        upcoming: dueNext,
        message: overdue.length > 0
          ? `⚠ ${overdue.length} vacunación(es) vencida(s) sin aplicar`
          : `${dueNext.length} vacunación(es) programadas en los próximos 7 días`,
      }
    } catch {
      return { message: 'Módulo agri_vet no inicializado aún — activa las vacunaciones en el módulo de Sanidad Veterinaria' }
    }
  },
})

// =============================================================================
// agri.get_cold_chain_status
// Cuartos fríos con temperatura fuera de rango (fuente: agri_cold_chain - Sprint B)
// =============================================================================

const getColdChainStatus = defineAiTool({
  name: 'agri.get_cold_chain_status',
  description: 'Get cold storage units with temperature out of range in the last hour. Requires Sprint B (agri_cold_chain) to be active.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    try {
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const excursions = await kysely
        .selectFrom('agri_temperature_logs as tl')
        .innerJoin('agri_cold_storage_units as cu', 'cu.id', 'tl.cold_storage_unit_id')
        .select([
          'cu.name', 'cu.target_temp_min', 'cu.target_temp_max',
          'tl.recorded_at', 'tl.temperature_c',
        ])
        .where('tl.tenant_id', '=', ctx.tenantId)
        .where('tl.recorded_at', '>=', oneHourAgo.toISOString())
        .where('tl.is_excursion', '=', true)
        .orderBy('tl.recorded_at', 'desc')
        .limit(10)
        .execute()

      return {
        excursions_last_hour: (excursions as any[]).length,
        excursions,
        message: (excursions as any[]).length > 0
          ? `🚨 ${(excursions as any[]).length} excursión(es) de temperatura en la última hora`
          : 'Cadena de frío OK — sin excursiones en la última hora',
      }
    } catch {
      return { message: 'Módulo agri_cold_chain no inicializado aún (Sprint B). Actívalo para monitorear la cadena de frío.' }
    }
  },
})

// =============================================================================
// agri.get_recall_risk
// Lotes con períodos de retiro activos — riesgo de despachar antes de tiempo
// =============================================================================

const getRecallRisk = defineAiTool({
  name: 'agri.get_recall_risk',
  description: 'Get active flocks that have medication withdrawal periods still active — cannot be dispatched to slaughter yet.',
  isMutation: false,
  requiredFeatures: ['agri_units.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const today = new Date().toISOString().split('T')[0]

    try {
      const atRisk = await kysely
        .selectFrom('agri_vet_medication_records as mr')
        .innerJoin('agri_flocks as f', 'f.id', 'mr.flock_id')
        .select([
          'f.flock_number', 'f.species', 'f.planned_end_date',
          'mr.medication_name', 'mr.withdrawal_end_date', 'mr.diagnosis',
        ])
        .where('mr.tenant_id', '=', ctx.tenantId)
        .where('mr.organization_id', '=', ctx.organizationId)
        .where('f.status', '=', 'active')
        .where('mr.withdrawal_end_date', '>=', today)
        .orderBy('mr.withdrawal_end_date', 'asc')
        .execute()

      return {
        at_risk_flocks: (atRisk as any[]).length,
        records: atRisk,
        message: (atRisk as any[]).length > 0
          ? `⚠ ${(atRisk as any[]).length} lote(s) con período de retiro activo — NO pueden ir a beneficio aún`
          : 'Sin lotes con períodos de retiro activos',
      }
    } catch {
      return { message: 'Módulo agri_vet no inicializado aún — registra los tratamientos en Sanidad Veterinaria.' }
    }
  },
})

// =============================================================================
// Export
// =============================================================================

export const aiTools = [
  getActiveFlocks,
  getMortalityAlerts,
  getFeedCostBreakdown,
  getVaccinationSchedule,
  getColdChainStatus,
  getRecallRisk,
]

export default aiTools
