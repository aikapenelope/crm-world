import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { VeWithholdingRecordEntity } from '../../data/entities'
import { createWithholdingSchema, updateWithholdingSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  type: z.enum(['iva', 'islr']).optional(),
  period_month: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['ve_withholdings.view'] },
  POST: { requireAuth: true, requireFeatures: ['ve_withholdings.create'] },
  PUT: { requireAuth: true, requireFeatures: ['ve_withholdings.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['ve_withholdings.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: VeWithholdingRecordEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 've_withholdings.record' },
  list: { schema: listSchema },
  create: { schema: createWithholdingSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateWithholdingSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
