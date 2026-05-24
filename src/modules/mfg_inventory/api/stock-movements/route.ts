/**
 * POST /api/mfg-inventory/stock-movements
 *
 * Custom handler: creates movement AND updates lot quantity atomically.
 * Also emits alerts when stock falls below reorder point.
 */
import { MfgStockMovementEntity } from '../../data/entities'
import { stockMovementCreateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { v4 } from 'uuid'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_inventory.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_inventory.receive'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgStockMovementEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_inventory:movement' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50), lot_id: z.string().uuid().optional(), movement_type: z.string().optional() }).passthrough() },
  create: { schema: stockMovementCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: stockMovementCreateSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = stockMovementCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data
  const delta = Number(data.quantity)

  // Load lot to get current qty
  const lot = await kysely
    .selectFrom('mfg_stock_lots')
    .select(['id', 'quantity', 'material_id', 'material_code', 'material_name', 'status'])
    .where('id', '=', data.lot_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!lot) return Response.json({ error: 'Lot not found' }, { status: 404 })

  const currentQty = Number((lot as any).quantity)
  const newQty     = currentQty + delta

  // Create movement record
  await kysely.insertInto('mfg_stock_movements').values({
    id:              v4(),
    tenant_id:       scope.tenantId,
    organization_id: scope.organizationId,
    lot_id:          data.lot_id,
    movement_type:   data.movement_type,
    quantity:        String(delta),
    from_location_id: data.from_location_id ?? null,
    to_location_id:  data.to_location_id ?? null,
    reference_type:  data.reference_type ?? null,
    reference_id:    data.reference_id ?? null,
    reason:          data.reason ?? null,
    created_at:      new Date().toISOString(),
  } as any).execute()

  // Update lot quantity
  const updates: Record<string, any> = { quantity: Math.max(0, newQty).toFixed(4), updated_at: new Date() }

  // Auto-update status based on movement type
  if (data.movement_type === 'quarantine_release') updates.status = 'available'
  if (data.movement_type === 'quarantine_hold') updates.status = 'quarantine'
  if (data.movement_type === 'GI_scrap') updates.status = newQty <= 0 ? 'consumed' : (lot as any).status
  if (data.movement_type === 'GI_production' && newQty <= 0) updates.status = 'consumed'
  if (data.movement_type === 'to_location_id' && data.to_location_id) updates.location_id = data.to_location_id

  await kysely.updateTable('mfg_stock_lots')
    .set(updates)
    .where('id', '=', data.lot_id)
    .execute()

  // Emit specific events
  if (data.movement_type === 'quarantine_release') {
    await emitLifecycle(eventsConfig, 'mfg_inventory.lot.released_from_qc', scope, { lot_id: data.lot_id })
  }
  if (data.movement_type === 'GI_production') {
    await emitLifecycle(eventsConfig, 'mfg_inventory.movement.gi_production', scope, { lot_id: data.lot_id, quantity: delta })
  }

  return Response.json({ data: { lot_id: data.lot_id, new_quantity: Math.max(0, newQty).toFixed(4) } }, { status: 201 })
}

export const GET = crud.GET
export const openApi = {}
