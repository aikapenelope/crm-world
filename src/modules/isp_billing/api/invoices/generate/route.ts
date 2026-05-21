/**
 * POST /api/isp-billing/invoices/generate
 *
 * Genera facturas masivas para todos los abonados activos cuyo día de
 * facturación coincide con el período solicitado. Idempotente: si ya existe
 * una factura para el mismo abonado y período, la saltea.
 *
 * Consulta la tasa BCV del día para calcular el equivalente en VES.
 */
import { z } from 'zod'

const bodySchema = z.object({
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  billing_day: z.number().int().min(1).max(28).optional(),
})

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_billing.generate'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const { period_month, billing_day } = parsed.data

  // Obtener tasa BCV del día via venezuela_rates (si está disponible)
  let bcvRate: string | null = null
  try {
    const rateRow = await kysely
      .selectFrom('currency_rates')
      .select(['rate'])
      .where('from_currency', '=', 'USD')
      .where('to_currency', '=', 'VES')
      .where('source', 'like', '%BCV%')
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst()
    if (rateRow) bcvRate = (rateRow as any).rate
  } catch {
    // Venezuela rates module might not be available — continue without BCV rate
  }

  // Obtener abonados activos del período
  let subsQuery = kysely
    .selectFrom('isp_subscribers')
    .select(['id', 'monthly_price_usd', 'billing_cycle_day', 'cut_policy_days'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('service_status', '=', 'active')
    .where('deleted_at', 'is', null)

  if (billing_day) {
    subsQuery = subsQuery.where('billing_cycle_day', '=', billing_day)
  }

  const subscribers = await subsQuery.execute()

  // Calcular fechas del período
  const [year, month] = period_month.split('-').map(Number)
  const today = new Date()
  const IVA_RATE = 16

  let generated = 0
  let skipped = 0

  const { v4 } = await import('uuid')

  for (const sub of subscribers as any[]) {
    // Verificar si ya existe factura para este abonado y período
    const existing = await kysely
      .selectFrom('isp_invoices')
      .select(['id'])
      .where('subscriber_id', '=', sub.id)
      .where('period_month', '=', period_month)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (existing) { skipped++; continue }

    const issueDate = today.toISOString().split('T')[0]
    const billingDay = Math.min(sub.billing_cycle_day, 28)
    const dueDate = new Date(year, month - 1, billingDay)
    // Si el día de corte ya pasó en este mes, due date es el mes siguiente
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1)
    const dueDateStr = dueDate.toISOString().split('T')[0]

    const baseUsd = parseFloat(sub.monthly_price_usd)
    const totalUsd = baseUsd
    const totalVes = bcvRate ? (baseUsd * parseFloat(bcvRate)).toFixed(2) : null
    const ivaVes = totalVes ? (parseFloat(totalVes) * IVA_RATE / 100).toFixed(2) : null

    // Generar número de factura: FAC-{YYYYMM}-{seq}
    const countResult = await kysely
      .selectFrom('isp_invoices')
      .select(kysely.fn.count<number>('id').as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .executeTakeFirst()
    const seq = String(Number((countResult as any)?.count ?? 0) + 1).padStart(5, '0')
    const invoiceNumber = `FAC-${period_month.replace('-', '')}-${seq}`

    await kysely.insertInto('isp_invoices').values({
      id: v4(),
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      subscriber_id: sub.id,
      invoice_number: invoiceNumber,
      period_month,
      issue_date: issueDate,
      due_date: dueDateStr,
      status: 'pending',
      base_amount_usd: sub.monthly_price_usd,
      addons_amount_usd: '0.00',
      discount_amount_usd: '0.00',
      subtotal_usd: String(totalUsd),
      iva_rate: String(IVA_RATE),
      iva_amount_ves: ivaVes,
      bcv_rate: bcvRate,
      total_usd: String(totalUsd),
      total_ves: totalVes,
      paid_amount_usd: '0.00',
      balance_usd: String(totalUsd),
      created_at: today,
      updated_at: today,
    }).execute()

    generated++
  }

  return Response.json({
    ok: true,
    period_month,
    generated,
    skipped,
    bcv_rate_used: bcvRate,
  })
}

export const openApi = {}
