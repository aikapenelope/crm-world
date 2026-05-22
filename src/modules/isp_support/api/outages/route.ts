import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspOutageEntity } from '../../data/entities'
import { createOutageSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(),
  node_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_support.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_support.manage_outages'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_support.manage_outages'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_support.manage_outages'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspOutageEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_support.outage' },
  list: { schema: listSchema },
  create: { schema: createOutageSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: createOutageSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
