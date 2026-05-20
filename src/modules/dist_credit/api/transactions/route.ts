import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistCreditTransactionEntity } from '../../data/entities'
import { createCreditTransactionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  customer_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_credit.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_credit.manage_transactions'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistCreditTransactionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'dist_credit.transaction' },
  list: { schema: listSchema },
  create: { schema: createCreditTransactionSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST

export const openApi = {}
