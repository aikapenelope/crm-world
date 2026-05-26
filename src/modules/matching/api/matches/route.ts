import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { MatchResultEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  contact_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  min_score: z.coerce.number().min(0).max(100).optional(),
  is_dismissed: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['matching.view'] },
  DELETE: { requireAuth: true, requireFeatures: ['matching.run'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MatchResultEntity,
    idField: 'id',
    tenantField: 'tenant_id',
    orgField: 'organization_id',
    // MatchResultEntity is append-only (no deleted_at column).
    // Pass null to disable the implicit soft-delete filter (WHERE deletedAt IS NULL)
    // that makeCrudRoute adds by default. Without this, MikroORM generates a query
    // referencing a non-existent column → DB error → HTTP 500.
    // Documented in makeCrudRoute factory.ts:149:
    //   softDeleteField?: string | null  // default: 'deletedAt'; pass null to disable
    softDeleteField: null,
  },
  indexer: { entityType: 'matching.match' },
  list: { schema: listSchema },
})

export const GET = crud.GET
export const DELETE = crud.DELETE

export const openApi = {}
