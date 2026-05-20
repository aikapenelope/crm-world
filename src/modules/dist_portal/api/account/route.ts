/**
 * Portal Account API.
 * Returns the customer's credit account summary for the portal.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const url = new URL(request.url)
  const customerId = url.searchParams.get('customer_id')

  if (!customerId) {
    return Response.json({ error: 'customer_id is required' }, { status: 400 })
  }

  // Get credit limit
  const limit = await kysely
    .selectFrom('dist_credit_limits')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('customer_id', '=', customerId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Get recent transactions
  const transactions = await kysely
    .selectFrom('dist_credit_transactions')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('customer_id', '=', customerId)
    .orderBy('created_at', 'desc')
    .limit(20)
    .execute()

  // Get pending invoices (positive amount with due_date)
  const pendingInvoices = (transactions as any[]).filter(
    (t: any) => t.type === 'invoice' && Number(t.amount) > 0,
  )

  return Response.json({
    credit_limit: (limit as any)?.credit_limit ?? '0.00',
    current_balance: (limit as any)?.current_balance ?? '0.00',
    currency: (limit as any)?.currency ?? 'USD',
    payment_terms_days: (limit as any)?.payment_terms_days ?? 30,
    status: (limit as any)?.status ?? 'active',
    pending_invoices: pendingInvoices.length,
    recent_transactions: transactions,
  })
}

export const openApi = {}
