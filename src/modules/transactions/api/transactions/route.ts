import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { PropertyTransactionEntity } from '../../data/entities'
import { createTransactionSchema, updateTransactionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  transaction_type: z.string().optional(),
  status: z.string().optional(),
  property_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  listing_agent_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['transactions.view'] },
  POST: { requireAuth: true, requireFeatures: ['transactions.create'] },
  PUT: { requireAuth: true, requireFeatures: ['transactions.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['transactions.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PropertyTransactionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'transactions.property_transaction' },
  list: { schema: listSchema },
  create: {
    schema: createTransactionSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateTransactionSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
