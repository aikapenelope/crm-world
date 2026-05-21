import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspNetworkSegmentEntity } from '../../data/entities'
import { createSegmentSchema, updateSegmentSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  node_from_id: z.string().uuid().optional(),
  node_to_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_network.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_network.manage'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_network.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_network.manage'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspNetworkSegmentEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_network.segment' },
  list: { schema: listSchema },
  create: { schema: createSegmentSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateSegmentSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
