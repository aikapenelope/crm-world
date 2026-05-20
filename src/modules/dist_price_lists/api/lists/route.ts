import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistPriceListEntity } from '../../data/entities'
import { createPriceListSchema, updatePriceListSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  type: z.string().optional(),
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
    entity: DistPriceListEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_price_lists.list' },
  list: { schema: listSchema },
  create: { schema: createPriceListSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updatePriceListSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
