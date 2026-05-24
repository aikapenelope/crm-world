/**
 * Subscriber: reacciona a isp_network.node.outage_reported.
 * Cuando un nodo se reporta como caído, crea automáticamente:
 *   1. Un isp_outage (avería masiva) vinculado al nodo
 *   2. Un isp_support_ticket de tipo 'fault' vinculado a la avería
 *
 * Esta automatización elimina el proceso manual de crear tickets cuando
 * cae un nodo — el ISP solo tiene que ir al panel y ver qué pasó.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const metadata = {
  event: 'isp_network.node.outage_reported',
  persistent: true,
  id: 'isp_support.on-node-outage',
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = { tenantId: payload.tenantId, organizationId: payload.organizationId }
  const kysely = (em as any).getKysely()
  const { v4 } = await import('uuid')

  const { node_id, node_name, affected_subscribers } = payload
  if (!node_id || !scope.tenantId) return

  // Verificar si ya existe una avería activa para este nodo
  const existingOutage = await kysely
    .selectFrom('isp_outages')
    .select(['id'])
    .where('node_id', '=', node_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '!=', 'resolved')
    .executeTakeFirst()

  if (existingOutage) {
    console.log(`[isp_support] Outage already exists for node ${node_id}, skipping`)
    return
  }

  const now = new Date()

  // Generar número de avería
  const countResult = await kysely
    .selectFrom('isp_outages')
    .select(kysely.fn.count('id').as('count'))
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()
  const seq = String(Number((countResult as any)?.count ?? 0) + 1).padStart(4, '0')
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const outageNumber = `AVR-${yearMonth}-${seq}`

  const outageId = v4()

  // Crear avería masiva
  await kysely.insertInto('isp_outages').values({
    id: outageId,
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    node_id,
    outage_number: outageNumber,
    cause: 'unknown', // El operador lo actualiza cuando identifica la causa
    status: 'active',
    affected_subscribers: affected_subscribers ?? 0,
    started_at: now,
    notified_subscribers: false,
    created_at: now,
    updated_at: now,
  }).execute()

  // Generar número de ticket
  const tktCount = await kysely
    .selectFrom('isp_support_tickets')
    .select(kysely.fn.count('id').as('count'))
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()
  const tktSeq = String(Number((tktCount as any)?.count ?? 0) + 1).padStart(5, '0')
  const ticketNumber = `TKT-${yearMonth}-${tktSeq}`

  // Crear ticket de avería masiva
  await kysely.insertInto('isp_support_tickets').values({
    id: v4(),
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    ticket_number: ticketNumber,
    subscriber_id: null,
    node_id,
    outage_id: outageId,
    type: 'fault',
    origin: 'automatic_monitoring',
    status: 'open',
    priority: affected_subscribers >= 50 ? 'critical' : affected_subscribers >= 10 ? 'high' : 'normal',
    subject: `Avería masiva — ${node_name ?? node_id} (${affected_subscribers ?? 0} abonados afectados)`,
    description: `Avería detectada automáticamente. Nodo: ${node_name}. Abonados afectados: ${affected_subscribers ?? 0}.`,
    sla_hours: 2, // 2h para averías masivas críticas
    sla_breached: false,
    created_at: now,
    updated_at: now,
  }).execute()

  await emitLifecycle(eventsConfig, 'isp_support.outage.created', scope, {
    outage_id: outageId,
    outage_number: outageNumber,
    node_id,
    node_name,
    affected_subscribers,
  })

  console.log(`[isp_support] Outage ${outageNumber} and ticket ${ticketNumber} created for node ${node_id}`)
}
