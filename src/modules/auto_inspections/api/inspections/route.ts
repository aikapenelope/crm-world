import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoInspectionEntity } from '../../data/entities'
import { createInspectionSchema, updateInspectionSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  service_order_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_inspections.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_inspections.create'] },
  PUT: { requireAuth: true, requireFeatures: ['auto_inspections.create'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoInspectionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'auto_inspections.inspection' },
  list: { schema: listSchema },
  create: { schema: createInspectionSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateInspectionSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
