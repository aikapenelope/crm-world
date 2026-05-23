import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriInputItemEntity } from '../../data/entities'
import { inputItemCreateSchema, inputItemUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:       z.coerce.number().min(1).default(1),
  pageSize:   z.coerce.number().min(1).max(100).default(50),
  search:     z.string().optional(),
  input_type: z.string().optional(),
  is_active:  z.coerce.boolean().optional(),
  low_stock:  z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_inputs.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_inputs.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_inputs.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_inputs.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity:          AgriInputItemEntity,
    idField:         'id',
    orgField:        'organization_id',
    tenantField:     'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'agri_inputs:item' },
  list: { schema: listSchema },
  create: {
    schema: inputItemCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: inputItemUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
