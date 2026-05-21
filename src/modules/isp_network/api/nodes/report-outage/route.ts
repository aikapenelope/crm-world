/**
 * POST /api/isp-network/nodes/report-outage
 *
 * Reporta una caída en un nodo de red. Actualiza el estado del nodo a 'offline',
 * registra la hora de la última avería, y emite el evento de dominio que otros
 * módulos (isp_support, isp_billing) pueden suscribir para crear tickets masivos
 * y notificar a los abonados afectados.
 */
import { z } from 'zod'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

const bodySchema = z.object({
  node_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_network.report_outage'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const { node_id, notes } = parsed.data

  // Verificar que el nodo existe y pertenece al tenant
  const node = await kysely
    .selectFrom('isp_network_nodes')
    .select(['id', 'name', 'status'])
    .where('id', '=', node_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!node) {
    return Response.json({ error: 'Nodo no encontrado' }, { status: 404 })
  }

  if ((node as any).status === 'offline') {
    return Response.json({ error: 'El nodo ya está marcado como caído' }, { status: 409 })
  }

  const now = new Date()

  // Actualizar estado del nodo
  await kysely
    .updateTable('isp_network_nodes')
    .set({ status: 'offline', last_outage_at: now, updated_at: now })
    .where('id', '=', node_id)
    .execute()

  // Contar abonados activos conectados a este nodo
  const countResult = await kysely
    .selectFrom('isp_subscribers')
    .select(kysely.fn.count<number>('id').as('count'))
    .where('node_id', '=', node_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('service_status', '=', 'active')
    .executeTakeFirst()

  const affectedCount = Number((countResult as any)?.count ?? 0)

  // Emitir evento de dominio — isp_support y isp_billing pueden suscribirse
  await emitLifecycle(eventsConfig, 'isp_network.node.outage_reported', scope, {
    node_id,
    node_name: (node as any).name,
    affected_subscribers: affectedCount,
    notes: notes ?? null,
    reported_at: now.toISOString(),
  })

  return Response.json({
    ok: true,
    node_id,
    node_name: (node as any).name,
    affected_subscribers: affectedCount,
    message: `Avería reportada. ${affectedCount} abonados afectados.`,
  })
}

export const openApi = {}
