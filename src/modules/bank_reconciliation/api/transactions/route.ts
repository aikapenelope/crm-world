import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { BankTransactionEntity } from '../../data/entities'
import { reconcileTransactionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  statement_id: z.string().uuid().optional(),
  reconciliation_status: z.string().optional(),
  search: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['bank_reconciliation.view'] },
  PUT: { requireAuth: true, requireFeatures: ['bank_reconciliation.reconcile'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: BankTransactionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'bank_reconciliation.transaction' },
  list: { schema: listSchema },
  update: { schema: reconcileTransactionSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const PUT = crud.PUT

export const openApi = {}
