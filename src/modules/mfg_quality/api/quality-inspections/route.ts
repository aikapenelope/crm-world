/**
 * POST /api/mfg-quality/quality-inspections
 *
 * Custom handler: records inspection AND checks if out-of-spec/out-of-control.
 * If plan is_critical_control_point and measurement is out-of-spec, creates an NC automatically.
 */
import { MfgQualityInspectionEntity, MfgNonconformanceEntity } from '../../data/entities'
import { inspectionCreateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { v4 } from 'uuid'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_quality.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_quality.inspect'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgQualityInspectionEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_quality:inspection' },
  list: { schema: z.object({ plan_id: z.string().uuid().optional(), lot_id: z.string().uuid().optional(), order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  create: { schema: inspectionCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: inspectionCreateSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = inspectionCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data

  // Load quality plan to get limits and CCP flag
  const plan = await kysely
    .selectFrom('mfg_quality_plans')
    .select(['id', 'lsl', 'usl', 'lcl', 'ucl', 'is_critical_control_point', 'parameter_name', 'product_code', 'product_id'])
    .where('id', '=', data.plan_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!plan) return Response.json({ error: 'Quality plan not found' }, { status: 404 })

  const p   = plan as any
  const val = Number(data.measured_value)

  const isInSpec    = (!p.lsl || val >= Number(p.lsl)) && (!p.usl || val <= Number(p.usl))
  const isInControl = (!p.lcl || val >= Number(p.lcl)) && (!p.ucl || val <= Number(p.ucl))

  // Create inspection record
  const inspectionId = v4()
  await kysely.insertInto('mfg_quality_inspections').values({
    id:                    inspectionId,
    tenant_id:             scope.tenantId,
    organization_id:       scope.organizationId,
    plan_id:               data.plan_id,
    lot_id:                data.lot_id ?? null,
    order_id:              data.order_id ?? null,
    sample_number:         data.sample_number,
    subgroup_id:           data.subgroup_id ?? null,
    measured_value:        String(data.measured_value),
    is_in_spec:            isInSpec,
    is_in_control:         isInControl,
    inspector_id:          null,
    inspection_timestamp:  new Date().toISOString(),
    notes:                 data.notes ?? null,
    created_at:            new Date().toISOString(),
  } as any).execute()

  // Emit events for out-of-spec/out-of-control
  if (!isInSpec) {
    await emitLifecycle(eventsConfig, 'mfg_quality.inspection.out_of_spec', scope, { plan_id: data.plan_id, value: val })
  }
  if (!isInControl) {
    await emitLifecycle(eventsConfig, 'mfg_quality.inspection.out_of_control', scope, { plan_id: data.plan_id, value: val })
  }

  // Auto-create NC if this is a CCP and measurement is out of spec
  let autoNcId: string | null = null
  if (p.is_critical_control_point && !isInSpec) {
    autoNcId = v4()
    const year = new Date().getFullYear()
    const ncNumber = `NC-MFG-${year}-${Date.now().toString().slice(-5)}`
    await kysely.insertInto('mfg_nonconformances').values({
      id:               autoNcId,
      tenant_id:        scope.tenantId,
      organization_id:  scope.organizationId,
      nc_number:        ncNumber,
      source:           'in_process',
      lot_id:           data.lot_id ?? null,
      order_id:         data.order_id ?? null,
      product_id:       p.product_id,
      product_code:     p.product_code,
      inspection_id:    inspectionId,
      description:      `Desviación automática detectada en PCC: ${p.parameter_name} = ${val} (fuera de especificación)`,
      severity:         'critical',
      status:           'open',
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    } as any).execute()

    await emitLifecycle(eventsConfig, 'mfg_quality.nc.created', scope, { nc_id: autoNcId, source: 'auto_ccp' })
  }

  return Response.json({
    data: { id: inspectionId, is_in_spec: isInSpec, is_in_control: isInControl, auto_nc_id: autoNcId },
  }, { status: 201 })
}

export const GET = crud.GET
export const openApi = {}
