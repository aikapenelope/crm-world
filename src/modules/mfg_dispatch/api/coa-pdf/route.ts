/**
 * GET /api/mfg-dispatch/coa-pdf?coa_id=<uuid>
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { CoaPdf, type CoaPdfData, type QaResult } from '../../documents/CoaPdf'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const coaId = url.searchParams.get('coa_id')
  if (!coaId) return Response.json({ error: 'coa_id required' }, { status: 400 })

  const coa = await kysely.selectFrom('mfg_coa').selectAll().where('id', '=', coaId).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!coa) return Response.json({ error: 'CoA not found' }, { status: 404 })
  const c = coa as any

  const org = await loadOrgBranding(kysely, scope)

  // Parse qa_results from JSONB — each key becomes a QaResult row
  const qaResults: QaResult[] = []
  if (c.qa_results && typeof c.qa_results === 'object') {
    for (const [key, val] of Object.entries(c.qa_results)) {
      qaResults.push({
        parameter:     key.replace(/_/g, ' '),
        specification: null,
        result:        val as string | number | boolean,
        unit:          null,
        status:        'info',
      })
    }
  }

  const data: CoaPdfData = {
    org,
    coa_number:       c.coa_number,
    lot_number:       c.lot_number,
    product_code:     c.product_code,
    product_name:     c.product_name,
    production_date:  c.production_date,
    expiry_date:      c.expiry_date ?? null,
    quantity:         Number(c.quantity),
    uom:              c.uom,
    customer_name:    c.customer_name ?? null,
    qa_results:       qaResults,
    approved_by:      c.approved_by ?? null,
    approved_at:      c.approved_at ?? null,
    id: coaId,
  }

  const stream = await renderToStream(React.createElement(CoaPdf, { data }))
  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="coa-${c.coa_number}.pdf"`,
    },
  })
}

export const openApi = {}
