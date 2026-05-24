/**
 * Generate receipts for all units in a building based on a fee config.
 * One click = one receipt per unit, amount calculated by aliquot.
 * Emits condo_fees.receipts.generated (clientBroadcast: true) so the
 * receipts list and fee config status refresh instantly in the browser.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['condo_fees.generate'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const feeConfigId = body.fee_config_id

  if (!feeConfigId) {
    return Response.json({ error: 'fee_config_id is required' }, { status: 400 })
  }

  // Get fee config
  const feeConfig = await kysely
    .selectFrom('condo_fee_configs')
    .selectAll()
    .where('id', '=', feeConfigId)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!feeConfig) {
    return Response.json({ error: 'Fee config not found' }, { status: 404 })
  }

  const config = feeConfig as any

  // Get all units for the building
  const units = await kysely
    .selectFrom('condo_units')
    .selectAll()
    .where('building_id', '=', config.building_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  if ((units as any[]).length === 0) {
    return Response.json({ error: 'No units found for this building' }, { status: 400 })
  }

  // Get exchange rate from venezuela_rates (latest BCV rate)
  let exchangeRate: string | null = null
  try {
    const rateRow = await kysely
      .selectFrom('venezuela_exchange_rates')
      .select(['rate'])
      .where('source', '=', 'bcv')
      .where('currency_from', '=', 'USD')
      .where('currency_to', '=', 'VES')
      .orderBy('date', 'desc')
      .executeTakeFirst()
    if (rateRow) {
      exchangeRate = (rateRow as any).rate
    }
  } catch {
    // Table may not exist in all environments
  }

  const baseAmount = Number(config.base_amount)
  const receipts: any[] = []
  let receiptCounter = 1

  for (const unit of units as any[]) {
    const aliquot = Number(unit.aliquot_percent)
    let amountUsd: number

    if (config.distribution_method === 'equal') {
      amountUsd = baseAmount / (units as any[]).length
    } else {
      // aliquot-based (default)
      amountUsd = (baseAmount * aliquot) / 100
    }

    const amountVes = exchangeRate ? amountUsd * Number(exchangeRate) : null
    const receiptNumber = `REC-${config.period_month}-${String(receiptCounter).padStart(3, '0')}`

    receipts.push({
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      fee_config_id: feeConfigId,
      building_id: config.building_id,
      unit_id: unit.id,
      receipt_number: receiptNumber,
      period_month: config.period_month,
      owner_name: unit.owner_name ?? 'Sin propietario',
      unit_number: unit.unit_number,
      aliquot_percent: unit.aliquot_percent,
      amount_usd: amountUsd.toFixed(2),
      amount_ves: amountVes ? amountVes.toFixed(2) : null,
      exchange_rate: exchangeRate,
      late_fee_amount: '0.00',
      total_amount: amountUsd.toFixed(2),
      status: 'pending',
      paid_amount: '0.00',
      due_date: config.due_date,
      created_at: new Date(),
      updated_at: new Date(),
    })

    receiptCounter++
  }

  // Bulk insert receipts
  if (receipts.length > 0) {
    await kysely
      .insertInto('condo_receipts')
      .values(receipts)
      .execute()

    // Update fee config status to 'generated'
    await kysely
      .updateTable('condo_fee_configs')
      .set({ status: 'generated', updated_at: new Date() })
      .where('id', '=', feeConfigId)
      .execute()
  }

  // Emit lifecycle event — clientBroadcast: true means the receipts list
  // and fee config status update instantly across all connected browsers
  // of this tenant without a page reload.
  await emitLifecycle(eventsConfig, 'condo_fees.receipts.generated', scope, {
    fee_config_id: feeConfigId,
    building_id: config.building_id,
    period_month: config.period_month,
    receipts_generated: receipts.length,
  })

  return Response.json({
    success: true,
    receipts_generated: receipts.length,
    building_id: config.building_id,
    period_month: config.period_month,
    exchange_rate: exchangeRate,
  })
}

export const openApi = {}
