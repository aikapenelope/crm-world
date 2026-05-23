import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriRecallEntity } from '../../data/entities'
import { recallCreateSchema, recallUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), recall_class: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_traceability.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_traceability.recall'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_traceability.recall'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_traceability.approve'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriRecallEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_traceability:recall' },
  list: { schema: listSchema },
  create: { schema: recallCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: recallUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
