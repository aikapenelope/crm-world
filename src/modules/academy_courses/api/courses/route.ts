import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyCourseEntity } from '../../data/entities'
import { createCourseSchema, updateCourseSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  modality: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_courses.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_courses.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_courses.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_courses.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyCourseEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'academy_courses.course' },
  list: { schema: listSchema },
  create: {
    schema: createCourseSchema,
    mapToEntity: (input: any) => ({
      ...input,
      duration_hours: String(input.duration_hours),
      price_usd: String(input.price_usd),
    }),
  },
  update: {
    schema: updateCourseSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
