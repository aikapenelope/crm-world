import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistCreditLimitEntity } from '../../data/entities'
import { createCreditLimitSchema, updateCreditLimitSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_credit.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_credit.manage_limits'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_credit.manage_limits'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_credit.manage_limits'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistCreditLimitEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_credit.limit' },
  list: { schema: listSchema },
  create: { schema: createCreditLimitSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateCreditLimitSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
