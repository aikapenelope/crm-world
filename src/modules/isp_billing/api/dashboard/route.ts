/**
 * GET /api/isp-billing/dashboard
 * KPIs de facturación: cobrado, pendiente, vencido, por método de pago.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_billing.view'] },
}

export async function GET(_request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const [byStatus, paymentsByMethod, monthlyTotals] = await Promise.all([
    // Facturas por estado
    kysely
      .selectFrom('isp_invoices')
      .select([
        'status',
        kysely.fn.count('id').as('count'),
        kysely.fn.sum('total_usd').as('total_usd'),
        kysely.fn.sum('balance_usd').as('balance_usd'),
      ])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .groupBy('status')
      .execute(),

    // Pagos del mes por método
    kysely
      .selectFrom('isp_payments')
      .select([
        'payment_method',
        kysely.fn.count('id').as('count'),
        kysely.fn.sum('amount_usd').as('total_usd'),
      ])
      .where('tenant_id', '=', scope.tenantId)
      .where('created_at', '>=', firstDayOfMonth.toISOString())
      .groupBy('payment_method')
      .execute(),

    // Totales del mes actual
    kysely
      .selectFrom('isp_invoices')
      .select([
        kysely.fn.sum('total_usd').as('billed_usd'),
        kysely.fn.sum('paid_amount_usd').as('collected_usd'),
        kysely.fn.sum('balance_usd').as('pending_usd'),
      ])
      .where('tenant_id', '=', scope.tenantId)
      .where('deleted_at', 'is', null)
      .where('created_at', '>=', firstDayOfMonth.toISOString())
      .executeTakeFirst(),
  ])

  type StatusRow   = { status: string; count: string | number; total_usd: string | null; balance_usd: string | null }
  type MethodRow   = { payment_method: string; count: string | number; total_usd: string | null }
  type MonthlyRow  = { billed_usd: string | null; collected_usd: string | null; pending_usd: string | null }

  const statusMap: Record<string, { count: number; total_usd: number; balance_usd: number }> = {}
  for (const row of byStatus as StatusRow[]) {
    statusMap[row.status] = {
      count: Number(row.count),
      total_usd: parseFloat(row.total_usd ?? '0'),
      balance_usd: parseFloat(row.balance_usd ?? '0'),
    }
  }

  const methodMap: Record<string, { count: number; total_usd: number }> = {}
  for (const row of paymentsByMethod as MethodRow[]) {
    methodMap[row.payment_method] = {
      count: Number(row.count),
      total_usd: parseFloat(row.total_usd ?? '0'),
    }
  }

  const mt = monthlyTotals as MonthlyRow | undefined

  return Response.json({
    this_month: {
      billed_usd:    parseFloat(mt?.billed_usd    ?? '0'),
      collected_usd: parseFloat(mt?.collected_usd ?? '0'),
      pending_usd:   parseFloat(mt?.pending_usd   ?? '0'),
    },
    by_status: statusMap,
    payments_by_method: methodMap,
  })
}

export const openApi = {}
