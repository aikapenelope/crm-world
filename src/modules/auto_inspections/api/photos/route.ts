import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoInspectionPhotoEntity } from '../../data/entities'
import { createInspectionPhotoSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  inspection_id: z.string().uuid().optional(),
  inspection_item_id: z.string().uuid().optional(),
  photo_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_inspections.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_inspections.create'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_inspections.create'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoInspectionPhotoEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'auto_inspections.photo' },
  list: { schema: listSchema },
  create: { schema: createInspectionPhotoSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE

export const openApi = {}
