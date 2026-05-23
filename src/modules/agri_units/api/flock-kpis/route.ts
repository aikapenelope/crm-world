/**
 * Endpoint: GET /api/agri-units/flock-kpis?flock_id=<uuid>
 *
 * Calcula los KPIs productivos en tiempo real para un lote:
 * - FCA (Factor de Conversión Alimenticia): kg alimento / kg peso ganado
 * - IEP (Índice Europeo de Producción): referencia venezolana para pollo engorde
 * - Viabilidad (%): aves vivas / aves iniciales × 100
 * - Días en ciclo: fecha hoy - fecha de entrada
 * - Proyección de peso al día 42 (ciclo estándar Ross/Cobb)
 *
 * Fórmulas:
 *   FCA = alimento_acumulado_kg / peso_ganado_kg
 *   peso_ganado_kg = (peso_promedio_g / 1000 × aves_vivas) - (peso_inicial_g / 1000 × aves_iniciales)
 *   IEP = (peso_promedio_kg × viabilidad) / (FCA × edad_días) × 100
 *
 * Estos cálculos se basan en el ÚLTIMO FlockWeeklyRecord disponible.
 */

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_units.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em    = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const url      = new URL(request.url)
  const flock_id = url.searchParams.get('flock_id')

  if (!flock_id) {
    return Response.json({ error: 'flock_id is required' }, { status: 400 })
  }

  // Cargar el flock
  const flock = await kysely
    .selectFrom('agri_flocks')
    .selectAll()
    .where('id', '=', flock_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!flock) {
    return Response.json({ error: 'Flock not found' }, { status: 404 })
  }

  // Obtener el último registro semanal
  const latestRecord = await kysely
    .selectFrom('agri_flock_weekly_records')
    .selectAll()
    .where('flock_id', '=', flock_id)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('week_number', 'desc')
    .executeTakeFirst()

  const f = flock as any
  const r = latestRecord as any

  // Calcular días en ciclo
  const startDate   = new Date(f.start_date)
  const today       = new Date()
  const daysInCycle = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (!r) {
    // Sin registros semanales aún
    return Response.json({
      flock_id,
      days_in_cycle:       daysInCycle,
      has_weekly_records:  false,
      fca:                 null,
      iep:                 null,
      viability_pct:       null,
      live_count:          f.initial_count,
      avg_body_weight_g:   f.initial_avg_weight_g ?? null,
      cumulative_feed_kg:  null,
      projected_weight_kg: null,
      week_number:         0,
    })
  }

  const initialCount    = Number(f.initial_count)
  const initialWeightG  = Number(f.initial_avg_weight_g ?? 0)
  const liveCount       = Number(r.live_count)
  const avgWeightG      = Number(r.avg_body_weight_g)
  const cumFeedKg       = Number(r.cumulative_feed_kg)

  // Viabilidad
  const viabilityPct = initialCount > 0 ? (liveCount / initialCount) * 100 : 0

  // Peso ganado total (kg)
  const currentBiomasseKg = (avgWeightG / 1000) * liveCount
  const initialBiomasseKg = (initialWeightG / 1000) * initialCount
  const weightGainedKg    = currentBiomasseKg - initialBiomasseKg

  // FCA acumulado
  let fca: number | null = null
  if (weightGainedKg > 0 && cumFeedKg > 0) {
    fca = cumFeedKg / weightGainedKg
  }

  // IEP (Índice Europeo de Producción)
  let iep: number | null = null
  if (fca && fca > 0 && daysInCycle > 0) {
    const pesoPromedioKg = avgWeightG / 1000
    iep = (pesoPromedioKg * (viabilityPct / 100)) / (fca * daysInCycle) * 100
  }

  // Proyección de peso al día 42 (ciclo estándar) usando ganancia diaria promedio
  let projectedWeight42: number | null = null
  if (daysInCycle > 0 && avgWeightG > 0) {
    const dailyGainG     = (avgWeightG - initialWeightG) / daysInCycle
    const daysRemaining  = Math.max(0, 42 - daysInCycle)
    projectedWeight42    = (avgWeightG + dailyGainG * daysRemaining) / 1000
  }

  return Response.json({
    flock_id,
    days_in_cycle:       daysInCycle,
    has_weekly_records:  true,
    week_number:         Number(r.week_number),
    fca:                 fca != null ? Number(fca.toFixed(3)) : null,
    iep:                 iep != null ? Number(iep.toFixed(1)) : null,
    viability_pct:       Number(viabilityPct.toFixed(2)),
    live_count:          liveCount,
    avg_body_weight_g:   avgWeightG,
    cumulative_feed_kg:  cumFeedKg,
    projected_weight_kg: projectedWeight42 != null ? Number(projectedWeight42.toFixed(3)) : null,
    weight_gained_kg:    Number(weightGainedKg.toFixed(2)),
  })
}

export const openApi = {}
