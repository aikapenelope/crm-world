/**
 * API route: Generate enrollment certificate PDF
 * GET /api/enrollment/constancia-pdf?student_id=XXX&school_year=2025-2026
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { ConstanciaInscripcion, type ConstanciaPDFData } from '../../documents/ConstanciaInscripcion'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['enrollment.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const studentId = url.searchParams.get('student_id')
  const schoolYear = url.searchParams.get('school_year')
  const purpose = url.searchParams.get('purpose')
  const issuedTo = url.searchParams.get('issued_to')

  if (!studentId) return Response.json({ error: 'student_id is required' }, { status: 400 })

  const student = await kysely.selectFrom('students').selectAll()
    .where('id', '=', studentId)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })
  const st = student as any

  // Get enrollment application for the school year (to get enrollment date)
  let enrollmentDate: string | null = null
  let resolvedSchoolYear = schoolYear ?? ''

  if (!resolvedSchoolYear) {
    const activePeriod = await kysely.selectFrom('grade_periods')
      .select(['school_year'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
    resolvedSchoolYear = (activePeriod as any)?.school_year ?? ''
  }

  // Try to find enrollment date
  try {
    const app = await kysely.selectFrom('enrollment_applications')
      .select(['created_at'])
      .where('student_id', '=', studentId)
      .where('tenant_id', '=', scope.tenantId)
      .where('status', '=', 'approved')
      .orderBy('created_at', 'desc')
      .executeTakeFirst()
    if (app) enrollmentDate = (app as any).created_at
  } catch { /* enrollment may not exist */ }

  // Try to get student cedula/CI
  let cedula: string | null = null
  try {
    const contact = await kysely.selectFrom('customers')
      .select(['national_id'])
      .where('id', '=', st.contact_id)
      .executeTakeFirst()
    cedula = (contact as any)?.national_id ?? null
  } catch { /* customers table lookup failed */ }

  const org = await loadOrgBranding(kysely, scope)

  const data: ConstanciaPDFData = {
    org,
    schoolYear: resolvedSchoolYear,
    studentFullName: `${st.first_name} ${st.last_name}`,
    cedula,
    gradeLabel: GRADE_LABELS[st.grade_level] ?? st.grade_level,
    section: st.section ?? 'A',
    enrollmentDate,
    issuedTo: issuedTo ?? null,
    purpose: purpose ?? null,
    id: studentId,
  }

  const stream = await renderToStream(React.createElement(ConstanciaInscripcion, { data }))
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const pdfBuffer = Buffer.concat(chunks)

  const safeName = `${st.last_name}-${st.first_name}`.replace(/[^a-zA-Z0-9-]/g, '-')
  const filename = `constancia-${safeName}.pdf`

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
