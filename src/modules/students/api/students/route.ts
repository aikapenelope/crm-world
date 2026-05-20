import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { StudentEntity } from '../../data/entities'
import { createStudentSchema, updateStudentSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  grade_level: z.string().optional(),
  section: z.string().optional(),
  enrollment_status: z.string().optional(),
  gender: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['students.view'] },
  POST: { requireAuth: true, requireFeatures: ['students.create'] },
  PUT: { requireAuth: true, requireFeatures: ['students.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['students.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: StudentEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'students.student' },
  list: { schema: listSchema },
  create: {
    schema: createStudentSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateStudentSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
