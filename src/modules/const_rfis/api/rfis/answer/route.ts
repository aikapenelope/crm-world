import { answerRFISchema } from '../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['const_rfis.answer'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const parsed = answerRFISchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { rfi_id, answer, cost_impact, schedule_impact_days } = parsed.data

  await kysely.updateTable('const_rfis')
    .set({
      status: 'answered',
      answer,
      answered_at: new Date(),
      cost_impact: cost_impact ?? null,
      schedule_impact_days: schedule_impact_days ?? null,
      updated_at: new Date(),
    })
    .where('id', '=', rfi_id)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  return Response.json({ success: true, rfi_id, status: 'answered' })
}

export const openApi = {}
