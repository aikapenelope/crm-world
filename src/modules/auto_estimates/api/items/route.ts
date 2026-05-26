import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoEstimateItemEntity } from '../../data/entities'
import { createEstimateItemSchema } from '../../data/validators'

const listSchema = z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), estimate_id: z.string().uuid().optional() }).passthrough()
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['auto_estimates.view'] }, POST: { requireAuth: true, requireFeatures: ['auto_estimates.create'] } }
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AutoEstimateItemEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'auto_estimates.item' },
  list: { schema: listSchema },
  create: { schema: createEstimateItemSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const openApi = {}
