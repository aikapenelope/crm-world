/**
 * Worker: Detectar abonados morosos y activar corte automático.
 *
 * Corre diariamente. Para cada abonado activo con facturas vencidas, verifica
 * si superó sus días de gracia. Si los superó:
 *   1. Emite isp_billing.cut_triggered
 *   2. isp_subscribers (subscriber) suscribe y cambia service_status → suspended_overdue
 *   3. isp_monitoring (cuando esté activo) suscribe y envía el comando al Radius/OLT
 *
 * Pre-notificación WhatsApp (wa.me):
 *   3 días antes del corte: emite isp_billing.invoice.overdue → notify lib envía email
 *   1 día antes: emite de nuevo
 *   Día del corte: emite cut_triggered
 *
 * Ref: AGM.md §12.1, docs/REALTIME.md, .ai/specs/2026-05-26-isp-telecom-vertical.md
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  queue: 'isp-billing-overdue',
  id: 'isp-billing-detect-overdue',
  concurrency: 1,
}

export default async function handler(_payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = { tenantId: _payload.tenantId, organizationId: _payload.organizationId }
  const kysely = (em as any).getKysely()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Facturas pendientes/partial cuya due_date ya pasó
  const overdueInvoices = await kysely
    .selectFrom('isp_invoices as inv')
    .innerJoin('isp_subscribers as s', 's.id', 'inv.subscriber_id')
    .select([
      'inv.id as invoice_id',
      'inv.subscriber_id',
      'inv.due_date',
      'inv.balance_usd',
      'inv.invoice_number',
      's.cut_policy_days',
      's.service_status',
      's.account_number',
    ])
    .where('inv.tenant_id', '=', scope.tenantId)
    .where('inv.deleted_at', 'is', null)
    .where('inv.status', 'in', ['pending', 'partial'])
    .where('inv.due_date', '<', today.toISOString().split('T')[0])
    .where('s.deleted_at', 'is', null)
    .where('s.service_status', 'in', ['active', 'suspended_overdue'])
    .execute()

  let cutsTriggered = 0
  let warningsSent = 0

  for (const inv of overdueInvoices as any[]) {
    const dueDate = new Date(inv.due_date)
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const cutDays = inv.cut_policy_days ?? 7

    if (daysOverdue >= cutDays && inv.service_status === 'active') {
      // Activar corte
      await emitLifecycle(eventsConfig, 'isp_billing.cut_triggered', scope, {
        subscriber_id: inv.subscriber_id,
        invoice_id: inv.invoice_id,
        account_number: inv.account_number,
        days_overdue: daysOverdue,
        balance_usd: inv.balance_usd,
      })
      cutsTriggered++
    } else if ((daysOverdue === cutDays - 3 || daysOverdue === cutDays - 1) && inv.service_status === 'active') {
      // Pre-notificación antes del corte
      await emitLifecycle(eventsConfig, 'isp_billing.invoice.overdue', scope, {
        subscriber_id: inv.subscriber_id,
        invoice_id: inv.invoice_id,
        account_number: inv.account_number,
        days_overdue: daysOverdue,
        days_until_cut: cutDays - daysOverdue,
        balance_usd: inv.balance_usd,
        invoice_number: inv.invoice_number,
      })
      warningsSent++
    }
  }

  console.log(
    `[isp_billing:detect-overdue] tenant=${scope.tenantId} ` +
    `checked=${overdueInvoices.length} cuts=${cutsTriggered} warnings=${warningsSent}`,
  )

  return { checked: overdueInvoices.length, cutsTriggered, warningsSent }
}
