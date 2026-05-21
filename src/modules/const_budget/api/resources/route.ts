import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstBudgetResourceEntity } from '../../data/entities'
import { createBudgetResourceSchema, updateBudgetResourceSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  budget_item_id: z.string().uuid().optional(),
  resource_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_budget.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_budget.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_budget.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_budget.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: ConstBudgetResourceEntity,
    idField: 'id',
    orgField: null as any,
    tenantField: null as any,
  },
  indexer: { entityType: 'const_budget.resource' },
  list: { schema: listSchema },
  create: { schema: createBudgetResourceSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateBudgetResourceSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
