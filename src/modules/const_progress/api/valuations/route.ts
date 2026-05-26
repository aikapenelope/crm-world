import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstValuationEntity } from '../../data/entities'
import { createValuationSchema, updateValuationSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_progress.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstValuationEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'const_progress.valuation' },
  list: { schema: listSchema },
  create: {
    schema: createValuationSchema,
    mapToEntity: (input: any) => ({
      ...input,
      valuation_number: `VAL-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    }),
  },
  update: { schema: updateValuationSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
