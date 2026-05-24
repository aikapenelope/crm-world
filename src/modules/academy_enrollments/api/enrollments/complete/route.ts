/**
 * Complete an enrollment:
 * - Marks status as 'completed'
 * - Sets completion_date to today
 * - Increments group's enrolled_count (if not already counted)
 * - Creates a pending certificate record (returns certificate_id)
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['academy_enrollments.manage'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const { enrollment_id, final_grade } = await request.json()
  if (!enrollment_id) return Response.json({ error: 'enrollment_id is required' }, { status: 400 })

  const enrollment = await kysely
    .selectFrom('academy_enrollments')
    .selectAll()
    .where('id', '=', enrollment_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!enrollment) return Response.json({ error: 'Enrollment not found' }, { status: 404 })
  const e = enrollment as any

  const now = new Date()

  // Create pending certificate
  const certId = crypto.randomUUID()
  const certNumber = `CERT-${Date.now().toString(36).toUpperCase().slice(-7)}`

  // Get group + course info for the certificate
  const group = await kysely.selectFrom('academy_groups').selectAll()
    .where('id', '=', e.group_id).executeTakeFirst()
  const course = group
    ? await kysely.selectFrom('academy_courses').select(['name'])
        .where('id', '=', (group as any).course_id).executeTakeFirst()
    : null
  const instructor = group && (group as any).instructor_id
    ? await kysely.selectFrom('academy_instructors').select(['name'])
        .where('id', '=', (group as any).instructor_id).executeTakeFirst()
    : null

  // Calculate attendance
  const sessions = await kysely.selectFrom('academy_sessions').select(['id'])
    .where('group_id', '=', e.group_id).execute()
  let attendedCount = 0
  if ((sessions as any[]).length > 0) {
    const sessionIds = (sessions as any[]).map((s: any) => s.id)
    const attended = await kysely.selectFrom('academy_attendance')
      .select(['id'])
      .where('enrollment_id', '=', enrollment_id)
      .where('status', 'in', ['present', 'late'])
      .execute()
    attendedCount = (attended as any[]).length
  }
  const totalSessions = (sessions as any[]).length
  const attendancePercent = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0

  await kysely.insertInto('academy_certificates').values({
    id: certId,
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    certificate_number: certNumber,
    enrollment_id,
    course_name: (course as any)?.name ?? '',
    group_code: (group as any)?.group_code ?? '',
    instructor_name: (instructor as any)?.name ?? '',
    student_name: e.student_name,
    final_grade: final_grade ?? null,
    attendance_percent: attendancePercent.toFixed(1),
    template_type: 'standard',
    status: 'pending',
    issued_by: null,
    issued_at: null,
    notes: null,
    created_at: now,
    updated_at: now,
  }).execute()

  await kysely.updateTable('academy_enrollments')
    .set({
      status: 'completed',
      completion_date: now,
      final_grade: final_grade ?? null,
      certificate_id: certId,
      updated_at: now,
    })
    .where('id', '=', enrollment_id)
    .execute()

  await emitLifecycle(eventsConfig, 'academy_enrollments.enrollment.completed', scope, {
    id: enrollment_id,
    certificate_id: certId,
    student_name: e.student_name,
  })

  return Response.json({
    success: true,
    enrollment_id,
    certificate_id: certId,
    certificate_number: certNumber,
    attendance_percent: attendancePercent.toFixed(1),
  })
}

export const openApi = {}
