import { z } from 'zod'

/**
 * GET  /api/isp-portal/tickets — Mis tickets de soporte
 * POST /api/isp-portal/tickets — Reportar un problema desde el portal
 */
export const metadata = {
  GET:  { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.view_tickets'] },
  POST: { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.create_ticket'] },
}

const createTicketBodySchema = z.object({
  type: z.enum(['fault', 'inquiry', 'plan_change', 'complaint', 'other']).default('fault'),
  subject: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
})

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const subscriber = await kysely
    .selectFrom('isp_subscribers').select(['id'])
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status') ?? null

  let query = kysely
    .selectFrom('isp_support_tickets')
    .select(['id', 'ticket_number', 'type', 'status', 'priority', 'subject', 'solution', 'created_at', 'resolved_at'])
    .where('subscriber_id', '=', (subscriber as any).id)
    .where('tenant_id', '=', scope.tenantId)
    .orderBy('created_at', 'desc')
    .limit(20)

  if (statusFilter) {
    query = query.where('status', '=', statusFilter)
  }

  const tickets = await query.execute()
  return Response.json({ tickets })
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const customerEntityId = ctx.customerContext?.customerEntityId ?? null
  if (!customerEntityId) return Response.json({ error: 'No customer session' }, { status: 401 })

  const subscriber = await kysely
    .selectFrom('isp_subscribers').select(['id'])
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) return Response.json({ error: 'Abonado no encontrado' }, { status: 404 })

  const body = await request.json()
  const parsed = createTicketBodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })

  const { v4 } = await import('uuid')
  const now = new Date()

  // Generar número de ticket
  const count = await kysely
    .selectFrom('isp_support_tickets')
    .select(kysely.fn.count<number>('id').as('count'))
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()
  const seq = String(Number((count as any)?.count ?? 0) + 1).padStart(5, '0')
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const ticketNumber = `TKT-${yearMonth}-${seq}`

  const ticketId = v4()
  await kysely.insertInto('isp_support_tickets').values({
    id: ticketId,
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    ticket_number: ticketNumber,
    subscriber_id: (subscriber as any).id,
    type: parsed.data.type,
    origin: 'portal',
    status: 'open',
    priority: 'normal',
    subject: parsed.data.subject,
    description: parsed.data.description ?? null,
    sla_hours: 24, // default SLA para tickets del portal
    sla_breached: false,
    created_at: now,
    updated_at: now,
  }).execute()

  return Response.json({ ok: true, ticket_id: ticketId, ticket_number: ticketNumber }, { status: 201 })
}

export const openApi = {}
