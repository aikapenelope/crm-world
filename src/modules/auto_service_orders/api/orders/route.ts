import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoServiceOrderEntity } from '../../data/entities'
import { createServiceOrderSchema, updateServiceOrderSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  vehicle_id: z.string().uuid().optional(),
  priority: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_service_orders.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_service_orders.create'] },
  PUT: { requireAuth: true, requireFeatures: ['auto_service_orders.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_service_orders.edit'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoServiceOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'auto_service_orders.order' },
  list: { schema: listSchema },
  create: { schema: createServiceOrderSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateServiceOrderSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
