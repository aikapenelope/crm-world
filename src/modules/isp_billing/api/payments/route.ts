import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspPaymentEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  subscriber_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  payment_method: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['isp_billing.view'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspPaymentEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_billing.payment' },
  list: { schema: listSchema },
  create: { schema: z.object({}).passthrough(), mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: z.object({}).passthrough(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const openApi = {}
