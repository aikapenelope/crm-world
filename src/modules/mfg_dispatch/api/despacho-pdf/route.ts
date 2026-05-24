/**
 * GET /api/mfg-dispatch/despacho-pdf?dispatch_id=<uuid>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { GuiaDespachoMfgPdf, type GuiaDespachoMfgData } from '../../documents/GuiaDespachoMfgPdf'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const dispatchId = url.searchParams.get('dispatch_id')
  if (!dispatchId) return Response.json({ error: 'dispatch_id required' }, { status: 400 })

  const dispatch = await kysely.selectFrom('mfg_dispatch_orders as d').selectAll().where('d.id', '=', dispatchId).where('d.tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!dispatch) return Response.json({ error: 'Dispatch not found' }, { status: 404 })
  const d = dispatch as any

  // Load sale order for totals
  const saleOrder = await kysely.selectFrom('mfg_sale_orders_mfg').selectAll().where('id', '=', d.sale_order_id).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  const so = saleOrder as any

  // Load lines
  const lines = await kysely
    .selectFrom('mfg_sale_order_lines')
    .selectAll()
    .where('sale_order_id', '=', d.sale_order_id)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  const org = await loadOrgBranding(kysely, scope)

  const data: GuiaDespachoMfgData = {
    org,
    dispatch_number:    d.dispatch_number,
    sale_order_number:  d.sale_order_number,
    customer_name:      d.customer_name,
    customer_rif:       so?.customer_rif ?? null,
    dispatch_date:      d.dispatch_date ?? null,
    carrier_name:       d.carrier_name ?? null,
    vehicle_plate:      d.vehicle_plate ?? null,
    driver_name:        d.driver_name ?? null,
    requires_temperature_control: Boolean(d.requires_temperature_control),
    temperature_range:  d.temperature_range ?? null,
    lines: (lines as any[]).map((l: any) => ({
      product_code:    l.product_code,
      product_name:    l.product_name,
      lot_number:      l.lot_number ?? null,
      quantity:        Number(l.quantity),
      uom:             l.uom,
      unit_price_usd:  Number(l.unit_price_usd),
      total_price_usd: Number(l.total_price_usd),
    })),
    subtotal_usd:    so ? Number(so.subtotal_usd) : 0,
    iva_pct:         so ? Number(so.iva_pct) : 16,
    iva_amount_usd:  so ? Number(so.iva_amount_usd) : 0,
    igtf_pct:        so?.igtf_pct ? Number(so.igtf_pct) : null,
    igtf_amount_usd: so ? Number(so.igtf_amount_usd) : 0,
    total_usd:       so ? Number(so.total_usd) : 0,
    notes:           d.delivery_notes ?? null,
    id: dispatchId,
  }

  const stream = await renderToStream(React.createElement(GuiaDespachoMfgPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="guia-despacho-${d.dispatch_number}.pdf"`,
    },
  })
}

export const openApi = {}
