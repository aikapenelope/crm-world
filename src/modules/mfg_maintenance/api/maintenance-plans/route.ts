import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgMaintenancePlanEntity } from '../../data/entities'
import { maintenancePlanCreateSchema, maintenancePlanUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgMaintenancePlanEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_maintenance:plan' },
  list: { schema: z.object({ equipment_id: z.string().uuid().optional(), status: z.string().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: maintenancePlanCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: maintenancePlanUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
