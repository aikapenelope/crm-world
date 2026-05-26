import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistCustomerPriceListEntity } from '../../data/entities'
import { assignCustomerSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  customer_id: z.string().uuid().optional(),
  price_list_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_price_lists.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_price_lists.assign'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_price_lists.assign'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistCustomerPriceListEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'dist_price_lists.assignment' },
  list: { schema: listSchema },
  create: { schema: assignCustomerSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE

export const openApi = {}
