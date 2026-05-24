/**
 * POST /api/isp-technicians/work-orders/complete
 *
 * El técnico completa una orden de trabajo. Si es una instalación,
 * emite isp_technicians.installation.done para que isp_subscribers
 * cambie el service_status a 'active'.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { completeWorkOrderSchema } from '../../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_technicians.complete_orders'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = completeWorkOrderSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { work_order_id, completion_notes, km_traveled, cpe_installed_id } = parsed.data

  const order = await kysely.selectFrom('isp_work_orders').selectAll()
    .where('id', '=', work_order_id).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!order) return Response.json({ error: 'OT no encontrada' }, { status: 404 })

  const now = new Date()
  await kysely.updateTable('isp_work_orders').set({
    status: 'completed',
    completion_notes,
    completed_at: now,
    km_traveled: km_traveled ?? null,
    cpe_installed_id: cpe_installed_id ?? null,
    updated_at: now,
  }).where('id', '=', work_order_id).execute()

  // Si hay CPE instalado, actualizar su estado en inventario
  if (cpe_installed_id) {
    await kysely.updateTable('isp_cpe_inventory')
      .set({ status: 'deployed', updated_at: now })
      .where('id', '=', cpe_installed_id).execute()
  }

  await emitLifecycle(eventsConfig, 'isp_technicians.work_order.completed', scope, {
    work_order_id,
    work_order_number: (order as any).work_order_number,
    type: (order as any).type,
    subscriber_id: (order as any).subscriber_id,
  })

  // Si es instalación, activar el servicio del abonado
  if ((order as any).type === 'installation' && (order as any).subscriber_id) {
    await emitLifecycle(eventsConfig, 'isp_technicians.installation.done', scope, {
      work_order_id,
      subscriber_id: (order as any).subscriber_id,
    })
  }

  return Response.json({ ok: true, work_order_id })
}

export const openApi = {}
