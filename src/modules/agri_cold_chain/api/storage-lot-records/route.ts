import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriStorageLotRecordEntity } from '../../data/entities'
import { storageLotRecordCreateSchema, storageLotRecordUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  cold_storage_unit_id: z.string().uuid().optional(), status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_cold_chain.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_cold_chain.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_cold_chain.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriStorageLotRecordEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_cold_chain:storage_lot' },
  list: { schema: listSchema },
  create: { schema: storageLotRecordCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: storageLotRecordUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
