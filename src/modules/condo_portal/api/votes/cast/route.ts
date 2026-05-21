/**
 * Portal: Cast a vote (portal version).
 * Validates unit aliquot and prevents double-voting.
 *
 * Fix (2026-05-26): Removed direct cross-module import of condo_comms/events.
 * Turbopack cannot resolve cross-module entity/config imports at build time.
 * The event bus is now accessed via the DI container — the documented pattern
 * for emitting events across module boundaries.
 *
 * Reference: docs/REALTIME.md §"Emit via DI event bus"
 * Pattern: see src/modules/tuition/workers/overdue-checker.ts §eventBus usage
 */

export const metadata = {
  POST: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.view_account'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // Access the event bus through DI — never import another module's eventsConfig
  const eventBus = ctx.container.resolve('eventBus') as {
    emitEvent: (id: string, payload: Record<string, unknown>, opts?: { persistent?: boolean }) => Promise<void>
  } | null

  const body = await request.json()
  const { vote_id, unit_id, choice } = body

  if (!vote_id || !unit_id || !choice) {
    return Response.json({ error: 'vote_id, unit_id, and choice are required' }, { status: 400 })
  }

  // Verify vote is open
  const vote = await kysely
    .selectFrom('condo_votes')
    .selectAll()
    .where('id', '=', vote_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!vote || (vote as any).status !== 'open') {
    return Response.json({ error: 'Vote not found or not open' }, { status: 400 })
  }

  // Check unit hasn't voted
  const existing = await kysely
    .selectFrom('condo_vote_casts')
    .select(['id'])
    .where('vote_id', '=', vote_id)
    .where('unit_id', '=', unit_id)
    .executeTakeFirst()

  if (existing) {
    return Response.json({ error: 'This unit has already voted' }, { status: 409 })
  }

  // Get unit aliquot
  const unit = await kysely
    .selectFrom('condo_units')
    .select(['aliquot_percent', 'unit_number'])
    .where('id', '=', unit_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!unit) {
    return Response.json({ error: 'Unit not found' }, { status: 404 })
  }

  const aliquotWeight = Number((unit as any).aliquot_percent)

  // Insert vote cast
  await kysely
    .insertInto('condo_vote_casts')
    .values({
      id: crypto.randomUUID(),
      vote_id,
      unit_id,
      choice,
      aliquot_weight: String(aliquotWeight),
      cast_at: new Date(),
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
    })
    .execute()

  // Update vote totals
  const newTotalVotes = Number((vote as any).total_votes) + 1
  const newTotalAliquot = Number((vote as any).total_aliquot_voted) + aliquotWeight

  await kysely
    .updateTable('condo_votes')
    .set({
      total_votes: newTotalVotes,
      total_aliquot_voted: newTotalAliquot.toFixed(5),
      updated_at: new Date(),
    })
    .where('id', '=', vote_id)
    .execute()

  // Emit the real-time broadcast event via the DI event bus (no cross-module imports)
  if (eventBus) {
    await eventBus.emitEvent('condo_comms.vote.cast', {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      id: vote_id,
      unit_id,
      choice,
      total_votes: newTotalVotes,
      total_aliquot_voted: newTotalAliquot.toFixed(5),
    })
  }

  return Response.json({ success: true, choice, aliquot_weight: aliquotWeight })
}

export const openApi = {}
