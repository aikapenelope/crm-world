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
  },
  indexer: { entityType: 'matching.match' },
  list: { schema: listSchema },
})

export const GET = crud.GET
export const DELETE = crud.DELETE

export const openApi = {}
