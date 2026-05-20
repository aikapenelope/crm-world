import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailBranchEntity } from '../../data/entities'
import { createBranchSchema, updateBranchSchema, listBranchSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_branches.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_branches.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_branches.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['retail_branches.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailBranchEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listBranchSchema },
  create: {
    schema: createBranchSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateBranchSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
