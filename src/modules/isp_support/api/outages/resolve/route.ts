/**
 * POST /api/isp-support/outages/resolve
 *
 * Cierra una avería masiva. Restaura el estado del nodo a 'active',
 * cierra todos los tickets vinculados a esta avería, y emite el evento
 * de resolución (clientBroadcast para que el portal del abonado se actualice).
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { resolveOutageSchema } from '../../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_support.manage_outages'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = resolveOutageSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { outage_id, resolution_notes } = parsed.data

  const outage = await kysely.selectFrom('isp_outages').selectAll()
    .where('id', '=', outage_id).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!outage) return Response.json({ error: 'Avería no encontrada' }, { status: 404 })

  const now = new Date()

  // Cerrar la avería
  await kysely.updateTable('isp_outages')
    .set({ status: 'resolved', resolved_at: now, resolution_notes, updated_at: now })
    .where('id', '=', outage_id).execute()

  // Restaurar el nodo a 'active'
  await kysely.updateTable('isp_network_nodes')
    .set({ status: 'active', updated_at: now })
    .where('id', '=', (outage as any).node_id)
    .execute()

  // Cerrar tickets abiertos vinculados a esta avería
  await kysely.updateTable('isp_support_tickets')
    .set({ status: 'resolved', resolved_at: now, solution: resolution_notes, updated_at: now })
    .where('outage_id', '=', outage_id)
    .where('status', 'not in', ['resolved', 'closed'])
    .execute()

  await emitLifecycle(eventsConfig, 'isp_support.outage.resolved', scope, {
    outage_id,
    node_id: (outage as any).node_id,
    affected_subscribers: (outage as any).affected_subscribers,
    resolution_notes,
  })

  return Response.json({ ok: true, outage_id })
}

export const openApi = {}
