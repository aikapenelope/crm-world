import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistDeliveryItemEntity } from '../../data/entities'
import { createDeliveryItemSchema, updateDeliveryItemSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  delivery_order_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_delivery.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_delivery.create'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_delivery.confirm'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistDeliveryItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'dist_delivery.item' },
  list: { schema: listSchema },
  create: { schema: createDeliveryItemSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateDeliveryItemSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
