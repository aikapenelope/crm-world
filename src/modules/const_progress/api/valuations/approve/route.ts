/**
 * Approve a submitted valuation.
 */
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['const_progress.approve'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const { valuation_id, approved_by, notes } = body

  if (!valuation_id) return Response.json({ error: 'valuation_id required' }, { status: 400 })

  await kysely.updateTable('const_valuations')
    .set({
      status: 'approved',
      approved_at: new Date(),
      approved_by: approved_by ?? 'Director',
      notes: notes ?? null,
      updated_at: new Date(),
    })
    .where('id', '=', valuation_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'submitted')
    .execute()

  return Response.json({ success: true, valuation_id, status: 'approved' })
}

export const openApi = {}
