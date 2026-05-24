/**
 * GET /api/mfg-maintenance/work-order-pdf?wo_id=<uuid>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { WorkOrderMaintPdf, type WorkOrderMaintPdfData, type SparePart } from '../../documents/WorkOrderMaintPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const woId = url.searchParams.get('wo_id')
  if (!woId) return Response.json({ error: 'wo_id required' }, { status: 400 })

  const wo = await kysely.selectFrom('mfg_work_orders_maint').selectAll()
    .where('id', '=', woId).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!wo) return Response.json({ error: 'Work order not found' }, { status: 404 })
  const w = wo as any

  const org = await loadOrgBranding(kysely, scope)

  // Parse spare_parts_used from JSONB
  const spareParts: SparePart[] = []
  const rawParts = w.spare_parts_used ?? []
  if (Array.isArray(rawParts)) {
    for (const p of rawParts) {
      spareParts.push({ part_code: p.part_code ?? '—', part_name: p.part_name ?? '—', quantity: Number(p.quantity ?? 1) })
    }
  }

  const data: WorkOrderMaintPdfData = {
    org,
    wo_number:             w.wo_number,
    equipment_code:        w.equipment_code,
    equipment_name:        w.equipment_name,
    work_type:             w.work_type,
    priority:              w.priority,
    status:                w.status,
    description:           w.description,
    fault_description:     w.fault_description ?? null,
    scheduled_date:        w.scheduled_date ?? null,
    estimated_duration_hrs: w.estimated_duration_hrs ? Number(w.estimated_duration_hrs) : null,
    assigned_to_name:      null, // resolve from worker if needed
    spare_parts:           spareParts,
    work_performed:        w.work_performed ?? null,
    actual_duration_hrs:   w.actual_duration_hrs ? Number(w.actual_duration_hrs) : null,
    total_parts_cost_usd:  Number(w.total_parts_cost_usd ?? 0),
    id: woId,
  }

  const stream = await renderToStream(React.createElement(WorkOrderMaintPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="wo-mantenimiento-${w.wo_number}.pdf"`,
    },
  })
}

export const openApi = {}
