import { defineAiTool } from '@open-mercato/ai-assistant'

const getOverview = defineAiTool({
  name: 'academy.get_overview',
  description: 'Get academy overview: active courses, groups in progress/scheduled, total active enrollments, total pending payments.',
  parameters: {},
  async execute(_params: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const tenantId: string = ctx.tenantId ?? ''
    const organizationId: string = ctx.organizationId ?? ''

    const [courses, groups, enrollments] = await Promise.all([
      kysely.selectFrom('academy_courses').select(['is_active'])
        .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null).execute(),
      kysely.selectFrom('academy_groups').select(['status', 'enrolled_count', 'max_students'])
        .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null).execute(),
      kysely.selectFrom('academy_enrollments').select(['status', 'price_agreed'])
        .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null).execute(),
    ])

    const activeCourses = (courses as any[]).filter((c: any) => c.is_active).length
    const inProgressGroups = (groups as any[]).filter((g: any) => g.status === 'in_progress')
    const scheduledGroups = (groups as any[]).filter((g: any) => g.status === 'scheduled').length
    const activeEnrollments = (enrollments as any[]).filter((e: any) => e.status === 'active').length
    const completedEnrollments = (enrollments as any[]).filter((e: any) => e.status === 'completed').length
    const totalEnrolled = inProgressGroups.reduce((s: number, g: any) => s + Number(g.enrolled_count), 0)
    const totalCapacity = inProgressGroups.reduce((s: number, g: any) => s + Number(g.max_students), 0)

    return {
      courses: { active: activeCourses, total: (courses as any[]).length },
      groups: {
        in_progress: inProgressGroups.length,
        scheduled: scheduledGroups,
        occupancy_rate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
      },
      enrollments: { active: activeEnrollments, completed: completedEnrollments },
    }
  },
})

const getGroupStatus = defineAiTool({
  name: 'academy.get_group_status',
  description: 'Get status of groups in progress: code, course name, instructor, enrolled/max, sessions completed, next session date.',
  parameters: {},
  async execute(_params: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const tenantId: string = ctx.tenantId ?? ''
    const organizationId: string = ctx.organizationId ?? ''
    const today = new Date().toISOString().slice(0, 10)

    const groups = await kysely.selectFrom('academy_groups').selectAll()
      .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
      .where('status', '=', 'in_progress').where('deleted_at', 'is', null).execute()

    const result = []
    for (const g of groups as any[]) {
      const [course, instructor, completedSessions, nextSession] = await Promise.all([
        kysely.selectFrom('academy_courses').select(['name']).where('id', '=', g.course_id).executeTakeFirst(),
        g.instructor_id ? kysely.selectFrom('academy_instructors').select(['name']).where('id', '=', g.instructor_id).executeTakeFirst() : Promise.resolve(null),
        kysely.selectFrom('academy_sessions').select(['id']).where('group_id', '=', g.id).where('status', '=', 'completed').execute(),
        kysely.selectFrom('academy_sessions').select(['session_date', 'start_time', 'topic']).where('group_id', '=', g.id).where('status', '=', 'scheduled').where('session_date', '>=', today).orderBy('session_date', 'asc').executeTakeFirst(),
      ])
      result.push({
        group_code: g.group_code,
        course_name: (course as any)?.name ?? '',
        instructor_name: (instructor as any)?.name ?? 'Sin asignar',
        enrolled: g.enrolled_count,
        max_students: g.max_students,
        occupancy_percent: Math.round((g.enrolled_count / g.max_students) * 100),
        sessions_completed: (completedSessions as any[]).length,
        sessions_total: g.sessions_count,
        progress_percent: g.sessions_count > 0 ? Math.round(((completedSessions as any[]).length / g.sessions_count) * 100) : 0,
        next_session: nextSession ? `${(nextSession as any).session_date} ${(nextSession as any).start_time}` : 'Sin sesiones programadas',
      })
    }
    return { groups: result }
  },
})

const getPendingPayments = defineAiTool({
  name: 'academy.get_pending_payments',
  description: 'Get enrollments with remaining balance to collect, sorted by amount descending.',
  parameters: {},
  async execute(_params: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const tenantId: string = ctx.tenantId ?? ''
    const organizationId: string = ctx.organizationId ?? ''

    const enrollments = await kysely.selectFrom('academy_enrollments')
      .select(['id', 'student_name', 'student_phone', 'group_id', 'price_agreed', 'currency'])
      .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
      .where('status', 'in', ['active', 'pending_payment']).where('deleted_at', 'is', null).execute()

    const result = []
    for (const e of enrollments as any[]) {
      const payments = await kysely.selectFrom('academy_payments').select(['amount'])
        .where('enrollment_id', '=', e.id).where('status', '=', 'confirmed').execute()
      const paid = (payments as any[]).reduce((s: number, p: any) => s + Number(p.amount), 0)
      const remaining = Number(e.price_agreed) - paid
      if (remaining <= 0) continue
      const group = await kysely.selectFrom('academy_groups').select(['group_code']).where('id', '=', e.group_id).executeTakeFirst()
      result.push({
        student_name: e.student_name,
        phone: e.student_phone,
        group_code: (group as any)?.group_code ?? '',
        price_agreed: Number(e.price_agreed),
        paid_total: paid,
        remaining,
        currency: e.currency,
      })
    }
    return { debtors: result.sort((a, b) => b.remaining - a.remaining), total_pending: result.reduce((s, d) => s + d.remaining, 0) }
  },
})

const getAttendanceReport = defineAiTool({
  name: 'academy.get_attendance_report',
  description: 'Get attendance percentage per active group. Alerts groups below 75% average.',
  parameters: {},
  async execute(_params: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const tenantId: string = ctx.tenantId ?? ''
    const organizationId: string = ctx.organizationId ?? ''

    const groups = await kysely.selectFrom('academy_groups').select(['id', 'group_code', 'course_id'])
      .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
      .where('status', '=', 'in_progress').execute()

    const result = []
    for (const g of groups as any[]) {
      const sessions = await kysely.selectFrom('academy_sessions').select(['id'])
        .where('group_id', '=', g.id).where('status', '=', 'completed').execute()
      if ((sessions as any[]).length === 0) continue

      const sessionIds = (sessions as any[]).map((s: any) => s.id)
      const attendance = await kysely.selectFrom('academy_attendance').select(['status'])
        .where('session_id', 'in', sessionIds).execute()

      const total = (attendance as any[]).length
      const present = (attendance as any[]).filter((a: any) => ['present', 'late'].includes(a.status)).length
      const pct = total > 0 ? Math.round((present / total) * 100) : 0

      const course = await kysely.selectFrom('academy_courses').select(['name']).where('id', '=', g.course_id).executeTakeFirst()
      result.push({
        group_code: g.group_code,
        course_name: (course as any)?.name ?? '',
        attendance_percent: pct,
        sessions_with_data: (sessions as any[]).length,
        alert: pct < 75 ? '⚠️ Asistencia baja' : null,
      })
    }
    return { groups: result.sort((a, b) => a.attendance_percent - b.attendance_percent) }
  },
})

const getCertificatesPending = defineAiTool({
  name: 'academy.get_certificates_pending',
  description: 'Get certificates pending issuance, grouped by course.',
  parameters: {},
  async execute(_params: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const tenantId: string = ctx.tenantId ?? ''
    const organizationId: string = ctx.organizationId ?? ''

    const certs = await kysely.selectFrom('academy_certificates')
      .select(['certificate_number', 'student_name', 'course_name', 'group_code', 'final_grade', 'attendance_percent', 'created_at'])
      .where('tenant_id', '=', tenantId).where('organization_id', '=', organizationId)
      .where('status', '=', 'pending').orderBy('created_at', 'desc').execute()

    return { pending_count: (certs as any[]).length, certificates: certs }
  },
})

export const aiTools = [
  getOverview,
  getGroupStatus,
  getPendingPayments,
  getAttendanceReport,
  getCertificatesPending,
]

export default aiTools
