import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriSaleInvoiceEntity } from '../../data/entities'
import { saleInvoiceCreateSchema, saleInvoiceUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), customer_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_sales.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_sales.invoice'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_sales.collect'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_sales.invoice'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriSaleInvoiceEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_sales:invoice' },
  list: { schema: listSchema },
  create: { schema: saleInvoiceCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: saleInvoiceUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
