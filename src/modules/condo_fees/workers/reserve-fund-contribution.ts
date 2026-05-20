/**
 * Worker: Automatic reserve fund contribution when a receipt is paid.
 * Triggered by event subscriber. Creates an accounting entry for the
 * reserve fund (Art. 14 LPH — minimum 10% of annual budget).
 */

export const metadata = {
  queue: 'condo-reserve-fund',
  id: 'condo-reserve-fund-contribution',
  concurrency: 2,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  const { receipt_id, tenant_id, organization_id } = payload

  if (!receipt_id || !tenant_id || !organization_id) {
    return { skipped: true, reason: 'Missing required payload fields' }
  }

  // Get receipt details
  const receipt = await kysely
    .selectFrom('condo_receipts')
    .select(['id', 'building_id', 'total_amount', 'period_month'])
    .where('id', '=', receipt_id)
    .where('tenant_id', '=', tenant_id)
    .executeTakeFirst()

  if (!receipt) return { skipped: true, reason: 'Receipt not found' }

  const r = receipt as any

  // Get building's budget to determine reserve fund percentage
  const budget = await kysely
    .selectFrom('condo_budgets')
    .select(['reserve_fund_percent'])
    .where('building_id', '=', r.building_id)
    .where('tenant_id', '=', tenant_id)
    .where('status', 'in', ['active', 'approved'])
    .orderBy('year', 'desc')
    .executeTakeFirst()

  const reservePercent = budget ? Number((budget as any).reserve_fund_percent) : 10 // Default 10% per Art. 14 LPH

  // Calculate contribution
  const paidAmount = Number(r.total_amount)
  const contribution = (paidAmount * reservePercent) / 100

  if (contribution <= 0) return { skipped: true, reason: 'Zero contribution' }

  // Create accounting entry for reserve fund
  await kysely
    .insertInto('condo_accounting_entries')
    .values({
      id: crypto.randomUUID(),
      tenant_id,
      organization_id,
      building_id: r.building_id,
      entry_type: 'income',
      category: 'reserve_fund',
      description: `Aporte fondo de reserva (${reservePercent}%) — Recibo ${r.period_month}`,
      amount: contribution.toFixed(2),
      currency: 'USD',
      reference_type: 'receipt',
      reference_id: receipt_id,
      entry_date: new Date(),
      period_month: r.period_month,
      is_reserve_fund: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .execute()

  return {
    success: true,
    receipt_id,
    contribution: contribution.toFixed(2),
    reserve_percent: reservePercent,
    period: r.period_month,
  }
}
