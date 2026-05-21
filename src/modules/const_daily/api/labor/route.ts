import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstDailyLaborEntity } from '../../data/entities'
import { createLaborSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  report_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_daily.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_daily.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_daily.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstDailyLaborEntity, idField: 'id', orgField: null as any, tenantField: null as any },
  indexer: { entityType: 'const_daily.labor' },
  list: { schema: listSchema },
  create: { schema: createLaborSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE
export const openApi = {}
