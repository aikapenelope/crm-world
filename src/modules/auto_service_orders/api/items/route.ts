import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoServiceOrderItemEntity } from '../../data/entities'
import { createOrderItemSchema, updateOrderItemSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  service_order_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_service_orders.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_service_orders.edit'] },
  PUT: { requireAuth: true, requireFeatures: ['auto_service_orders.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_service_orders.edit'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoServiceOrderItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'auto_service_orders.item' },
  list: { schema: listSchema },
  create: { schema: createOrderItemSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateOrderItemSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
