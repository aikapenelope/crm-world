import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspPlanAddonEntity } from '../../data/entities'
import { createPlanAddonSchema, updatePlanAddonSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_plans.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_plans.manage'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_plans.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_plans.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspPlanAddonEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_plans.addon' },
  list: { schema: listSchema },
  create: {
    schema: createPlanAddonSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePlanAddonSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
