import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistDeliveryOrderEntity } from '../../data/entities'
import { createDeliveryOrderSchema, updateDeliveryOrderSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(),
  dispatch_date: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_delivery.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_delivery.create'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_delivery.create'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_delivery.create'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistDeliveryOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_delivery.order' },
  list: { schema: listSchema },
  create: { schema: createDeliveryOrderSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateDeliveryOrderSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
