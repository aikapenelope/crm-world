import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspSubscriberEntity } from '../../data/entities'
import { createSubscriberSchema, updateSubscriberSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  service_status: z.string().optional(),
  subscriber_type: z.string().optional(),
  node_id: z.string().uuid().optional(),
  plan_id: z.string().uuid().optional(),
  assigned_agent_id: z.string().uuid().optional(),
  city: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_subscribers.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_subscribers.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_subscribers.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_subscribers.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspSubscriberEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_subscribers.subscriber' },
  list: { schema: listSchema },
  create: {
    schema: createSubscriberSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateSubscriberSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
