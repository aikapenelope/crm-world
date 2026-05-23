import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriColdStorageUnitEntity } from '../../data/entities'
import { coldStorageUnitCreateSchema, coldStorageUnitUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), unit_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_cold_chain.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_cold_chain.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_cold_chain.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_cold_chain.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriColdStorageUnitEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_cold_chain:storage_unit' },
  list: { schema: listSchema },
  create: { schema: coldStorageUnitCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: coldStorageUnitUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
