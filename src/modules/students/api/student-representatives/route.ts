import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { StudentRepresentativeEntity } from '../../data/entities'
import { createRepresentativeSchema, updateRepresentativeSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  student_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['students.view'] },
  POST: { requireAuth: true, requireFeatures: ['students.manage_representatives'] },
  PUT: { requireAuth: true, requireFeatures: ['students.manage_representatives'] },
  DELETE: { requireAuth: true, requireFeatures: ['students.manage_representatives'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: StudentRepresentativeEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'students.representative' },
  list: { schema: listSchema },
  create: {
    schema: createRepresentativeSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateRepresentativeSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
