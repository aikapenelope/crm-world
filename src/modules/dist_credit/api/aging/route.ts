/**
 * Aging Report API.
 * Returns accounts receivable grouped by age buckets (0-30, 31-60, 61-90, 90+).
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_credit.view_aging'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Get all credit transactions that are invoices with due_date
  const invoiceTransactions = await kysely
    .selectFrom('dist_credit_transactions')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('type', '=', 'invoice')
    .execute()

  // Get all payments to calculate remaining balance per invoice
  const payments = await kysely
    .selectFrom('dist_credit_transactions')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('type', 'in', ['payment', 'credit_note'])
    .execute()

  // Get customer names
  const customerIds = [...new Set((invoiceTransactions as any[]).map((t: any) => t.customer_id))]
  let customerMap = new Map<string, any>()
  if (customerIds.length > 0) {
    const customers = await kysely
      .selectFrom('customer_people')
      .select(['id', 'display_name'])
      .where('id', 'in', customerIds)
      .execute()
    customerMap = new Map<string, any>(customers.map((c: any) => [c.id, c]))
  }

  // Get credit limits for context
  const limits = await kysely
    .selectFrom('dist_credit_limits')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()
  const limitMap = new Map<string, any>(limits.map((l: any) => [l.customer_id, l]))

  // Calculate balance per customer
  const balanceByCustomer = new Map<string, number>()
  for (const tx of invoiceTransactions as any[]) {
    const current = balanceByCustomer.get(tx.customer_id) ?? 0
    balanceByCustomer.set(tx.customer_id, current + Number(tx.amount))
  }
  for (const tx of payments as any[]) {
    const current = balanceByCustomer.get(tx.customer_id) ?? 0
    balanceByCustomer.set(tx.customer_id, current + Number(tx.amount)) // payments are negative
  }

  // Build aging buckets per customer
  type AgingRow = {
    customer_id: string
    customer_name: string
    credit_limit: string
    current_balance: string
    bucket_0_30: number
    bucket_31_60: number
    bucket_61_90: number
    bucket_90_plus: number
    total_overdue: number
    status: string
  }

  const agingRows: AgingRow[] = []

  for (const [customerId, balance] of balanceByCustomer.entries()) {
    if (balance <= 0) continue // No debt

    const customer = customerMap.get(customerId) as any
    const limit = limitMap.get(customerId) as any

    // Calculate aging from invoice due dates
    let bucket_0_30 = 0
    let bucket_31_60 = 0
    let bucket_61_90 = 0
    let bucket_90_plus = 0

    const customerInvoices = (invoiceTransactions as any[]).filter((t: any) => t.customer_id === customerId)
    for (const inv of customerInvoices) {
      if (!inv.due_date) continue
      const dueDate = new Date(inv.due_date)
      const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const amount = Number(inv.amount)

      if (diffDays <= 0) {
        bucket_0_30 += amount // Not yet due, count as current
      } else if (diffDays <= 30) {
        bucket_0_30 += amount
      } else if (diffDays <= 60) {
        bucket_31_60 += amount
      } else if (diffDays <= 90) {
        bucket_61_90 += amount
      } else {
        bucket_90_plus += amount
      }
    }

    agingRows.push({
      customer_id: customerId,
      customer_name: customer?.display_name ?? 'Cliente',
      credit_limit: limit?.credit_limit ?? '0.00',
      current_balance: balance.toFixed(2),
      bucket_0_30: Math.round(bucket_0_30 * 100) / 100,
      bucket_31_60: Math.round(bucket_31_60 * 100) / 100,
      bucket_61_90: Math.round(bucket_61_90 * 100) / 100,
      bucket_90_plus: Math.round(bucket_90_plus * 100) / 100,
      total_overdue: Math.round((bucket_31_60 + bucket_61_90 + bucket_90_plus) * 100) / 100,
      status: limit?.status ?? 'active',
    })
  }

  // Sort by total overdue descending
  agingRows.sort((a, b) => b.total_overdue - a.total_overdue)

  // Summary totals
  const summary = {
    total_receivable: agingRows.reduce((sum, r) => sum + Number(r.current_balance), 0).toFixed(2),
    total_0_30: agingRows.reduce((sum, r) => sum + r.bucket_0_30, 0).toFixed(2),
    total_31_60: agingRows.reduce((sum, r) => sum + r.bucket_31_60, 0).toFixed(2),
    total_61_90: agingRows.reduce((sum, r) => sum + r.bucket_61_90, 0).toFixed(2),
    total_90_plus: agingRows.reduce((sum, r) => sum + r.bucket_90_plus, 0).toFixed(2),
    total_overdue: agingRows.reduce((sum, r) => sum + r.total_overdue, 0).toFixed(2),
    customers_with_debt: agingRows.length,
  }

  return Response.json({ items: agingRows, summary })
}

export const openApi = {}
