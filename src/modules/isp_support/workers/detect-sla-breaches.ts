/**
 * Worker: Detectar tickets de soporte que superaron su SLA.
 *
 * Corre diariamente. Marca como `sla_breached = true` los tickets que:
 *   - No están resueltos ni cerrados
 *   - Tienen sla_hours definido
 *   - Han superado el tiempo (created_at + sla_hours) sin estar resueltos
 *
 * Tras marcar el incumplimiento, emite isp_support.ticket.sla_breached
 * con clientBroadcast: true para que el panel del supervisor se actualice
 * en tiempo real.
 *
 * SLAs de referencia por segmento:
 *   residencial: 24h · pyme: 8h · corporativo: 4h · masiva: 2h
 *
 * Reference: .ai/specs/2026-05-26-isp-telecom-vertical.md §Módulo 5
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'isp-support-sla-check',
  id: 'isp-support-detect-sla-breaches',
  concurrency: 1,
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = { tenantId: payload.tenantId, organizationId: payload.organizationId }
  const kysely = (em as any).getKysely()

  const now = new Date()

  // Buscar tickets abiertos con SLA definido que aún no marcamos como incumplidos
  const openTickets = await kysely
    .selectFrom('isp_support_tickets')
    .select(['id', 'ticket_number', 'type', 'sla_hours', 'created_at', 'priority', 'subscriber_id'])
    .where('tenant_id', '=', scope.tenantId)
    .where('status', 'not in', ['resolved', 'closed'])
    .where('sla_breached', '=', false)
    .where('sla_hours', 'is not', null)
    .execute()

  let breached = 0

  for (const ticket of openTickets as any[]) {
    const slaHours = Number(ticket.sla_hours)
    if (!slaHours || slaHours <= 0) continue

    const createdAt = new Date(ticket.created_at)
    const deadlineMs = createdAt.getTime() + slaHours * 60 * 60 * 1000

    if (now.getTime() > deadlineMs) {
      // Marcar como incumplido
      await kysely
        .updateTable('isp_support_tickets')
        .set({ sla_breached: true, updated_at: now })
        .where('id', '=', ticket.id)
        .execute()

      // Emitir evento clientBroadcast para alerta en tiempo real
      await emitLifecycle(eventsConfig, 'isp_support.ticket.sla_breached', scope, {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        type: ticket.type,
        priority: ticket.priority,
        sla_hours: slaHours,
        subscriber_id: ticket.subscriber_id,
      })

      breached++
    }
  }

  console.log(
    `[isp_support:sla-check] tenant=${scope.tenantId} ` +
    `checked=${openTickets.length} breached=${breached}`,
  )

  return { checked: openTickets.length, breached }
}
