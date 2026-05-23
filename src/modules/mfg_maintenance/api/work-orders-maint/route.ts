import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgWorkOrderMaintEntity } from '../../data/entities'
import { workOrderCreateSchema, workOrderUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_maintenance.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_maintenance.execute'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgWorkOrderMaintEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_maintenance:work_order' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50), status: z.string().optional(), equipment_id: z.string().uuid().optional(), work_type: z.string().optional(), priority: z.string().optional() }).passthrough() },
  create: { schema: workOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: workOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
