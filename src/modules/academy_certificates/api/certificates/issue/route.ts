/**
 * Issue a certificate — changes status from 'pending' to 'issued'.
 * Sets issued_at and issued_by.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['academy_certificates.manage'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const { certificate_id, issued_by } = await request.json()
  if (!certificate_id) return Response.json({ error: 'certificate_id is required' }, { status: 400 })

  const cert = await kysely
    .selectFrom('academy_certificates')
    .selectAll()
    .where('id', '=', certificate_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!cert) return Response.json({ error: 'Certificate not found' }, { status: 404 })
  if ((cert as any).status === 'issued') {
    return Response.json({ error: 'Certificate already issued' }, { status: 409 })
  }

  const now = new Date()
  await kysely
    .updateTable('academy_certificates')
    .set({ status: 'issued', issued_at: now, issued_by: issued_by ?? null, updated_at: now })
    .where('id', '=', certificate_id)
    .execute()

  await emitLifecycle(eventsConfig, 'academy_certificates.certificate.issued', scope, {
    id: certificate_id,
    certificate_number: (cert as any).certificate_number,
    student_name: (cert as any).student_name,
  })

  return Response.json({
    success: true,
    certificate_id,
    certificate_number: (cert as any).certificate_number,
    issued_at: now.toISOString(),
  })
}

export const openApi = {}
