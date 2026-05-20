import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/postgresql'

/**
 * GET /api/tuition/whatsapp-cobro?status=pending&status=overdue
 *
 * Returns a list of pending/overdue charges with representative phone numbers
 * and pre-formatted WhatsApp messages ready to send via wa.me links.
 *
 * Each item includes:
 * - studentName, gradeLabel, representativeName, phone
 * - amount, currency, concept, dueDate
 * - waLink: full wa.me URL with pre-filled message
 * - message: the plain text message
 */

const querySchema = z.object({
  status: z.string().default('overdue'),
  period_month: z.string().optional(),
  grade_level: z.string().optional(),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['tuition.view_debtors'] },
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const params = querySchema.parse({
      status: url.searchParams.get('status') ?? 'overdue',
      period_month: url.searchParams.get('period_month') ?? undefined,
      grade_level: url.searchParams.get('grade_level') ?? undefined,
    })

    const { resolveOrganizationScopeForRequest } = await import(
      '@open-mercato/core/modules/directory/utils/organizationScope'
    )
    const scope = await resolveOrganizationScopeForRequest(request)
    if (!scope) return NextResponse.json({ error: 'No scope' }, { status: 401 })

    const { createRequestContainer } = await import('@open-mercato/shared/lib/di/container')
    const container = await createRequestContainer()
    const em = container.resolve('em') as EntityManager
    const kysely = (em as any).getKysely()

    // Get organization name for message
    const org = await kysely
      .selectFrom('organizations')
      .select(['name'])
      .where('id', '=', scope.organizationId)
      .executeTakeFirst()

    const schoolName = org?.name ?? 'el colegio'

    // Get charges with status filter
    const statuses = params.status.split(',').map((s) => s.trim())

    let chargesQuery = kysely
      .selectFrom('tuition_charges')
      .selectAll()
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('status', 'in', statuses)
      .where('deleted_at', 'is', null)
      .orderBy('due_date', 'asc')

    if (params.period_month) {
      chargesQuery = chargesQuery.where('period_month', '=', params.period_month)
    }

    const charges = await chargesQuery.execute()

    if (charges.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // Get students for these charges
    const studentIds = [...new Set(charges.map((c: any) => c.student_id))]
    const students = await kysely
      .selectFrom('students')
      .select(['id', 'first_name', 'last_name', 'grade_level', 'section'])
      .where('id', 'in', studentIds)
      .execute()

    const studentMap = new Map(students.map((s: any) => [s.id, s]))

    // Get primary representatives with phone numbers
    const reps = await kysely
      .selectFrom('student_representatives')
      .select(['student_id', 'contact_id', 'is_primary'])
      .where('tenant_id', '=', scope.tenantId)
      .where('student_id', 'in', studentIds)
      .where('is_primary', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    const repContactIds = [...new Set(reps.map((r: any) => r.contact_id))]

    // Get contact phone numbers from customers module
    let contacts: any[] = []
    if (repContactIds.length > 0) {
      contacts = await kysely
        .selectFrom('customer_people')
        .select(['id', 'display_name', 'primary_phone'])
        .where('id', 'in', repContactIds)
        .execute()
    }

    const contactMap = new Map(contacts.map((c: any) => [c.id, c]))
    const repByStudent = new Map(reps.map((r: any) => [r.student_id, r]))

    // Build response items with wa.me links
    const items = charges.map((charge: any) => {
      const student = studentMap.get(charge.student_id)
      const rep = repByStudent.get(charge.student_id)
      const contact = rep ? contactMap.get(rep.contact_id) : null

      const studentName = student
        ? `${student.first_name} ${student.last_name}`
        : 'Estudiante'
      const gradeLabel = GRADE_LABELS[student?.grade_level] ?? student?.grade_level ?? ''
      const representativeName = contact?.display_name ?? 'Representante'
      const phone = contact?.primary_phone ?? null

      const amount = Number(charge.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })
      const dueDate = new Date(charge.due_date).toLocaleDateString('es-VE')

      // Build WhatsApp message
      const message = buildCobroMessage({
        schoolName,
        representativeName,
        studentName,
        gradeLabel,
        section: student?.section ?? '',
        concept: charge.description ?? `Mensualidad ${charge.period_month}`,
        amount,
        currency: charge.currency,
        dueDate,
        isOverdue: charge.status === 'overdue',
      })

      // Build wa.me link (clean phone number)
      const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '').replace(/^\+/, '') : null
      const waLink = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : null

      return {
        chargeId: charge.id,
        studentId: charge.student_id,
        studentName,
        gradeLabel,
        section: student?.section ?? '',
        representativeName,
        phone,
        amount: charge.amount,
        currency: charge.currency,
        concept: charge.description ?? `Mensualidad ${charge.period_month}`,
        periodMonth: charge.period_month,
        dueDate,
        status: charge.status,
        lateFee: charge.late_fee_applied,
        message,
        waLink,
      }
    })

    return NextResponse.json({
      items,
      total: items.length,
      withPhone: items.filter((i: any) => i.waLink).length,
      withoutPhone: items.filter((i: any) => !i.waLink).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// =============================================================================
// Message Builder
// =============================================================================

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

type CobroMessageParams = {
  schoolName: string
  representativeName: string
  studentName: string
  gradeLabel: string
  section: string
  concept: string
  amount: string
  currency: string
  dueDate: string
  isOverdue: boolean
}

function buildCobroMessage(params: CobroMessageParams): string {
  const greeting = `Estimado/a ${params.representativeName},`
  const intro = params.isOverdue
    ? `Le informamos que el siguiente pago se encuentra *vencido*:`
    : `Le recordamos el siguiente pago pendiente:`

  return `${greeting}

${intro}

*Estudiante:* ${params.studentName}
*Grado:* ${params.gradeLabel} - Sección ${params.section}
*Concepto:* ${params.concept}
*Monto:* ${params.currency} ${params.amount}
*Vencimiento:* ${params.dueDate}

Puede realizar su pago por: Pago Móvil, Zelle, Binance o Transferencia.

Una vez realizado, por favor envíe el comprobante por este medio.

Gracias,
_${params.schoolName}_`
}

export const openApi = {}
