import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgEquipmentEntity } from '../../data/entities'
import { equipmentCreateSchema, equipmentUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgEquipmentEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_maintenance:equipment' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional(), criticality: z.string().optional(), work_center_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: equipmentCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: equipmentUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
