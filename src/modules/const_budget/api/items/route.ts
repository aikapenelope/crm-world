import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstBudgetItemEntity } from '../../data/entities'
import { createBudgetItemSchema, updateBudgetItemSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(200),
  project_id: z.string().uuid().optional(),
  category: z.string().optional(),
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
    entity: ConstBudgetItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'const_budget.item' },
  list: { schema: listSchema },
  create: { schema: createBudgetItemSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateBudgetItemSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
