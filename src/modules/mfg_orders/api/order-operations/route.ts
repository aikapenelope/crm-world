import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgOrderOperationEntity } from '../../data/entities'
import { orderOperationCreateSchema, orderOperationUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_orders.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_orders.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['mfg_orders.execute'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgOrderOperationEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_orders:operation' },
  list: { schema: z.object({ order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: orderOperationCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: orderOperationUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
