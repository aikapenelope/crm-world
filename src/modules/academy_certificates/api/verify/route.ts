/**
 * Public certificate verification endpoint.
 * No authentication required — intentionally public so third parties
 * (employers, universities) can verify a certificate by its number.
 *
 * Returns only the minimum public data: student name, course, dates.
 * Never returns enrollment_id, payment data, or internal IDs.
 */
export const metadata = {
  GET: { requireAuth: false },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const number = url.searchParams.get('number')?.trim().toUpperCase()

  if (!number) {
    return Response.json({ valid: false, error: 'certificate_number is required' }, { status: 400 })
  }

  const cert = await kysely
    .selectFrom('academy_certificates')
    .select([
      'certificate_number', 'student_name', 'course_name', 'group_code',
      'instructor_name', 'final_grade', 'attendance_percent',
      'issued_at', 'issued_by', 'status', 'tenant_id',
    ])
    .where('certificate_number', '=', number)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!cert || (cert as any).status !== 'issued') {
    return Response.json({ valid: false, error: 'Certificate not found or not issued' }, { status: 404 })
  }

  const c = cert as any

  // Return only public-safe fields
  return Response.json({
    valid: true,
    certificate_number: c.certificate_number,
    student_name: c.student_name,
    course_name: c.course_name,
    group_code: c.group_code,
    instructor_name: c.instructor_name || null,
    final_grade: c.final_grade || null,
    attendance_percent: c.attendance_percent || null,
    issued_at: c.issued_at,
    issued_by: c.issued_by || null,
  })
}

export const openApi = {}
