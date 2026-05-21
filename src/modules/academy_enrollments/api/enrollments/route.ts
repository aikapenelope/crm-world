import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyEnrollmentEntity } from '../../data/entities'
import { createEnrollmentSchema, updateEnrollmentSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  group_id: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_enrollments.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_enrollments.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_enrollments.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_enrollments.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyEnrollmentEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'academy_enrollments.enrollment' },
  list: { schema: listSchema },
  create: {
    schema: createEnrollmentSchema,
    mapToEntity: (input: any) => ({
      ...input,
      enrollment_number: `ENR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      enrollment_date: input.enrollment_date ?? new Date().toISOString().slice(0, 10),
      price_agreed: String(input.price_agreed),
    }),
  },
  update: {
    schema: updateEnrollmentSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
