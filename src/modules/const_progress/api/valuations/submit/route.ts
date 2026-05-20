/**
 * Submit a valuation for approval.
 */
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const { valuation_id } = body

  if (!valuation_id) return Response.json({ error: 'valuation_id required' }, { status: 400 })

  await kysely.updateTable('const_valuations')
    .set({ status: 'submitted', submitted_at: new Date(), updated_at: new Date() })
    .where('id', '=', valuation_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'draft')
    .execute()

  return Response.json({ success: true, valuation_id, status: 'submitted' })
}

export const openApi = {}
