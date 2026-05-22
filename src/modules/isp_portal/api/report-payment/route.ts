/**
 * POST /api/isp-portal/report-payment
 *
 * El abonado reporta un pago realizado (sube comprobante o referencia).
 * Crea un registro pendiente de confirmación por el operador.
 */
import { z } from 'zod'

const bodySchema = z.object({
  invoice_id: z.string().uuid(),
  payment_method: z.enum(['zelle', 'pago_movil', 'efectivo_usd', 'efectivo_ves', 'transferencia', 'binance', 'otro']),
  reference_number: z.string().max(100).nullable().optional(),
  payment_date: z.string().date(),
  amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  notes: z.string().max(500).nullable().optional(),
})

export const metadata = {
  POST: { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.report_payment'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.entityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  // Verificar que la factura pertenece al abonado autenticado
  const subscriber = await kysely
    .selectFrom('isp_subscribers').select(['id'])
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })

  const invoice = await kysely
    .selectFrom('isp_invoices').select(['id', 'status', 'subscriber_id'])
    .where('id', '=', parsed.data.invoice_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!invoice || (invoice as any).subscriber_id !== (subscriber as any).id) {
    return Response.json({ error: 'Factura no encontrada' }, { status: 404 })
  }

  if ((invoice as any).status === 'paid') {
    return Response.json({ error: 'Esta factura ya está pagada' }, { status: 409 })
  }

  // Crear un ticket de tipo "payment_reported" con los datos del pago
  // El operador lo verifica y registra el pago formal
  const { v4 } = await import('uuid')
  const now = new Date()

  const count = await kysely
    .selectFrom('isp_support_tickets')
    .select(kysely.fn.count<number>('id').as('count'))
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()
  const seq = String(Number((count as any)?.count ?? 0) + 1).padStart(5, '0')
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const ticketNumber = `TKT-${yearMonth}-${seq}`

  const d = parsed.data
  const paymentSummary = [
    `Método: ${d.payment_method}`,
    d.reference_number ? `Referencia: ${d.reference_number}` : null,
    `Monto: USD ${d.amount_usd}`,
    `Fecha: ${d.payment_date}`,
    d.notes ? `Notas: ${d.notes}` : null,
  ].filter(Boolean).join('\n')

  await kysely.insertInto('isp_support_tickets').values({
    id: v4(),
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    ticket_number: ticketNumber,
    subscriber_id: (subscriber as any).id,
    type: 'inquiry',
    origin: 'portal',
    status: 'open',
    priority: 'high',
    subject: `Reporte de pago — ${d.amount_usd} USD vía ${d.payment_method}`,
    description: `El abonado reporta un pago pendiente de confirmar:\n\n${paymentSummary}`,
    sla_hours: 4,
    sla_breached: false,
    created_at: now,
    updated_at: now,
  }).execute()

  return Response.json({
    ok: true,
    message: 'Pago reportado correctamente. El equipo lo verificará en las próximas horas.',
    ticket_number: ticketNumber,
  }, { status: 201 })
}

export const openApi = {}
