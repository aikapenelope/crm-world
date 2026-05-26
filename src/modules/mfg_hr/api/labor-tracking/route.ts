import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgLaborTrackingEntity } from '../../data/entities'
import { laborTrackingCreateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_hr.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_hr.labor'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgLaborTrackingEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_hr:labor_tracking' },
  list: { schema: z.object({ production_order_id: z.string().uuid().optional(), worker_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  create: { schema: laborTrackingCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: laborTrackingCreateSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const openApi = {}
