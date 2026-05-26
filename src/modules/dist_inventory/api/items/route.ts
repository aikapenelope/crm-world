import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { DistInventoryItemEntity } from '../../data/entities'
import { createInventoryItemSchema, updateInventoryItemSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  warehouse_code: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_inventory.view'] },
  POST: { requireAuth: true, requireFeatures: ['dist_inventory.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['dist_inventory.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: DistInventoryItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'dist_inventory.item' },
  list: { schema: listSchema },
  create: { schema: createInventoryItemSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateInventoryItemSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
