import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspSubscriberContractEntity } from '../../data/entities'
import { createContractSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  subscriber_id: z.string().uuid().optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_subscribers.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_subscribers.manage_contracts'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_subscribers.manage_contracts'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_subscribers.manage_contracts'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspSubscriberContractEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_subscribers.contract' },
  list: { schema: listSchema },
  create: { schema: createContractSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: createContractSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
