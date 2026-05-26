import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgDispatchOrderEntity } from '../../data/entities'
import { dispatchOrderCreateSchema, dispatchOrderUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_dispatch.dispatch'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_dispatch.dispatch'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgDispatchOrderEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_dispatch:dispatch_order' },
  list: { schema: z.object({ sale_order_id: z.string().uuid().optional(), status: z.string().optional(), pageSize: z.coerce.number().min(1).max(100).default(50) }).passthrough() },
  create: { schema: dispatchOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: dispatchOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
