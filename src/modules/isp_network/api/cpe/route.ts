import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspCpeInventoryEntity } from '../../data/entities'
import { createCpeSchema, updateCpeSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  cpe_type: z.string().optional(),
  brand: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_network.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_network.manage_cpe'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_network.manage_cpe'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_network.manage_cpe'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspCpeInventoryEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_network.cpe' },
  list: { schema: listSchema },
  create: { schema: createCpeSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateCpeSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
