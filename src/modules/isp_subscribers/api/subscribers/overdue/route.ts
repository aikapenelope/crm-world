/**
 * GET /api/isp-subscribers/subscribers/overdue
 *
 * Lista los abonados activos con facturas vencidas y calcula los días de atraso.
 * Usado por la vista de morosos y por el worker de corte automático.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_subscribers.view_financials'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const url = new URL(request.url)
  const subscriberType = url.searchParams.get('subscriber_type') ?? null
  const minDays = parseInt(url.searchParams.get('min_days') ?? '1', 10)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Abonados activos con facturas pendientes/vencidas
  let query = kysely
    .selectFrom('isp_subscribers as s')
    .innerJoin('isp_invoices as inv', 'inv.subscriber_id', 's.id')
    .select([
      's.id',
      's.account_number',
      's.subscriber_type',
      's.installation_city',
      's.monthly_price_usd',
      's.cut_policy_days',
      's.last_payment_date',
      'inv.id as invoice_id',
      'inv.invoice_number',
      'inv.due_date',
      'inv.balance_usd',
      'inv.status as invoice_status',
    ])
    .where('s.tenant_id', '=', scope.tenantId)
    .where('s.organization_id', '=', scope.organizationId)
    .where('s.service_status', '=', 'active')
    .where('s.deleted_at', 'is', null)
    .where('inv.status', 'in', ['pending', 'partial', 'overdue'])
    .where('inv.due_date', '<', today.toISOString().split('T')[0])
    .orderBy('inv.due_date', 'asc')

  if (subscriberType) {
    query = query.where('s.subscriber_type', '=', subscriberType)
  }

  const rows = await query.execute()

  // Calcular días de atraso y filtrar
  type OverdueRow = {
    id: string; account_number: string; subscriber_type: string
    installation_city: string; monthly_price_usd: string; cut_policy_days: number
    last_payment_date: string | null; invoice_id: string; invoice_number: string
    due_date: string; balance_usd: string; invoice_status: string
  }
  const overdue = (rows as OverdueRow[])
    .map((row) => {
      const dueDate = new Date(row.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return { ...row, days_overdue: daysOverdue }
    })
    .filter((row) => row.days_overdue >= minDays)

  return Response.json({
    items: overdue,
    total: overdue.length,
  })
}

export const openApi = {}
