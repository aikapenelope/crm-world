/**
 * Debtors list — calculated from overdue receipts.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_collections.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('building_id')

  // Get all overdue/pending receipts grouped by unit
  let query = kysely
    .selectFrom('condo_receipts')
    .select(['unit_id', 'building_id', 'owner_name', 'unit_number', 'total_amount', 'paid_amount', 'due_date', 'status'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['pending', 'overdue', 'partial'])

  if (buildingId) {
    query = query.where('building_id', '=', buildingId)
  }

  const receipts = await query.execute()

  // Aggregate by unit
  const unitDebts = new Map<string, any>()
  for (const r of receipts as any[]) {
    const key = r.unit_id as string
    const existing = unitDebts.get(key)
    const debt = Number(r.total_amount) - Number(r.paid_amount)
    const dueDate = new Date(r.due_date)

    if (existing) {
      existing.total_debt += debt
      existing.receipt_count += 1
      if (dueDate < existing.oldest_pending_date) {
        existing.oldest_pending_date = dueDate
      }
    } else {
      unitDebts.set(key, {
        unit_id: r.unit_id,
        building_id: r.building_id,
        owner_name: r.owner_name,
        unit_number: r.unit_number,
        total_debt: debt,
        receipt_count: 1,
        oldest_pending_date: dueDate,
      })
    }
  }

  // Calculate months overdue and get phone numbers
  const now = new Date()
  const debtors = Array.from(unitDebts.values())
    .filter((d) => d.total_debt > 0)
    .map((d) => {
      const monthsDiff = (now.getFullYear() - d.oldest_pending_date.getFullYear()) * 12 +
        (now.getMonth() - d.oldest_pending_date.getMonth())
      return {
        ...d,
        total_debt: d.total_debt.toFixed(2),
        months_overdue: Math.max(0, monthsDiff),
        oldest_pending_date: d.oldest_pending_date.toISOString().split('T')[0],
        currency: 'USD',
      }
    })
    .sort((a, b) => b.months_overdue - a.months_overdue)

  // Get phone numbers from units
  const unitIds = debtors.map((d) => d.unit_id)
  if (unitIds.length > 0) {
    const units = await kysely
      .selectFrom('condo_units')
      .select(['id', 'owner_phone'])
      .where('id', 'in', unitIds)
      .execute()

    const phoneMap = new Map<string, any>((units as any[]).map((u: any) => [u.id, u.owner_phone]))
    for (const debtor of debtors) {
      debtor.owner_phone = phoneMap.get(debtor.unit_id) ?? null
    }
  }

  return Response.json({
    items: debtors,
    total: debtors.length,
    total_debt: debtors.reduce((s, d) => s + Number(d.total_debt), 0).toFixed(2),
  })
}

export const openApi = {}
