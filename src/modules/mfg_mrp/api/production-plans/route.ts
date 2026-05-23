import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgProductionPlanEntity } from '../../data/entities'
import { productionPlanCreateSchema, productionPlanUpdateSchema } from '../../data/validators'

const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_mrp.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgProductionPlanEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_mrp:plan' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(50).default(20), status: z.string().optional() }).passthrough() },
  create: { schema: productionPlanCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: productionPlanUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
