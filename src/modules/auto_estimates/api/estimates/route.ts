import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoEstimateEntity } from '../../data/entities'
import { createEstimateSchema, updateEstimateSchema } from '../../data/validators'

const listSchema = z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), service_order_id: z.string().uuid().optional(), status: z.string().optional() }).passthrough()
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['auto_estimates.view'] }, POST: { requireAuth: true, requireFeatures: ['auto_estimates.create'] }, PUT: { requireAuth: true, requireFeatures: ['auto_estimates.create'] } }
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AutoEstimateEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'auto_estimates.estimate' },
  list: { schema: listSchema },
  create: { schema: createEstimateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateEstimateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
