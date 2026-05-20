import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoVoteEntity } from '../../data/entities'
import { createVoteSchema, updateVoteSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_comms.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_comms.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_comms.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoVoteEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_comms.vote' },
  list: { schema: listSchema },
  create: { schema: createVoteSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateVoteSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
