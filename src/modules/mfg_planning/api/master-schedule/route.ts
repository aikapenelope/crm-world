import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgMasterScheduleEntity } from '../../data/entities'
import { masterScheduleCreateSchema, masterScheduleUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_planning.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgMasterScheduleEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_planning:schedule' },
  list: { schema: z.object({ week_start: z.string().optional(), status: z.string().optional(), work_center_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: masterScheduleCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: masterScheduleUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
