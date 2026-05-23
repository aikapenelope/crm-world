import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriHaccpPlanEntity } from '../../data/entities'
import { haccpPlanCreateSchema, haccpPlanUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  process: z.string().optional(), status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_quality.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_quality.edit'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_quality.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_quality.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriHaccpPlanEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_quality:haccp_plan' },
  list: { schema: listSchema },
  create: { schema: haccpPlanCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: haccpPlanUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
