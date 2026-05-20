/**
 * Worker: Detect overdue receipts and apply late fees.
 * Runs daily via scheduler. Finds receipts past due_date + grace period,
 * marks them as 'overdue', and applies the configured late fee percentage.
 */

export const metadata = {
  queue: 'condo-fees-overdue',
  id: 'condo-fees-detect-overdue',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()
  const now = new Date()

  // Get all pending receipts that are past due
  const overdueReceipts = await kysely
    .selectFrom('condo_receipts')
    .innerJoin('condo_fee_configs', 'condo_fee_configs.id', 'condo_receipts.fee_config_id')
    .select([
      'condo_receipts.id',
      'condo_receipts.total_amount',
      'condo_receipts.late_fee_amount',
      'condo_receipts.due_date',
      'condo_receipts.status',
      'condo_fee_configs.late_fee_percent',
      'condo_fee_configs.late_fee_days',
    ])
    .where('condo_receipts.status', '=', 'pending')
    .execute()

  let markedOverdue = 0
  let feesApplied = 0

  for (const receipt of overdueReceipts as any[]) {
    const dueDate = new Date(receipt.due_date)
    const graceDays = receipt.late_fee_days ?? 15
    const graceDeadline = new Date(dueDate.getTime() + graceDays * 24 * 60 * 60 * 1000)

    if (now <= graceDeadline) continue

    // Mark as overdue
    const lateFeePercent = Number(receipt.late_fee_percent ?? 0)
    const baseAmount = Number(receipt.total_amount)
    const existingLateFee = Number(receipt.late_fee_amount ?? 0)

    // Only apply late fee once (if not already applied)
    let newLateFee = existingLateFee
    if (lateFeePercent > 0 && existingLateFee === 0) {
      newLateFee = (baseAmount * lateFeePercent) / 100
      feesApplied++
    }

    const newTotal = baseAmount + newLateFee

    await kysely
      .updateTable('condo_receipts')
      .set({
        status: 'overdue',
        late_fee_amount: newLateFee.toFixed(2),
        total_amount: newTotal.toFixed(2),
        updated_at: now,
      })
      .where('id', '=', receipt.id)
      .execute()

    markedOverdue++
  }

  return {
    processed: (overdueReceipts as any[]).length,
    marked_overdue: markedOverdue,
    fees_applied: feesApplied,
    timestamp: now.toISOString(),
  }
}
