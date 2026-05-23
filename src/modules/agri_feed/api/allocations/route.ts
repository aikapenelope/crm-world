import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFeedAllocationEntity } from '../../data/entities'
import { feedAllocationCreateSchema, feedAllocationUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:          z.coerce.number().min(1).default(1),
  pageSize:      z.coerce.number().min(1).max(200).default(50),
  flock_id:      z.string().uuid().optional(),
  feed_batch_id: z.string().uuid().optional(),
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
    entity:      AgriFeedAllocationEntity,
    idField:     'id',
    orgField:    'organization_id',
    tenantField: 'tenant_id',
    // No soft delete — allocations are part of the traceability audit trail
  },
  indexer: { entityType: 'agri_feed:allocation' },
  list: { schema: listSchema },
  create: {
    schema: feedAllocationCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: feedAllocationUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
