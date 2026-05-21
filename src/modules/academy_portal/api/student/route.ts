/**
 * Portal: Student dashboard data.
 * Identified by student_phone query param.
 * Returns: active enrollments, balance per enrollment, next sessions.
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

  // Find enrollments
  let query = kysely
    .selectFrom('academy_enrollments')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('status', 'in', ['active', 'pending_payment', 'completed'])
    .where('deleted_at', 'is', null)

  if (enrollmentId) {
    query = query.where('id', '=', enrollmentId)
  } else {
    // Normalize phone for comparison
    query = query.where('student_phone', 'like', `%${phone.slice(-8)}%`)
  }

  const enrollments = await query.orderBy('created_at', 'desc').execute()

  // Enrich each enrollment with group + course info + payments
  const result = []
  const today = new Date().toISOString().slice(0, 10)

  for (const e of enrollments as any[]) {
    const [group, payments, nextSession] = await Promise.all([
      kysely.selectFrom('academy_groups').selectAll().where('id', '=', e.group_id).executeTakeFirst(),
      kysely.selectFrom('academy_payments').select(['amount', 'status'])
        .where('enrollment_id', '=', e.id).where('status', '=', 'confirmed').execute(),
      kysely.selectFrom('academy_sessions').select(['id', 'session_number', 'session_date', 'start_time', 'end_time', 'topic'])
        .where('group_id', '=', e.group_id).where('status', '=', 'scheduled')
        .where('session_date', '>=', today).orderBy('session_date', 'asc').executeTakeFirst(),
    ])

    let courseName = ''
    if (group) {
      const course = await kysely.selectFrom('academy_courses').select(['name'])
        .where('id', '=', (group as any).course_id).executeTakeFirst()
      courseName = (course as any)?.name ?? ''
    }

    const paidTotal = (payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
    const remaining = Math.max(0, Number(e.price_agreed) - paidTotal)

    result.push({
      enrollment_id: e.id,
      enrollment_number: e.enrollment_number,
      student_name: e.student_name,
      course_name: courseName,
      group_code: (group as any)?.group_code ?? '',
      schedule_days: (group as any)?.schedule_days ?? [],
      schedule_time: (group as any)?.schedule_time ?? '',
      location: (group as any)?.location ?? null,
      online_link: (group as any)?.online_link ?? null,
      start_date: (group as any)?.start_date ?? null,
      end_date: (group as any)?.end_date ?? null,
      status: e.status,
      price_agreed: e.price_agreed,
      currency: e.currency,
      paid_total: paidTotal.toFixed(2),
      remaining: remaining.toFixed(2),
      final_grade: e.final_grade,
      certificate_id: e.certificate_id,
      next_session: nextSession ? {
        session_number: (nextSession as any).session_number,
        session_date: (nextSession as any).session_date,
        start_time: (nextSession as any).start_time,
        end_time: (nextSession as any).end_time,
        topic: (nextSession as any).topic,
      } : null,
    })
  }

  return Response.json({ items: result })
}

export const openApi = {}
