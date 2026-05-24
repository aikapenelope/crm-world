/**
 * API route: Generate construction valuation PDF
 * GET /api/const-progress/valuations/pdf?id=VALUATION_ID
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { ValuacionObra, type ValuacionPDFData } from '../../../documents/ValuacionObra'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['const_progress.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const valuation = await kysely
    .selectFrom('const_valuations')
    .selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!valuation) return Response.json({ error: 'Valuation not found' }, { status: 404 })

  // Kysely selectAll() — fields used to build the PDF
  type ValuationRow = {
    id: string; project_id: string; valuation_number: string
    period_from: string; period_to: string; status: string
    invoice_number: string | null; approved_by: string | null
    approved_at: string | null; submitted_at: string | null
    notes: string | null; currency: string | null
    total_contract: string; previous_billed: string; current_period: string
    retention_amount: string; advance_deduction: string; net_payable: string
    exchange_rate: string | null; amount_ves: string | null
  }
  const v = valuation as ValuationRow

  type ProjectRow = { name: string | null; code: string | null; client_name: string | null }
  type LineRow = {
    item_number: string; item_name: string; unit: string | null
    contracted_quantity: string; unit_price: string
    current_quantity: string; current_amount: string; accumulated_percent: string
  }

  // Load related data in parallel
  const [project, lines, org] = await Promise.all([
    kysely.selectFrom('const_projects')
      .select(['name', 'code', 'client_name'])
      .where('id', '=', v.project_id)
      .executeTakeFirst() as Promise<ProjectRow | undefined>,
    kysely.selectFrom('const_valuation_lines')
      .selectAll()
      .where('valuation_id', '=', id)
      .orderBy('item_number', 'asc')
      .execute() as Promise<LineRow[]>,
    loadOrgBranding(kysely, scope),
  ])

  const data: ValuacionPDFData = {
    org,
    projectName: project?.name ?? 'Proyecto',
    projectCode: project?.code ?? '',
    clientName: project?.client_name ?? '',
    valuationNumber: v.valuation_number,
    periodFrom: v.period_from,
    periodTo: v.period_to,
    status: v.status,
    invoiceNumber: v.invoice_number ?? null,
    approvedBy: v.approved_by ?? null,
    approvedAt: v.approved_at ?? null,
    submittedAt: v.submitted_at ?? null,
    notes: v.notes ?? null,
    currency: v.currency ?? 'USD',
    totalContract: v.total_contract,
    previousBilled: v.previous_billed,
    currentPeriod: v.current_period,
    retentionAmount: v.retention_amount,
    advanceDeduction: v.advance_deduction,
    netPayable: v.net_payable,
    exchangeRate: v.exchange_rate ?? null,
    amountVes: v.amount_ves ?? null,
    lines: lines.map((l) => ({
      item_number: l.item_number,
      item_name: l.item_name,
      unit: l.unit ?? null,
      contracted_quantity: l.contracted_quantity,
      unit_price: l.unit_price,
      current_quantity: l.current_quantity,
      current_amount: l.current_amount,
      accumulated_percent: l.accumulated_percent,
    })),
    id: v.id,
  }

  const stream = await renderToStream(React.createElement(ValuacionObra, { data }) as any)

  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const pdfBuffer = Buffer.concat(chunks)
  const filename = `valuacion-${data.valuationNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-cache',
    },
  })
}

export const openApi = {}
