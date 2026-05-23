import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFlockEntity } from '../../data/entities'
import { flockCreateSchema, flockUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  pageSize:     z.coerce.number().min(1).max(100).default(50),
  search:       z.string().optional(),
  status:       z.string().optional(),
  species:      z.string().optional(),
  farm_unit_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_units.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_units.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_units.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_units.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity:          AgriFlockEntity,
    idField:         'id',
    orgField:        'organization_id',
    tenantField:     'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'agri_units:flock' },
  list: { schema: listSchema },
  create: {
    schema: flockCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: flockUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
