import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { TuitionPlanEntity } from '../../data/entities'
import { createPlanSchema, updatePlanSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  grade_level: z.string().optional(),
  is_active: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['tuition.view'] },
  POST: { requireAuth: true, requireFeatures: ['tuition.manage_plans'] },
  PUT: { requireAuth: true, requireFeatures: ['tuition.manage_plans'] },
  DELETE: { requireAuth: true, requireFeatures: ['tuition.manage_plans'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: TuitionPlanEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'tuition.plan' },
  list: { schema: listSchema },
  create: { schema: createPlanSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updatePlanSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
