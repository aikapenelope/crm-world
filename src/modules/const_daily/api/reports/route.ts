import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstDailyReportEntity } from '../../data/entities'
import { createDailyReportSchema, updateDailyReportSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_daily.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_daily.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_daily.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstDailyReportEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'const_daily.report' },
  list: { schema: listSchema },
  create: {
    schema: createDailyReportSchema,
    mapToEntity: (input: any) => ({
      ...input,
      report_number: `RDO-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    }),
  },
  update: { schema: updateDailyReportSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
