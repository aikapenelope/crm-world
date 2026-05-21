/**
 * API route: Generate condo receipt PDF
 * GET /api/condo-fees/receipts/pdf?id=RECEIPT_ID
 *
 * Returns a professional PDF of the receipt with org branding.
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { ReciboCondo, type ReciboPDFData } from '../../../documents/ReciboCondo'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_fees.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  // Load receipt
  const receipt = await kysely
    .selectFrom('condo_receipts')
    .selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!receipt) {
    return Response.json({ error: 'Receipt not found' }, { status: 404 })
  }
  const r = receipt as any

  // Load building name
  const building = await kysely
    .selectFrom('condo_buildings')
    .select(['name'])
    .where('id', '=', r.building_id)
    .executeTakeFirst()

  // Load org branding
  const org = await loadOrgBranding(kysely, scope)

  const data: ReciboPDFData = {
    org,
    buildingName: (building as any)?.name ?? 'Edificio',
    receiptNumber: r.receipt_number,
    periodMonth: r.period_month,
    issueDate: r.created_at,
    unitNumber: r.unit_number,
    ownerName: r.owner_name,
    aliquotPercent: r.aliquot_percent,
    amountUsd: r.amount_usd,
    amountVes: r.amount_ves ?? null,
    exchangeRate: r.exchange_rate ?? null,
    lateFeeAmount: r.late_fee_amount ?? '0.00',
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount ?? '0.00',
    currency: r.currency ?? 'USD',
    status: r.status,
    dueDate: r.due_date,
    paidAt: r.paid_at ?? null,
    paymentMethod: r.payment_method ?? null,
    paymentReference: r.payment_reference ?? null,
    id: r.id,
  }

  // Generate PDF stream
  const stream = await renderToStream(
    React.createElement(ReciboCondo, { data })
  )

  // Collect stream to buffer
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const pdfBuffer = Buffer.concat(chunks)

  const filename = `recibo-${data.receiptNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`

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
