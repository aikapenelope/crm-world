/**
 * Construction Dashboard API.
 * KPIs: active projects, total contract value, billing, progress.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['const_projects.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const projects = await kysely
    .selectFrom('const_projects')
    .select(['id', 'name', 'status', 'contract_amount', 'overall_progress', 'currency', 'planned_end_date', 'start_date'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  const all = projects as any[]
  const active = all.filter((p: any) => p.status === 'in_progress')
  const totalContract = active.reduce((s: number, p: any) => s + Number(p.contract_amount), 0)
  const avgProgress = active.length > 0
    ? active.reduce((s: number, p: any) => s + Number(p.overall_progress), 0) / active.length
    : 0

  // Count by status
  const byStatus: Record<string, number> = {}
  for (const p of all) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1
  }

  // Billed amount from valuations
  let totalBilled = 0
  try {
    const valuations = await kysely
      .selectFrom('const_valuations')
      .select(['current_period', 'status'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('status', 'in', ['approved', 'invoiced', 'paid'])
      .execute()
    totalBilled = (valuations as any[]).reduce((s: number, v: any) => s + Number(v.current_period), 0)
  } catch {
    // Table may not exist yet
  }

  // Open RFIs
  let openRfis = 0
  try {
    const rfis = await kysely
      .selectFrom('const_rfis')
      .select(['id'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('status', 'in', ['open', 'pending_response'])
      .execute()
    openRfis = (rfis as any[]).length
  } catch {
    // Table may not exist yet
  }

  return Response.json({
    projects: { total: all.length, active: active.length, by_status: byStatus },
    financials: {
      total_contract: totalContract.toFixed(2),
      total_billed: totalBilled.toFixed(2),
      billing_rate: totalContract > 0 ? Math.round((totalBilled / totalContract) * 100) : 0,
      currency: 'USD',
    },
    progress: { avg_progress: Math.round(avgProgress) },
    rfis: { open: openRfis },
  })
}

export const openApi = {}
