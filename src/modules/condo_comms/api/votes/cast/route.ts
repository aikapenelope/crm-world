/**
 * Cast a vote — weighted by aliquot (Art. 23 LPH).
 * Validates: vote is open, unit hasn't voted, quorum tracking.
 * Emits condo_comms.vote.cast (clientBroadcast: true) so the vote
 * results page shows the live running tally without any polling.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['condo_comms.view'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const { vote_id, unit_id, choice } = body

  if (!vote_id || !unit_id || !choice) {
    return Response.json({ error: 'vote_id, unit_id, and choice are required' }, { status: 400 })
  }

  // Get vote
  const vote = await kysely
    .selectFrom('condo_votes')
    .selectAll()
    .where('id', '=', vote_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!vote) {
    return Response.json({ error: 'Vote not found' }, { status: 404 })
  }

  const v = vote as any
  if (v.status !== 'open') {
    return Response.json({ error: 'Vote is not open' }, { status: 400 })
  }

  // Check if unit already voted
  const existingCast = await kysely
    .selectFrom('condo_vote_casts')
    .select(['id'])
    .where('vote_id', '=', vote_id)
    .where('unit_id', '=', unit_id)
    .executeTakeFirst()

  if (existingCast) {
    return Response.json({ error: 'This unit has already voted' }, { status: 400 })
  }

  // Get unit aliquot
  const unit = await kysely
    .selectFrom('condo_units')
    .select(['aliquot_percent'])
    .where('id', '=', unit_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!unit) {
    return Response.json({ error: 'Unit not found' }, { status: 404 })
  }

  const aliquotWeight = (unit as any).aliquot_percent

  // Insert vote cast
  await kysely
    .insertInto('condo_vote_casts')
    .values({
      id: crypto.randomUUID(),
      vote_id,
      unit_id,
      choice,
      aliquot_weight: aliquotWeight,
      cast_at: new Date(),
    })
    .execute()

  // Update vote totals atomically
  const newTotalVotes = Number(v.total_votes) + 1
  const newTotalAliquot = Number(v.total_aliquot_voted) + Number(aliquotWeight)
  const quorumReached = newTotalAliquot >= Number(v.quorum_percent)

  await kysely
    .updateTable('condo_votes')
    .set({
      total_votes: newTotalVotes,
      total_aliquot_voted: newTotalAliquot.toFixed(5),
      updated_at: new Date(),
    })
    .where('id', '=', vote_id)
    .execute()

  // Emit — clientBroadcast: true pushes the updated totals to every browser
  // connected to this tenant. The votes results page uses useAppEvent() to
  // refresh the live tally counter without any polling.
  await emitLifecycle(eventsConfig, 'condo_comms.vote.cast', scope, {
    id: vote_id,
    unit_id,
    choice,
    total_votes: newTotalVotes,
    total_aliquot_voted: newTotalAliquot.toFixed(5),
    quorum_reached: quorumReached,
  })

  return Response.json({
    success: true,
    vote_id,
    unit_id,
    choice,
    aliquot_weight: aliquotWeight,
    total_votes: newTotalVotes,
    total_aliquot_voted: newTotalAliquot.toFixed(5),
    quorum_reached: quorumReached,
  })
}

export const openApi = {}
