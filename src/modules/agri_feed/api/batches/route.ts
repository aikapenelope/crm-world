import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFeedBatchEntity } from '../../data/entities'
import { feedBatchCreateSchema, feedBatchUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:       z.coerce.number().min(1).default(1),
  pageSize:   z.coerce.number().min(1).max(100).default(50),
  search:     z.string().optional(),
  status:     z.string().optional(),
  formula_id: z.string().uuid().optional(),
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
    entity:          AgriFeedBatchEntity,
    idField:         'id',
    orgField:        'organization_id',
    tenantField:     'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'agri_feed:batch' },
  list: { schema: listSchema },
  create: {
    schema: feedBatchCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: feedBatchUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
