import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistRouteStopEntity } from '../../data/entities'
import { createStopSchema, updateStopSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  route_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_routes.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_routes.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_routes.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['dist_routes.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistRouteStopEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_routes.stop' },
  list: { schema: listSchema },
  create: { schema: createStopSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateStopSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
