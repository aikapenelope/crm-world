import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistRouteEntity } from '../../data/entities'
import { createRouteSchema, updateRouteSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  day_of_week: z.coerce.number().optional(),
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
    entity: DistRouteEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'dist_routes.route' },
  list: { schema: listSchema },
  create: { schema: createRouteSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateRouteSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
