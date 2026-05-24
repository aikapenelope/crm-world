import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriInputMovementEntity, AgriInputItemEntity } from '../../data/entities'
import { inputMovementCreateSchema, inputMovementUpdateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'

const listSchema = z.object({
  page:          z.coerce.number().min(1).default(1),
  pageSize:      z.coerce.number().min(1).max(200).default(50),
  input_item_id: z.string().uuid().optional(),
  movement_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_inputs.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_inputs.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_inputs.adjust'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_inputs.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity:      AgriInputMovementEntity,
    idField:     'id',
    orgField:    'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'agri_inputs:movement' },
  list: { schema: listSchema },
  create: {
    schema: inputMovementCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: inputMovementUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

/**
 * Custom POST — creates the movement and updates item stock atomically.
 * After updating, checks min_stock and emits agri_inputs.item.stock_low if needed.
 */
export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = inputMovementCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data

  // Verify the item belongs to this tenant/org
  const item = await kysely
    .selectFrom('agri_input_items')
    .select(['id', 'quantity_available', 'min_stock', 'name'])
    .where('id', '=', data.input_item_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!item) {
    return Response.json({ error: 'Input item not found' }, { status: 404 })
  }

  const currentQty  = Number((item as any).quantity_available)
  const delta       = Number(data.quantity)
  const newQty      = Math.max(0, currentQty + delta)

  // Create movement + update stock
  const movement = em.create(AgriInputMovementEntity, {
    tenant_id:       scope.tenantId,
    organization_id: scope.organizationId,
    input_item_id:   data.input_item_id,
    movement_type:   data.movement_type,
    quantity:        String(delta),
    reference_type:  data.reference_type ?? null,
    reference_id:    data.reference_id ?? null,
    unit_cost_usd:   data.unit_cost_usd ?? null,
    notes:           data.notes ?? null,
  } as any)

  em.persist(movement)

  await kysely
    .updateTable('agri_input_items')
    .set({ quantity_available: newQty.toFixed(3), updated_at: new Date() })
    .where('id', '=', data.input_item_id)
    .execute()

  await em.flush()

  // Check stock alert
  const minStock = Number((item as any).min_stock)
  if (newQty <= minStock && delta < 0) {
    await emitLifecycle(eventsConfig, 'agri_inputs.item.stock_low', scope, {
      item_id:            data.input_item_id,
      item_name:          (item as any).name,
      quantity_available: newQty,
      min_stock:          minStock,
    })
  }

  await emitLifecycle(eventsConfig, 'agri_inputs.movement.recorded', scope, {
    item_id:       data.input_item_id,
    movement_type: data.movement_type,
    quantity:      delta,
  })

  return Response.json({ data: { id: movement.id, quantity_available: newQty.toFixed(3) } })
}

export const GET    = crud.GET
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
