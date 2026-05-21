import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyGroupEntity } from '../../data/entities'
import { createGroupSchema, updateGroupSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  course_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_groups.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_groups.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_groups.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_groups.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyGroupEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'academy_groups.group' },
  list: { schema: listSchema },
  create: {
    schema: createGroupSchema,
    mapToEntity: (input: any) => ({
      ...input,
      status: 'scheduled',
      enrolled_count: 0,
      sessions_count: 0,
    }),
  },
  update: {
    schema: updateGroupSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
