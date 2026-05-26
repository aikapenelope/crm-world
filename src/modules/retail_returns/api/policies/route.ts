import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailReturnPolicyEntity } from '../../data/entities'
import { createPolicySchema, listPolicySchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_returns.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_returns.policies'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_returns.policies'] },
  DELETE: { requireAuth: true, requireFeatures: ['retail_returns.policies'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailReturnPolicyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'retail_returns.policy' },
  list: { schema: listPolicySchema },
  create: {
    schema: createPolicySchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: createPolicySchema.partial(),
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
