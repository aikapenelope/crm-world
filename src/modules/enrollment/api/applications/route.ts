import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { EnrollmentApplicationEntity } from '../../data/entities'
import { createApplicationSchema, updateApplicationSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  period_id: z.string().uuid().optional(),
  status: z.string().optional(),
  application_type: z.string().optional(),
  requested_grade: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['enrollment.view'] },
  POST: { requireAuth: true, requireFeatures: ['enrollment.manage_applications'] },
  PUT: { requireAuth: true, requireFeatures: ['enrollment.manage_applications'] },
  DELETE: { requireAuth: true, requireFeatures: ['enrollment.manage_applications'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: EnrollmentApplicationEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'enrollment.application' },
  list: { schema: listSchema },
  create: {
    schema: createApplicationSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateApplicationSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
