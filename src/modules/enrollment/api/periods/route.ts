import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { EnrollmentPeriodEntity } from '../../data/entities'
import { createPeriodSchema, updatePeriodSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  school_year: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['enrollment.view'] },
  POST: { requireAuth: true, requireFeatures: ['enrollment.manage_periods'] },
  PUT: { requireAuth: true, requireFeatures: ['enrollment.manage_periods'] },
  DELETE: { requireAuth: true, requireFeatures: ['enrollment.manage_periods'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: EnrollmentPeriodEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'enrollment.period' },
  list: { schema: listSchema },
  create: {
    schema: createPeriodSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePeriodSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
