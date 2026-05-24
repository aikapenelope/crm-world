import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { assignTicketSchema } from '../../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_support.assign'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = assignTicketSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { ticket_id, technician_id } = parsed.data

  const ticket = await kysely.selectFrom('isp_support_tickets').select(['id', 'status'])
    .where('id', '=', ticket_id).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!ticket) return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })

  const now = new Date()
  await kysely.updateTable('isp_support_tickets')
    .set({ assigned_to: technician_id, assigned_at: now, status: 'assigned', updated_at: now })
    .where('id', '=', ticket_id).execute()

  await emitLifecycle(eventsConfig, 'isp_support.ticket.assigned', scope, {
    ticket_id, technician_id,
  })

  return Response.json({ ok: true, ticket_id, technician_id })
}

export const openApi = {}
