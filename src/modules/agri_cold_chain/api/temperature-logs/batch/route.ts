/**
 * POST /api/agri-cold-chain/temperature-logs/batch
 *
 * Batch endpoint for IoT sensors to push multiple readings at once.
 * Calculates is_excursion for each reading by comparing against the
 * unit's target_temp_min / target_temp_max.
 *
 * Accepts up to 1000 readings per request (15-min intervals = ~96/day).
 */
import { v4 } from 'uuid'

export const metadata = {
  POST: { requireAuth: false }, // Sensors use API key auth — no user auth required
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { cold_storage_unit_id, readings, source = 'batch_upload' } = body

  if (!cold_storage_unit_id || !Array.isArray(readings) || readings.length === 0) {
    return Response.json({ error: 'cold_storage_unit_id and readings[] required' }, { status: 400 })
  }

  // Fetch the unit to get temp range
  const unit = await kysely
    .selectFrom('agri_cold_storage_units')
    .select(['id', 'target_temp_min', 'target_temp_max', 'tenant_id', 'organization_id'])
    .where('id', '=', cold_storage_unit_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!unit) return Response.json({ error: 'Cold storage unit not found' }, { status: 404 })

  const u       = unit as any
  const minTemp = Number(u.target_temp_min)
  const maxTemp = Number(u.target_temp_max)

  const rows = readings.slice(0, 1000).map((r: any) => ({
    id:                   v4(),
    tenant_id:            scope.tenantId,
    organization_id:      scope.organizationId,
    cold_storage_unit_id,
    temperature_c:        String(r.temperature_c),
    humidity_pct:         r.humidity_pct != null ? String(r.humidity_pct) : null,
    recorded_at:          new Date(r.recorded_at).toISOString(),
    is_excursion:         Number(r.temperature_c) < minTemp || Number(r.temperature_c) > maxTemp,
    source,
    created_at:           new Date().toISOString(),
  }))

  await kysely.insertInto('agri_temperature_logs').values(rows).execute()

  return Response.json({ inserted: rows.length, unit_id: cold_storage_unit_id })
}

export const openApi = {}
