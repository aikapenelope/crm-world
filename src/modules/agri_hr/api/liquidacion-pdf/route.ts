/**
 * GET /api/agri-hr/liquidacion-pdf?settlement_id=<uuid>
 * Liquidación del ciclo del productor integrado con KPIs y desglose de pago.
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { LiquidacionProducerPdf, type LiquidacionProducerData } from '../../documents/LiquidacionProducerPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

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

  // Kysely selectAll() — fields used to build the PDF
  type SettlementRow = {
    flock_id: string; settlement_number: string | null
    cycle_start_date: string; cycle_end_date: string
    initial_birds: number | string; final_birds: number | string
    actual_mortality_pct: string; actual_fca: string; target_fca: string
    actual_avg_weight_kg: string; target_weight_kg: string
    price_per_kg_usd: string; base_payment_usd: string
    fca_bonus_usd: string | null; weight_bonus_usd: string | null
    fca_penalty_usd: string | null; total_payment_usd: string
    status: string; payment_date: string | null; notes: string | null
  }
  const s = settlement as SettlementRow

  type FlockRow = { flock_number: string | null; farm_name: string | null; producer_name: string | null }

  // Load flock and producer info
  const flock = await kysely
    .selectFrom('agri_flocks as f')
    .leftJoin('agri_farm_units as u', 'u.id', 'f.farm_unit_id')
    .select(['f.flock_number', 'u.name as farm_name', 'u.owner_name as producer_name'])
    .where('f.id', '=', s.flock_id)
    .executeTakeFirst() as FlockRow | undefined

  const org = await loadOrgBranding(kysely, scope)

  const data: LiquidacionProducerData = {
    org,
    settlement_number: s.settlement_number ?? `LIQ-${settlementId.slice(-6).toUpperCase()}`,
    flock_number: flock?.flock_number ?? 'N/D',
    producer_name: flock?.producer_name ?? 'Productor',
    farm_name: flock?.farm_name ?? null,
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

  // @react-pdf/renderer renderToStream returns a non-standard stream — Response cast is required
  const stream = await renderToStream(React.createElement(LiquidacionProducerPdf, { data }) as any)
  return new Response(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="liquidacion-${data.flock_number}.pdf"`,
    },
  })
}

export const openApi = {}
