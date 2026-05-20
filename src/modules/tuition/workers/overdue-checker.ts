/**
 * Overdue Checker Worker
 *
 * Runs every 3 days (configured via scheduler module).
 * Checks all pending charges past their due_date + grace period.
 * Marks them as 'overdue' and applies the late fee.
 *
 * Logic:
 * 1. Find charges with status='pending' where due_date + late_fee_after_days < today
 * 2. For each: set status='overdue', calculate late_fee, emit event
 * 3. Charges already marked 'paid', 'waived', or 'credited' are skipped
 * 4. Charges already 'overdue' are skipped (idempotent)
 *
 * The worker is idempotent — running it multiple times won't double-charge.
 */

export const metadata = {
  queue: 'tuition.overdue-check',
  id: 'tuition.overdue-checker',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.resolve('em')
  const kysely = (em as any).getKysely()
  const eventBus = ctx.resolve('eventBus')

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Get all tenants that have tuition charges (multi-tenant safe)
  const tenants = await kysely
    .selectFrom('tuition_charges')
    .select(['tenant_id', 'organization_id'])
    .where('status', '=', 'pending')
    .where('deleted_at', 'is', null)
    .groupBy(['tenant_id', 'organization_id'])
    .execute()

  let totalMarked = 0

  for (const tenant of tenants) {
    // Get plans for grace period info
    const plans = await kysely
      .selectFrom('tuition_plans')
      .select(['id', 'late_fee_percentage', 'late_fee_after_days'])
      .where('tenant_id', '=', tenant.tenant_id)
      .where('organization_id', '=', tenant.organization_id)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    const planMap = new Map<string, any>(plans.map((p: any) => [p.id, p]))
    const defaultGraceDays = 10
    const defaultLateFee = 5

    // Find pending charges past grace period
    const pendingCharges = await kysely
      .selectFrom('tuition_charges')
      .selectAll()
      .where('tenant_id', '=', tenant.tenant_id)
      .where('organization_id', '=', tenant.organization_id)
      .where('status', '=', 'pending')
      .where('deleted_at', 'is', null)
      .execute()

    for (const charge of pendingCharges) {
      const plan = charge.plan_id ? planMap.get(charge.plan_id) : null
      const graceDays = plan?.late_fee_after_days ?? defaultGraceDays
      const lateFeePercentage = plan ? parseFloat(plan.late_fee_percentage) : defaultLateFee

      // Calculate if past grace period
      const dueDate = new Date(charge.due_date)
      const graceDeadline = new Date(dueDate)
      graceDeadline.setDate(graceDeadline.getDate() + graceDays)

      if (now <= graceDeadline) continue // Still within grace period

      // Calculate late fee
      const amount = parseFloat(charge.amount)
      const lateFee = Math.round(amount * (lateFeePercentage / 100) * 100) / 100

      // Update charge
      await kysely
        .updateTable('tuition_charges')
        .set({
          status: 'overdue',
          late_fee_applied: String(lateFee),
          updated_at: now,
        })
        .where('id', '=', charge.id)
        .execute()

      totalMarked++

      // Emit event
      if (eventBus) {
        eventBus.emit('tuition.charge.overdue', {
          chargeId: charge.id,
          studentId: charge.student_id,
          tenantId: tenant.tenant_id,
          organizationId: tenant.organization_id,
          amount: charge.amount,
          lateFee: String(lateFee),
          periodMonth: charge.period_month,
        })
      }
    }
  }

  console.log(`[tuition.overdue-checker] Marked ${totalMarked} charges as overdue`)
  return { processed: totalMarked }
}
