/**
 * POST /api/agri-quality/ccp-monitoring
 *
 * Custom handler: when is_deviation = true, automatically creates
 * a non-conformity (agri_non_conformities) and emits
 * agri_quality.ccp.deviation_detected to alert quality manager.
 */
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriCcpMonitoringRecordEntity, AgriNonConformityEntity } from '../../data/entities'
import { ccpMonitoringRecordCreateSchema, ccpMonitoringRecordUpdateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50),
  haccp_plan_id: z.string().uuid().optional(), is_deviation: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_quality.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_quality.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_quality.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriCcpMonitoringRecordEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_quality:ccp_monitoring' },
  list: { schema: listSchema },
  create: { schema: ccpMonitoringRecordCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: ccpMonitoringRecordUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

/**
 * Custom POST: if is_deviation = true, auto-create a non-conformity.
 */
export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = ccpMonitoringRecordCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data

  const record = em.create(AgriCcpMonitoringRecordEntity, {
    tenant_id: scope.tenantId, organization_id: scope.organizationId, ...data,
  } as any)

  let nonConformityId: string | null = null

  if (data.is_deviation) {
    // Auto-generate NC number: NC-YYYYMM-{seq}
    const ym = new Date().toISOString().slice(0, 7).replace('-', '')
    const existingNcs = await kysely
      .selectFrom('agri_non_conformities')
      .select(['id'])
      .where('tenant_id', '=', scope.tenantId)
      .where('nc_number', 'like', `NC-${ym}-%`)
      .execute()
    const seq = (existingNcs as any[]).length + 1
    const ncNumber = `NC-${ym}-${String(seq).padStart(3, '0')}`

    const nc = em.create(AgriNonConformityEntity, {
      tenant_id:        scope.tenantId,
      organization_id:  scope.organizationId,
      nc_number:        ncNumber,
      source:           'ccp_deviation',
      severity:         'critical',
      description:      `Desviación en ${data.ccp_name} (${data.ccp_id}): valor medido ${data.measured_value} ${data.unit}`,
      affected_lot_id:  data.processing_lot_id ?? null,
      detection_date:   data.monitoring_date,
      status:           'open',
    } as any)

    em.persist(nc)
    nonConformityId = nc.id

    record.non_conformity_id = nc.id

    await emitLifecycle(eventsConfig, 'agri_quality.ccp.deviation_detected', scope, {
      ccp_id:             data.ccp_id,
      ccp_name:           data.ccp_name,
      measured_value:     data.measured_value,
      unit:               data.unit,
      nc_number:          ncNumber,
      processing_lot_id:  data.processing_lot_id,
    })
  }

  em.persist(record)
  await em.flush()

  return Response.json({
    data: { id: record.id, is_deviation: data.is_deviation, non_conformity_id: nonConformityId },
  }, { status: 201 })
}

export const GET = crud.GET
export const PUT = crud.PUT
export const openApi = {}
