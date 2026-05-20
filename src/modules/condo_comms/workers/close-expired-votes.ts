/**
 * Worker: Close expired votes automatically.
 * Scheduled to run every hour. Finds open votes past their closes_at
 * timestamp and marks them as closed with final results.
 */

export const metadata = {
  queue: 'condo-comms-votes',
  id: 'condo-comms-close-expired-votes',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()
  const now = new Date()

  // Find open votes that have passed their closing time
  const expiredVotes = await kysely
    .selectFrom('condo_votes')
    .select(['id', 'title', 'building_id', 'total_votes', 'total_aliquot_voted', 'quorum_percent', 'options'])
    .where('status', '=', 'open')
    .where('closes_at', '<', now)
    .execute()

  let closed = 0

  for (const vote of expiredVotes as any[]) {
    // Calculate results
    const casts = await kysely
      .selectFrom('condo_vote_casts')
      .select(['choice', 'aliquot_weight'])
      .where('vote_id', '=', vote.id)
      .execute()

    // Tally by choice (weighted by aliquot)
    const tally: Record<string, number> = {}
    for (const cast of casts as any[]) {
      const choice = cast.choice as string
      tally[choice] = (tally[choice] ?? 0) + Number(cast.aliquot_weight)
    }

    const quorumReached = Number(vote.total_aliquot_voted) >= Number(vote.quorum_percent)

    // Determine winner
    const sortedChoices = Object.entries(tally).sort(([, a], [, b]) => b - a)
    const winner = sortedChoices.length > 0 ? sortedChoices[0][0] : null

    const results = {
      tally,
      winner,
      quorum_reached: quorumReached,
      total_votes: vote.total_votes,
      total_aliquot_voted: vote.total_aliquot_voted,
      closed_at: now.toISOString(),
    }

    await kysely
      .updateTable('condo_votes')
      .set({
        status: 'closed',
        results: JSON.stringify(results),
        updated_at: now,
      })
      .where('id', '=', vote.id)
      .execute()

    closed++
  }

  return {
    success: true,
    votes_closed: closed,
    timestamp: now.toISOString(),
  }
}
