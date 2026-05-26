import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriNonConformityEntity } from '../../data/entities'
import { nonConformityCreateSchema, nonConformityUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), severity: z.string().optional(), source: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_quality.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_quality.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_quality.decide'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_quality.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriNonConformityEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_quality:non_conformity' },
  list: { schema: listSchema },
  create: { schema: nonConformityCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: nonConformityUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
