import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistRouteVisitEntity } from '../../data/entities'
import { createVisitSchema, updateVisitSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  route_id: z.string().uuid().optional(),
  visit_date: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_routes.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_routes.visit'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_routes.visit'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistRouteVisitEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'dist_routes.visit' },
  list: { schema: listSchema },
  create: { schema: createVisitSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateVisitSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
