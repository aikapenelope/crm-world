import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailBranchStaffEntity } from '../../data/entities'
import { createStaffSchema, listStaffSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_branches.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_branches.staff_manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['retail_branches.staff_manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailBranchStaffEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_branches.staff' },
  list: { schema: listStaffSchema },
  create: {
    schema: createStaffSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE

export const openApi = {}
