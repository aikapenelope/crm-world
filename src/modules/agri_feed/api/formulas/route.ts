import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFeedFormulaEntity } from '../../data/entities'
import { feedFormulaCreateSchema, feedFormulaUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:         z.coerce.number().min(1).default(1),
  pageSize:     z.coerce.number().min(1).max(100).default(50),
  search:       z.string().optional(),
  formula_type: z.string().optional(),
  species:      z.string().optional(),
  is_active:    z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_feed.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_feed.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_feed.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_feed.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity:          AgriFeedFormulaEntity,
    idField:         'id',
    orgField:        'organization_id',
    tenantField:     'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'agri_feed:formula' },
  list: { schema: listSchema },
  create: {
    schema: feedFormulaCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: feedFormulaUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
