import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspInvoiceEntity } from '../../data/entities'
import { createInvoiceSchema, updateInvoiceSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  subscriber_id: z.string().uuid().optional(),
  status: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_billing.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_billing.manage'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_billing.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_billing.cancel_invoice'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspInvoiceEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_billing.invoice' },
  list: { schema: listSchema },
  create: { schema: createInvoiceSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateInvoiceSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
