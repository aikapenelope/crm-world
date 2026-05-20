import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/postgresql'
import {
  generateReceiptHtml,
  generateReceiptNumber,
  generateVerificationCode,
  type ReceiptData,
} from '../../services/receipt-generator'

/**
 * GET /api/tuition/receipts?payment_id=uuid
 *
 * Returns the receipt HTML for a specific payment.
 * Can be rendered as image client-side using html2canvas or similar.
 *
 * POST /api/tuition/receipts
 *
 * Generates a receipt for a payment and returns the HTML + metadata.
 * Body: { payment_id: string }
 */

const querySchema = z.object({
  payment_id: z.string().uuid(),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['tuition.view'] },
  POST: { requireAuth: true, requireFeatures: ['tuition.record_payment'] },
}

export async function GET(request: Request, ctx: any) {
  try {
    const url = new URL(request.url)
    const params = querySchema.parse({ payment_id: url.searchParams.get('payment_id') })

    const scope = ctx.scope as { tenantId: string; organizationId: string }
    if (!scope) return NextResponse.json({ error: 'No scope' }, { status: 401 })

    const em = ctx.container.resolve('em') as EntityManager
    const kysely = (em as any).getKysely()

    const receiptData = await buildReceiptData(kysely, scope, params.payment_id)
    if (!receiptData) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const html = generateReceiptHtml(receiptData)

    return NextResponse.json({
      html,
      receiptNumber: receiptData.receiptNumber,
      verificationCode: receiptData.verificationCode,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: any) {
  try {
    const body = await request.json()
    const { payment_id } = z.object({ payment_id: z.string().uuid() }).parse(body)

    const scope = ctx.scope as { tenantId: string; organizationId: string }
    if (!scope) return NextResponse.json({ error: 'No scope' }, { status: 401 })

    const em = ctx.container.resolve('em') as EntityManager
    const kysely = (em as any).getKysely()

    const receiptData = await buildReceiptData(kysely, scope, payment_id)
    if (!receiptData) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const html = generateReceiptHtml(receiptData)

    return NextResponse.json({
      html,
      data: receiptData,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// =============================================================================
// Helpers
// =============================================================================

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

const METHOD_LABELS: Record<string, string> = {
  pago_movil: 'Pago Móvil', zelle: 'Zelle', binance: 'Binance (USDT)',
  efectivo_usd: 'Efectivo USD', efectivo_ves: 'Efectivo Bs.',
  transferencia: 'Transferencia', debito: 'Punto de Venta',
}

async function buildReceiptData(
  kysely: any,
  scope: { tenantId: string; organizationId: string },
  paymentId: string,
): Promise<ReceiptData | null> {
  // Get payment
  const payment = await kysely
    .selectFrom('tuition_payments')
    .selectAll()
    .where('id', '=', paymentId)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!payment) return null

  // Get student
  const student = await kysely
    .selectFrom('students')
    .select(['first_name', 'last_name', 'grade_level', 'section'])
    .where('id', '=', payment.student_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!student) return null

  // Get charge for concept
  const charge = await kysely
    .selectFrom('tuition_charges')
    .select(['concept', 'period_month', 'description'])
    .where('id', '=', payment.charge_id)
    .executeTakeFirst()

  // Get organization name (school branding)
  const org = await kysely
    .selectFrom('organizations')
    .select(['name'])
    .where('id', '=', scope.organizationId)
    .executeTakeFirst()

  // Count existing receipts for sequential number
  const countResult = await kysely
    .selectFrom('tuition_payments')
    .select(kysely.fn.count('id').as('total'))
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  const sequence = parseInt(countResult?.total ?? '0')

  const conceptLabel = charge?.description
    ?? (charge?.concept === 'mensualidad' ? `Mensualidad ${charge?.period_month ?? ''}` : charge?.concept ?? 'Pago')

  return {
    schoolName: org?.name ?? 'Institución Educativa',
    schoolLogo: null, // TODO: resolve from tenant branding/directory
    studentName: `${student.first_name} ${student.last_name}`,
    gradeLabel: GRADE_LABELS[student.grade_level] ?? student.grade_level,
    section: student.section ?? 'A',
    receiptNumber: generateReceiptNumber('', sequence),
    concept: conceptLabel,
    amount: Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
    currency: payment.currency,
    paymentMethod: METHOD_LABELS[payment.payment_method_code] ?? payment.payment_method_code ?? 'No especificado',
    reference: payment.reference,
    paymentDate: new Date(payment.payment_date).toLocaleDateString('es-VE'),
    exchangeRate: payment.exchange_rate ? String(payment.exchange_rate) : null,
    amountLocal: payment.exchange_rate
      ? (Number(payment.amount) * Number(payment.exchange_rate)).toLocaleString('es-VE', { minimumFractionDigits: 2 })
      : null,
    generatedAt: new Date().toLocaleString('es-VE'),
    verificationCode: generateVerificationCode(paymentId),
  }
}

export const openApi = {}
