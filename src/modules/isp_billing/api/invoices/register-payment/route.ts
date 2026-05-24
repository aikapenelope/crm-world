/**
 * POST /api/isp-billing/invoices/register-payment
 *
 * Registra un cobro. Actualiza el balance de la factura, cambia el estado
 * a 'paid' o 'partial', y emite el evento correspondiente para que
 * isp_subscribers reactive automáticamente el servicio si estaba suspendido.
 *
 * IGTF: se calcula automáticamente (3%) cuando el método de pago es en divisas
 * (zelle, efectivo_usd, binance, transferencia) o el pago es en USDT.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { registerPaymentSchema } from '../../../data/validators'

const IGTF_METHODS = new Set(['zelle', 'efectivo_usd', 'binance', 'transferencia'])
const IGTF_RATE = 0.03

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_billing.register_payment'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = registerPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  // Verificar que la factura existe y pertenece al tenant
  const invoice = await kysely
    .selectFrom('isp_invoices')
    .selectAll()
    .where('id', '=', data.invoice_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!invoice) {
    return Response.json({ error: 'Factura no encontrada' }, { status: 404 })
  }
  // Kysely selectAll() — define the fields we actually read
  type InvoiceRow = { status: string; paid_amount_usd: string | null; total_usd: string }
  const inv = invoice as InvoiceRow

  if (inv.status === 'paid' || inv.status === 'cancelled') {
    return Response.json({ error: `La factura ya está en estado: ${inv.status}` }, { status: 409 })
  }

  // Calcular IGTF si aplica (pago en divisas o USDT)
  const igtfApplies = data.igtf_applies ||
    IGTF_METHODS.has(data.payment_method) ||
    data.currency !== 'VES'

  const igtfAmount = igtfApplies
    ? String((parseFloat(data.amount_usd) * IGTF_RATE).toFixed(2))
    : '0.00'

  const now = new Date()

  // Registrar el pago
  const { v4 } = await import('uuid')
  await kysely.insertInto('isp_payments').values({
    id: v4(),
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    invoice_id: data.invoice_id,
    subscriber_id: data.subscriber_id,
    payment_date: data.payment_date,
    amount_usd: data.amount_usd,
    currency: data.currency,
    payment_method: data.payment_method,
    reference_number: data.reference_number ?? null,
    igtf_applies: igtfApplies,
    igtf_amount_usd: igtfAmount,
    bcv_rate_at_payment: data.bcv_rate_at_payment ?? null,
    amount_ves: data.amount_ves ?? null,
    confirmed_by: null,
    confirmed_at: now,
    photo_receipt_url: data.photo_receipt_url ?? null,
    notes: data.notes ?? null,
    created_at: now,
  }).execute()

  // Actualizar balance y estado de la factura
  const currentPaid = parseFloat(inv.paid_amount_usd ?? '0')
  const newPaid = (currentPaid + parseFloat(data.amount_usd)).toFixed(2)
  const totalUsd = parseFloat(inv.total_usd)
  const newBalance = Math.max(0, totalUsd - parseFloat(newPaid)).toFixed(2)
  const newStatus = parseFloat(newBalance) <= 0 ? 'paid' : 'partial'

  await kysely
    .updateTable('isp_invoices')
    .set({
      paid_amount_usd: newPaid,
      balance_usd: newBalance,
      status: newStatus,
      paid_at: newStatus === 'paid' ? now : null,
      updated_at: now,
    })
    .where('id', '=', data.invoice_id)
    .execute()

  // Actualizar last_payment_date del abonado
  await kysely
    .updateTable('isp_subscribers')
    .set({ last_payment_date: data.payment_date, updated_at: now })
    .where('id', '=', data.subscriber_id)
    .execute()

  // Emitir evento
  const eventId = newStatus === 'paid'
    ? 'isp_billing.invoice.paid'
    : 'isp_billing.invoice.partial_payment'

  await emitLifecycle(eventsConfig, eventId, scope, {
    invoice_id: data.invoice_id,
    subscriber_id: data.subscriber_id,
    payment_method: data.payment_method,
    amount_usd: data.amount_usd,
  })

  // Si se pagó la factura vencida, emitir reconexión para que isp_subscribers reactive el servicio
  if (newStatus === 'paid') {
    const subscriber = await kysely
      .selectFrom('isp_subscribers')
      .select(['service_status'])
      .where('id', '=', data.subscriber_id)
      .executeTakeFirst()

    type SubscriberServiceRow = { service_status: string }
    if ((subscriber as SubscriberServiceRow | undefined)?.service_status === 'suspended_overdue') {
      await emitLifecycle(eventsConfig, 'isp_billing.reconnect_triggered', scope, {
        subscriber_id: data.subscriber_id,
        invoice_id: data.invoice_id,
      })
    }
  }

  return Response.json({
    ok: true,
    invoice_id: data.invoice_id,
    new_status: newStatus,
    paid_amount_usd: newPaid,
    balance_usd: newBalance,
    igtf_amount_usd: igtfAmount,
    igtf_applies: igtfApplies,
  })
}

export const openApi = {}
