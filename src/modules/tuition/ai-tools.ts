import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Tools: Education vertical
// Queries: students, tuition_charges, attendance_records, student_grades,
//          enrollment_applications, school_announcements
// =============================================================================

const getCollectionStatus = defineAiTool({
  name: 'school.get_collection_status',
  description: 'Get tuition collection status: overdue charges, total owed, payment rate. Answer "¿cuánto se debe de mensualidades?" or who has unpaid fees.',
  isMutation: false,
  requiredFeatures: ['tuition.view'],
  inputSchema: z.object({
    status: z.enum(['pending', 'overdue', 'paid']).optional().describe('Filter by charge status'),
    period: z.string().optional().describe('School period e.g. "2026-01"'),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('tuition_charges')
      .select(['id', 'student_id', 'amount', 'status', 'due_date', 'period_month'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.status) query = query.where('status', '=', args.status)
    if (args.period) query = query.where('period_month', '=', args.period)

    const charges = await query.limit(args.limit * 3).execute()
    const all = charges as any[]

    const overdue = all.filter((c: any) => c.status === 'overdue')
    const pending = all.filter((c: any) => c.status === 'pending')
    const paid = all.filter((c: any) => c.status === 'paid')
    const totalOverdue = overdue.reduce((s: number, c: any) => s + Number(c.amount), 0)
    const totalPending = pending.reduce((s: number, c: any) => s + Number(c.amount), 0)
    const paymentRate = all.length > 0 ? Math.round((paid.length / all.length) * 100) : 0

    return {
      total_charges: all.length,
      overdue_count: overdue.length,
      pending_count: pending.length,
      paid_count: paid.length,
      total_overdue: totalOverdue.toFixed(2),
      total_pending: totalPending.toFixed(2),
      payment_rate: paymentRate,
      currency: 'USD',
    }
  },
})

const getAttendanceAlerts = defineAiTool({
  name: 'school.get_attendance_alerts',
  description: 'Get students with low attendance. Answer "¿qué estudiantes tienen baja asistencia?" or attendance overview.',
  isMutation: false,
  requiredFeatures: ['attendance.view'],
  inputSchema: z.object({
    min_absence_days: z.number().int().min(1).default(5).describe('Minimum number of absence days to flag'),
    limit: z.number().int().min(1).max(30).default(15),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const summaries = await kysely
      .selectFrom('attendance_summary')
      .select(['student_id', 'period', 'total_days', 'present_days', 'absent_days', 'attendance_rate'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('absent_days', '>=', args.min_absence_days)
      .orderBy('absent_days', 'desc')
      .limit(args.limit)
      .execute()

    const all = summaries as any[]

    return {
      flagged_students: all.length,
      students: all.map((s: any) => ({
        student_id: s.student_id,
        period: s.period,
        present: s.present_days,
        absent: s.absent_days,
        attendance_rate: s.attendance_rate,
      })),
      message: `${all.length} estudiantes con ${args.min_absence_days}+ días de ausencia`,
    }
  },
})

const getEnrollmentSummary = defineAiTool({
  name: 'school.get_enrollment_summary',
  description: 'Get enrollment status: pending applications, approved, rejected. Answer "¿cómo va la inscripción?" or enrollment pipeline.',
  isMutation: false,
  requiredFeatures: ['enrollment.view'],
  inputSchema: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'waitlisted']).optional(),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('enrollment_applications')
      .select(['id', 'status', 'grade_applying_for', 'created_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.status) query = query.where('status', '=', args.status)

    const apps = await query.execute()
    const all = apps as any[]

    // Count by status
    const byCounts: Record<string, number> = {}
    for (const a of all) {
      byCounts[a.status] = (byCounts[a.status] ?? 0) + 1
    }

    // Count by grade
    const byGrade: Record<string, number> = {}
    for (const a of all) {
      if (a.grade_applying_for) {
        byGrade[a.grade_applying_for] = (byGrade[a.grade_applying_for] ?? 0) + 1
      }
    }

    return {
      total_applications: all.length,
      by_status: byCounts,
      by_grade: byGrade,
      pending: all.filter((a: any) => a.status === 'pending').length,
    }
  },
})

const getGradesSummary = defineAiTool({
  name: 'school.get_grades_summary',
  description: 'Get grades performance: average scores, failing students, subject breakdown. Answer "¿cómo van las notas?" or academic performance.',
  isMutation: false,
  requiredFeatures: ['grades.view'],
  inputSchema: z.object({
    period_id: z.string().uuid().optional().describe('Grade period to analyze'),
    passing_threshold: z.number().min(0).max(100).default(10).describe('Minimum passing grade (Venezuelan scale 1-20, default ≥10)'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('student_grades')
      .select(['student_id', 'subject_id', 'score', 'period_id'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.period_id) query = query.where('period_id', '=', args.period_id)

    const grades = await query.execute()
    const all = grades as any[]

    const numericGrades = all.filter((g: any) => g.score != null)
    const failing = numericGrades.filter((g: any) => Number(g.score) < args.passing_threshold)
    const average = numericGrades.length > 0
      ? (numericGrades.reduce((s: number, g: any) => s + Number(g.score), 0) / numericGrades.length).toFixed(1)
      : '0.0'

    // Unique failing students
    const failingStudents = new Set(failing.map((g: any) => g.student_id))

    return {
      total_grade_records: all.length,
      average_score: average,
      failing_records: failing.length,
      failing_students_count: failingStudents.size,
      pass_rate: numericGrades.length > 0
        ? Math.round(((numericGrades.length - failing.length) / numericGrades.length) * 100)
        : 0,
    }
  },
})

const getStudentCount = defineAiTool({
  name: 'school.get_student_count',
  description: 'Get total student count and breakdown. Answer "¿cuántos alumnos tenemos?" or student roster overview.',
  isMutation: false,
  requiredFeatures: ['enrollment.view'],
  inputSchema: z.object({
    grade: z.string().optional().describe('Filter by grade level (e.g. "1er Grado")'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('students')
      .select(['id', 'grade', 'status'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.grade) query = query.where('grade', '=', args.grade)

    const students = await query.execute()
    const all = students as any[]

    const active = all.filter((s: any) => s.status === 'active' || !s.status)

    // Group by grade
    const byGrade: Record<string, number> = {}
    for (const s of active) {
      if (s.grade) {
        byGrade[s.grade] = (byGrade[s.grade] ?? 0) + 1
      }
    }

    return {
      total_students: all.length,
      active_students: active.length,
      by_grade: byGrade,
    }
  },
})

export const aiTools = [
  getCollectionStatus,
  getAttendanceAlerts,
  getEnrollmentSummary,
  getGradesSummary,
  getStudentCount,
]

export default aiTools
