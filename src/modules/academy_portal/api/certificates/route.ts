/**
 * Portal: Issued certificates for a student.
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

  let eQuery = kysely.selectFrom('academy_enrollments').select(['id'])
    .where('tenant_id', '=', scope.tenantId).where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)

  if (enrollmentId) {
    eQuery = eQuery.where('id', '=', enrollmentId)
  } else {
    eQuery = eQuery.where('student_phone', 'like', `%${phone.slice(-8)}%`)
  }

  const enrollments = await eQuery.execute()
  const enrollmentIds = (enrollments as any[]).map((e: any) => e.id)

  if (enrollmentIds.length === 0) return Response.json({ items: [] })

  const certs = await kysely.selectFrom('academy_certificates')
    .selectAll()
    .where('enrollment_id', 'in', enrollmentIds)
    .where('status', '=', 'issued')
    .orderBy('issued_at', 'desc')
    .execute()

  return Response.json({ items: certs })
}

export const openApi = {}
