import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademySessionEntity } from '../../data/entities'
import { createSessionSchema, updateSessionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(100),
  group_id: z.string().uuid().optional(),
  status: z.string().optional(),
  session_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_sessions.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_sessions.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_sessions.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_sessions.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademySessionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'academy_sessions.session' },
  list: { schema: listSchema },
  create: {
    schema: createSessionSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateSessionSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
