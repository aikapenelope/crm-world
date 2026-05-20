import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistCommissionRuleEntity } from '../../data/entities'
import { createRuleSchema, updateRuleSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_commissions.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_commissions.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_commissions.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_commissions.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistCommissionRuleEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_commissions.rule' },
  list: { schema: listSchema },
  create: { schema: createRuleSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateRuleSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
