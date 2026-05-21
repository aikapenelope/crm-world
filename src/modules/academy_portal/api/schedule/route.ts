/**
 * Portal: Upcoming sessions for a student's enrollments.
 */
export const metadata = {
  GET: { requireCustomerAuth: false, requireAuth: false },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const phone = url.searchParams.get('phone')?.replace(/\D/g, '') ?? ''
  const enrollmentId = url.searchParams.get('enrollment_id')

  if (!phone && !enrollmentId) {
    return Response.json({ error: 'phone or enrollment_id required' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let eQuery = kysely.selectFrom('academy_enrollments').select(['id', 'group_id', 'course_name'])
    .where('tenant_id', '=', scope.tenantId).where('organization_id', '=', scope.organizationId)
    .where('status', '=', 'active').where('deleted_at', 'is', null)

  if (enrollmentId) {
    eQuery = eQuery.where('id', '=', enrollmentId)
  } else {
    eQuery = eQuery.where('student_phone', 'like', `%${phone.slice(-8)}%`)
  }

  const enrollments = await eQuery.execute()
  const groupIds = (enrollments as any[]).map((e: any) => e.group_id)

  if (groupIds.length === 0) return Response.json({ items: [] })

  const sessions = await kysely.selectFrom('academy_sessions')
    .select(['id', 'group_id', 'session_number', 'session_date', 'start_time', 'end_time', 'topic', 'session_type'])
    .where('group_id', 'in', groupIds)
    .where('status', '=', 'scheduled')
    .where('session_date', '>=', today)
    .where('session_date', '<=', in30Days)
    .orderBy('session_date', 'asc')
    .execute()

  // Add group info to each session
  const groupMap: Record<string, any> = {}
  for (const e of enrollments as any[]) {
    const group = await kysely.selectFrom('academy_groups').select(['group_code', 'online_link', 'location'])
      .where('id', '=', e.group_id).executeTakeFirst()
    if (group) groupMap[e.group_id] = { ...(group as any), course_name: e.course_name }
  }

  const enriched = (sessions as any[]).map((s: any) => ({
    ...s,
    group_code: groupMap[s.group_id]?.group_code ?? '',
    course_name: groupMap[s.group_id]?.course_name ?? '',
    online_link: groupMap[s.group_id]?.online_link ?? null,
    location: groupMap[s.group_id]?.location ?? null,
  }))

  return Response.json({ items: enriched })
}

export const openApi = {}
