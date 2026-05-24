/**
 * GET /api/agri-traceability/trazabilidad-pdf?lot_number=<string>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { TrazabilidadPdf, type TrazabilidadPdfData, type TraceLink } from '../../documents/TrazabilidadPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_traceability.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const lotNumber = url.searchParams.get('lot_number')
  if (!lotNumber) return Response.json({ error: 'lot_number required' }, { status: 400 })

  // Trace chain: processing lot → slaughter batch → flock → farm
  const procLot = await kysely
    .selectFrom('agri_processing_lots as pl')
    .leftJoin('agri_slaughter_batches as sb', 'sb.id', 'pl.slaughter_batch_id')
    .leftJoin('agri_flocks as f', 'f.id', 'sb.flock_id')
    .leftJoin('agri_farm_units as u', 'u.id', 'f.farm_unit_id')
    .select([
      'pl.lot_number', 'pl.formula_id', 'pl.processing_date', 'pl.quantity_kg',
      'pl.expiry_date', 'pl.id as lot_id',
      'sb.batch_number', 'sb.slaughter_date', 'sb.birds_processed', 'sb.yield_pct',
      'f.flock_number', 'f.start_date', 'f.species', 'f.genetic_line',
      'u.name as farm_name', 'u.location_city',
    ])
    .where('pl.lot_number', '=', lotNumber)
    .where('pl.tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!procLot) return Response.json({ error: 'Lot not found' }, { status: 404 })
  const p = procLot as any

  // Load feed formulas for this flock
  let feedFormulas: any[] = []
  try {
    feedFormulas = await kysely
      .selectFrom('agri_feed_formulas')
      .select(['name', 'cost_per_ton_usd'])
      .where('tenant_id', '=', scope.tenantId)
      .where('is_active', '=', true)
      .limit(5)
      .execute()
  } catch { /* module may not be initialized */ }

  // Load medications
  let medications: any[] = []
  if (p.flock_number) {
    try {
      const flockRow = await kysely.selectFrom('agri_flocks').select(['id']).where('flock_number', '=', p.flock_number).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
      if (flockRow) {
        medications = await kysely
          .selectFrom('agri_vet_medication_records')
          .select(['medication_name', 'dose_per_bird', 'withdrawal_end_date'])
          .where('flock_id', '=', (flockRow as any).id)
          .where('tenant_id', '=', scope.tenantId)
          .execute()
      }
    } catch { /* module may not be initialized */ }
  }

  // Get formula name
  let formulaName = 'Fórmula de procesamiento'
  if (p.formula_id) {
    try {
      const formula = await kysely.selectFrom('agri_processing_formulas').select(['name']).where('id', '=', p.formula_id).executeTakeFirst()
      if (formula) formulaName = (formula as any).name
    } catch { /* ok */ }
  }

  const chain: TraceLink[] = [
    { step: '1. Producto Terminado', entity: `Lote ${lotNumber}`, code: lotNumber, detail: `Fórmula: ${formulaName} · ${Number(p.quantity_kg ?? 0).toFixed(2)} kg`, date: p.processing_date },
    { step: '2. Planta de Beneficio', entity: `Lote ${p.batch_number ?? '—'}`, code: p.batch_number ?? '—', detail: `Aves procesadas: ${Number(p.birds_processed ?? 0).toLocaleString('es-VE')} · Rendimiento: ${Number(p.yield_pct ?? 0).toFixed(2)}%`, date: p.slaughter_date },
    { step: '3. Lote de Aves', entity: `Flock ${p.flock_number ?? '—'}`, code: p.flock_number ?? '—', detail: `${p.species ?? '—'} ${p.genetic_line ?? ''} · Iniciado: ${p.farm_name ?? ''}`, date: p.start_date },
    { step: '4. Granja de Producción', entity: p.farm_name ?? 'Granja', code: '', detail: p.location_city ? `Ubicación: ${p.location_city}` : 'Granja registrada en sistema', date: null },
  ]

  const org = await loadOrgBranding(kysely, scope)

  const data: TrazabilidadPdfData = {
    org,
    product_lot_number: lotNumber,
    product_name: `Producto procesado — ${formulaName}`,
    production_date: p.processing_date ?? new Date().toISOString(),
    expiry_date: p.expiry_date ?? null,
    quantity_kg: Number(p.quantity_kg ?? 0),
    chain,
    feed_formulas: feedFormulas.map((f: any) => ({ name: f.name, cost_per_ton_usd: f.cost_per_ton_usd ? Number(f.cost_per_ton_usd) : null })),
    medications: medications.map((m: any) => ({
      name: m.medication_name,
      dose: m.dose_per_bird ? `${m.dose_per_bird} por ave` : null,
      withdrawal_end_date: m.withdrawal_end_date ?? null,
    })),
    issued_for: null,
    id: p.lot_id ?? lotNumber,
  }

  const stream = await renderToStream(React.createElement(TrazabilidadPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="trazabilidad-${lotNumber}.pdf"`,
    },
  })
}

export const openApi = {}
