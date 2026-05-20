import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistPriceListItemEntity } from '../../data/entities'
import { createPriceListItemSchema, updatePriceListItemSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  price_list_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_price_lists.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_price_lists.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_price_lists.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_price_lists.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistPriceListItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_price_lists.item' },
  list: { schema: listSchema },
  create: { schema: createPriceListItemSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updatePriceListItemSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
