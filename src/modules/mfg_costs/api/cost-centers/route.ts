import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgCostCenterEntity } from '../../data/entities'
import { costCenterCreateSchema, costCenterUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_costs.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_costs.standard'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgCostCenterEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_costs:cost_center' },
  list: { schema: z.object({ pageSize: z.coerce.number().min(1).max(100).default(50) }).passthrough() },
  create: { schema: costCenterCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: costCenterUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
