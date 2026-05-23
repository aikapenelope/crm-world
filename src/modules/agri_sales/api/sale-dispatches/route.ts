import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriSaleDispatchEntity } from '../../data/entities'
import { saleDispatchCreateSchema, saleDispatchUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  sale_order_id: z.string().uuid().optional(), status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_sales.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_sales.edit'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_sales.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriSaleDispatchEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_sales:dispatch' },
  list: { schema: listSchema },
  create: { schema: saleDispatchCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: saleDispatchUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
