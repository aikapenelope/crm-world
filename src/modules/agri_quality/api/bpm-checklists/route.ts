import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriBpmChecklistEntity } from '../../data/entities'
import { bpmChecklistCreateSchema, bpmChecklistUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  checklist_type: z.string().optional(), overall_result: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_quality.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_quality.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_quality.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriBpmChecklistEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_quality:bpm_checklist' },
  list: { schema: listSchema },
  create: { schema: bpmChecklistCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: bpmChecklistUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
