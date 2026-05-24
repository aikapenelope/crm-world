/**
 * GET /api/agri-units/informe-semanal-pdf?flock_id=<uuid>
 * Informe semanal del lote con KPIs (FCA, IEP, mortalidad, peso, proyecciones).
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { InformeSemanalPdf, type InformeSemanalData } from '../../documents/InformeSemanalPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_units.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const flockId = url.searchParams.get('flock_id')
  if (!flockId) return Response.json({ error: 'flock_id required' }, { status: 400 })

  const flock = await kysely
    .selectFrom('agri_flocks as f')
    .leftJoin('agri_farm_units as u', 'u.id', 'f.farm_unit_id')
    .select(['f.id', 'f.flock_number', 'f.species', 'f.genetic_line', 'f.start_date', 'f.initial_count', 'f.planned_end_date', 'f.mortality_threshold_pct', 'u.name as farm_name'])
    .where('f.id', '=', flockId)
    .where('f.tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!flock) return Response.json({ error: 'Flock not found' }, { status: 404 })
  const f = flock as any

  const records = await kysely
    .selectFrom('agri_flock_weekly_records')
    .selectAll()
    .where('flock_id', '=', flockId)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('week_number', 'asc')
    .execute()

  const org = await loadOrgBranding(kysely, scope)
  const today = new Date()
  const startDate = new Date(f.start_date)
  const daysInCycle = Math.floor((today.getTime() - startDate.getTime()) / 86400000)

  const processedRecords = (records as any[]).map((r) => {
    const liveCount  = Number(r.live_count)
    const initCount  = Number(f.initial_count)
    const initWtG    = 40 // typical initial avg weight ~40g
    const weightG    = Number(r.avg_body_weight_g)
    const cumFeedKg  = Number(r.cumulative_feed_kg)
    const weightGained = (weightG / 1000 * liveCount) - (initWtG / 1000 * initCount)
    const fca = weightGained > 0 ? cumFeedKg / weightGained : null
    const week = Number(r.week_number)
    const iep = fca && fca > 0 && week > 0 ? (weightG / 1000) * (liveCount / initCount) / (fca * week * 7 / 100) : null
    return {
      week_number: week,
      record_date: r.record_date,
      live_count: liveCount,
      weekly_mortality: Number(r.weekly_mortality),
      avg_body_weight_g: Number(r.avg_body_weight_g),
      cumulative_feed_kg: Number(r.cumulative_feed_kg),
      fca,
      iep,
    }
  })

  const latest = processedRecords[processedRecords.length - 1]
  const viabilityPct = f.initial_count > 0 && latest ? (latest.live_count / Number(f.initial_count)) * 100 : null

  const data: InformeSemanalData = {
    org,
    flock_number: f.flock_number,
    species: f.species,
    genetic_line: f.genetic_line,
    farm_name: f.farm_name,
    start_date: f.start_date,
    days_in_cycle: daysInCycle,
    initial_count: Number(f.initial_count),
    current_week: processedRecords.length,
    records: processedRecords,
    latest_fca: latest?.fca ?? null,
    latest_iep: latest?.iep ?? null,
    viability_pct: viabilityPct,
    mortality_threshold_pct: Number(f.mortality_threshold_pct ?? 0.3),
    planned_end_date: f.planned_end_date,
    report_date: today.toISOString(),
    id: flockId,
  }

  const stream = await renderToStream(React.createElement(InformeSemanalPdf, { data }))
  const response = new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="informe-semanal-${f.flock_number}.pdf"`,
    },
  })
  return response
}

export const openApi = {}
