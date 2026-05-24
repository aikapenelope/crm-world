/**
 * API route: Generate school report card (boletín) PDF
 * GET /api/grades/boleta-pdf?student_id=XXX&period_id=XXX
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { BoletinEscolar, type BoletinPDFData } from '../../documents/BoletinEscolar'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['grades.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const studentId = url.searchParams.get('student_id')
  const periodId = url.searchParams.get('period_id')

  if (!studentId) return Response.json({ error: 'student_id is required' }, { status: 400 })

  // Load student
  const student = await kysely.selectFrom('students').selectAll()
    .where('id', '=', studentId)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })
  const st = student as any

  // Load periods for this school year
  let periodsQuery = kysely.selectFrom('grade_periods')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .orderBy('period_number', 'asc')

  // If a specific period was requested, get its school year and load all periods for that year
  if (periodId) {
    const targetPeriod = await kysely.selectFrom('grade_periods').select(['school_year'])
      .where('id', '=', periodId).executeTakeFirst()
    if (targetPeriod) {
      periodsQuery = periodsQuery.where('school_year', '=', (targetPeriod as any).school_year)
    }
  } else {
    // Get most recent active school year
    const activePeriod = await kysely.selectFrom('grade_periods').select(['school_year'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
    if (activePeriod) {
      periodsQuery = periodsQuery.where('school_year', '=', (activePeriod as any).school_year)
    }
  }

  const periods = await periodsQuery.execute()
  if ((periods as any[]).length === 0) {
    return Response.json({ error: 'No grade periods found' }, { status: 404 })
  }

  const schoolYear = (periods as any[])[0]?.school_year ?? ''
  const periodIds = (periods as any[]).map((p: any) => p.id)

  // Load all subjects
  const subjects = await kysely.selectFrom('subjects').selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)
    .orderBy('sort_order', 'asc')
    .execute()

  // Load grades for this student across all periods
  const grades = await kysely.selectFrom('student_grades').selectAll()
    .where('student_id', '=', studentId)
    .where('period_id', 'in', periodIds)
    .execute()

  // Build grades map: subject_id → period_id → score
  const gradesMap = new Map<string, Map<string, string | null>>()
  for (const g of grades as any[]) {
    if (!gradesMap.has(g.subject_id)) gradesMap.set(g.subject_id, new Map())
    gradesMap.get(g.subject_id)!.set(g.period_id, g.qualitative_score ?? g.score ?? null)
  }

  // Get observations (last period, per subject)
  const obsMap = new Map<string, string | null>()
  for (const g of grades as any[]) {
    obsMap.set(g.subject_id, g.observations ?? null)
  }

  // Load attendance summary
  let attendanceSummary = null
  try {
    const attendanceRows = await kysely.selectFrom('attendance_records')
      .select(['status'])
      .where('student_id', '=', studentId)
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .execute()

    if ((attendanceRows as any[]).length > 0) {
      const a = attendanceRows as any[]
      attendanceSummary = {
        total_days: a.length,
        present_days: a.filter(r => r.status === 'present').length,
        absent_days: a.filter(r => r.status === 'absent').length,
        late_days: a.filter(r => r.status === 'late').length,
      }
    }
  } catch { /* attendance table may not exist in all setups */ }

  const org = await loadOrgBranding(kysely, scope)

  const data: BoletinPDFData = {
    org,
    schoolYear,
    studentName: `${st.first_name} ${st.last_name}`,
    gradeLabel: GRADE_LABELS[st.grade_level] ?? st.grade_level,
    section: st.section ?? 'A',
    periods: (periods as any[]).map((p: any) => ({
      name: p.name,
      period_number: p.period_number,
    })),
    subjects: (subjects as any[]).map((sub: any) => ({
      subject_name: sub.name,
      subject_code: sub.code,
      is_qualitative: sub.is_qualitative,
      scores: (periods as any[]).map((p: any) =>
        gradesMap.get(sub.id)?.get(p.id) ?? null
      ),
      observations: obsMap.get(sub.id) ?? null,
    })).filter(sub => sub.scores.some(s => s !== null)),
    attendanceSummary,
    id: studentId,
  }

  const stream = await renderToStream(React.createElement(BoletinEscolar, { data }))
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const pdfBuffer = Buffer.concat(chunks)

  const safeName = `${st.last_name}-${st.first_name}`.replace(/[^a-zA-Z0-9-]/g, '-')
  const filename = `boleta-${safeName}-${schoolYear}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-cache',
    },
  })
}

export const openApi = {}
