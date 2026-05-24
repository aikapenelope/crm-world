/**
 * GET /api/agri-processing/despacho-sanitario-pdf?batch_id=<uuid>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { DespachoPdf, type DespachoPdfData } from '../../documents/DespachoPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_processing.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const batchId = url.searchParams.get('batch_id')
  if (!batchId) return Response.json({ error: 'batch_id required' }, { status: 400 })

  const batch = await kysely
    .selectFrom('agri_slaughter_batches')
    .selectAll()
    .where('id', '=', batchId)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!batch) return Response.json({ error: 'Batch not found' }, { status: 404 })
  const b = batch as any

  // Get flock number for origin tracking
  const flock = await kysely
    .selectFrom('agri_flocks')
    .select(['flock_number'])
    .where('id', '=', b.flock_id)
    .executeTakeFirst()

  const org = await loadOrgBranding(kysely, scope)

  const data: DespachoPdfData = {
    org,
    batch_number:           b.batch_number,
    flock_number:           (flock as any)?.flock_number ?? '—',
    dispatch_date:          b.slaughter_date ?? new Date().toISOString(),
    client_name:            b.client_name ?? null,
    client_rif:             b.client_rif ?? null,
    carrier_name:           b.carrier_name ?? null,
    vehicle_plate:          b.vehicle_plate ?? null,
    driver_name:            b.driver_name ?? null,
    birds_processed:        Number(b.birds_processed ?? 0),
    total_weight_kg:        Number(b.total_weight_kg ?? 0),
    yield_pct:              Number(b.yield_pct ?? 0),
    temperature_transport:  b.temperature_transport ?? null,
    microbiological_result: b.microbiological_result ?? 'pending',
    condemned_count:        Number(b.condemned_count ?? 0),
    notes:                  b.notes ?? null,
    approved_by:            b.approved_by ?? null,
    id: batchId,
  }

  const stream = await renderToStream(React.createElement(DespachoPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="despacho-sanitario-${b.batch_number}.pdf"`,
    },
  })
}

export const openApi = {}
