import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspNetworkNodeEntity } from '../../data/entities'
import { createNodeSchema, updateNodeSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
  node_type: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
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
    entity: IspNetworkNodeEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_network.node' },
  list: { schema: listSchema },
  create: { schema: createNodeSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateNodeSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
