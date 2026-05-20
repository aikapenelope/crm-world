import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoCollectionActionEntity } from '../../data/entities'
import { createActionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  unit_id: z.string().uuid().optional(),
  action_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_collections.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_collections.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoCollectionActionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_collections.action' },
  list: { schema: listSchema },
  create: { schema: createActionSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST

export const openApi = {}
