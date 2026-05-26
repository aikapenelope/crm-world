import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgNonconformanceEntity } from '../../data/entities'
import { nonconformanceCreateSchema, nonconformanceUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_quality.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_quality.inspect'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_quality.disposition'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_quality.disposition'] },
}
export const metadata = routeMetadata
const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), severity: z.string().optional(),
  source: z.string().optional(), product_id: z.string().uuid().optional(),
}).passthrough()

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgNonconformanceEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_quality:nc' },
  list: { schema: listSchema },
  create: { schema: nonconformanceCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: nonconformanceUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
