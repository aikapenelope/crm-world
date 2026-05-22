import { z } from 'zod'

const bodySchema = z.object({
  commission_ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['approve', 'mark_paid']),
  paid_at: z.string().date().nullable().optional(),
})

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['isp_sales.approve_commissions'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  const { commission_ids, action, paid_at } = parsed.data

  const now = new Date()
  const newStatus = action === 'mark_paid' ? 'paid' : 'approved'

  await kysely.updateTable('isp_commissions')
    .set({
      status: newStatus,
      paid_at: action === 'mark_paid' ? (paid_at ?? now.toISOString().split('T')[0]) : null,
      updated_at: now,
    })
    .where('id', 'in', commission_ids)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  return Response.json({ ok: true, updated: commission_ids.length, status: newStatus })
}

export const openApi = {}
