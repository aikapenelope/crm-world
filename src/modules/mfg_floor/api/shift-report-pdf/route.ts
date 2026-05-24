/**
 * GET /api/mfg-floor/shift-report-pdf?report_id=<uuid>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { ReporteTurnoPdf, type ReporteTurnoData } from '../../documents/ReporteTurnoPdf'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['mfg_floor.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const reportId = url.searchParams.get('report_id')
  if (!reportId) return Response.json({ error: 'report_id required' }, { status: 400 })

  const report = await kysely.selectFrom('mfg_shift_reports').selectAll()
    .where('id', '=', reportId).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!report) return Response.json({ error: 'Shift report not found' }, { status: 404 })
  const r = report as any

  const org = await loadOrgBranding(kysely, scope)

  const data: ReporteTurnoData = {
    org,
    report_number:          r.report_number,
    shift_date:             r.shift_date,
    shift_type:             r.shift_type,
    work_center_name:       r.work_center_name ?? null,
    workers_count:          Number(r.workers_count ?? 0),
    planned_production:     Number(r.planned_production ?? 0),
    actual_production:      Number(r.actual_production ?? 0),
    production_uom:         r.production_uom ?? null,
    total_downtime_hrs:     Number(r.total_downtime_hrs ?? 0),
    electrical_downtime_hrs: Number(r.electrical_downtime_hrs ?? 0),
    internal_downtime_hrs:  Number(r.internal_downtime_hrs ?? 0),
    oee_total_pct:          Number(r.oee_total_pct ?? 0),
    oee_internal_pct:       Number(r.oee_internal_pct ?? 0),
    observations:           r.observations ?? null,
    supervisor_name:        r.supervisor_name ?? null,
    id: reportId,
  }

  const stream = await renderToStream(React.createElement(ReporteTurnoPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="reporte-turno-${r.report_number}.pdf"`,
    },
  })
}

export const openApi = {}
