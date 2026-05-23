import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgStandardCostEntity } from '../../data/entities'
import { standardCostCreateSchema, standardCostUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_costs.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgStandardCostEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_costs:standard_cost' },
  list: { schema: z.object({ product_id: z.string().uuid().optional(), status: z.string().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: standardCostCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: standardCostUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
