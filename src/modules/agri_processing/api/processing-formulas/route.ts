import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriProcessingFormulaEntity } from '../../data/entities'
import { processingFormulaCreateSchema, processingFormulaUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  product_type: z.string().optional(), is_active: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_processing.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_processing.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_processing.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_processing.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriProcessingFormulaEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_processing:formula' },
  list: { schema: listSchema },
  create: { schema: processingFormulaCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: processingFormulaUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
