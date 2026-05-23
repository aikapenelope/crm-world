import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgCostVarianceEntity } from '../../data/entities'
import { costVarianceUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_costs.view'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_costs.approve'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgCostVarianceEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_costs:variance' },
  list: { schema: z.object({ status: z.string().optional(), order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(50) }).passthrough() },
  update: { schema: costVarianceUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const PUT = crud.PUT
export const openApi = {}
