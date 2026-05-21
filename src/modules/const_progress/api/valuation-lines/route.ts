import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstValuationLineEntity } from '../../data/entities'
import { createValuationLineSchema, updateValuationLineSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(200),
  valuation_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_progress.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_progress.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstValuationLineEntity, idField: 'id', orgField: null as any, tenantField: null as any },
  indexer: { entityType: 'const_progress.valuation_line' },
  list: { schema: listSchema },
  create: { schema: createValuationLineSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateValuationLineSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
