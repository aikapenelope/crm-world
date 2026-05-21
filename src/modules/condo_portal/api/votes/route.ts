/**
 * Portal: List votes (open and recent) for a building.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['condo_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('building_id')
  const unitId = url.searchParams.get('unit_id')

  if (!buildingId) {
    return Response.json({ error: 'building_id is required' }, { status: 400 })
  }

  const votes = await kysely
    .selectFrom('condo_votes')
    .select([
      'id', 'title', 'description', 'status', 'vote_type',
      'quorum_percent', 'total_aliquot_voted', 'total_votes',
      'start_date', 'end_date', 'created_at',
    ])
    .where('building_id', '=', buildingId)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .orderBy('created_at', 'desc')
    .limit(20)
    .execute()

  // Check if the unit has already voted in each vote
  let votedSet: Set<string> = new Set()
  if (unitId && votes.length > 0) {
    const voteIds = (votes as any[]).map((v: any) => v.id)
    const castVotes = await kysely
      .selectFrom('condo_vote_casts')
      .select(['vote_id'])
      .where('unit_id', '=', unitId)
      .where('vote_id', 'in', voteIds)
      .execute()
    votedSet = new Set((castVotes as any[]).map((c: any) => c.vote_id))
  }

  return Response.json({
    items: (votes as any[]).map((v: any) => ({
      ...v,
      already_voted: votedSet.has(v.id),
    })),
  })
}

export const openApi = {}
