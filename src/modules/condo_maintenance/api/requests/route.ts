import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoMaintenanceRequestEntity } from '../../data/entities'
import { createRequestSchema, updateRequestSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_maintenance.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_maintenance.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_maintenance.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoMaintenanceRequestEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'condo_maintenance.request' },
  list: { schema: listSchema },
  create: { schema: createRequestSchema, mapToEntity: (input: any) => ({ ...input, request_number: `SOL-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updateRequestSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input); if (input.status === 'completed') { entity.completed_at = new Date() } } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
