import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriCropActivityEntity } from '../../data/entities'
import { cropActivityCreateSchema, cropActivityUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_field.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_field.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_field.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriCropActivityEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_field:activity' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50), crop_cycle_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: cropActivityCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: cropActivityUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
