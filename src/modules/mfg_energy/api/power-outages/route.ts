/**
 * Custom handler for power outages.
 * POST: creates outage + auto-calculates duration if ended_at is provided.
 * PUT: updates outage + calculates duration = (ended_at - started_at).
 */
import { MfgPowerOutageEntity } from '../../data/entities'
import { powerOutageCreateSchema, powerOutageUpdateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { v4 } from 'uuid'

const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_energy.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_energy.record'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_energy.record'] } }
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgPowerOutageEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_energy:power_outage' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50), outage_type: z.string().optional() }).passthrough() },
  update: { schema: powerOutageUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = powerOutageCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data
  let durationHrs: string | null = null
  if (data.ended_at && data.started_at) {
    const ms = new Date(data.ended_at).getTime() - new Date(data.started_at).getTime()
    durationHrs = (ms / 3600000).toFixed(4)
  }

  const id = v4()
  await kysely.insertInto('mfg_power_outages').values({
    id, tenant_id: scope.tenantId, organization_id: scope.organizationId,
    started_at:            new Date(data.started_at).toISOString(),
    ended_at:              data.ended_at ? new Date(data.ended_at).toISOString() : null,
    duration_hrs:          durationHrs,
    outage_type:           data.outage_type,
    zone:                  data.zone ?? null,
    impact_production_hrs_lost: data.impact_production_hrs_lost ?? null,
    products_affected:     data.products_affected ?? null,
    used_generator:        data.used_generator ?? false,
    generator_fuel_liters: data.generator_fuel_liters ?? null,
    fuel_cost_usd:         data.fuel_cost_usd ?? null,
    notes:                 data.notes ?? null,
    created_at:            new Date().toISOString(),
    updated_at:            new Date().toISOString(),
  } as any).execute()

  await emitLifecycle(eventsConfig, 'mfg_energy.outage.started', scope, { outage_type: data.outage_type, zone: data.zone })
  if (data.used_generator) {
    await emitLifecycle(eventsConfig, 'mfg_energy.generator.activated', scope, {})
  }

  return Response.json({ data: { id, duration_hrs: durationHrs } }, { status: 201 })
}

export const GET = crud.GET; export const PUT = crud.PUT
export const openApi = {}
