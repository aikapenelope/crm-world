import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { TuitionDiscountEntity } from '../../data/entities'
import { createDiscountSchema, updateDiscountSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  student_id: z.string().uuid().optional(),
  discount_type: z.string().optional(),
  is_active: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['tuition.view'] },
  POST: { requireAuth: true, requireFeatures: ['tuition.manage_discounts'] },
  PUT: { requireAuth: true, requireFeatures: ['tuition.manage_discounts'] },
  DELETE: { requireAuth: true, requireFeatures: ['tuition.manage_discounts'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: TuitionDiscountEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'tuition.discount' },
  list: { schema: listSchema },
  create: { schema: createDiscountSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateDiscountSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
