import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriCropCycleEntity } from '../../data/entities'
import { cropCycleCreateSchema, cropCycleUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_field.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_field.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_field.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_field.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriCropCycleEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_field:cycle' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), field_plot_id: z.string().uuid().optional(), status: z.string().optional() }).passthrough() },
  create: { schema: cropCycleCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: cropCycleUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
