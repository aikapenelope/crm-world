/**
 * Worker: Detect overdue RFIs (past due_date without response).
 * Runs daily. Marks open RFIs past due as urgent priority.
 */
export const metadata = {
  queue: 'const-rfis-overdue',
  id: 'const-rfis-detect-overdue',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()
  const today = new Date().toISOString().split('T')[0]

  // Find open RFIs past due_date
  const overdue = await kysely
    .selectFrom('const_rfis')
    .select(['id', 'rfi_number', 'priority'])
    .where('status', 'in', ['open', 'pending_response'])
    .where('due_date', '<', today)
    .execute()

  let escalated = 0
  for (const rfi of overdue as any[]) {
    if ((rfi as any).priority !== 'urgent') {
      await kysely
        .updateTable('const_rfis')
        .set({ priority: 'urgent', updated_at: new Date() })
        .where('id', '=', (rfi as any).id)
        .execute()
      escalated++
    }
  }

  return { processed: (overdue as any[]).length, escalated, timestamp: new Date().toISOString() }
}
