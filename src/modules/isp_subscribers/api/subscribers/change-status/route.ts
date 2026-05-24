/**
 * POST /api/isp-subscribers/subscribers/change-status
 *
 * Cambia el estado del servicio de un abonado.
 * Emite el evento correspondiente para que otros módulos reaccionen
 * (isp_billing para corte/reconexión, notify para notificaciones al abonado).
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { changeStatusSchema } from '../../../data/validators'

const STATUS_EVENTS: Record<string, string> = {
  active:               'isp_subscribers.subscriber.activated',
  suspended_overdue:    'isp_subscribers.subscriber.suspended_overdue',
  suspended_voluntary:  'isp_subscribers.subscriber.suspended_overdue',
  cancelled:            'isp_subscribers.subscriber.cancelled',
}

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_subscribers.suspend'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = changeStatusSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const { subscriber_id, new_status, reason } = parsed.data

  // Verificar que el abonado existe y pertenece al tenant
  const subscriber = await kysely
    .selectFrom('isp_subscribers')
    .select(['id', 'account_number', 'service_status', 'customer_entity_id'])
    .where('id', '=', subscriber_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) {
    return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })
  }

  type SubscriberRow = { id: string; account_number: string; service_status: string; customer_entity_id: string | null }
  const sub = subscriber as SubscriberRow

  const previousStatus = sub.service_status
  if (previousStatus === new_status) {
    return Response.json({ error: 'El abonado ya está en ese estado' }, { status: 409 })
  }

  const now = new Date()
  const updatePayload: Record<string, unknown> = {
    service_status: new_status,
    updated_at: now,
  }

  // Si se activa, registrar fecha de activación si no la tiene
  if (new_status === 'active') {
    const existing = await kysely
      .selectFrom('isp_subscribers')
      .select(['activation_date'])
      .where('id', '=', subscriber_id)
      .executeTakeFirst()
    type ActivationRow = { activation_date: string | null }
    if (!(existing as ActivationRow | undefined)?.activation_date) {
      updatePayload.activation_date = now
    }
  }

  await kysely
    .updateTable('isp_subscribers')
    .set(updatePayload)
    .where('id', '=', subscriber_id)
    .execute()

  // Emitir evento de dominio
  const eventId = STATUS_EVENTS[new_status]
  if (eventId) {
    await emitLifecycle(eventsConfig, eventId, scope, {
      subscriber_id,
      account_number: sub.account_number,
      previous_status: previousStatus,
      new_status,
      reason: reason ?? null,
    })
  }

  return Response.json({
    ok: true,
    subscriber_id,
    previous_status: previousStatus,
    new_status,
  })
}

export const openApi = {}
