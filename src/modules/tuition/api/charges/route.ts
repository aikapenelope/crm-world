import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { TuitionChargeEntity } from '../../data/entities'
import { createChargeSchema, updateChargeSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  student_id: z.string().uuid().optional(),
  period_month: z.string().optional(),
  status: z.string().optional(),
  concept: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['tuition.view'] },
  POST: { requireAuth: true, requireFeatures: ['tuition.manage_charges'] },
  PUT: { requireAuth: true, requireFeatures: ['tuition.manage_charges'] },
  DELETE: { requireAuth: true, requireFeatures: ['tuition.manage_charges'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: TuitionChargeEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'tuition.charge' },
  list: { schema: listSchema },
  create: { schema: createChargeSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateChargeSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
