import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyInstructorEntity } from '../../data/entities'
import { createInstructorSchema, updateInstructorSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_instructors.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_instructors.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_instructors.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_instructors.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyInstructorEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'academy_instructors.instructor' },
  list: { schema: listSchema },
  create: {
    schema: createInstructorSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateInstructorSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
