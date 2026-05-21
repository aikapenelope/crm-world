/**
 * Notify — Dispatcher de notificaciones multi-canal para Aika Platform
 *
 * Interfaz unificada para enviar notificaciones a suscriptores/clientes desde
 * cualquier módulo. Actualmente soporta: email (Resend) y portal (SSE
 * clientBroadcast). El diseño es extensible: cuando se integren Telegram Bot o
 * WhatsApp Business API, se agrega un adapter sin tocar los módulos que ya usan notify().
 *
 * Uso:
 *   import { notifySubscriber } from '@app/lib/notify'
 *   await notifySubscriber(ctx, subscriberId, { message: '...', channels: ['email', 'portal'] })
 *
 * Ref. arquitectura: docs/REALTIME.md, docs/AGM.md §9 Eventos
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotifyChannel = 'email' | 'portal' | 'log'

export interface NotifyPayload {
  /** Mensaje principal (texto plano). */
  message: string
  /** Asunto del email (solo para channel: email). Default: message. */
  subject?: string
  /** Canales a usar. Default: ['log'] */
  channels?: NotifyChannel[]
  /** Prioridad — afecta el tipo de alerta en el portal. */
  priority?: 'low' | 'normal' | 'high'
  /** Datos adicionales para el portal (se pasan como payload del evento SSE). */
  extra?: Record<string, unknown>
}

export interface NotifyScope {
  tenantId: string
  organizationId: string
}

/** Información mínima del destinatario necesaria para enviar la notificación. */
export interface NotifyRecipient {
  id: string
  email?: string | null
  name?: string | null
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Envía un email via Resend.
 * Si RESEND_API_KEY no está configurado, loguea y continúa sin fallar.
 */
async function sendEmail(recipient: NotifyRecipient, payload: NotifyPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.EMAIL_FROM ?? 'noreply@aika.app'

  if (!apiKey || !recipient.email) {
    console.debug(`[notify:email] Skipping email to ${recipient.id}: ${!apiKey ? 'no API key' : 'no email address'}`)
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient.email],
        subject: payload.subject ?? payload.message.slice(0, 80),
        text: payload.message,
      }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => response.status.toString())
      console.error(`[notify:email] Resend error for ${recipient.id}: ${err}`)
    }
  } catch (err: any) {
    console.error(`[notify:email] Fetch error for ${recipient.id}:`, err.message)
  }
}

/**
 * Emite un evento SSE al portal del cliente.
 * Solo llega si el suscriptor tiene la sesión abierta en el portal.
 * clientBroadcast: true en los event definitions hace el trabajo.
 */
async function sendPortalEvent(
  eventBus: { emitEvent: (id: string, payload: Record<string, unknown>, opts?: object) => Promise<void> } | null,
  scope: NotifyScope,
  recipient: NotifyRecipient,
  payload: NotifyPayload,
): Promise<void> {
  if (!eventBus) {
    console.debug(`[notify:portal] eventBus not available, skipping portal notification`)
    return
  }

  try {
    await eventBus.emitEvent('aika.notification.subscriber', {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      subscriberId: recipient.id,
      message: payload.message,
      priority: payload.priority ?? 'normal',
      ...payload.extra,
    })
  } catch (err: any) {
    console.error(`[notify:portal] Error emitting portal event:`, err.message)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Envía una notificación a un suscriptor/cliente a través de los canales
 * especificados. Nunca lanza excepciones — todos los errores se loguean.
 *
 * @param ctx        Contexto de la request u objeto con container DI y scope
 * @param recipient  Datos del destinatario (id + email + name)
 * @param payload    Mensaje, canales, prioridad
 */
export async function notifySubscriber(
  ctx: {
    container?: { resolve: (key: string) => any }
    scope?: NotifyScope
  },
  recipient: NotifyRecipient,
  payload: NotifyPayload,
): Promise<void> {
  const channels = payload.channels ?? ['log']
  const scope = ctx.scope ?? { tenantId: 'unknown', organizationId: 'unknown' }

  // Log siempre (auditoría)
  console.log(
    `[notify] to=${recipient.id} channels=${channels.join(',')} priority=${payload.priority ?? 'normal'} msg="${payload.message.slice(0, 100)}"`,
  )

  const promises: Promise<void>[] = []

  for (const channel of channels) {
    if (channel === 'email') {
      promises.push(sendEmail(recipient, payload))
    } else if (channel === 'portal') {
      const eventBus = ctx.container?.resolve('eventBus') ?? null
      promises.push(sendPortalEvent(eventBus, scope, recipient, payload))
    }
  }

  await Promise.allSettled(promises)
}

/**
 * Envía la misma notificación a múltiples destinatarios.
 * Los envíos se hacen en paralelo pero no bloquean el llamador si alguno falla.
 */
export async function notifyBulk(
  ctx: {
    container?: { resolve: (key: string) => any }
    scope?: NotifyScope
  },
  recipients: NotifyRecipient[],
  payload: NotifyPayload,
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    recipients.map((r) => notifySubscriber(ctx, r, payload)),
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    console.warn(`[notify:bulk] ${failed}/${recipients.length} notifications failed`)
  }

  return { sent, failed }
}
