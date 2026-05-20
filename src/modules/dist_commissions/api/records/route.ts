import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistCommissionRecordEntity } from '../../data/entities'
import { createRecordSchema, updateRecordSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  seller_id: z.string().uuid().optional(),
  period_month: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_commissions.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_commissions.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_commissions.approve'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistCommissionRecordEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'dist_commissions.record' },
  list: { schema: listSchema },
  create: { schema: createRecordSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateRecordSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
