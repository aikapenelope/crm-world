/**
 * Approve a submitted valuation.
 * Emits const_progress.valuation.approved (clientBroadcast: true) so
 * the project team sees the approval status change live — no refresh needed.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

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

  // Emit — the submitter's browser sees the badge change from "Enviada" to
  // "Aprobada" in real-time without requiring a page reload.
  await emitLifecycle(eventsConfig, 'const_progress.valuation.approved', scope, {
    id: valuation_id,
    approved_by: approved_by ?? 'Director',
  })

  return Response.json({ success: true, valuation_id, status: 'approved' })
}

export const openApi = {}
