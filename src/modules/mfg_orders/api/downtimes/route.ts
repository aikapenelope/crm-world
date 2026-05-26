import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgProductionDowntimeEntity } from '../../data/entities'
import { downtimeCreateSchema, downtimeUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_orders.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_orders.execute'] },
  PUT:  { requireAuth: true, requireFeatures: ['mfg_orders.execute'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgProductionDowntimeEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_orders:downtime' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50), order_id: z.string().uuid().optional(), work_center_id: z.string().uuid().optional(), cause_category: z.string().optional() }).passthrough() },
  create: { schema: downtimeCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: downtimeUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
