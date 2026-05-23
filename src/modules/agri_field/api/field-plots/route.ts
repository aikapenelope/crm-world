import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFieldPlotEntity } from '../../data/entities'
import { fieldPlotCreateSchema, fieldPlotUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_field.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_field.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_field.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_field.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriFieldPlotEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_field:plot' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional() }).passthrough() },
  create: { schema: fieldPlotCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: fieldPlotUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
