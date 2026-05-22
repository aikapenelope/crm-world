import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { resolveTicketSchema } from '../../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_support.resolve'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = resolveTicketSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { ticket_id, solution } = parsed.data

  const ticket = await kysely.selectFrom('isp_support_tickets').select(['id'])
    .where('id', '=', ticket_id).where('tenant_id', '=', scope.tenantId).executeTakeFirst()
  if (!ticket) return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })

  const now = new Date()
  await kysely.updateTable('isp_support_tickets')
    .set({ solution, status: 'resolved', resolved_at: now, updated_at: now })
    .where('id', '=', ticket_id).execute()

  await emitLifecycle(eventsConfig, 'isp_support.ticket.resolved', scope, { ticket_id })

  return Response.json({ ok: true, ticket_id })
}

export const openApi = {}
