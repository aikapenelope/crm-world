import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriSaleOrderEntity } from '../../data/entities'
import { saleOrderCreateSchema, saleOrderUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), customer_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_sales.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_sales.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_sales.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_sales.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriSaleOrderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_sales:order' },
  list: { schema: listSchema },
  create: { schema: saleOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: saleOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
