/**
 * Accounting summary — income vs expenses by period.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_accounting.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('building_id')
  const periodMonth = url.searchParams.get('period_month')

  let query = kysely
    .selectFrom('condo_accounting_entries')
    .select(['entry_type', 'category', 'amount', 'period_month', 'is_reserve_fund'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (buildingId) query = query.where('building_id', '=', buildingId)
  if (periodMonth) query = query.where('period_month', '=', periodMonth)

  const entries = await query.execute()

  const totalIncome = (entries as any[])
    .filter((e: any) => e.entry_type === 'income')
    .reduce((s: number, e: any) => s + Number(e.amount), 0)

  const totalExpenses = (entries as any[])
    .filter((e: any) => e.entry_type === 'expense')
    .reduce((s: number, e: any) => s + Number(e.amount), 0)

  const reserveFundContributions = (entries as any[])
    .filter((e: any) => e.is_reserve_fund && e.entry_type === 'income')
    .reduce((s: number, e: any) => s + Number(e.amount), 0)

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {}
  for (const e of (entries as any[]).filter((e: any) => e.entry_type === 'expense')) {
    const cat = e.category as string
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + Number(e.amount)
  }

  return Response.json({
    total_income: totalIncome.toFixed(2),
    total_expenses: totalExpenses.toFixed(2),
    net_balance: (totalIncome - totalExpenses).toFixed(2),
    reserve_fund_contributions: reserveFundContributions.toFixed(2),
    expenses_by_category: expensesByCategory,
    total_entries: (entries as any[]).length,
    currency: 'USD',
  })
}

export const openApi = {}
