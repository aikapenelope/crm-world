import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoFeeConfigEntity } from '../../data/entities'
import { createFeeConfigSchema, updateFeeConfigSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_fees.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_fees.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_fees.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoFeeConfigEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_fees.config' },
  list: { schema: listSchema },
  create: { schema: createFeeConfigSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateFeeConfigSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
