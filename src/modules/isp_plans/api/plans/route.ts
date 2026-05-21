import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspServicePlanEntity } from '../../data/entities'
import { createServicePlanSchema, updateServicePlanSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
  technology: z.string().optional(),
  target_segment: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
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
    entity: IspServicePlanEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_plans.service_plan' },
  list: { schema: listSchema },
  create: {
    schema: createServicePlanSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateServicePlanSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
