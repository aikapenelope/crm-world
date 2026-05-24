/**
 * GET /api/agri-hr/liquidacion-pdf?settlement_id=<uuid>
 * Liquidación del ciclo del productor integrado con KPIs y desglose de pago.
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { LiquidacionProducerPdf, type LiquidacionProducerData } from '../../documents/LiquidacionProducerPdf'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['agri_hr.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const settlementId = url.searchParams.get('settlement_id')
  if (!settlementId) return Response.json({ error: 'settlement_id required' }, { status: 400 })

  const settlement = await kysely
    .selectFrom('agri_producer_settlements as s')
    .selectAll()
    .where('s.id', '=', settlementId)
    .where('s.tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!settlement) return Response.json({ error: 'Settlement not found' }, { status: 404 })
  const s = settlement as any

  // Load flock and producer info
  const flock = await kysely
    .selectFrom('agri_flocks as f')
    .leftJoin('agri_farm_units as u', 'u.id', 'f.farm_unit_id')
    .select(['f.flock_number', 'u.name as farm_name', 'u.owner_name as producer_name'])
    .where('f.id', '=', s.flock_id)
    .executeTakeFirst()

  const org = await loadOrgBranding(kysely, scope)
  const f = flock as any

  const data: LiquidacionProducerData = {
    org,
    settlement_number: s.settlement_number ?? `LIQ-${settlementId.slice(-6).toUpperCase()}`,
    flock_number: f?.flock_number ?? 'N/D',
    producer_name: f?.producer_name ?? 'Productor',
    farm_name: f?.farm_name ?? null,
    cycle_start_date: s.cycle_start_date,
    cycle_end_date: s.cycle_end_date,
    initial_birds: Number(s.initial_birds ?? 0),
    final_birds: Number(s.final_birds ?? 0),
    actual_mortality_pct: Number(s.actual_mortality_pct ?? 0),
    actual_fca: Number(s.actual_fca ?? 0),
    target_fca: Number(s.target_fca ?? 2.0),
    actual_avg_weight_kg: Number(s.actual_avg_weight_kg ?? 0),
    target_weight_kg: Number(s.target_weight_kg ?? 2.1),
    price_per_kg_usd: Number(s.price_per_kg_usd ?? 0),
    base_payment_usd: Number(s.base_payment_usd ?? 0),
    fca_bonus_usd: Number(s.fca_bonus_usd ?? 0),
    weight_bonus_usd: Number(s.weight_bonus_usd ?? 0),
    fca_penalty_usd: Number(s.fca_penalty_usd ?? 0),
    total_payment_usd: Number(s.total_payment_usd ?? 0),
    status: s.status ?? 'calculated',
    payment_date: s.payment_date ?? null,
    notes: s.notes ?? null,
    id: settlementId,
  }

  const stream = await renderToStream(React.createElement(LiquidacionProducerPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="liquidacion-${data.flock_number}.pdf"`,
    },
  })
}

export const openApi = {}
