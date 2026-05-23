/**
 * POST /api/agri-processing/slaughter-batches
 *
 * Custom handler con verificación de período de retiro activo.
 *
 * Antes de crear el lote de beneficio, verifica via Kysely que el flock
 * NO tenga registros en agri_vet_medication_records con
 * withdrawal_end_date > today. Si los hay → 409 Conflict.
 *
 * Esto implementa la regla crítica de seguridad alimentaria:
 * un flock medicado no puede ir a beneficio hasta completar el retiro.
 */
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriSlaughterBatchEntity } from '../../data/entities'
import { slaughterBatchCreateSchema, slaughterBatchUpdateSchema } from '../../data/validators'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../../events'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), flock_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_processing.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_processing.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_processing.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_processing.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriSlaughterBatchEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_processing:slaughter_batch' },
  list: { schema: listSchema },
  create: { schema: slaughterBatchCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: slaughterBatchUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

/**
 * Custom POST — verifica retiro antes de permitir el beneficio.
 */
export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = slaughterBatchCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data
  const today = new Date().toISOString().split('T')[0]

  // ── Verificar período de retiro activo en el flock ─────────────────────────
  const activeWithdrawal = await kysely
    .selectFrom('agri_vet_medication_records')
    .select(['id', 'medication_name', 'withdrawal_end_date'])
    .where('flock_id', '=', data.flock_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('resolved', '=', false)
    .where('withdrawal_end_date', '>=', today)
    .executeTakeFirst()

  if (activeWithdrawal) {
    const w = activeWithdrawal as any
    await emitLifecycle(eventsConfig, 'agri_processing.withdrawal_block', scope, {
      flock_id:            data.flock_id,
      medication_name:     w.medication_name,
      withdrawal_end_date: w.withdrawal_end_date,
    })
    return Response.json({
      error: 'WITHDRAWAL_PERIOD_ACTIVE',
      message: `El flock tiene un período de retiro activo por "${w.medication_name}". No puede ir a beneficio hasta: ${w.withdrawal_end_date}`,
      medication_name:     w.medication_name,
      withdrawal_end_date: w.withdrawal_end_date,
    }, { status: 409 })
  }

  // ── Crear el SlaughterBatch ────────────────────────────────────────────────
  const batch = em.create(AgriSlaughterBatchEntity, {
    tenant_id:       scope.tenantId,
    organization_id: scope.organizationId,
    ...data,
  } as any)
  em.persist(batch)
  await em.flush()

  await emitLifecycle(eventsConfig, 'agri_processing.batch.created', scope, { id: batch.id, batch_number: batch.batch_number })

  return Response.json({ data: { id: batch.id, batch_number: batch.batch_number } }, { status: 201 })
}

export const GET    = crud.GET
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
